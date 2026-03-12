import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

/**
 * POST /api/webhook
 * Stripe webhook handler for payment events
 * 
 * IMPORTANT: Configure this webhook in Stripe Dashboard after deployment:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhook
 * 3. Select events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tierName = session.metadata?.tier_name

        if (!userId) {
          console.error('No user_id in session metadata')
          break
        }

        // Create purchase record
        const { error: purchaseError } = await adminClient
          .from('purchases')
          .insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent as string || session.subscription as string,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string || null,
            amount: session.amount_total || 0,
            tier_name: tierName || 'Unknown',
            payment_type: session.mode === 'subscription' ? 'recurring' : 'one_time',
            status: 'completed',
          })

        if (purchaseError) {
          console.error('Failed to create purchase record:', purchaseError)
        }

        // Update user profile
        const { error: userError } = await adminClient
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_tier: tierName,
            stripe_customer_id: session.customer as string,
            is_founding_member: tierName === 'Founding Member',
          })
          .eq('id', userId)

        if (userError) {
          console.error('Failed to update user:', userError)
        }

        console.log(`Payment completed for user ${userId}, tier: ${tierName}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          const status = subscription.status === 'active' ? 'active' : 'inactive'
          await adminClient
            .from('users')
            .update({ subscription_status: status })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id

        if (userId) {
          await adminClient
            .from('users')
            .update({ subscription_status: 'cancelled' })
            .eq('id', userId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
