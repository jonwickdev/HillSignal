import { NextResponse } from 'next/server'
import { stripe, getCurrentTier } from '@/lib/stripe'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/checkout
 * Creates a Stripe Checkout session with dynamic pricing based on purchase count
 */
export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Get current purchase count for tiered pricing
    let purchaseCount = 0
    try {
      const adminClient = createAdminClient()
      const { count } = await adminClient
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      purchaseCount = count || 0
    } catch (e) {
      // If database isn't set up yet, default to 0
      console.log('Could not fetch purchase count, defaulting to 0')
    }

    const tier = getCurrentTier(purchaseCount)
    
    // Determine success and cancel URLs
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create Stripe checkout session
    const sessionConfig: any = {
      customer_email: user.email,
      client_reference_id: user.id,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        user_id: user.id,
        tier_name: tier.name,
        purchase_count_at_time: purchaseCount.toString(),
      },
    }

    if (tier.type === 'one_time') {
      // One-time payment for lifetime access
      sessionConfig.mode = 'payment'
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HillSignal ${tier.name} - Lifetime Access`,
              description: 'Lifetime access to HillSignal Congressional activity signals',
            },
            unit_amount: tier.price,
          },
          quantity: 1,
        },
      ]
      sessionConfig.payment_intent_data = {
        metadata: {
          user_id: user.id,
          tier_name: tier.name,
        },
      }
    } else {
      // Recurring subscription
      sessionConfig.mode = 'subscription'
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'HillSignal Standard - Monthly',
              description: 'Monthly access to HillSignal Congressional activity signals',
            },
            unit_amount: tier.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ]
      sessionConfig.subscription_data = {
        metadata: {
          user_id: user.id,
          tier_name: tier.name,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    )
  }
}
