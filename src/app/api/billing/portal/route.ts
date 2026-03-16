export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session so users can manage billing.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stripe_customer_id from purchases
    const admin = createAdminClient()
    const { data: purchase, error: purchaseError } = await admin
      .from('purchases')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (purchaseError || !purchase?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing record found. If you recently subscribed, please try again in a moment.' },
        { status: 404 }
      )
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Billing service not configured' }, { status: 500 })
    }

    // Create a Stripe Customer Portal session via API (no SDK needed)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hillsignal.com'
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: purchase.stripe_customer_id,
        return_url: `${appUrl}/profile`,
      }),
    })

    const session = await res.json()

    if (!res.ok) {
      console.error('Stripe portal error:', session)
      return NextResponse.json(
        { error: session.error?.message || 'Failed to create billing session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
