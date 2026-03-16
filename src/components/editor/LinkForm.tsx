'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { SectionType, LinkType, Link as ZunoLink } from '@/types'

const LINK_TYPES: Record<SectionType, { type: LinkType; label: string }[]> = {
  videos:  [{ type: 'video',        label: 'Video'         }],
  shop:    [{ type: 'shop_link',    label: 'Shop Link'     }, { type: 'product', label: 'Product' }],
  events:  [{ type: 'event',        label: 'Event'         }],
  press:   [{ type: 'press',        label: 'Press Feature' }],
  connect: [{ type: 'connect_link', label: 'Connect Link'  }],
  collabs: [{ type: 'brand',        label: 'Brand'         }, { type: 'service', label: 'Service' }],
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function isTikTokUrl(url: string): boolean {
  return url.includes('tiktok.com')
}

function detectPlatform(url: string): string {
  if (getYouTubeId(url)) return 'youtube'
  if (isTikTokUrl(url)) return 'tiktok'
  return 'youtube'
}

async function fetchVideoThumbnail(url: string): Promise<string | null> {
  const ytId = getYouTubeId(url)
  if (ytId) {
    const maxRes = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    try {
      const res = await fetch(maxRes, { method: 'HEAD' })
      if (res.ok) return maxRes
    } catch {}
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
  }
  if (isTikTokUrl(url)) {
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const data = await res.json()
        return data.thumbnail_url || null
      }
    } catch {}
  }
  return null
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.image || null
  } catch {
    return null
  }
}

type Props = {
  sectionType: SectionType
  onSave:      (data: Partial<ZunoLink>) => void
  onCancel:    () => void
}

export default function LinkForm({ sectionType, onSave, onCancel }: Props) {
  const types = LINK_TYPES[sectionType] || []
  const [type, setType]           = useState<LinkType>(types[0]?.type || 'shop_link')
  const [title, setTitle]         = useState('')
  const [subtitle, setSubtitle]   = useState('')
  const [url, setUrl]             = useState('')
  const [price, setPrice]         = useState('')
  const [platform, setPlatform]   = useState('youtube')
  const [eventDate, setEventDate] = useState('')
  const [eventTag, setEventTag]   = useState('Free')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [fetchingThumb, setFetchingThumb] = useState(false)

  const shouldFetchImage = ['video', 'press', 'product', 'shop_link'].includes(type)

  useEffect(() => {
    if (!shouldFetchImage || !url) {
      setThumbnail(null)
      return
    }
    const timer = setTimeout(async () => {
      setFetchingThumb(true)
      let thumb: string | null = null
      if (type === 'video') {
        thumb = await fetchVideoThumbnail(url)
        setPlatform(detectPlatform(url))
      } else {
        thumb = await fetchOgImage(url)
      }
      setThumbnail(thumb)
      setFetchingThumb(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [url, type, shouldFetchImage])

  function handleSave() {
    onSave({
      type,
      title,
      subtitle:   subtitle || null,
      url:        url || null,
      price:      price || null,
      platform:   type === 'video' ? platform : null,
      event_date: eventDate || null,
      event_tag:  (eventTag as any) || null,
      image_url:  thumbnail || null,
    })
  }

  const showLargePreview = url && (type === 'video' || type === 'press' || type === 'product')
  const showSmallPreview = url && type === 'shop_link'

  return (
    <div className="bg-zuno-surface border border-zuno-accent rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">New item</p>

      {types.length > 1 && (
        <select className="input text-sm" value={type} onChange={e => setType(e.target.value as LinkType)}>
          {types.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
      )}

      <input className="input text-sm" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} required />
      <input className="input text-sm" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />

      {/* Large preview — video, press, product */}
      {showLargePreview && (
        <div className="rounded-xl overflow-hidden bg-zuno-card border border-zuno-border h-36 relative">
          {fetchingThumb && (
            <div className="flex items-center justify-center h-full text-xs text-zuno-muted">Fetching image…</div>
          )}
          {!fetchingThumb && thumbnail && (
            <Image src={thumbnail} alt="Preview" fill className="object-cover" unoptimized />
          )}
          {!fetchingThumb && !thumbnail && (
            <div className="flex items-center justify-center h-full text-xs text-zuno-muted">No image found</div>
          )}
          {!fetchingThumb && thumbnail && type === 'video' && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">
              {platform}
            </div>
          )}
        </div>
      )}

      {/* Small preview — shop link */}
      {showSmallPreview && (
        <div className="flex items-center gap-2 text-xs text-zuno-muted">
          {fetchingThumb ? (
            <span>Fetching image…</span>
          ) : thumbnail ? (
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative border border-zuno-border">
                <Image src={thumbnail} alt="" fill className="object-cover" unoptimized />
              </div>
              <span style={{ color: '#4a7c59' }}>Image found ✓</span>
            </>
          ) : (
            <span>No image found</span>
          )}
        </div>
      )}

      <input className="input text-sm" placeholder="Subtitle (optional)" value={subtitle} onChange={e => setSubtitle(e.target.value)} />

      {type === 'product' && (
        <input className="input text-sm" placeholder="Price e.g. R 1,200" value={price} onChange={e => setPrice(e.target.value)} />
      )}

      {type === 'video' && (
        <select className="input text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
        </select>
      )}

      {type === 'event' && (
        <>
          <input className="input text-sm" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
          <select className="input text-sm" value={eventTag} onChange={e => setEventTag(e.target.value)}>
            {['Free', 'Invite', 'Soon', 'Live'].map(t => <option key={t}>{t}</option>)}
          </select>
        </>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1 text-sm py-2" onClick={handleSave} disabled={!title}>Add</button>
        <button className="btn-secondary flex-1 text-sm py-2" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}