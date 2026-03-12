'use client'
 
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Section, Link as ZunoLink } from '@/types'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import LinkForm from './LinkForm'
 
type Props = {
  profileId: string
  sections:  (Section & { links: ZunoLink[] })[]
  onChange:  (s: (Section & { links: ZunoLink[] })[]) => void
}
 
export default function SectionsEditor({ profileId, sections, onChange }: Props) {
  const supabase = createClient()
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id || null)
  const [addingLink, setAddingLink]   = useState<string | null>(null)
  const [syncing, setSyncing]         = useState<string | null>(null)
 
  async function toggleSection(sectionId: string, enabled: boolean) {
    onChange(sections.map(s => s.id === sectionId ? { ...s, is_enabled: enabled } : s))
    await supabase.from('sections').update({ is_enabled: enabled }).eq('id', sectionId)
  }
 
  async function updateSectionTitle(sectionId: string, title: string) {
    onChange(sections.map(s => s.id === sectionId ? { ...s, title } : s))
    await supabase.from('sections').update({ title }).eq('id', sectionId)
  }
 
  async function updateChannelUrl(sectionId: string, channelUrl: string) {
    onChange(sections.map(s =>
      s.id === sectionId ? { ...s, channel_url: channelUrl || null } : s
    ))
    await supabase
      .from('sections')
      .update({ channel_url: channelUrl || null })
      .eq('id', sectionId)
  }
 
  async function syncNow(sectionId: string) {
    setSyncing(sectionId)
    try {
      const res = await fetch('/api/cron/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
 
      if (data.videos_added > 0) {
        toast.success(`Added ${data.videos_added} new video${data.videos_added > 1 ? 's' : ''}!`)
        const { data: freshLinks } = await supabase
          .from('links')
          .select('*')
          .eq('section_id', sectionId)
          .order('sort_order')
        if (freshLinks) {
          onChange(sections.map(s =>
            s.id === sectionId ? { ...s, links: freshLinks as ZunoLink[] } : s
          ))
        }
      } else {
        toast.success(data.error ? `Sync note: ${data.error}` : 'Already up to date!')
      }
    } catch (err: any) {
      toast.error(err.message || 'Sync failed')
    } finally {
      setSyncing(null)
    }
  }
 
  async function addLink(sectionId: string, linkData: Partial<ZunoLink>) {
    const section = sections.find(s => s.id === sectionId)!
    const newLink: ZunoLink = {
      id:          uuidv4(),
      profile_id:  profileId,
      section_id:  sectionId,
      type:        linkData.type || 'shop_link',
      title:       linkData.title || '',
      subtitle:    linkData.subtitle || null,
      url:         linkData.url || null,
      image_url:   linkData.image_url || null,
      price:       linkData.price || null,
      platform:    linkData.platform || null,
      event_date:  linkData.event_date || null,
      event_tag:   linkData.event_tag || null,
      is_enabled:  true,
      sort_order:  section.links.length,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }
    onChange(sections.map(s =>
      s.id === sectionId ? { ...s, links: [...s.links, newLink] } : s
    ))
    await supabase.from('links').insert(newLink)
    setAddingLink(null)
    toast.success('Link added!')
  }
 
  async function removeLink(sectionId: string, linkId: string) {
    onChange(sections.map(s =>
      s.id === sectionId ? { ...s, links: s.links.filter(l => l.id !== linkId) } : s
    ))
    await supabase.from('links').delete().eq('id', linkId)
    toast.success('Removed')
  }
 
  async function updateLink(sectionId: string, linkId: string, updates: Partial<ZunoLink>) {
    onChange(sections.map(s =>
      s.id === sectionId
        ? { ...s, links: s.links.map(l => l.id === linkId ? { ...l, ...updates } : l) }
        : s
    ))
    await supabase.from('links').update(updates).eq('id', linkId)
  }
 
  return (
    <div className="flex flex-col gap-4 py-4">
      <h2 className="font-medium">Sections</h2>
      <p className="text-sm text-zuno-muted">Enable sections and manage the links in each one.</p>
 
      {sections.map(section => (
        <div key={section.id} className="card overflow-visible">
 
          {/* Section header */}
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="flex-1 text-left"
            >
              <span className="font-medium text-sm">{section.title}</span>
              <span className="text-xs text-zuno-muted ml-2">
                {section.links.length} {section.links.length === 1 ? 'item' : 'items'}
              </span>
            </button>
            <button
              onClick={() => toggleSection(section.id, !section.is_enabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                section.is_enabled ? 'bg-zuno-text' : 'bg-zuno-accent'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                section.is_enabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className="text-zuno-muted text-lg"
            >
              {openSection === section.id ? '−' : '+'}
            </button>
          </div>
 
          {openSection === section.id && (
            <div className="border-t border-zuno-border p-4 flex flex-col gap-3">
 
              {/* Section title edit */}
              <input
                className="input text-sm"
                value={section.title}
                onChange={e => updateSectionTitle(section.id, e.target.value)}
                placeholder="Section name (shown on tab)"
              />
 
              {/* Video section controls */}
              {section.type === 'videos' && (
                <div className="bg-zuno-card rounded-xl p-3 flex flex-col gap-3">
 
                  {/* YouTube auto-sync */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-zuno-muted uppercase tracking-wide">
                      YouTube — auto-sync
                    </p>
                    <p className="text-xs text-zuno-muted">
                      Paste your YouTube channel URL — new videos are added automatically every 6 hours.
                    </p>
                    <input
                      className="input text-sm"
                      placeholder="https://youtube.com/@yourchannel"
                      value={section.channel_url || ''}
                      onChange={e => updateChannelUrl(section.id, e.target.value)}
                    />
                    {section.channel_url && (
                      <div className="flex items-center justify-between">
                        {section.last_synced ? (
                          <span className="text-xs text-zuno-muted">
                            Last synced: {new Date(section.last_synced).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-zuno-muted">Never synced yet</span>
                        )}
                        <button
                          onClick={() => syncNow(section.id)}
                          disabled={syncing === section.id}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          {syncing === section.id ? 'Syncing…' : '↻ Sync now'}
                        </button>
                      </div>
                    )}
                  </div>
 
                  {/* Divider */}
                  <div className="border-t border-zuno-border" />
 
                  {/* TikTok manual */}
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-zuno-muted uppercase tracking-wide">
                      TikTok — manual
                    </p>
                    <p className="text-xs text-zuno-muted">
                      TikTok doesn't support auto-sync. Add TikTok videos individually using "+ Add item" below — paste each video URL and the thumbnail fetches automatically.
                    </p>
                  </div>
 
                </div>
              )}
 
              {/* Links list */}
              {section.links.map(link => (
                <div key={link.id} className="bg-zuno-card rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zuno-muted uppercase tracking-wide">
                      {link.type.replace('_', ' ')}
                      {link.platform && <span className="ml-1 capitalize">· {link.platform}</span>}
                    </span>
                    <button
                      onClick={() => removeLink(section.id, link.id)}
                      className="text-xs text-zuno-muted hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    className="input text-sm"
                    value={link.title}
                    onChange={e => updateLink(section.id, link.id, { title: e.target.value })}
                    placeholder="Title"
                  />
                  <input
                    className="input text-sm"
                    value={link.url || ''}
                    onChange={e => updateLink(section.id, link.id, { url: e.target.value })}
                    placeholder="URL"
                  />
                  {link.subtitle !== undefined && (
                    <input
                      className="input text-sm"
                      value={link.subtitle || ''}
                      onChange={e => updateLink(section.id, link.id, { subtitle: e.target.value })}
                      placeholder="Subtitle (optional)"
                    />
                  )}
                  {link.type === 'product' && (
                    <input
                      className="input text-sm"
                      value={link.price || ''}
                      onChange={e => updateLink(section.id, link.id, { price: e.target.value })}
                      placeholder="Price e.g. R 1,200"
                    />
                  )}
                </div>
              ))}
 
              {/* Add link */}
              {addingLink === section.id ? (
                <LinkForm
                  sectionType={section.type}
                  onSave={data => addLink(section.id, data)}
                  onCancel={() => setAddingLink(null)}
                />
              ) : (
                <button
                  onClick={() => setAddingLink(section.id)}
                  className="btn-secondary text-sm py-2 w-full"
                >
                  + Add item
                </button>
              )}
 
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
