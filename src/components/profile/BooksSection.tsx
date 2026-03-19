// BooksSection.tsx — src/components/profile/BooksSection.tsx

type Link = {
  id:        string
  title:     string
  subtitle:  string | null  // author
  url:       string | null
  image_url: string | null  // cover
  price:     string | null
  platform:  string | null  // blurb
}

type Props = {
  links: Link[]
  theme: { bg: string; surface: string; text: string; accent: string }
}

export default function BooksSection({ links, theme }: Props) {
  if (!links.length) {
    return (
      <p style={{ fontSize: '13px', opacity: 0.4, textAlign: 'center', padding: '20px 0' }}>
        No books yet
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: '24px' }}>
      {links.map(book => (
        <div
          key={book.id}
          style={{
            background:   theme.surface,
            border:       `1px solid ${theme.accent}33`,
            borderRadius: '16px',
            overflow:     'hidden',
            display:      'flex',
            flexDirection:'column',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Book cover */}
          <div style={{
            position:   'relative',
            paddingTop: '150%', // 2:3 book aspect ratio
            background: `linear-gradient(135deg, ${theme.accent}44, ${theme.accent}22)`,
            overflow:   'hidden',
          }}>
            {book.image_url ? (
              <img
                src={book.image_url}
                alt={book.title}
                style={{
                  position:   'absolute',
                  inset:       0,
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'cover',
                }}
              />
            ) : (
              <div style={{
                position:      'absolute',
                inset:          0,
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                flexDirection: 'column',
                gap:           '8px',
                padding:       '16px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <span style={{ fontSize: '11px', opacity: 0.4, textAlign: 'center', lineHeight: 1.3 }}>
                  {book.title}
                </span>
              </div>
            )}
          </div>

          {/* Book info */}
          <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
              {book.title}
            </div>
            {book.subtitle && (
              <div style={{ fontSize: '11px', opacity: 0.5 }}>
                by {book.subtitle}
              </div>
            )}
            {book.platform && (
              <div style={{
                fontSize:   '11px',
                opacity:     0.6,
                lineHeight:  1.4,
                marginTop:  '4px',
                display:    '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow:   'hidden',
              }}>
                {book.platform}
              </div>
            )}
            {book.price && (
              <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '4px' }}>
                {book.price}
              </div>
            )}
            {book.url && (
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop:     '10px',
                  display:       'block',
                  textAlign:     'center',
                  background:    theme.text,
                  color:         theme.bg,
                  borderRadius:  '100px',
                  padding:       '8px 12px',
                  fontSize:      '12px',
                  fontWeight:    500,
                  textDecoration:'none',
                }}
              >
                Get book ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}