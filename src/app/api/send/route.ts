import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeEmail from '@/emails/WelcomeEmail'
 
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}
 
export async function POST(req: NextRequest) {
  try {
    const { email, username, displayName } = await req.json()
 
    if (!email || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resend          = getResend()
    const appUrl          = (process.env.NEXT_PUBLIC_APP_URL || 'https://zunobio.com').replace(/\/$/, '').replace(/^http:/, 'https:')
    const profileUrl      = `${appUrl}/${username}`
    const previewImageUrl = 'https://zunobio.com/zunobio-preview.jpg'

    const html = await render(
      WelcomeEmail({ username, displayName: displayName || username, profileUrl, previewImageUrl })
    )

    const { data, error } = await resend.emails.send({
      from:    'Zunobio <hello@zunobio.com>',
      to:      email,
      subject: `Welcome to Zunobio, ${displayName || username} 🚀`,
      html,
    })
 
    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
 
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    console.error('Send welcome email error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}