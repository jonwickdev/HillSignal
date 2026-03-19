'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Link from 'next/link'

interface PricingSectionProps {
  currentTierIndex: number
  spotsRemaining: number
  purchaseCount: number
}

const TIERS = [
  {
    name: 'Founding Member',
    price: '$5',
    period: 'Lifetime',
    spots: '0 - 1,000',
    features: [
      'Lifetime access to all signals',
      'Daily AI market digest email',
      'Full signal analysis with tickers',
      '12-sector market coverage',
      'Sector-specific filtering',
      'Direct founder access',
    ],
    highlight: true,
  },
  {
    name: 'Early Adopter',
    price: '$9',
    period: 'Lifetime',
    spots: '1,001 - 3,000',
    features: [
      'Lifetime access to all signals',
      'Daily AI market digest email',
      'Full signal analysis with tickers',
      '12-sector market coverage',
      'Sector-specific filtering',
    ],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$15',
    period: 'Lifetime',
    spots: '3,001 - 5,000',
    features: [
      'Lifetime access to all signals',
      'Daily AI market digest email',
      'Full signal analysis with tickers',
      '12-sector market coverage',
    ],
    highlight: false,
  },
  {
    name: 'Standard',
    price: '$19',
    period: '/month',
    spots: '5,001+',
    features: [
      'Access to all signals',
      'Daily AI market digest email',
      'Full signal analysis with tickers',
      '12-sector market coverage',
    ],
    highlight: false,
  },
]

export default function PricingSection({
  currentTierIndex,
  spotsRemaining,
  purchaseCount,
}: PricingSectionProps) {
  return (
    <section className="py-20 px-4 bg-hill-dark">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">
            Tiered Pricing: <span className="text-hill-orange">Early = Cheaper</span>
          </h2>
          <p className="text-hill-muted max-w-2xl mx-auto">
            We're rewarding early believers. The earlier you join, the less you pay — forever.
            Once a tier fills up, the price increases permanently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier, index) => {
            const isCurrentTier = index === currentTierIndex
            const isPastTier = index < currentTierIndex
            const isFutureTier = index > currentTierIndex

            return (
              <Card
                key={tier.name}
                className={`relative ${
                  isCurrentTier
                    ? 'border-hill-orange ring-2 ring-hill-orange/30'
                    : isPastTier
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-hill-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                      CURRENT TIER
                    </span>
                  </div>
                )}

                {isPastTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-hill-muted text-hill-black text-xs font-bold px-3 py-1 rounded-full">
                      SOLD OUT
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-hill-white font-semibold text-lg mb-2">{tier.name}</h3>
                  <p className="text-hill-muted text-xs font-mono mb-4">{tier.spots} users</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-hill-white">{tier.price}</span>
                    <span className="text-hill-muted text-sm"> {tier.period}</span>
                  </div>

                  <ul className="text-left space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ${isCurrentTier ? 'text-hill-orange' : 'text-hill-green'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-hill-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentTier && (
                    <div>
                      <p className="text-hill-orange text-sm font-mono mb-3">
                        {spotsRemaining > 0
                          ? `${spotsRemaining.toLocaleString()} spots left`
                          : 'Limited spots'}
                      </p>
                      <Link href="/signup">
                        <Button className="w-full">Get Access Now</Button>
                      </Link>
                    </div>
                  )}

                  {isPastTier && (
                    <Button disabled className="w-full opacity-50">
                      Sold Out
                    </Button>
                  )}

                  {isFutureTier && (
                    <Button variant="secondary" disabled className="w-full opacity-50">
                      Upcoming
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-hill-muted/60 text-xs">
            Not financial advice. HillSignal provides informational data only — always do your own research.
          </p>
        </div>
      </div>
    </section>
  )
}
