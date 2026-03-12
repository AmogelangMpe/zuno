import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already has an account
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('stripe_account_id, is_onboarded')
    .eq('profile_id', user.id)
    .single()

  let accountId = existing?.stripe_account_id

  if (!accountId) {
    // Create new Stripe Express account
    const account = await stripe.accounts.create({
      type:  'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
    })
    accountId = account.id

    await supabase.from('stripe_accounts').insert({
      profile_id:        user.id,
      stripe_account_id: accountId,
      is_onboarded:      false,
    })
  }

  // Generate onboarding link
  const link = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/products?stripe=refresh`,
    return_url:  `${process.env.NEXT_PUBLIC_APP_URL}/products?stripe=success`,
    type:        'account_onboarding',
  })

  return NextResponse.redirect(link.url)
}
