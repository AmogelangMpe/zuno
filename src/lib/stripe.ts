import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Create a Stripe Connect onboarding link for a creator
export async function createConnectAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type:  'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers:     { requested: true },
    },
  })

  const link = await stripe.accountLinks.create({
    account:     account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=refresh`,
    return_url:  `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=success`,
    type:        'account_onboarding',
  })

  return JSON.stringify({ accountId: account.id, url: link.url })
}

// Create a checkout session for a product purchase
export async function createCheckoutSession({
  productId,
  priceId,
  creatorStripeAccountId,
  buyerEmail,
  successUrl,
  cancelUrl,
  applicationFeePercent = 10, // Zuno takes 10%
}: {
  productId:              string
  priceId:                string
  creatorStripeAccountId: string
  buyerEmail?:            string
  successUrl:             string
  cancelUrl:              string
  applicationFeePercent?: number
}) {
  const session = await stripe.checkout.sessions.create({
    mode:               'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url:  cancelUrl,
    customer_email: buyerEmail,
    metadata: { productId },
    payment_intent_data: {
      application_fee_amount: undefined, // calculated per transaction
      transfer_data: {
        destination: creatorStripeAccountId,
      },
    },
  }, {
    stripeAccount: undefined, // platform account creates session
  })

  return session
}
