import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'

type Props = {
  username:        string
  displayName:     string
  profileUrl:      string
  previewImageUrl: string
}

export default function WelcomeEmail({ username, displayName, profileUrl, previewImageUrl }: Props) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={900}
          fontStyle="normal"
        />
      </Head>

      <Preview>You just got 10x cooler. Welcome to Zunobio 🚀</Preview>

      <Body style={body}>
        <Container style={container}>

          {/* ── Header bar ── */}
          <Section style={headerBar}>
            <Text style={logoMark}>Zunobio</Text>
          </Section>

          {/* ── Hero ── */}
          <Section style={heroSection}>
            <Text style={heroEmoji}>🚀</Text>
            <Heading style={heroHeading}>
              You just got<br />10x cooler.
            </Heading>
            <Text style={heroTagline}>
              Most people have a boring link in their bio.{'{\n'}
              You? You have a Zunobio.
            </Text>
            <Button style={primaryBtn} href={profileUrl}>
              See your live page →
            </Button>
          </Section>

          {/* ── Preview image ── */}
          <Section style={previewImageSection}>
            <Text style={previewCaption}>✨ HERE&apos;S WHAT&apos;S POSSIBLE</Text>
            <Img
              src={previewImageUrl}
              alt="Example Zunobio profile page"
              width="464"
              style={previewImg}
            />
            <Text style={previewSubCaption}>This is what a Zunobio page looks like. Yours is waiting.</Text>
          </Section>

          <Hr style={divider} />

          {/* ── Next Steps checklist ── */}
          <Section style={section}>
            <Text style={sectionEyebrow}>✅  YOUR NEXT STEPS</Text>
            <Text style={sectionSub}>3 things to do right now</Text>

            <Section style={stepCard}>
              <Row>
                <Column style={stepIconCol}>
                  <Text style={stepEmoji}>🔗</Text>
                </Column>
                <Column style={stepBody}>
                  <Text style={stepTitle}>Claim your URL</Text>
                  <Text style={stepDesc}>Your page is live at zunobio.com/{username}</Text>
                </Column>
                <Column style={stepArrowCol}>
                  <Text style={stepArrow}>›</Text>
                </Column>
              </Row>
            </Section>

            <Section style={stepCard}>
              <Row>
                <Column style={stepIconCol}>
                  <Text style={stepEmoji}>✍️</Text>
                </Column>
                <Column style={stepBody}>
                  <Text style={stepTitle}>Add 3 links</Text>
                  <Text style={stepDesc}>YouTube, shop, socials — all in one place.</Text>
                </Column>
                <Column style={stepArrowCol}>
                  <Text style={stepArrow}>›</Text>
                </Column>
              </Row>
            </Section>

            <Section style={stepCard}>
              <Row>
                <Column style={stepIconCol}>
                  <Text style={stepEmoji}>🎨</Text>
                </Column>
                <Column style={stepBody}>
                  <Text style={stepTitle}>Pick a theme</Text>
                  <Text style={stepDesc}>Dark, light, minimal — make it yours.</Text>
                </Column>
                <Column style={stepArrowCol}>
                  <Text style={stepArrow}>›</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* ── Features grid ── */}
          <Section style={section}>
            <Text style={sectionEyebrow}>🎁  WHAT YOU UNLOCKED</Text>
            <Row style={featureGrid}>
              <Column style={featureCell}>
                <Text style={featureEmoji}>🎬</Text>
                <Text style={featureLabel}>Video Showcase</Text>
              </Column>
              <Column style={featureCell}>
                <Text style={featureEmoji}>🛍️</Text>
                <Text style={featureLabel}>Shop Section</Text>
              </Column>
              <Column style={featureCell}>
                <Text style={featureEmoji}>🤝</Text>
                <Text style={featureLabel}>Brand Collabs</Text>
              </Column>
              <Column style={featureCell}>
                <Text style={featureEmoji}>📚</Text>
                <Text style={featureLabel}>Books Shelf</Text>
              </Column>
            </Row>
          </Section>

          {/* ── CTA block ── */}
          <Section style={ctaBlock}>
            <Text style={ctaUrlText}>zunobio.com/{username}</Text>
            <Button style={secondaryBtn} href={profileUrl}>
              Customise your page
            </Button>
          </Section>

          {/* ── Footer ── */}
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you just joined Zunobio. No spam. Ever.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Zunobio · zunobio.com
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Preview defaults ──────────────────────────────────────────────────────────
WelcomeEmail.PreviewProps = {
  username:        'mihlali',
  displayName:     'Mihlali',
  profileUrl:      'https://zunobio.com/mihlali',
  previewImageUrl: 'https://zunobio.com/zunobio-preview.jpg',
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f4',
  fontFamily:      'Inter, Helvetica, Arial, sans-serif',
  margin:          0,
  padding:         '24px 0',
}

const container: React.CSSProperties = {
  maxWidth:        '520px',
  margin:          '0 auto',
  backgroundColor: '#ffffff',
  borderRadius:    '20px',
  overflow:        'hidden',
  border:          '1px solid #e0e0e0',
}

const headerBar: React.CSSProperties = {
  backgroundColor: '#000000',
  padding:         '18px 28px',
}

const logoMark: React.CSSProperties = {
  fontStyle:     'italic',
  fontSize:      '20px',
  fontWeight:    700,
  color:         '#ffffff',
  margin:        0,
  letterSpacing: '-0.5px',
}

const heroSection: React.CSSProperties = {
  backgroundColor: '#000000',
  padding:         '32px 28px 40px',
  textAlign:       'center',
}

const heroEmoji: React.CSSProperties = {
  fontSize: '52px',
  margin:   '0 0 12px',
}

const heroHeading: React.CSSProperties = {
  fontSize:      '44px',
  fontWeight:    900,
  color:         '#ffffff',
  lineHeight:    1.05,
  letterSpacing: '-2px',
  margin:        '0 0 16px',
}

const heroTagline: React.CSSProperties = {
  fontSize:   '16px',
  color:      '#999999',
  lineHeight: 1.65,
  margin:     '0 0 32px',
}

const primaryBtn: React.CSSProperties = {
  backgroundColor: '#c8f53b',
  color:           '#000000',
  fontFamily:      'Inter, Helvetica, sans-serif',
  fontSize:        '16px',
  fontWeight:      800,
  padding:         '16px 40px',
  borderRadius:    '100px',
  textDecoration:  'none',
  display:         'inline-block',
  letterSpacing:   '-0.2px',
}

const divider: React.CSSProperties = {
  borderColor: '#eeeeee',
  margin:      0,
}

const section: React.CSSProperties = {
  padding: '28px 28px 24px',
}

const sectionEyebrow: React.CSSProperties = {
  fontSize:      '11px',
  fontWeight:    800,
  color:         '#000000',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  margin:        '0 0 4px',
}

const sectionSub: React.CSSProperties = {
  fontSize: '14px',
  color:    '#888888',
  margin:   '0 0 20px',
}

const stepCard: React.CSSProperties = {
  backgroundColor: '#f7f7f7',
  borderRadius:    '14px',
  padding:         '14px 16px',
  marginBottom:    '10px',
}

const stepIconCol: React.CSSProperties = {
  width:         '44px',
  verticalAlign: 'middle',
}

const stepEmoji: React.CSSProperties = {
  fontSize: '24px',
  margin:   0,
}

const stepBody: React.CSSProperties = {
  verticalAlign: 'middle',
}

const stepTitle: React.CSSProperties = {
  fontSize:   '15px',
  fontWeight: 700,
  color:      '#000000',
  margin:     '0 0 2px',
}

const stepDesc: React.CSSProperties = {
  fontSize:   '13px',
  color:      '#888888',
  margin:     0,
  lineHeight: 1.4,
}

const stepArrowCol: React.CSSProperties = {
  width:         '24px',
  textAlign:     'right',
  verticalAlign: 'middle',
}

const stepArrow: React.CSSProperties = {
  fontSize:   '20px',
  color:      '#cccccc',
  fontWeight: 300,
  margin:     0,
}

const featureGrid: React.CSSProperties = {
  marginTop: '16px',
}

const featureCell: React.CSSProperties = {
  textAlign: 'center',
  padding:   '10px 6px',
}

const featureEmoji: React.CSSProperties = {
  fontSize: '28px',
  margin:   '0 0 6px',
}

const featureLabel: React.CSSProperties = {
  fontSize:      '12px',
  fontWeight:    700,
  color:         '#000000',
  margin:        0,
  letterSpacing: '-0.2px',
}

const ctaBlock: React.CSSProperties = {
  backgroundColor: '#f7f7f7',
  padding:         '28px',
  textAlign:       'center',
  borderTop:       '1px solid #eeeeee',
}

const ctaUrlText: React.CSSProperties = {
  fontSize:      '22px',
  fontWeight:    800,
  color:         '#000000',
  margin:        '0 0 18px',
  letterSpacing: '-0.5px',
}

const secondaryBtn: React.CSSProperties = {
  backgroundColor: '#000000',
  color:           '#ffffff',
  fontFamily:      'Inter, Helvetica, sans-serif',
  fontSize:        '15px',
  fontWeight:      700,
  padding:         '14px 32px',
  borderRadius:    '100px',
  textDecoration:  'none',
  display:         'inline-block',
}

const footer: React.CSSProperties = {
  padding:   '24px 28px',
  textAlign: 'center',
}

const footerText: React.CSSProperties = {
  fontSize:   '12px',
  color:      '#aaaaaa',
  margin:     '0 0 4px',
  lineHeight: 1.6,
}

const previewImageSection: React.CSSProperties = {
  backgroundColor: '#f7f7f7',
  padding:         '24px 28px',
  textAlign:       'center',
}

const previewCaption: React.CSSProperties = {
  fontSize:      '11px',
  fontWeight:    800,
  color:         '#000000',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  margin:        '0 0 14px',
}

const previewImg: React.CSSProperties = {
  borderRadius: '16px',
  width:        '100%',
  maxWidth:     '464px',
  display:      'block',
  margin:       '0 auto',
  border:       '1px solid #e0e0e0',
}

const previewSubCaption: React.CSSProperties = {
  fontSize:  '13px',
  color:     '#888888',
  margin:    '12px 0 0',
  fontStyle: 'italic',
}