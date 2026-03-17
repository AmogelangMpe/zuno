'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Profile, SocialLink, Section, Link as ZunoLink } from '@/types'
import { getPublicUrl } from '@/lib/utils'
import SocialIcon from './SocialIcon'
import CollabsSection from './CollabsSection'

type Props = {
  profile:     Profile
  socialLinks: SocialLink[]
  sections:    (Section & { links: ZunoLink[] })[]
  showJoinCta?: boolean
}

export default function ProfilePreview({ profile, socialLinks, sections, showJoinCta = false }: Props) {
  const enabledSections = sections.filter(s => s.is_enabled)
  const [activeSection, setActiveSection] = useState(enabledSections[0]?.id || '')

  const coverUrl  = getPublicUrl(profile.cover_url, 'covers')

  const style = {
    '--theme-bg':      profile.theme_bg,
    '--theme-surface': profile.theme_surface,
    '--theme-text':    profile.theme_text,
    '--theme-accent':  profile.theme_accent,
  } as React.CSSProperties

  return (
    <div className="min-h-screen pb-20" css-vars="true"
      style={{
        background:    profile.theme_bg,
        color:         profile.theme_text,
        fontFamily:    'var(--font-dm-sans, DM Sans, sans-serif)',
        maxWidth:      '480px',
        margin:        '0 auto',
        ...style,
      }}
    >
      {/* Hero */}
      <div className="relative w-full h-[420px] overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${profile.theme_accent}44, ${profile.theme_accent}22)` }}
      >
        {coverUrl && (
          <Image src={coverUrl} alt={profile.display_name} fill className="object-cover object-top" />
        )}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom, transparent 50%, ${profile.theme_bg} 100%)`
        }} />
      </div>

      {/* Profile info */}
      <div className="text-center px-5 mt-[-70px] relative z-10 pb-2">
        <h1 style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)', fontStyle: 'italic', fontSize: '38px', fontWeight: 400, lineHeight: 1.1, marginBottom: '8px' }}>
          {profile.display_name || profile.username}
        </h1>
        {profile.bio && (
          <p style={{ fontSize: '13px', opacity: 0.6, lineHeight: 1.6, maxWidth: '280px', margin: '0 auto 16px' }}>
            {profile.bio}
          </p>
        )}
      </div>

      {/* Stats bar */}
      {socialLinks.some(s => s.follower_count) && (
        <div style={{
          display: 'flex', background: profile.theme_surface, borderRadius: '16px',
          margin: '0 18px 20px', overflow: 'hidden',
          border: `1px solid ${profile.theme_accent}33`,
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}>
          {socialLinks.filter(s => s.follower_count).slice(0, 3).map((s, i, arr) => (
            <div key={s.id} style={{
              flex: 1, padding: '14px 8px', textAlign: 'center',
              borderRight: i < arr.length - 1 ? `1px solid ${profile.theme_accent}33` : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: '18px', fontWeight: 500, marginBottom: '2px' }}>
                {s.follower_count}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {s.platform}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Social icons */}
      {socialLinks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '0 18px 22px', flexWrap: 'wrap' }}>
          {socialLinks.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.platform}
              style={{
                width: '42px', height: '42px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: profile.theme_surface,
                border: `1px solid ${profile.theme_accent}44`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s',
                textDecoration: 'none',
                color: profile.theme_text,
              }}
            >
              <SocialIcon platform={link.platform} size={16} color={profile.theme_text} />
            </a>
          ))}
        </div>
      )}

      {/* Tabs */}
      {enabledSections.length > 0 && (
        <div style={{ borderBottom: `1px solid ${profile.theme_accent}33`, marginBottom: '0' }}>
          <div style={{ display: 'flex', padding: '0 18px', overflowX: 'auto' }}
            className="no-scrollbar"
          >
            {enabledSections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding: '10px 16px 12px',
                  fontSize: '13px',
                  fontWeight: activeSection === s.id ? 500 : 400,
                  color: activeSection === s.id ? profile.theme_text : `${profile.theme_text}88`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  fontFamily: 'var(--font-dm-sans, sans-serif)',
                  transition: 'color 0.2s',
                }}
              >
                {s.title}
                {activeSection === s.id && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 16, right: 16,
                    height: '2px', background: profile.theme_text,
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section content */}
      {enabledSections.map(section => (
        <div
          key={section.id}
          style={{ display: activeSection === section.id ? 'block' : 'none', padding: '24px 18px 0' }}
        >
          <SectionContent section={section} profile={profile} theme={{ bg: profile.theme_bg, surface: profile.theme_surface, text: profile.theme_text, accent: profile.theme_accent }} />
        </div>
      ))}

      {showJoinCta && (
        <div
          style={{
            position: 'sticky',
            marginTop: '18px',
            padding: '10px 18px calc(10px + env(safe-area-inset-bottom))',
            bottom: '10px',
            textAlign: 'center',
            zIndex: 30,
            background: `linear-gradient(to top, ${profile.theme_bg}F2, ${profile.theme_bg}00)`,
          }}
        >
          <a
            href="/auth/signup"
            style={{
              display: 'inline-block',
              fontSize: '12px',
              letterSpacing: '0.04em',
              opacity: 0.72,
              color: profile.theme_text,
              textDecoration: 'none',
              borderBottom: `1px solid ${profile.theme_text}44`,
              paddingBottom: '2px',
            }}
          >
            Want your own page? Create one
          </a>
        </div>
      )}
    </div>
  )
}

function SectionContent({ section, profile, theme }: { section: Section & { links: ZunoLink[] }, profile: Profile, theme: any }) {
  if (section.links.length === 0) {
    return <p style={{ fontSize: '13px', opacity: 0.4, textAlign: 'center', padding: '20px 0' }}>No items yet</p>
  }

  const cardStyle = {
    background: theme.surface,
    border: `1px solid ${theme.accent}33`,
    borderRadius: '14px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    marginBottom: '10px',
    overflow: 'hidden',
    display: 'block',
    textDecoration: 'none',
    color: theme.text,
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
  }

  if (section.type === 'videos') {
    return (
      <div>
        {['youtube', 'tiktok'].map(platform => {
          const platformLinks = section.links.filter(l => l.platform === platform)
          if (!platformLinks.length) return null
          return (
            <div key={platform}>
              <p style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, marginBottom: '12px', marginTop: '8px' }}>
                {platform}
              </p>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', margin: '0 -18px', paddingLeft: '18px', paddingRight: '18px' }}
                className="no-scrollbar"
              >
                {platformLinks.map(link => (
                  <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer"
                    style={{ ...cardStyle, flexShrink: 0, width: '190px', display: 'block' }}
                  >
                    <div style={{ height: '120px', background: `linear-gradient(135deg, ${theme.accent}44, ${theme.accent}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {link.image_url && <img src={link.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                      <div style={{ width: '38px', height: '38px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={theme.text}><path d="M5 3l14 9-14 9V3z"/></svg>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{platform}</div>
                      <div style={{ fontSize: '12px', lineHeight: 1.4 }}>{link.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (section.type === 'shop') {
    const shopLinks = section.links.filter(l => l.type === 'shop_link')
    const products  = section.links.filter(l => l.type === 'product')
    return (
      <div>
        {shopLinks.map(link => (
          <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center' }}
          >
            <div style={{ width: '90px', height: '80px', flexShrink: 0, background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            </div>
            <div style={{ flex: 1, padding: '0 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{link.title}</div>
              {link.subtitle && <div style={{ fontSize: '12px', opacity: 0.5 }}>{link.subtitle}</div>}
            </div>
            <div style={{ paddingRight: '14px', opacity: 0.3, fontSize: '20px' }}>›</div>
          </a>
        ))}
        {products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            {products.map(link => (
              <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer" style={cardStyle}>
                <div style={{ height: '130px', background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {link.image_url ? <img src={link.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{link.title}</div>
                  {link.price && <div style={{ fontSize: '12px', opacity: 0.5 }}>{link.price}</div>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (section.type === 'events') {
    return (
      <div>
        {section.links.map(link => (
          <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: '16px', gap: '14px' }}
          >
            {link.event_date && (
              <div style={{ flexShrink: 0, width: '48px', height: '52px', background: `${theme.accent}22`, borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5 }}>
                  {new Date(link.event_date).toLocaleString('default', { month: 'short' })}
                </div>
                <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: '22px', fontWeight: 500, lineHeight: 1 }}>
                  {new Date(link.event_date).getDate()}
                </div>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '3px' }}>{link.title}</div>
              {link.subtitle && <div style={{ fontSize: '12px', opacity: 0.5 }}>{link.subtitle}</div>}
            </div>
            {link.event_tag && (
              <div style={{
                fontSize: '10px', fontWeight: 500, padding: '4px 10px', borderRadius: '100px',
                background: link.event_tag === 'Live' || link.event_tag === 'Soon' ? '#fef0f0' : `${theme.accent}22`,
                color: link.event_tag === 'Live' || link.event_tag === 'Soon' ? '#d44' : theme.text,
                textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
              }}>
                {link.event_tag}
              </div>
            )}
          </a>
        ))}
      </div>
    )
  }

  if (section.type === 'collabs') {
    return <CollabsSection section={section} profile={profile} theme={theme} />
  }

  // Press & Connect — simple link cards
  return (
    <div>
      {section.type === 'press' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {section.links.map(link => (
            <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer" style={cardStyle}>
              <div style={{ height: '96px', background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {link.image_url ? <img src={link.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', opacity: 0.4 }}>{link.subtitle || ''}</span>}
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                {link.subtitle && <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{link.subtitle}</div>}
                <div style={{ fontSize: '12px', lineHeight: 1.45 }}>{link.title}</div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        section.links.map(link => (
          <a key={link.id} href={link.url || '#'} target="_blank" rel="noopener noreferrer"
            style={{ ...cardStyle, display: 'flex', alignItems: 'center' }}
          >
            <div style={{ width: '90px', height: '80px', flexShrink: 0, background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ flex: 1, padding: '0 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{link.title}</div>
              {link.subtitle && <div style={{ fontSize: '12px', opacity: 0.5 }}>{link.subtitle}</div>}
            </div>
            <div style={{ paddingRight: '14px', opacity: 0.3, fontSize: '20px' }}>›</div>
          </a>
        ))
      )}
    </div>
  )
}
