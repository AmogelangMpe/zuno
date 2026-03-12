import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { productId } = await req.json()
  const supabase = createClient()

  // Get product + creator's Stripe account
  const { data: product } = await supabase
    .from('products')
    .select('*, stripe_accounts(stripe_account_id, is_onboarded)')
    .eq('id', productId)
    .eq('is_published', true)
    .single()

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const stripeAccount = (product as any).stripe_accounts
  if (!stripeAccount?.is_onboarded) {
    return NextResponse.json({ error: 'Creator has not set up payments yet' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency:     product.currency.toLowerCase(),
        product_data: { name: product.title, description: product.description },
        unit_amount:  product.price,
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/buy/${productId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/buy/${productId}`,
    metadata:    { productId },
    payment_intent_data: {
      application_fee_amount: Math.round(product.price * 0.10), // 10% platform fee
      transfer_data: { destination: stripeAccount.stripe_account_id },
    },
  })

  return NextResponse.json({ url: session.url })
}
