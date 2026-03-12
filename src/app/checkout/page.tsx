'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

interface PricingData {
  tier: {
    name: string
    price: number
    type: 'one_time' | 'recurring'
  }
  spotsRemaining: number
  purchaseCount: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [pricingData, setPricingData] = useState<PricingData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFetchPricing = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/signup')
        return
      }

      // Fetch current pricing
      try {
        const response = await fetch('/api/pricing')
        const data = await response.json()
        setPricingData(data)
      } catch (err) {
        setError('Failed to load pricing. Please refresh the page.')
      }

      setCheckingAuth(false)
    }

    checkAuthAndFetchPricing()
  }, [router])

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-hill-black flex items-center justify-center">
        <div className="text-hill-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hill-black flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>
        </div>
      </header>

      {/* Checkout content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-hill-white mb-2">Complete Your Purchase</h1>
              <p className="text-hill-muted">You're one step away from accessing Congressional signals</p>
            </div>

            {error && (
              <div className="bg-hill-red/10 border border-hill-red/30 rounded-lg p-4 mb-6">
                <p className="text-hill-red text-sm">{error}</p>
              </div>
            )}

            {pricingData && (
              <div className="space-y-6">
                {/* Order summary */}
                <div className="bg-hill-gray rounded-lg p-4">
                  <h3 className="text-hill-white font-semibold mb-4">Order Summary</h3>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-hill-muted">Plan</span>
                    <span className="text-hill-orange font-mono">{pricingData.tier.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-hill-muted">Type</span>
                    <span className="text-hill-text">
                      {pricingData.tier.type === 'one_time' ? 'Lifetime Access' : 'Monthly Subscription'}
                    </span>
                  </div>
                  
                  <div className="border-t border-hill-border my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-hill-white font-semibold">Total</span>
                    <span className="text-2xl font-bold text-hill-green">
                      ${(pricingData.tier.price / 100).toFixed(0)}
                      {pricingData.tier.type === 'recurring' && (
                        <span className="text-sm text-hill-muted">/mo</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Spots remaining */}
                {pricingData.spotsRemaining > 0 && (
                  <div className="text-center">
                    <p className="text-hill-orange text-sm font-mono">
                      ⚡ Only {pricingData.spotsRemaining.toLocaleString()} spots left at this price
                    </p>
                  </div>
                )}

                {/* Checkout button */}
                <Button
                  onClick={handleCheckout}
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Redirecting to Stripe...' : 'Pay with Stripe →'}
                </Button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 text-hill-muted text-xs">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Powered by Stripe</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
