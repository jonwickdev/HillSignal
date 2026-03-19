import { NextResponse } from 'next/server'
import { getCurrentTier, getSpotsRemaining } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/pricing
 * Returns current pricing tier based on purchase count
 * Used by landing page and checkout page
 */
export async function GET() {
  try {
    // Get current purchase count
    let purchaseCount = 0
    
    try {
      const adminClient = createAdminClient()
      const { count } = await adminClient
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      purchaseCount = count || 0
    } catch (e) {
      // Database not configured yet, default to 0
      console.log('Could not fetch purchase count, defaulting to 0')
    }

    const tier = getCurrentTier(purchaseCount)
    const spotsRemaining = getSpotsRemaining(purchaseCount)

    return NextResponse.json({
      tier: {
        name: tier.name,
        price: tier.price,
        type: tier.type,
      },
      spotsRemaining,
    })
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    )
  }
}
