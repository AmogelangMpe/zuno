'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialLink, SocialPlatform } from '@/types'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const PLATFORMS: { id: SocialPlatform; label: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram',  placeholder: 'https://instagram.com/yourhandle' },
  { id: 'tiktok',    label: 'TikTok',     placeholder: 'https://tiktok.com/@yourhandle' },
  { id: 'youtube',   label: 'YouTube',    placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'facebook',  label: 'Facebook',   placeholder: 'https://facebook.com/yourpage' },
  { id: 'snapchat',  label: 'Snapchat',   placeholder: 'https://snapchat.com/add/yourhandle' },
  { id: 'twitter',   label: 'X / Twitter',placeholder: 'https://x.com/yourhandle' },
  { id: 'email',     label: 'Email',      placeholder: 'mailto:you@example.com' },
]

type Props = {
  profileId: string
  socials:   SocialLink[]
  onChange:  (s: SocialLink[]) => void
}

export default function SocialsEditor({ profileId, socials, onChange }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  async function addPlatform(platform: SocialPlatform) {
    const newLink: SocialLink = {
      id:             uuidv4(),
      profile_id:     profileId,
      platform,
      url:            '',
      follower_count: null,
      sort_order:     socials.length,
      created_at:     new Date().toISOString(),
    }
    const updated = [...socials, newLink]
    onChange(updated)
    await supabase.from('social_links').insert(newLink)
  }

  async function updateLink(id: string, field: keyof SocialLink, value: string) {
    const updated = socials.map(s => s.id === id ? { ...s, [field]: value } : s)
    onChange(updated)
    setSaving(true)
    await supabase.from('social_links').update({ [field]: value }).eq('id', id)
    setSaving(false)
  }

  async function removeLink(id: string) {
    onChange(socials.filter(s => s.id !== id))
    await supabase.from('social_links').delete().eq('id', id)
    toast.success('Removed')
  }

  const activePlatforms = new Set(socials.map(s => s.platform))

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Social links</h2>
        {saving && <span className="text-xs text-zuno-muted">Saving…</span>}
      </div>

      {/* Existing links */}
      {socials.map(link => {
        const p = PLATFORMS.find(p => p.id === link.platform)
        return (
          <div key={link.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{p?.label || link.platform}</span>
              <button
                onClick={() => removeLink(link.id)}
                className="text-xs text-zuno-muted hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
            <input
              className="input text-sm"
              value={link.url}
              onChange={e => updateLink(link.id, 'url', e.target.value)}
              placeholder={p?.placeholder}
            />
            <input
              className="input text-sm"
              value={link.follower_count || ''}
              onChange={e => updateLink(link.id, 'follower_count', e.target.value)}
              placeholder="Follower count e.g. 124K (optional)"
            />
          </div>
        )
      })}

      {/* Add platform */}
      <div>
        <p className="text-sm text-zuno-muted mb-3">Add a platform</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.filter(p => !activePlatforms.has(p.id)).map(p => (
            <button
              key={p.id}
              onClick={() => addPlatform(p.id)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              + {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
