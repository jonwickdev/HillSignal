import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import SignalFeed from '@/components/landing/SignalFeed'
import ProblemSolution from '@/components/landing/ProblemSolution'
import PricingSection from '@/components/landing/PricingSection'
import Footer from '@/components/landing/Footer'
import { getCurrentTier, getSpotsRemaining, formatPrice, PRICING_TIERS } from '@/lib/stripe'

/**
 * Get purchase count from database
 * Falls back to 0 if database is not configured
 */
async function getPurchaseCount(): Promise<number> {
  try {
    // Only attempt database call if env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return 0
    }
    
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('get_purchase_count')
    
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

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  const purchaseCount = await getPurchaseCount()
  const currentTier = getCurrentTier(purchaseCount)
  const spotsRemaining = getSpotsRemaining(purchaseCount)
  
  // Find current tier index
  const currentTierIndex = PRICING_TIERS.findIndex(
    tier => tier.min === currentTier.min && tier.max === currentTier.max
  )

  return (
    <main className="min-h-screen bg-hill-black">
      <Header />
      
      {/* Add padding for fixed header */}
      <div className="pt-16">
        <HeroSection
          spotsRemaining={spotsRemaining}
          currentPrice={formatPrice(currentTier.price)}
          tierName={currentTier.name}
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
