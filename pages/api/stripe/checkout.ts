// pages/api/stripe/checkout.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

// Make sure this exactly matches one of the literals in Stripe.ApiVersion.
// If your @stripe/stripe-js or stripe package has a different version,
// hover over Stripe.ApiVersion in your editor to pick the correct one.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ url?: string; error?: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const priceId = process.env.STRIPE_PRICE_ID
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!priceId || !baseUrl) {
    console.error('Missing STRIPE_PRICE_ID or NEXT_PUBLIC_APP_URL')
    return res
      .status(500)
      .json({ error: 'Configuration error: missing environment variables' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/billing/success`,
      cancel_url: `${baseUrl}/billing/cancel`,
    })

    return res.status(200).json({ url: session.url! })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
