import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import SignalFeed from '@/components/landing/SignalFeed'
import StatsBar from '@/components/landing/StatsBar'
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

/**
 * Get total signal count from database for stats display
 */
async function getSignalCount(): Promise<number> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return 0
    }
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = createAdminClient()
    const { count, error } = await adminClient
      .from('signals')
      .select('id', { count: 'exact', head: true })
    if (error) {
      console.error('Error fetching signal count:', error)
      return 0
    }
    return count ?? 0
  } catch (error) {
    console.error('Signal count fetch failed:', error)
    return 0
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  const [purchaseCount, totalSignals] = await Promise.all([
    getPurchaseCount(),
    getSignalCount(),
  ])
  const currentTier = getCurrentTier(purchaseCount)
  const spotsRemaining = getSpotsRemaining(purchaseCount)
  
  // Find current tier index
  const currentTierIndex = PRICING_TIERS.findIndex(
    tier => tier.min === currentTier.min && tier.max === currentTier.max
  )

  // JSON-LD structured data for SEO + AEO (LLM citation)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'HillSignal',
        url: 'https://hillsignal.com',
        description: 'Track Congressional bills, federal contracts, and votes that move markets. AI-powered analysis gives retail investors an edge — know what lawmakers know, before the market does.',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: currentTier.price,
          priceCurrency: 'USD',
          description: `${currentTier.name} — lifetime access to Congressional activity intelligence`,
        },
        creator: { '@type': 'Organization', name: 'HillSignal', url: 'https://hillsignal.com' },
      },
      {
        '@type': 'Organization',
        name: 'HillSignal',
        url: 'https://hillsignal.com',
        logo: 'https://hillsignal.com/og-image.png',
        description: 'Congressional activity intelligence platform for retail investors. Tracks bills, federal contracts, and votes with AI-powered market analysis.',
        sameAs: [],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is HillSignal?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HillSignal is a Congressional activity intelligence platform for retail investors. It tracks bills, federal government contracts, and legislative votes in real-time, then uses AI to analyze their market impact — including affected stock tickers, sectors, and sentiment.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does HillSignal track government contracts?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HillSignal monitors USAspending.gov for federal contract awards over $10M across 12 sectors including Defense, Healthcare, Technology, and Energy. Each contract is analyzed by AI to identify affected publicly traded companies, market sentiment, and investment implications.',
            },
          },
          {
            '@type': 'Question',
            name: 'What Congressional data does HillSignal analyze?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HillSignal analyzes data from Congress.gov (bills, votes, hearings, committee actions) and USAspending.gov (federal contract awards). The AI identifies which stocks and sectors are affected, assigns market sentiment (bullish/bearish/neutral), and scores the potential impact from 1-10.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I get daily email alerts about Congressional activity affecting my stocks?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. HillSignal sends daily and weekly digest emails with the top Congressional signals. Each digest includes market sentiment, affected tickers, dollar amounts for government contracts, and AI-generated analysis of how legislation may impact specific stocks and sectors.',
            },
          },
        ],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-hill-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      {/* Add padding for fixed header */}
      <div className="pt-16">
        <HeroSection
          spotsRemaining={spotsRemaining}
          currentPrice={formatPrice(currentTier.price)}
          tierName={currentTier.name}
        />
        
        <SignalFeed />
        
        <StatsBar totalSignals={totalSignals} sectorCount={12} />
        
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
