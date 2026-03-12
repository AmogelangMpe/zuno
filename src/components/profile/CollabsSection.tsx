// CollabsSection.tsx — drop this into src/components/profile/
// Used by ProfilePreview to render the Collabs tab

import type { Section, Link as ZunoLink, Profile } from '@/types'

type Props = {
  section:  Section & { links: ZunoLink[] }
  profile:  Profile
  theme:    { bg: string; surface: string; text: string; accent: string }
}

const SERVICES = [
  'Sponsored Post',
  'UGC Content',
  'Brand Ambassador',
  'Event Appearance',
  'Product Review',
  'Gifting',
]

export default function CollabsSection({ section, profile, theme }: Props) {
  const brands   = section.links.filter(l => l.type === 'brand')
  const services = section.links.filter(l => l.type === 'service')

  return (
    <div style={{ paddingBottom: '24px' }}>

      {/* Open to collabs banner */}
      {profile.open_to_collabs && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.accent}33, ${theme.accent}11)`,
          border: `1px solid ${theme.accent}44`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: '#4a7c5922', color: '#4a7c59',
            borderRadius: '100px', padding: '4px 12px',
            fontSize: '11px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.8px',
            marginBottom: '10px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4a7c59', display: 'inline-block' }} />
            Open to collabs
          </div>
          <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '14px', lineHeight: 1.5 }}>
            {profile.display_name} is available for brand partnerships and collaborations.
          </p>
          {profile.collab_email && (
            <a
              href={`mailto:${profile.collab_email}?subject=Collab enquiry`}
              style={{
                display: 'inline-block',
                background: theme.text,
                color: theme.bg,
                borderRadius: '100px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Get in touch ↗
            </a>
          )}
        </div>
      )}

      {/* Services offered */}
      {services.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, marginBottom: '10px' }}>
            Services
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {services.map(s => (
              <div key={s.id} style={{
                background: theme.surface,
                border: `1px solid ${theme.accent}33`,
                borderRadius: '100px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {s.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands worked with */}
      {brands.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 500, marginBottom: '12px' }}>
            Worked with
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {brands.map(brand => (
              <a
                key={brand.id}
                href={brand.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.accent}33`,
                  borderRadius: '14px',
                  padding: '14px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: theme.text,
                }}
              >
                {brand.image_url ? (
                  <img
                    src={brand.image_url}
                    alt={brand.title}
                    style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: `${theme.accent}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, opacity: 0.4,
                  }}>
                    {brand.title[0]?.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: 1.3, opacity: 0.7 }}>
                  {brand.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {brands.length === 0 && services.length === 0 && !profile.open_to_collabs && (
        <p style={{ fontSize: '13px', opacity: 0.4, textAlign: 'center', padding: '20px 0' }}>
          No collab info yet
        </p>
      )}
    </div>
  )
}