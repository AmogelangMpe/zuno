import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type VideoItem = {
  title:     string
  url:       string
  thumbnail: string | null
  platform:  'youtube' | 'tiktok'
}

async function resolveYouTubeChannelId(channelUrl: string): Promise<string | null> {
  try {
    const u = new URL(channelUrl)
    const idMatch = u.pathname.match(/^\/channel\/(UC[^/]+)/)
    if (idMatch) return idMatch[1]

    const page = await fetch(channelUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZunoBio/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!page.ok) return null
    const html = await page.text()

    const patterns = [
      /"channelId":"(UC[^"]+)"/,
      /"externalId":"(UC[^"]+)"/,
      /channel\/(UC[^"&?/]+)/,
    ]
    for (const p of patterns) {
      const m = html.match(p)
      if (m) return m[1]
    }
    return null
  } catch (e) {
    console.error('resolveYouTubeChannelId error:', e)
    return null
  }
}

async function fetchYouTubeFeed(channelUrl: string): Promise<VideoItem[]> {
  try {
    const channelId = await resolveYouTubeChannelId(channelUrl)
    if (!channelId) return []

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []

    const xml = await res.text()
    const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []

    return entries.slice(0, 10).map(entry => {
      const title   = entry.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() || 'Untitled'
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || ''
      return {
        title,
        url:       `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
        platform:  'youtube' as const,
      }
    }).filter(v => v.url !== 'https://www.youtube.com/watch?v=')
  } catch (e) {
    console.error('fetchYouTubeFeed error:', e)
    return []
  }
}

const findItemList = (obj: any): any[] | null => {
  if (!obj || typeof obj !== 'object') return null
  if (Array.isArray(obj.itemList) && obj.itemList.length > 0) return obj.itemList
  for (const val of Object.values(obj)) {
    const found = findItemList(val)
    if (found) return found
  }
  return null
}

async function fetchTikTokFeed(channelUrl: string): Promise<VideoItem[]> {
  try {
    const match = channelUrl.match(/tiktok\.com\/@([^/?#]+)/)
    if (!match) return []
    const username = match[1]

    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const html = await res.text()
    const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch) return []

    const data = JSON.parse(scriptMatch[1])
    const items = findItemList(data)
    if (!items) return []

    return items.slice(0, 10).map((item: any) => ({
      title:     item.desc || 'TikTok video',
      url:       `https://www.tiktok.com/@${username}/video/${item.id}`,
      thumbnail: item.video?.cover || item.video?.originCover || null,
      platform:  'tiktok' as const,
    }))
  } catch (e) {
    console.error('fetchTikTokFeed error:', e)
    return []
  }
}

async function syncSection(section: any): Promise<{ synced: number; error?: string }> {
  const supabase = getSupabase()
  try {
    const channelUrl: string = section.channel_url
    if (!channelUrl) return { synced: 0 }

    const isYouTube = /youtube\.com|youtu\.be/.test(channelUrl)
    const isTikTok  = /tiktok\.com/.test(channelUrl)

    let videos: VideoItem[] = []
    if (isYouTube)     videos = await fetchYouTubeFeed(channelUrl)
    else if (isTikTok) videos = await fetchTikTokFeed(channelUrl)

    if (!videos.length) return { synced: 0, error: 'No videos found from feed' }

    const { data: existing } = await supabase
      .from('links')
      .select('url')
      .eq('section_id', section.id)

    const existingUrls = new Set((existing || []).map((l: any) => l.url))
    const newVideos = videos.filter(v => !existingUrls.has(v.url))
    if (!newVideos.length) return { synced: 0 }

    const { data: lastLink } = await supabase
      .from('links')
      .select('sort_order')
      .eq('section_id', section.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    let sortOrder = (lastLink?.sort_order ?? -1) + 1

    const toInsert = newVideos.map(v => ({
      id:         uuidv4(),
      profile_id: section.profile_id,
      section_id: section.id,
      type:       'video',
      title:      v.title,
      subtitle:   null,
      url:        v.url,
      image_url:  v.thumbnail,
      price:      null,
      platform:   v.platform,
      event_date: null,
      event_tag:  null,
      is_enabled: true,
      sort_order: sortOrder++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from('links').insert(toInsert)
    if (insertError) return { synced: 0, error: insertError.message }

    await supabase
      .from('sections')
      .update({ last_synced: new Date().toISOString() })
      .eq('id', section.id)

    return { synced: newVideos.length }
  } catch (e: any) {
    console.error('syncSection error:', e)
    return { synced: 0, error: e.message }
  }
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sections, error } = await supabase
      .from('sections')
      .select('*')
      .eq('type', 'videos')
      .not('channel_url', 'is', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let totalSynced = 0
    const results: any[] = []
    for (const section of sections || []) {
      const result = await syncSection(section)
      totalSynced += result.synced
      results.push({ section_id: section.id, ...result })
    }

    return NextResponse.json({
      ok: true,
      sections_checked: sections?.length || 0,
      videos_added: totalSynced,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('GET /api/cron/feeds error:', e)
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const { sectionId } = body

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
    }

    const { data: section, error } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (error || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    if (!section.channel_url) {
      return NextResponse.json({ error: 'No channel URL set for this section' }, { status: 400 })
    }

    const result = await syncSection(section)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    console.error('POST /api/cron/feeds error:', e)
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 })
  }
}