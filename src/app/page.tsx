import Header from '@/components/landing/Header'
import HeroSection from '@/components/landing/HeroSection'
import SignalFeed from '@/components/landing/SignalFeed'
import StatsBar from '@/components/landing/StatsBar'
import ProblemSolution from '@/components/landing/ProblemSolution'
import HowItWorks from '@/components/landing/HowItWorks'
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

/**
 * Get 4 recent high-impact analyzed signals for the landing page feed
 */
async function getFeaturedSignals() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return []
    }
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = createAdminClient()
    
    // Get signals with analysis, recent, high impact
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data, error } = await adminClient
      .from('signals')
      .select('id, title, summary, sentiment, impact_score, tickers, affected_sectors, event_type, event_date, source')
      .not('full_analysis', 'is', null)
      .gte('event_date', sixMonthsAgo.toISOString().split('T')[0])
      .gte('impact_score', 5)
      .order('impact_score', { ascending: false })
      .order('event_date', { ascending: false })
      .limit(4)
    
    if (error) {
      console.error('Error fetching featured signals:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Featured signals fetch failed:', error)
    return []
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  const [purchaseCount, totalSignals, featuredSignals] = await Promise.all([
    getPurchaseCount(),
    getSignalCount(),
    getFeaturedSignals(),
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
        '@type': 'SoftwareApplication',
        name: 'HillSignal',
        url: 'https://hillsignal.com',
        description: 'AI-powered Congressional activity intelligence platform for retail investors. Tracks bills from Congress.gov and federal contracts from USAspending.gov, analyzes market impact with AI, and delivers daily alerts with affected tickers, sectors, and sentiment scores.',
        applicationCategory: 'FinanceApplication',
        applicationSubCategory: 'Alternative Data Platform',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: currentTier.price,
          priceCurrency: 'USD',
          description: `${currentTier.name} — lifetime access to Congressional activity intelligence`,
          availability: 'https://schema.org/InStock',
        },
        featureList: [
          'AI-powered market impact analysis of Congressional bills',
          'Federal contract tracking from USAspending.gov',
          'Daily email digest with top signals',
          'Impact scores from 1-10 for each signal',
          'Bullish/bearish/neutral sentiment classification',
          'Affected stock ticker identification',
          '12 sector coverage: Defense, Healthcare, Technology, Energy, Finance, Agriculture, Manufacturing, Infrastructure, Telecommunications, Transportation, Consumer, Real Estate',
        ],
        screenshot: 'https://hillsignal.com/og-image.png',
        creator: { '@type': 'Organization', name: 'HillSignal', url: 'https://hillsignal.com' },
      },
      {
        '@type': 'FinancialProduct',
        name: 'HillSignal Congressional Intelligence',
        description: 'Alternative data service providing AI-analyzed Congressional activity signals for stock market investors. Covers 12 sectors with daily updates from Congress.gov and USAspending.gov.',
        url: 'https://hillsignal.com',
        provider: { '@type': 'Organization', name: 'HillSignal', url: 'https://hillsignal.com' },
        category: 'Alternative Data',
      },
      {
        '@type': 'Organization',
        name: 'HillSignal',
        url: 'https://hillsignal.com',
        logo: 'https://hillsignal.com/og-image.png',
        description: 'Congressional activity intelligence platform for retail investors. Tracks bills, federal contracts, and legislative activity with AI-powered market analysis.',
        sameAs: [],
        knowsAbout: ['Congressional bills', 'Federal contracts', 'Market impact analysis', 'Legislative activity tracking', 'Alternative data for investing'],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is HillSignal?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HillSignal is an AI-powered Congressional activity intelligence platform for retail investors. It monitors Congress.gov and USAspending.gov daily, identifies bills and federal contracts with market impact, and uses AI to analyze which stocks and sectors are affected. Each signal includes an impact score (1-10), market sentiment (bullish/bearish/neutral), and affected stock tickers across 12 sectors.',
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
              text: 'HillSignal analyzes data from Congress.gov (bills and legislative activity) and USAspending.gov (federal contract awards). The AI identifies which stocks and sectors are affected, assigns market sentiment (bullish/bearish/neutral), and scores the potential impact from 1-10.',
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
          {
            '@type': 'Question',
            name: 'Which AI tool tracks Congressional bills for stock trades?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'HillSignal is an AI tool that tracks Congressional bills for stock market analysis. It monitors bills from Congress.gov and federal contracts from USAspending.gov, then uses AI to score their market impact (1-10), identify affected tickers, and classify sentiment as bullish, bearish, or neutral across 12 sectors.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is HillSignal different from Quiver Quantitative or Capitol Trades?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'While Quiver Quantitative and Capitol Trades focus on tracking what members of Congress personally trade, HillSignal tracks the legislative activity itself — the bills being introduced and federal contracts being awarded — and uses AI to analyze which stocks and sectors are affected. HillSignal focuses on the cause (legislation), not the effect (Congress members\' trades).',
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
        
        <SignalFeed signals={featuredSignals} />
        
        <StatsBar totalSignals={totalSignals} sectorCount={12} />
        
        <ProblemSolution />
        
        <HowItWorks />
        
        <section id="pricing">
          <PricingSection
            currentTierIndex={currentTierIndex}
            spotsRemaining={spotsRemaining}
            
          />
        </section>
        
        <Footer />
      </div>
    </main>
  )
}
