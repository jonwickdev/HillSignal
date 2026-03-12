'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

const SECTORS = [
  { id: 'defense', name: 'Defense & Aerospace', icon: '🎖️' },
  { id: 'healthcare', name: 'Healthcare & Pharma', icon: '🏥' },
  { id: 'technology', name: 'Technology & AI', icon: '💻' },
  { id: 'energy', name: 'Energy & Utilities', icon: '⚡' },
  { id: 'finance', name: 'Finance & Banking', icon: '🏦' },
  { id: 'agriculture', name: 'Agriculture & Food', icon: '🌾' },
  { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
  { id: 'infrastructure', name: 'Infrastructure', icon: '🚧' },
]

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [emailFrequency, setEmailFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSector = (sectorId: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId)
        ? prev.filter((id) => id !== sectorId)
        : [...prev, sectorId]
    )
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to save preferences')
        return
      }

      // Upsert user preferences
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          sectors: selectedSectors,
          email_frequency: emailFrequency,
        }, {
          onConflict: 'user_id',
        })

      if (prefError) {
        throw prefError
      }

      setSaved(true)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('Failed to save preferences. You can update them later in settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-hill-black flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <div className="w-16 h-16 bg-hill-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-hill-white mb-2">Preferences Saved!</h2>
          <p className="text-hill-muted mb-4">Redirecting you to your dashboard...</p>
          <div className="animate-pulse">
            <div className="h-1 bg-hill-green rounded-full" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hill-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-hill-white inline-block mb-6">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>
          
          <div className="w-16 h-16 bg-hill-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-hill-white mb-2">
            Welcome to HillSignal! 🎉
          </h1>
          <p className="text-hill-muted">
            Your payment was successful. Let&apos;s personalize your signal feed.
          </p>
        </div>

        {/* Preferences form */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-hill-white mb-4">Select Your Sectors</h2>
          <p className="text-hill-muted text-sm mb-6">
            Choose the sectors you want to track. You&apos;ll receive signals relevant to these industries.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SECTORS.map((sector) => (
              <button
                key={sector.id}
                onClick={() => toggleSector(sector.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-center ${
                  selectedSectors.includes(sector.id)
                    ? 'border-hill-orange bg-hill-orange/10 text-hill-white'
                    : 'border-hill-border bg-hill-gray text-hill-muted hover:border-hill-orange/50'
                }`}
              >
                <span className="text-2xl mb-2 block">{sector.icon}</span>
                <span className="text-xs font-medium">{sector.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-hill-white mb-4">Email Frequency</h2>
          <p className="text-hill-muted text-sm mb-6">
            How often do you want to receive email digests?
          </p>

          <div className="space-y-3">
            {[
              { value: 'instant', label: 'Instant', desc: 'Get notified immediately for high-impact signals' },
              { value: 'daily', label: 'Daily Digest', desc: 'One email per day with all signals' },
              { value: 'weekly', label: 'Weekly Summary', desc: 'Weekly roundup of key signals' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setEmailFrequency(option.value as 'instant' | 'daily' | 'weekly')}
                className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                  emailFrequency === option.value
                    ? 'border-hill-orange bg-hill-orange/10'
                    : 'border-hill-border bg-hill-gray hover:border-hill-orange/50'
                }`}
              >
                <span className="text-hill-white font-medium block">{option.label}</span>
                <span className="text-hill-muted text-sm">{option.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-hill-red/10 border border-hill-red/30 rounded-lg p-4 mb-6">
            <p className="text-hill-red text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSavePreferences}
            loading={saving}
            className="flex-1"
            size="lg"
          >
            Save Preferences & Continue
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="sm:w-auto"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-hill-black flex items-center justify-center">
      <div className="text-hill-muted">Loading...</div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  )
}
