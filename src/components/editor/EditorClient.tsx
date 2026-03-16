'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Profile, SocialLink, Section, Link as ZunoLink } from '@/types'
import ProfileEditor from './ProfileEditor'
import SectionsEditor from './SectionsEditor'
import SocialsEditor from './SocialsEditor'
import ThemeEditor from './ThemeEditor'
import CollabsEditor from './CollabsEditor'
import ProfilePreview from '../profile/ProfilePreview'

type Tab = 'profile' | 'socials' | 'sections' | 'collabs' | 'theme'

type Props = {
  profile:     Profile
  socialLinks: SocialLink[]
  sections:    (Section & { links: ZunoLink[] })[]
}

export default function EditorClient({ profile: initialProfile, socialLinks: initialSocials, sections: initialSections }: Props) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [profile, setProfile]     = useState(initialProfile)
  const [socials, setSocials]     = useState(initialSocials)
  const [sections, setSections]   = useState(initialSections)
  const [saving, setSaving]       = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  async function saveProfile(updates: Partial<Profile>) {
    setSaving(true)
    const updated = { ...profile, ...updates }
    setProfile(updated)
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
    if (error) toast.error('Save failed: ' + error.message)
    else toast.success('Saved!')
    setSaving(false)
  }

  // Find or create the collabs section in state
  const collabsSection = sections.find(s => s.type === 'collabs')

  function updateCollabsLinks(links: ZunoLink[]) {
    if (!collabsSection) return
    setSections(sections.map(s =>
      s.id === collabsSection.id ? { ...s, links } : s
    ))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',  label: 'Profile'  },
    { id: 'socials',  label: 'Socials'  },
    { id: 'sections', label: 'Sections' },
    { id: 'collabs',  label: 'Collabs'  },
    { id: 'theme',    label: 'Theme'    },
  ]

  return (
    <div className="min-h-screen bg-zuno-bg flex flex-col">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-zuno-border bg-zuno-surface sticky top-0 z-20">
        <Link href="/dashboard" className="font-serif italic text-xl">ZunoBio</Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-ghost text-xs py-1.5"
          >
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
          <a
            href={`/${profile.username}`}
            target="_blank"
            className="btn-secondary text-xs py-1.5"
          >
            View live ↗
          </a>
          {saving && <span className="text-xs text-zuno-muted">Saving…</span>}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab bar */}
          <div className="flex border-b border-zuno-border bg-zuno-surface px-4 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-sm relative transition-colors whitespace-nowrap ${
                  activeTab === t.id
                    ? 'text-zuno-text font-medium'
                    : 'text-zuno-muted hover:text-zuno-text'
                }`}
              >
                {t.label}
                {activeTab === t.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-zuno-text rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 max-w-lg">
            {activeTab === 'profile' && (
              <ProfileEditor profile={profile} onSave={saveProfile} />
            )}
            {activeTab === 'socials' && (
              <SocialsEditor
                profileId={profile.id}
                socials={socials}
                onChange={setSocials}
              />
            )}
            {activeTab === 'sections' && (
              <SectionsEditor
                profileId={profile.id}
                sections={sections}
                onChange={setSections}
              />
            )}
            {activeTab === 'collabs' && (
              collabsSection ? (
                <CollabsEditor
                  profile={profile}
                  section={collabsSection}
                  onSave={saveProfile}
                  onChange={updateCollabsLinks}
                />
              ) : (
                <div className="py-10 text-center flex flex-col items-center gap-4">
                  <p className="text-sm text-zuno-muted">No collabs section found.</p>
                  <p className="text-xs text-zuno-muted max-w-xs">
                    Run the SQL below in your Supabase SQL editor to create it, then refresh.
                  </p>
                  <pre className="text-xs bg-zuno-card border border-zuno-border rounded-xl p-4 text-left w-full max-w-sm overflow-x-auto">{`INSERT INTO sections (id, profile_id, type, title, is_enabled, sort_order)
VALUES (
  gen_random_uuid(),
  '${profile.id}',
  'collabs',
  'Collabs',
  true,
  99
);`}</pre>
                </div>
              )
            )}
            {activeTab === 'theme' && (
              <ThemeEditor profile={profile} onSave={saveProfile} />
            )}
          </div>
        </div>

        {/* Live preview panel — desktop only */}
        {showPreview && (
          <div className="hidden md:block w-96 border-l border-zuno-border bg-zuno-card overflow-y-auto">
            <div className="sticky top-0 bg-zuno-card border-b border-zuno-border px-4 py-3">
              <p className="text-xs text-zuno-muted uppercase tracking-wider font-medium">Live Preview</p>
            </div>
            <div className="p-4">
              <div className="rounded-3xl overflow-hidden border border-zuno-border shadow-lg bg-zuno-bg scale-90 origin-top">
                <ProfilePreview
                  profile={profile}
                  socialLinks={socials}
                  sections={sections}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}