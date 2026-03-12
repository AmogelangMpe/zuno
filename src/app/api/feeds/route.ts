import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Use service role so we can write to any profile's links
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── YouTube ───────────────────────────────────────────────────────────────────

// Extract channel ID or handle from a YouTube channel URL
function parseYouTubeChannel(url: string): { type: 'id' | 'handle' | 'user'; value: string } | null {
  try {
    const u = new URL(url)
    // /@handle
    const handle = u.pathname.match(/^\/@(.+)/)
    if (handle) return { type: 'handle', value: handle[1] }
    // /channel/UCxxx
    const channelId = u.pathname.match(/^\/channel\/([^/]+)/)
    if (channelId) return { type: 'id', value: channelId[1] }
    // /user/username
    const user = u.pathname.match(/^\/user\/([^/]+)/)
    if (user) return { type: 'user', value: user[1] }
  } catch {}
  return null
}

// YouTube exposes a public RSS feed per channel — no API key needed
async function fetchYouTubeFeed(channelUrl: string): Promise<VideoItem[]> {
  const parsed = parseYouTubeChannel(channelUrl)
  if (!parsed) return []

  let feedUrl: string
  if (parsed.type === 'id') {
    feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${parsed.value}`
  } else if (parsed.type === 'user') {
    feedUrl = `https://www.youtube.com/feeds/videos.xml?user=${parsed.value}`
  } else {
    // For handles we need to resolve to a channel ID first via oEmbed
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(channelUrl)}&format=json`
      )
      if (!oembed.ok) return []
      // oEmbed doesn't give us channel_id directly, so scrape the channel page
      const page = await fetch(channelUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const html = await page.text()
      const match = html.match(/"channelId":"([^"]+)"/)
      if (!match) return []
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`
    } catch {
      return []
    }
  }

  try {
    const res = await fetch(feedUrl)
    if (!res.ok) return []
    const xml = await res.text()
    return parseYouTubeXML(xml)
  } catch {
    return []
  }
}

type VideoItem = {
  title:     string
  url:       string
  thumbnail: string | null
  platform:  'youtube' | 'tiktok'
}

function parseYouTubeXML(xml: string): VideoItem[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []
  return entries.slice(0, 10).map(entry => {
    const title     = entry.match(/<title>([^<]+)<\/title>/)?.[1] || 'Untitled'
    const videoId   = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || ''
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
    const url       = `https://www.youtube.com/watch?v=${videoId}`
    return { title, url, thumbnail, platform: 'youtube' as const }
  }).filter(v => v.url !== 'https://www.youtube.com/watch?v=')
}

// ── TikTok ────────────────────────────────────────────────────────────────────

// TikTok doesn't have a public RSS feed, so we use their oEmbed endpoint
// to at least validate the profile exists, then fetch the user page for recent videos
async function fetchTikTokFeed(channelUrl: string): Promise<VideoItem[]> {
  try {
    // Extract username from URL like tiktok.com/@username
    const match = channelUrl.match(/tiktok\.com\/@([^/?]+)/)
    if (!match) return []
    const username = match[1]

    // Fetch the TikTok user page and extract video data from the JSON blob
    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    })
    if (!res.ok) return []
    const html = await res.text()

    // TikTok embeds video data in a __UNIVERSAL_DATA__ script tag
    const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/)
    if (!scriptMatch) return []

    const data = JSON.parse(scriptMatch[1])
    const itemList = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo?.stats
      ? data?.['__DEFAULT_SCOPE__']?.['webapp.video-detail'] 
      : null

    // Try to get items from the user page video list
    const userModule = findDeep(data, 'itemList')
    if (!Array.isArray(userModule)) return []

    return userModule.slice(0, 10).map((item: any) => ({
      title:     item.desc || 'TikTok video',
      url:       `https://www.tiktok.com/@${username}/video/${item.id}`,
      thumbnail: item.video?.cover || item.video?.originCover || null,
      platform:  'tiktok' as const,
    }))
  } catch {
    return []
  }
}

// Recursively find a key in a nested object
function findDeep(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return null
  if (key in obj) return obj[key]
  for (const v of Object.values(obj)) {
    const found = findDeep(v, key)
    if (found !== null) return found
  }
  return null
}

// ── Core sync logic ───────────────────────────────────────────────────────────

async function syncSection(section: any) {
  const channelUrl: string = section.channel_url
  if (!channelUrl) return { synced: 0 }

  const isYouTube = channelUrl.includes('youtube.com') || channelUrl.includes('youtu.be')
  const isTikTok  = channelUrl.includes('tiktok.com')

  let videos: VideoItem[] = []
  if (isYouTube) videos = await fetchYouTubeFeed(channelUrl)
  else if (isTikTok) videos = await fetchTikTokFeed(channelUrl)

  if (!videos.length) return { synced: 0 }

  // Get existing link URLs for this section to avoid duplicates
  const { data: existing } = await supabase
    .from('links')
    .select('url')
    .eq('section_id', section.id)

  const existingUrls = new Set((existing || []).map((l: any) => l.url))

  const newVideos = videos.filter(v => !existingUrls.has(v.url))
  if (!newVideos.length) return { synced: 0 }

  // Get current max sort_order
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

  await supabase.from('links').insert(toInsert)

  // Update last_synced timestamp
  await supabase
    .from('sections')
    .update({ last_synced: new Date().toISOString() })
    .eq('id', section.id)

  return { synced: newVideos.length }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Secure the cron endpoint — Vercel sends this header automatically
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all video sections that have a channel_url set
  const { data: sections, error } = await supabase
    .from('sections')
    .select('*')
    .eq('type', 'videos')
    .not('channel_url', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let totalSynced = 0
  for (const section of sections || []) {
    const { synced } = await syncSection(section)
    totalSynced += synced
  }

  return NextResponse.json({
    ok: true,
    sections_checked: sections?.length || 0,
    videos_added: totalSynced,
    timestamp: new Date().toISOString(),
  })
}

// Also allow POST for dashboard-triggered refresh of a single section
export async function POST(request: NextRequest) {
  try {
    const { sectionId } = await request.json()
    if (!sectionId) return NextResponse.json({ error: 'sectionId required' }, { status: 400 })

    const { data: section } = await supabase
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (!section?.channel_url) {
      return NextResponse.json({ error: 'No channel URL set' }, { status: 400 })
    }

    const { synced } = await syncSection(section)
    return NextResponse.json({ ok: true, videos_added: synced })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
