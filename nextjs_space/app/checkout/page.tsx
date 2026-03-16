'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

interface PricingData {
  tier: { name: string; price: number; type: 'one_time' | 'recurring' }
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
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/signup'); return }
      try {
        const response = await fetch('/api/pricing')
        const data = await response?.json?.()
        setPricingData(data ?? null)
      } catch { setError('Failed to load pricing. Please refresh.') }
      setCheckingAuth(false)
    }
    init()
  }, [router])

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await response?.json?.()
      if (!response?.ok) throw new Error(data?.error ?? 'Failed to create checkout session')
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      setError(err?.message ?? 'An error occurred')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return <div className="min-h-screen bg-hill-black flex items-center justify-center"><div className="text-hill-muted">Loading...</div></div>
  }

  return (
    <div className="min-h-screen bg-hill-black flex flex-col">
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-hill-white mb-2">Complete Your Purchase</h1>
              <p className="text-hill-muted">One step away from Congressional signals</p>
            </div>
            {error && (
              <div className="bg-hill-red/10 border border-hill-red/30 rounded-lg p-4 mb-6">
                <p className="text-hill-red text-sm">{error}</p>
              </div>
            )}
            {pricingData && (
              <div className="space-y-6">
                <div className="bg-hill-gray rounded-lg p-4">
                  <h3 className="text-hill-white font-semibold mb-4">Order Summary</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-hill-muted">Plan</span>
                    <span className="text-hill-orange font-mono">{pricingData?.tier?.name ?? 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-hill-muted">Type</span>
                    <span className="text-hill-text">{pricingData?.tier?.type === 'one_time' ? 'Lifetime Access' : 'Monthly Subscription'}</span>
                  </div>
                  <div className="border-t border-hill-border my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-hill-white font-semibold">Total</span>
                    <span className="text-2xl font-bold text-hill-green">
                      ${((pricingData?.tier?.price ?? 0) / 100).toFixed(0)}
                      {pricingData?.tier?.type === 'recurring' && <span className="text-sm text-hill-muted">/mo</span>}
                    </span>
                  </div>
                </div>
                {(pricingData?.spotsRemaining ?? 0) > 0 && (
                  <div className="text-center">
                    <p className="text-hill-orange text-sm font-mono">⚡ Only {pricingData?.spotsRemaining?.toLocaleString?.()} spots left at this price</p>
                  </div>
                )}
                <Button onClick={handleCheckout} loading={loading} className="w-full" size="lg">
                  {loading ? 'Redirecting to Stripe...' : 'Pay with Stripe \u2192'}
                </Button>
                <div className="flex items-center justify-center gap-4 text-hill-muted text-xs">
                  <span>\uD83D\uDD12 Secure checkout</span>
                  <span>\uD83D\uDEE1\uFE0F Powered by Stripe</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
