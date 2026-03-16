export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { stripe, getCurrentTier } from '@/lib/stripe'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    let purchaseCount = 0
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminClient = createAdminClient()
        const { count } = await adminClient
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
        purchaseCount = count || 0
      }
    } catch { console.log('Could not fetch purchase count') }

    const tier = getCurrentTier(purchaseCount)
    const origin = request?.headers?.get?.('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const sessionConfig: any = {
      customer_email: user?.email,
      client_reference_id: user?.id,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        user_id: user?.id,
        tier_name: tier?.name ?? 'Unknown',
        purchase_count_at_time: purchaseCount?.toString?.() ?? '0',
      },
    }

    if (tier?.type === 'one_time') {
      sessionConfig.mode = 'payment'
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `HillSignal ${tier?.name ?? ''} - Lifetime Access`,
            description: 'Lifetime access to HillSignal Congressional activity signals',
          },
          unit_amount: tier?.price ?? 500,
        },
        quantity: 1,
      }]
      sessionConfig.payment_intent_data = { metadata: { user_id: user?.id, tier_name: tier?.name } }
    } else {
      sessionConfig.mode = 'subscription'
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'HillSignal Standard - Monthly', description: 'Monthly access to HillSignal' },
          unit_amount: tier?.price ?? 1900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }]
      sessionConfig.subscription_data = { metadata: { user_id: user?.id, tier_name: tier?.name } }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)
    return NextResponse.json({ url: session?.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
  }
}
