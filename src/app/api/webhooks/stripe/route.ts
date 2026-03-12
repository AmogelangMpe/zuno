import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handlePurchase(session)
      break
    }
    case 'account.updated': {
      // Stripe Connect — creator finished onboarding
      const account = event.data.object as Stripe.Account
      if (account.details_submitted) {
        await supabase
          .from('stripe_accounts')
          .update({ is_onboarded: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function handlePurchase(session: Stripe.Checkout.Session) {
  const productId = session.metadata?.productId
  if (!productId) return

  // Get product to find creator
  const { data: product } = await supabase
    .from('products')
    .select('profile_id, price')
    .eq('id', productId)
    .single()

  if (!product) return

  // Create order record
  await supabase.from('orders').upsert({
    product_id:           productId,
    profile_id:           product.profile_id,
    buyer_email:          session.customer_email || '',
    amount_paid:          session.amount_total || 0,
    currency:             session.currency?.toUpperCase() || 'ZAR',
    stripe_session_id:    session.id,
    stripe_payment_intent: session.payment_intent as string,
    status:               'paid',
  }, { onConflict: 'stripe_session_id' })

  // Increment sales count
  await supabase.rpc('increment_sales', { product_id: productId })

  // TODO: Send download email to buyer
  // await sendDownloadEmail(session.customer_email, downloadToken)
}
