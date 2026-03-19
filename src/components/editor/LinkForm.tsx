'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { SectionType, LinkType, Link as ZunoLink } from '@/types'

const LINK_TYPES: Record<SectionType, { type: LinkType; label: string }[]> = {
  videos:  [{ type: 'video',        label: 'Video'         }],
  shop:    [{ type: 'shop_link',    label: 'Shop Link'     }, { type: 'product', label: 'Product' }],
  events:  [{ type: 'event',        label: 'Event'         }],
  press:   [{ type: 'press',        label: 'Press Feature' }],
  connect: [{ type: 'connect_link', label: 'Connect Link'  }],
  collabs: [{ type: 'brand',        label: 'Brand'         }, { type: 'service', label: 'Service' }],
  books:   [{ type: 'book',         label: 'Book'          }],
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
  profileId:   string
  onSave:      (data: Partial<ZunoLink>) => void
  onCancel:    () => void
}

export default function LinkForm({ sectionType, profileId, onSave, onCancel }: Props) {
  const types = LINK_TYPES[sectionType] || []
  const [type, setType]           = useState<LinkType>(types[0]?.type || 'shop_link')
  const [title, setTitle]         = useState('')
  const [subtitle, setSubtitle]   = useState('')  // author for books
  const [url, setUrl]             = useState('')
  const [price, setPrice]         = useState('')
  const [platform, setPlatform]   = useState('youtube')  // blurb for books
  const [eventDate, setEventDate] = useState('')
  const [eventTag, setEventTag]   = useState('Free')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [fetchingThumb, setFetchingThumb] = useState(false)
  const [uploading, setUploading] = useState(false)
  const coverFileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop() || 'jpg'
      const path = `${profileId}/book-covers/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('link-images')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) {
        console.error('Cover upload failed:', error.message)
        return
      }
      const { data: pub } = supabase.storage.from('link-images').getPublicUrl(path)
      setThumbnail(pub.publicUrl)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const isBook    = type === 'book'
  const isVideo   = type === 'video'
  const fetchImage = ['video', 'press', 'product', 'shop_link', 'book'].includes(type)

  useEffect(() => {
    if (!fetchImage || !url) { setThumbnail(null); return }
    const timer = setTimeout(async () => {
      setFetchingThumb(true)
      let thumb: string | null = null
      if (isVideo) {
        thumb = await fetchVideoThumbnail(url)
        setPlatform(detectPlatform(url))
      } else {
        thumb = await fetchOgImage(url)
      }
      setThumbnail(thumb)
      setFetchingThumb(false)
    }, 700)
    return () => clearTimeout(timer)
  }, [url, type, fetchImage, isVideo])

  function handleSave() {
    onSave({
      type,
      title,
      subtitle:   subtitle || null,
      url:        url || null,
      price:      price || null,
      // for books: store blurb in platform field
      platform:   isBook ? (platform || null) : (isVideo ? platform : null),
      event_date: eventDate || null,
      event_tag:  (eventTag as any) || null,
      image_url:  thumbnail || null,
    })
  }

  const showLargePreview = url && (isVideo || type === 'press' || type === 'product' || isBook)
  const showSmallPreview = url && type === 'shop_link'

  return (
    <div className="bg-zuno-surface border border-zuno-accent rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">New item</p>

      {types.length > 1 && (
        <select className="input text-sm" value={type} onChange={e => setType(e.target.value as LinkType)}>
          {types.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
      )}

      {/* Book-specific fields */}
      {isBook ? (
        <>
          <input className="input text-sm" placeholder="Book title *" value={title} onChange={e => setTitle(e.target.value)} required />
          <input className="input text-sm" placeholder="Author name" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
          <input className="input text-sm" placeholder="Book link (Amazon, Wattpad, Shopify etc.)" value={url} onChange={e => setUrl(e.target.value)} />

          {/* Cover preview */}
          {url && (
            <div className="rounded-xl overflow-hidden bg-zuno-card border border-zuno-border relative" style={{ paddingTop: '60%' }}>
              {fetchingThumb && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-zuno-muted">Fetching cover…</div>
              )}
              {!fetchingThumb && thumbnail && (
                <img src={thumbnail} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              )}
              {!fetchingThumb && !thumbnail && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-zuno-muted">No cover found — you can add one manually</div>
              )}
            </div>
          )}

          {/* Manual cover: upload file or paste URL */}
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Cover image URL (optional)"
              value={thumbnail || ''}
              onChange={e => setThumbnail(e.target.value || null)}
            />
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs px-3 py-2 whitespace-nowrap flex-shrink-0"
            >
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          <textarea
            className="input text-sm resize-none h-20"
            placeholder="Book description / blurb (optional)"
            value={platform}
            onChange={e => setPlatform(e.target.value)}
          />
          <input className="input text-sm" placeholder="Price e.g. R 299 or $12.99" value={price} onChange={e => setPrice(e.target.value)} />
        </>
      ) : (
        <>
          <input className="input text-sm" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} required />
          <input className="input text-sm" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />

          {/* Large preview */}
          {showLargePreview && (
            <div className="rounded-xl overflow-hidden bg-zuno-card border border-zuno-border h-36 relative">
              {fetchingThumb && <div className="flex items-center justify-center h-full text-xs text-zuno-muted">Fetching image…</div>}
              {!fetchingThumb && thumbnail && <Image src={thumbnail} alt="Preview" fill className="object-cover" unoptimized />}
              {!fetchingThumb && !thumbnail && <div className="flex items-center justify-center h-full text-xs text-zuno-muted">No image found</div>}
              {!fetchingThumb && thumbnail && isVideo && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">{platform}</div>
              )}
            </div>
          )}

          {/* Small preview for shop links */}
          {showSmallPreview && (
            <div className="flex items-center gap-2 text-xs text-zuno-muted">
              {fetchingThumb ? <span>Fetching image…</span> : thumbnail ? (
                <>
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative border border-zuno-border">
                    <Image src={thumbnail} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span style={{ color: '#4a7c59' }}>Image found ✓</span>
                </>
              ) : <span>No image found</span>}
            </div>
          )}

          <input className="input text-sm" placeholder="Subtitle (optional)" value={subtitle} onChange={e => setSubtitle(e.target.value)} />

          {type === 'product' && (
            <input className="input text-sm" placeholder="Price e.g. R 1,200" value={price} onChange={e => setPrice(e.target.value)} />
          )}
          {isVideo && (
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
        </>
      )}

      <div className="flex gap-2">
        <button className="btn-primary flex-1 text-sm py-2" onClick={handleSave} disabled={!title}>Add</button>
        <button className="btn-secondary flex-1 text-sm py-2" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}