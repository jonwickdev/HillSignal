'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Bell, Filter, LayoutGrid } from 'lucide-react'

const ALL_SECTORS = [
  { id: 'Defense', name: 'Defense & Aerospace', icon: '\uD83C\uDF96\uFE0F' },
  { id: 'Healthcare', name: 'Healthcare & Pharma', icon: '\uD83C\uDFE5' },
  { id: 'Technology', name: 'Technology & AI', icon: '\uD83D\uDCBB' },
  { id: 'Energy', name: 'Energy & Utilities', icon: '\u26A1' },
  { id: 'Finance', name: 'Finance & Banking', icon: '\uD83C\uDFE6' },
  { id: 'Agriculture', name: 'Agriculture & Food', icon: '\uD83C\uDF3E' },
  { id: 'Manufacturing', name: 'Manufacturing', icon: '\uD83C\uDFED' },
  { id: 'Infrastructure', name: 'Infrastructure', icon: '\uD83D\uDEA7' },
  { id: 'Consumer', name: 'Consumer', icon: '\uD83D\uDED2' },
  { id: 'Telecommunications', name: 'Telecommunications', icon: '\uD83D\uDCF1' },
  { id: 'Real Estate', name: 'Real Estate', icon: '\uD83C\uDFE0' },
  { id: 'Transportation', name: 'Transportation', icon: '\u2708\uFE0F' },
]

interface SettingsClientProps {
  userEmail: string
  preferences: any
}

export default function SettingsClient({ userEmail, preferences }: SettingsClientProps) {
  const router = useRouter()
  const [sectors, setSectors] = useState<string[]>(preferences?.sectors ?? [])
  const [emailFrequency, setEmailFrequency] = useState<string>(preferences?.email_frequency ?? 'daily')
  const [highImpactAlerts, setHighImpactAlerts] = useState<boolean>(preferences?.high_impact_alerts ?? true)
  const [sectorAlerts, setSectorAlerts] = useState<boolean>(preferences?.sector_alerts ?? false)
  const [dailyDigest, setDailyDigest] = useState<boolean>(preferences?.daily_digest ?? true)
  const [initialFeedSize, setInitialFeedSize] = useState<number>(5)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load feed size from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hillsignal_feed_size') : null
    if (saved) {
      const n = parseInt(saved, 10)
      if ([5, 10, 20].includes(n)) setInitialFeedSize(n)
    }
  }, [])

  const toggleSector = (sectorId: string) => {
    setSectors((prev: string[]) =>
      (prev ?? [])?.includes?.(sectorId)
        ? (prev ?? [])?.filter?.((id: string) => id !== sectorId)
        : [...(prev ?? []), sectorId]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); return }

      const { error: prefError } = await supabase.from('user_preferences').upsert({
        user_id: user?.id,
        sectors,
        email_frequency: emailFrequency,
        high_impact_alerts: highImpactAlerts,
        sector_alerts: sectorAlerts,
        daily_digest: dailyDigest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (prefError) throw prefError

      // Save feed size to localStorage (UI-only preference)
      if (typeof window !== 'undefined') {
        localStorage.setItem('hillsignal_feed_size', String(initialFeedSize))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err?.message ?? 'Failed to save settings')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-hill-black">
      <header className="sticky top-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft size={14} className="mr-2" /> Back to Feed</Button></Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-hill-white mb-2">Settings</h1>
          <p className="text-hill-muted">Customize signal preferences and notifications for <span className="text-hill-white">{userEmail}</span></p>
        </div>

        {/* Sector Preferences */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-hill-white mb-1 flex items-center gap-2"><Filter size={18} /> Sector Watchlist</h2>
          <p className="text-hill-muted text-sm mb-4">Select sectors to prioritize in your signal feed.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(ALL_SECTORS ?? [])?.map?.((sector: any) => (
              <button key={sector?.id} onClick={() => toggleSector(sector?.id)}
                className={`p-3 rounded-lg border transition-all duration-200 text-center ${
                  (sectors ?? [])?.includes?.(sector?.id)
                    ? 'border-hill-orange bg-hill-orange/10 text-hill-white'
                    : 'border-hill-border bg-hill-gray text-hill-muted hover:border-hill-orange/50'
                }`}>
                <span className="text-xl mb-1 block">{sector?.icon}</span>
                <span className="text-xs font-medium">{sector?.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Feed Display Settings */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-hill-white mb-1 flex items-center gap-2"><LayoutGrid size={18} /> Feed Display</h2>
          <p className="text-hill-muted text-sm mb-4">Control how many signals appear when you first open the dashboard.</p>
          <div>
            <label className="text-sm font-medium text-hill-text block mb-2">Initial Signals to Show</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 5, label: '5 signals', desc: 'Clean & focused' },
                { value: 10, label: '10 signals', desc: 'Balanced view' },
                { value: 20, label: '20 signals', desc: 'Full feed' },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setInitialFeedSize(opt.value)}
                  className={`px-4 py-3 rounded-lg border text-center transition-all ${
                    initialFeedSize === opt.value ? 'border-hill-orange bg-hill-orange/10 text-hill-white' : 'border-hill-border bg-hill-gray text-hill-muted'
                  }`}>
                  <span className="text-sm font-medium block">{opt.label}</span>
                  <span className="text-xs text-hill-muted">{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-hill-muted mt-2">You can always load more signals by clicking &quot;Load More&quot; on the dashboard.</p>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-hill-white mb-1 flex items-center gap-2"><Bell size={18} /> Notification Settings</h2>
          <p className="text-hill-muted text-sm mb-4">Control how and when you receive alerts.</p>

          <div className="space-y-4">
            {/* Email frequency */}
            <div>
              <label className="text-sm font-medium text-hill-text block mb-2">Email Digest Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {['instant', 'daily', 'weekly']?.map?.((freq: string) => (
                  <button key={freq} onClick={() => setEmailFrequency(freq)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      emailFrequency === freq ? 'border-hill-orange bg-hill-orange/10 text-hill-white' : 'border-hill-border bg-hill-gray text-hill-muted'
                    }`}>
                    {freq?.charAt?.(0)?.toUpperCase?.() ?? ''}{freq?.slice?.(1) ?? ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle options */}
            {[
              { label: 'High-Impact Alerts', desc: 'Immediate notification for signals scoring 8+', value: highImpactAlerts, setter: setHighImpactAlerts },
              { label: 'Sector Alerts', desc: 'Alerts for your watched sectors only', value: sectorAlerts, setter: setSectorAlerts },
              { label: 'Daily Digest', desc: 'Daily summary email of all signals', value: dailyDigest, setter: setDailyDigest },
            ]?.map?.((opt: any) => (
              <div key={opt?.label} className="flex items-center justify-between py-3 border-b border-hill-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-hill-white">{opt?.label}</p>
                  <p className="text-xs text-hill-muted">{opt?.desc}</p>
                </div>
                <button onClick={() => opt?.setter?.(!opt?.value)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    opt?.value ? 'bg-hill-orange' : 'bg-hill-gray'
                  }`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                    opt?.value ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Save */}
        {error && (<div className="bg-hill-red/10 border border-hill-red/30 rounded-lg p-4 mb-6"><p className="text-hill-red text-sm">{error}</p></div>)}
        {saved && (<div className="bg-hill-green/10 border border-hill-green/30 rounded-lg p-4 mb-6"><p className="text-hill-green text-sm">Settings saved successfully!</p></div>)}

        <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto" size="lg">
          <Save size={16} className="mr-2" /> Save Settings
        </Button>
      </main>
    </div>
  )
}
