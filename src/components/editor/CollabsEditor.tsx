'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Section, Link as ZunoLink } from '@/types'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const PRESET_SERVICES = [
  'Sponsored Post',
  'UGC Content',
  'Brand Ambassador',
  'Event Appearance',
  'Product Review',
  'Gifting',
]

type Props = {
  profile:   Profile
  section:   Section & { links: ZunoLink[] }
  onSave:    (updates: Partial<Profile>) => Promise<void>
  onChange:  (links: ZunoLink[]) => void
}

export default function CollabsEditor({ profile, section, onSave, onChange }: Props) {
  const supabase = createClient()

  const [openToCollabs, setOpenToCollabs] = useState(profile.open_to_collabs ?? false)
  const [collabEmail, setCollabEmail]     = useState(profile.collab_email ?? '')
  const [newBrandUrl, setNewBrandUrl]     = useState('')
  const [newBrandName, setNewBrandName]   = useState('')
  const [fetchingLogo, setFetchingLogo]   = useState(false)
  const [previewLogo, setPreviewLogo]     = useState<string | null>(null)
  const [addingService, setAddingService] = useState(false)
  const [customService, setCustomService] = useState('')

  const brands   = section.links.filter(l => l.type === 'brand')
  const services = section.links.filter(l => l.type === 'service')

  async function saveCollabSettings() {
    await onSave({ open_to_collabs: openToCollabs, collab_email: collabEmail || null })
    toast.success('Saved!')
  }

  async function fetchBrandLogo(url: string) {
    if (!url) return
    setFetchingLogo(true)
    try {
      const res = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.image) {
        setPreviewLogo(data.image)
      } else {
        // Fallback: try favicon
        const domain = new URL(url).hostname
        setPreviewLogo(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
      }
    } catch {
      setPreviewLogo(null)
    } finally {
      setFetchingLogo(false)
    }
  }

  async function addBrand() {
    if (!newBrandName) return
    const newLink: ZunoLink = {
      id:          uuidv4(),
      profile_id:  profile.id,
      section_id:  section.id,
      type:        'brand',
      title:       newBrandName,
      subtitle:    null,
      url:         newBrandUrl || null,
      image_url:   previewLogo || null,
      price:       null,
      platform:    null,
      event_date:  null,
      event_tag:   null,
      is_enabled:  true,
      sort_order:  section.links.length,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }
    onChange([...section.links, newLink])
    await supabase.from('links').insert(newLink)
    setNewBrandName('')
    setNewBrandUrl('')
    setPreviewLogo(null)
    toast.success('Brand added!')
  }

  async function addService(title: string) {
    if (!title) return
    const newLink: ZunoLink = {
      id:          uuidv4(),
      profile_id:  profile.id,
      section_id:  section.id,
      type:        'service',
      title,
      subtitle:    null,
      url:         null,
      image_url:   null,
      price:       null,
      platform:    null,
      event_date:  null,
      event_tag:   null,
      is_enabled:  true,
      sort_order:  section.links.length,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }
    onChange([...section.links, newLink])
    await supabase.from('links').insert(newLink)
    setCustomService('')
    setAddingService(false)
    toast.success('Service added!')
  }

  async function removeLink(linkId: string) {
    onChange(section.links.filter(l => l.id !== linkId))
    await supabase.from('links').delete().eq('id', linkId)
    toast.success('Removed')
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <h2 className="font-medium">Collabs</h2>

      {/* Open to collabs toggle */}
      <div className="card p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Open to collabs</p>
            <p className="text-xs text-zuno-muted mt-0.5">Shows a badge and contact button on your profile</p>
          </div>
          <button
            onClick={() => setOpenToCollabs(!openToCollabs)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              openToCollabs ? 'bg-zuno-text' : 'bg-zuno-accent'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              openToCollabs ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {openToCollabs && (
          <div>
            <label className="text-xs text-zuno-muted mb-1.5 block">Contact email for enquiries</label>
            <input
              className="input text-sm"
              type="email"
              placeholder="your@email.com"
              value={collabEmail}
              onChange={e => setCollabEmail(e.target.value)}
            />
          </div>
        )}

        <button className="btn-primary text-sm py-2" onClick={saveCollabSettings}>
          Save settings
        </button>
      </div>

      {/* Services offered */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-sm font-medium">Services offered</p>
        <p className="text-xs text-zuno-muted">What types of collaborations are you available for?</p>

        {/* Existing services */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {services.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 bg-zuno-card border border-zuno-border rounded-full px-3 py-1.5">
                <span className="text-xs font-medium">{s.title}</span>
                <button
                  onClick={() => removeLink(s.id)}
                  className="text-zuno-muted hover:text-red-500 transition-colors text-xs leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preset quick-add */}
        <div className="flex flex-wrap gap-2">
          {PRESET_SERVICES.filter(p => !services.find(s => s.title === p)).map(preset => (
            <button
              key={preset}
              onClick={() => addService(preset)}
              className="text-xs border border-dashed border-zuno-accent text-zuno-muted rounded-full px-3 py-1.5 hover:border-zuno-text hover:text-zuno-text transition-colors"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Custom service */}
        {addingService ? (
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Custom service name"
              value={customService}
              onChange={e => setCustomService(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addService(customService)}
              autoFocus
            />
            <button className="btn-primary text-sm py-2 px-3" onClick={() => addService(customService)} disabled={!customService}>
              Add
            </button>
            <button className="btn-secondary text-sm py-2 px-3" onClick={() => setAddingService(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingService(true)}
            className="btn-secondary text-sm py-2 w-full"
          >
            + Custom service
          </button>
        )}
      </div>

      {/* Brands worked with */}
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-sm font-medium">Brands worked with</p>
        <p className="text-xs text-zuno-muted">Add brand websites — logos are fetched automatically.</p>

        {/* Existing brands */}
        {brands.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {brands.map(brand => (
              <div key={brand.id} className="bg-zuno-card border border-zuno-border rounded-xl p-3 flex flex-col items-center gap-2 relative">
                <button
                  onClick={() => removeLink(brand.id)}
                  className="absolute top-1.5 right-1.5 text-zuno-muted hover:text-red-500 text-xs leading-none"
                >
                  ×
                </button>
                {brand.image_url ? (
                  <div className="w-10 h-10 relative">
                    <Image src={brand.image_url} alt={brand.title} fill className="object-contain rounded-lg" unoptimized />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zuno-hover flex items-center justify-center text-base font-bold text-zuno-muted">
                    {brand.title[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-center text-zuno-muted leading-tight">{brand.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Add brand */}
        <div className="flex flex-col gap-2">
          <input
            className="input text-sm"
            placeholder="Brand website URL (logo auto-fetched)"
            value={newBrandUrl}
            onChange={e => setNewBrandUrl(e.target.value)}
            onBlur={() => newBrandUrl && fetchBrandLogo(newBrandUrl)}
          />

          {/* Logo preview */}
          {fetchingLogo && <p className="text-xs text-zuno-muted">Fetching logo…</p>}
          {previewLogo && !fetchingLogo && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative border border-zuno-border rounded-lg overflow-hidden">
                <Image src={previewLogo} alt="Logo preview" fill className="object-contain" unoptimized />
              </div>
              <span className="text-xs text-zuno-muted">Logo found ✓</span>
            </div>
          )}

          <input
            className="input text-sm"
            placeholder="Brand name *"
            value={newBrandName}
            onChange={e => setNewBrandName(e.target.value)}
          />
          <button
            className="btn-primary text-sm py-2"
            onClick={addBrand}
            disabled={!newBrandName}
          >
            + Add brand
          </button>
        </div>
      </div>
    </div>
  )
}