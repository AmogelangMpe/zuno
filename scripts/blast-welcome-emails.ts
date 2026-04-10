/**
 * blast-welcome-emails.ts
 * ─────────────────────────────────────────────────────────────
 * Run once to send welcome emails to all existing Zunobio users.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/blast-welcome-emails.ts
 *
 * Or with tsx (recommended — no tsconfig needed):
 *   npx tsx scripts/blast-welcome-emails.ts
 *
 * Make sure your .env.local is loaded. If using tsx:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/blast-welcome-emails.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { render } from '@react-email/render'

// Import using relative path since this runs outside Next.js
// If this fails, copy WelcomeEmail.tsx content inline here
import WelcomeEmail from '../src/emails/WelcomeEmail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend  = new Resend(process.env.RESEND_API_KEY!)
const appUrl  = process.env.NEXT_PUBLIC_APP_URL || 'https://zunobio.com'

// Rate limit: Resend free tier = 2 emails/second max
const DELAY_MS = 600

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWelcomeEmail(email: string, username: string, displayName: string) {
  const profileUrl = `${appUrl}/${username}`

  const html = await render(
    WelcomeEmail({ username, displayName, profileUrl })
  )

  const { error } = await resend.emails.send({
    from:    'The Zunobio Team <hello@zunobio.com>',
    to:      email,
    subject: `Welcome to Zunobio, ${displayName} 🖤`,
    html,
  })

  if (error) throw new Error(error.message)
}

async function main() {
  console.log('🚀 Starting welcome email blast...\n')

  // Fetch all profiles with their auth emails
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Failed to fetch profiles:', error.message)
    process.exit(1)
  }

  if (!profiles?.length) {
    console.log('No profiles found.')
    process.exit(0)
  }

  console.log(`Found ${profiles.length} users. Sending emails...\n`)

  let sent    = 0
  let failed  = 0
  let skipped = 0

  for (const profile of profiles) {
    // Get the auth user's email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

    if (authError || !authUser?.user?.email) {
      console.log(`⚠️  Skipped ${profile.username} — no email found`)
      skipped++
      continue
    }

    const email       = authUser.user.email
    const displayName = profile.display_name || profile.username

    try {
      await sendWelcomeEmail(email, profile.username, displayName)
      console.log(`✅ Sent to ${displayName} <${email}>`)
      sent++
    } catch (err: any) {
      console.error(`❌ Failed for ${email}:`, err.message)
      failed++
    }

    // Respect rate limits
    await sleep(DELAY_MS)
  }

  console.log(`\n─────────────────────────`)
  console.log(`✅ Sent:    ${sent}`)
  console.log(`❌ Failed:  ${failed}`)
  console.log(`⚠️  Skipped: ${skipped}`)
  console.log(`─────────────────────────`)
  console.log('Done!')
}

main()