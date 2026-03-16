export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentTier, getSpotsRemaining } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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
    const spotsRemaining = getSpotsRemaining(purchaseCount)

    return NextResponse.json({
      tier: { name: tier?.name, price: tier?.price, type: tier?.type },
      spotsRemaining,
      purchaseCount,
    })
  } catch (error: any) {
    console.error('Pricing API error:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
  }
}
