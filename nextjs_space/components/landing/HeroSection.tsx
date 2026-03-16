'use client'

import Button from '@/components/ui/Button'
import LiveIndicator from '@/components/ui/LiveIndicator'
import Link from 'next/link'

interface HeroSectionProps {
  spotsRemaining: number
  currentPrice: string
  tierName: string
}

export default function HeroSection({ spotsRemaining, currentPrice, tierName }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hill-black/50 to-hill-black" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-hill-dark border border-hill-border rounded-full px-4 py-2">
            <LiveIndicator label="CONGRESSIONAL SIGNALS" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-hill-white">The Information Edge</span><br />
          <span className="gradient-text">Congress Doesn&apos;t Share</span>
        </h1>
        <p className="text-xl md:text-2xl text-hill-muted mb-8 max-w-2xl mx-auto">
          Real-time Congressional activity signals. Know what lawmakers know,
          <span className="text-hill-text"> before the market does.</span>
        </p>
        <div className="bg-hill-gray border border-hill-orange/30 rounded-lg p-4 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-hill-orange font-mono text-lg font-bold">{tierName ?? 'Founding Member'}</span>
            <span className="text-hill-muted">•</span>
            <span className="text-hill-green font-mono text-2xl font-bold">{currentPrice ?? '$5'}</span>
            <span className="text-hill-muted text-sm">Lifetime</span>
          </div>
          {(spotsRemaining ?? 0) > 0 && (
            <p className="text-hill-orange text-sm font-mono">
              ⚡ Only <span className="font-bold">{(spotsRemaining ?? 0)?.toLocaleString?.()}</span> spots at this price
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">Become a Founding Member →</Button>
          </Link>
          <Link href="#signals">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">See Sample Signals</Button>
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-hill-muted text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span>No credit card required to preview</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>Bank-level encryption</span>
          </div>
        </div>
      </div>
    </section>
  )
}
