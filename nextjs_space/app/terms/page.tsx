import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | HillSignal',
  description: 'Terms of Service for HillSignal',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-hill-black">
      <header className="py-6 px-4 border-b border-hill-border">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
        </div>
      </header>
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-2">Terms of Service</h1>
          <p className="text-hill-muted mb-8">Last Updated: March 15, 2026</p>
          <div className="prose prose-invert max-w-none space-y-8 text-hill-text">
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">1. Agreement to Terms</h2>
              <p className="text-hill-muted leading-relaxed">By accessing or using HillSignal, you agree to be bound by these Terms. You must be at least 18 years old to use this Service.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">2. Description of Service</h2>
              <p className="text-hill-muted leading-relaxed">HillSignal provides Congressional activity tracking and AI-powered market intelligence for investors. This includes real-time signals, impact analysis, and sector-specific alerts.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">3. Pricing</h2>
              <p className="text-hill-muted leading-relaxed">Founding Member: $5 lifetime | Early Adopter: $9 lifetime | Growth: $15 lifetime | Standard: $19/month. "Lifetime access" means access for as long as HillSignal operates.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">4. Not Financial Advice</h2>
              <div className="bg-hill-dark border border-yellow-600/50 rounded-lg p-4">
                <p className="text-hill-muted leading-relaxed">\u26A0\uFE0F HillSignal provides information for informational purposes only. Nothing constitutes investment, financial, or trading advice. Always consult a qualified financial advisor.</p>
              </div>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">5. Limitation of Liability</h2>
              <p className="text-hill-muted leading-relaxed">HillSignal shall not be liable for any indirect, incidental, special, or consequential damages resulting from use of the Service. Total liability shall not exceed the amount paid in the twelve months preceding the claim.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">6. Contact</h2>
              <p className="text-hill-muted leading-relaxed">Email: <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a></p>
            </section>
          </div>
        </div>
      </main>
      <footer className="py-8 px-4 border-t border-hill-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-hill-muted text-sm">&copy; 2026 HillSignal. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-hill-muted hover:text-hill-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-hill-orange">Terms of Service</Link>
            <Link href="/" className="text-hill-muted hover:text-hill-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
