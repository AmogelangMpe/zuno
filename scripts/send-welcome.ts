/**
 * send-welcome.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot script: fetches every user from Supabase auth.users, joins them
 * with the profiles table, and sends the Welcome Email via Resend.
 *
 * Usage (tsx recommended — no compile step needed):
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/send-welcome.ts
 *
 * Flags:
 *   --dry-run       Print recipients without sending any emails.
 *   --limit=N       Only send to the first N users (great for testing).
 *
 * Example — send to 5 users first as a sanity check:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/send-welcome.ts --limit=5
 *
 * When happy, run the full blast:
 *   npx dotenv-cli -e .env.local -- npx tsx scripts/send-welcome.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import WelcomeEmail from '../src/emails/WelcomeEmail'

// ── Config ────────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

const APP_URL  = (process.env.NEXT_PUBLIC_APP_URL || 'https://zunobio.com').replace(/\/$/, '')
const FROM     = process.env.RESEND_FROM_EMAIL    || 'Zunobio <hello@zunobio.com>'

// Resend free tier cap: ~2 emails / second. Keep ≥ 600ms to avoid 429s.
const DELAY_MS = 600

// ── Helpers ───────────────────────────────────────────────────────────────────

function flag(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find(a => a.startsWith(prefix))?.slice(prefix.length)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const SUPABASE_URL     = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const RESEND_API_KEY   = requireEnv('RESEND_API_KEY')

  const isDryRun = process.argv.includes('--dry-run')
  const limitArg = flag('limit')
  const limit    = limitArg ? parseInt(limitArg, 10) : Infinity
  if (limitArg && (isNaN(limit) || limit <= 0)) {
    throw new Error('--limit must be a positive integer, e.g. --limit=10')
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const resend = new Resend(RESEND_API_KEY)

  // ── 1. Page through all auth users ──────────────────────────────────────────
  type AuthUser = { id: string; email?: string }
  const authUsers: AuthUser[] = []
  const perPage = 200
  let page = 1

  process.stdout.write('Fetching auth users')
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    authUsers.push(...(data?.users ?? []))
    process.stdout.write('.')
    if ((data?.users?.length ?? 0) < perPage) break
    page++
  }
  console.log(` ${authUsers.length} found.\n`)

  // ── 2. Load profiles ────────────────────────────────────────────────────────
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, display_name')

  if (profilesError) throw new Error(`profiles query failed: ${profilesError.message}`)

  type ProfileRow = { id: string; username: string; display_name: string }
  const profileMap = new Map<string, ProfileRow>(
    (profiles ?? []).map((p: ProfileRow) => [p.id, p])
  )

  // ── 3. Build final recipient list ───────────────────────────────────────────
  type Recipient = { email: string; username: string; displayName: string }

  const recipients: Recipient[] = authUsers
    .filter(u => u.email && profileMap.has(u.id))
    .map(u => {
      const p = profileMap.get(u.id)!
      return { email: u.email!, username: p.username, displayName: p.display_name || p.username }
    })
    .slice(0, Number.isFinite(limit) ? limit : undefined)

  console.log(`Recipients: ${recipients.length}`)
  if (isDryRun) {
    console.log('\n── DRY RUN — no emails will be sent ─────────────────────────')
    recipients.forEach(r => console.log(`  ${r.email}  (@${r.username})  "${r.displayName}"`))
    console.log('\nRe-run without --dry-run to send.')
    return
  }

  console.log(`From:  ${FROM}`)
  console.log(`Delay: ${DELAY_MS}ms between emails\n`)

  // ── 4. Send ─────────────────────────────────────────────────────────────────
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const profileUrl      = `${APP_URL}/${r.username}`
    const previewImageUrl = `${APP_URL}/zunobio-preview.jpg`

    const html = await render(
      WelcomeEmail({ username: r.username, displayName: r.displayName, profileUrl, previewImageUrl })
    )

    const { error } = await resend.emails.send({
      from:    FROM,
      to:      [r.email],
      subject: `Welcome to Zunobio, ${r.displayName} 🚀`,
      html,
    })

    if (error) {
      console.error(`  ✗  ${r.email} — ${error.message}`)
      failed++
    } else {
      console.log(`  ✓  ${r.email}`)
      sent++
    }

    await sleep(DELAY_MS)
  }

  console.log('\n────────────────────────────────────────────────────────────')
  console.log(`Sent: ${sent}  ·  Failed: ${failed}  ·  Total: ${recipients.length}`)
}

main().catch(err => {
  console.error('\nFatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
