export const dynamic = 'force-dynamic'

import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import SignalFeed from '@/components/landing/SignalFeed'
import ProblemSolution from '@/components/landing/ProblemSolution'
import PricingSection from '@/components/landing/PricingSection'
import Footer from '@/components/landing/Footer'
import { getCurrentTier, getSpotsRemaining, formatPrice, PRICING_TIERS } from '@/lib/stripe'

async function getPurchaseCount(): Promise<number> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return 0
    }
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.rpc('get_purchase_count')
    if (error) {
      console.error('Error fetching purchase count:', error)
      return 0
    }
    return data || 0
  } catch (error) {
    console.error('Database not configured:', error)
    return 0
  }
}

export default async function HomePage() {
  const purchaseCount = await getPurchaseCount()
  const currentTier = getCurrentTier(purchaseCount)
  const spotsRemaining = getSpotsRemaining(purchaseCount)
  const currentTierIndex = PRICING_TIERS.findIndex(
    (tier: any) => tier?.min === currentTier?.min && tier?.max === currentTier?.max
  )

  return (
    <main className="min-h-screen bg-hill-black">
      <Header />
      <div className="pt-16">
        <HeroSection
          spotsRemaining={spotsRemaining}
          currentPrice={formatPrice(currentTier?.price ?? 500)}
          tierName={currentTier?.name ?? 'Founding Member'}
        />
        <SignalFeed />
        <ProblemSolution />
        <section id="pricing">
          <PricingSection
            currentTierIndex={currentTierIndex}
            spotsRemaining={spotsRemaining}
            purchaseCount={purchaseCount}
          />
        </section>
        <Footer />
      </div>
    </main>
  )
}
