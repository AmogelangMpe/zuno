'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AffiliateLink } from '@/types/extended'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { slugify } from '@/lib/utils'

const NETWORKS = ['Amazon','LTK','ShareASale','Impact','Takealot','Custom']

type Props = {
  profileId:    string
  links:        AffiliateLink[]
  clicksByLink: Record<string, number>
  appUrl:       string
}

export default function AffiliateManager({ profileId, links: initial, clicksByLink, appUrl }: Props) {
  const supabase = createClient()
  const [links, setLinks] = useState(initial)
  const [adding, setAdding] = useState(false)

  async function addLink(data: { title: string; destination: string; slug: string; commission: string; network: string }) {
    const newLink: AffiliateLink = {
      id:           uuidv4(),
      profile_id:   profileId,
      title:        data.title,
      destination:  data.destination,
      slug:         data.slug,
      commission:   data.commission || null,
      network:      data.network || null,
      thumbnail:    null,
      total_clicks: 0,
      is_active:    true,
      created_at:   new Date().toISOString(),
    }

    const { error } = await supabase.from('affiliate_links').insert(newLink)
    if (error) { toast.error(error.message); return }

    setLinks(prev => [newLink, ...prev])
    setAdding(false)
    toast.success('Link added!')
  }

  async function toggleLink(id: string, current: boolean) {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l))
    await supabase.from('affiliate_links').update({ is_active: !current }).eq('id', id)
  }

  async function deleteLink(id: string) {
    if (!confirm('Delete this link?')) return
    setLinks(prev => prev.filter(l => l.id !== id))
    await supabase.from('affiliate_links').delete().eq('id', id)
    toast.success('Deleted')
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${appUrl}/go/${slug}`)
    toast.success('Copied!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium">Your links</h2>
        <button className="btn-primary text-sm py-2" onClick={() => setAdding(true)}>+ Add link</button>
      </div>

      {adding && <AddLinkForm onSave={addLink} onCancel={() => setAdding(false)} />}

      {links.length === 0 && !adding && (
        <div className="card p-8 text-center">
          <p className="font-medium mb-1">No affiliate links yet</p>
          <p className="text-sm text-zuno-muted">Add your first link to start tracking clicks</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {links.map(link => (
          <div key={link.id} className={`card p-4 ${!link.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{link.title}</p>
                <p className="text-xs text-zuno-muted truncate">{link.destination}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {link.network && (
                  <span className="text-xs bg-zuno-card px-2 py-0.5 rounded-full">{link.network}</span>
                )}
                {link.commission && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{link.commission}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zuno-muted">{link.total_clicks} total · {clicksByLink[link.id] || 0} this month</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyLink(link.slug)} className="btn-secondary text-xs py-1 px-2">
                  Copy link
                </button>
                <button onClick={() => toggleLink(link.id, link.is_active)} className="btn-ghost text-xs">
                  {link.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteLink(link.id)} className="btn-ghost text-xs text-red-500">
                  ×
                </button>
              </div>
            </div>

            <div className="mt-2 px-3 py-1.5 bg-zuno-card rounded-lg">
              <p className="text-xs text-zuno-muted font-mono">{appUrl}/go/{link.slug}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddLinkForm({ onSave, onCancel }: { onSave: (d: any) => void; onCancel: () => void }) {
  const [title, setTitle]           = useState('')
  const [destination, setDest]      = useState('')
  const [slug, setSlug]             = useState('')
  const [commission, setCommission] = useState('')
  const [network, setNetwork]       = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slug) setSlug(slugify(val))
  }

  return (
    <div className="card p-5 mb-4 flex flex-col gap-4">
      <h3 className="font-medium text-sm">New affiliate link</h3>
      <input className="input" placeholder="Title e.g. Nike Running Shoes *" value={title} onChange={e => handleTitleChange(e.target.value)} />
      <input className="input" placeholder="Destination URL (your affiliate link) *" value={destination} onChange={e => setDest(e.target.value)} />
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zuno-muted">zunobio.com/go/</span>
        <input className="input pl-28 font-mono text-sm" placeholder="your-slug" value={slug} onChange={e => setSlug(slugify(e.target.value))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select className="input text-sm" value={network} onChange={e => setNetwork(e.target.value)}>
          <option value="">Network (optional)</option>
          {NETWORKS.map(n => <option key={n}>{n}</option>)}
        </select>
        <input className="input text-sm" placeholder="Commission e.g. 8%" value={commission} onChange={e => setCommission(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button className="btn-primary flex-1 text-sm" onClick={() => onSave({ title, destination, slug, commission, network })} disabled={!title || !destination || !slug}>
          Add link
        </button>
        <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
