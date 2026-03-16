'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ProfileProps {
  email: string
  createdAt: string
  userData: any
  purchase: any
  preferences: any
}

export default function ProfileClient({ email, createdAt, userData, purchase, preferences }: ProfileProps) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown'

  const subscriptionTier = userData?.subscription_tier || purchase?.tier_name || 'Free'
  const subscriptionStatus = userData?.subscription_status || 'active'
  const paymentType = purchase?.payment_type === 'recurring' ? 'Monthly subscription' : 'One-time purchase'
  const isFoundingMember = userData?.is_founding_member === true

  const handleManageBilling = async () => {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      window.location.href = data.url
    } catch (err: any) {
      setPortalError(err.message)
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hill-bg">
      {/* Header */}
      <header className="border-b border-hill-border bg-hill-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-hill-text tracking-tight">
            📊 HillSignal
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-hill-muted hover:text-hill-text transition-colors text-sm">
              ⚙️ Settings
            </Link>
            <Link href="/dashboard" className="text-hill-muted hover:text-hill-text transition-colors text-sm">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-hill-text">Your Profile</h1>

        {/* Account Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-hill-text mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Email</span>
              <span className="text-hill-text text-sm font-medium">{email}</span>
            </div>
            <div className="border-t border-hill-border" />
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Member since</span>
              <span className="text-hill-text text-sm">{memberSince}</span>
            </div>
            {isFoundingMember && (
              <>
                <div className="border-t border-hill-border" />
                <div className="flex justify-between items-center">
                  <span className="text-hill-muted text-sm">Status</span>
                  <span className="text-sm font-medium text-amber-400">⭐ Founding Member</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-hill-text mb-4">Subscription</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Plan</span>
              <span className="text-hill-text text-sm font-medium capitalize">{subscriptionTier}</span>
            </div>
            <div className="border-t border-hill-border" />
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Status</span>
              <span className={`text-sm font-medium capitalize ${
                subscriptionStatus === 'active' ? 'text-green-400' :
                subscriptionStatus === 'canceled' ? 'text-red-400' : 'text-hill-muted'
              }`}>
                {subscriptionStatus === 'active' ? '● Active' : subscriptionStatus}
              </span>
            </div>
            {purchase && (
              <>
                <div className="border-t border-hill-border" />
                <div className="flex justify-between items-center">
                  <span className="text-hill-muted text-sm">Payment</span>
                  <span className="text-hill-text text-sm">{paymentType}</span>
                </div>
                <div className="border-t border-hill-border" />
                <div className="flex justify-between items-center">
                  <span className="text-hill-muted text-sm">Amount</span>
                  <span className="text-hill-text text-sm">${(purchase.amount / 100).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          {purchase?.stripe_customer_id && (
            <div className="mt-6">
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="w-full sm:w-auto"
              >
                {portalLoading ? 'Opening...' : 'Manage Billing →'}
              </Button>
              {portalError && (
                <p className="text-red-400 text-sm mt-2">{portalError}</p>
              )}
            </div>
          )}
        </Card>

        {/* Notification Preferences Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-hill-text mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Email frequency</span>
              <span className="text-hill-text text-sm capitalize">{preferences?.email_frequency || 'daily'}</span>
            </div>
            <div className="border-t border-hill-border" />
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Daily digest</span>
              <span className={`text-sm ${preferences?.daily_digest !== false ? 'text-green-400' : 'text-hill-muted'}`}>
                {preferences?.daily_digest !== false ? '● Enabled' : '○ Disabled'}
              </span>
            </div>
            <div className="border-t border-hill-border" />
            <div className="flex justify-between items-center">
              <span className="text-hill-muted text-sm">Watched sectors</span>
              <span className="text-hill-text text-sm">
                {preferences?.sectors?.length ? preferences.sectors.join(', ') : 'All sectors'}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/settings">
              <Button variant="secondary" className="w-full sm:w-auto">
                Edit Preferences →
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  )
}
