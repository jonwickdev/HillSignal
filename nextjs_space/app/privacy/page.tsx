import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | HillSignal',
  description: 'Privacy Policy for HillSignal',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hill-black">
      <header className="py-6 px-4 border-b border-hill-border">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
        </div>
      </header>
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-2">Privacy Policy</h1>
          <p className="text-hill-muted mb-8">Last Updated: March 15, 2026</p>
          <div className="prose prose-invert max-w-none space-y-8 text-hill-text">
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">1. Introduction</h2>
              <p className="text-hill-muted leading-relaxed mb-4">HillSignal respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services at hillsignal.com.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">2. Information We Collect</h2>
              <p className="text-hill-muted leading-relaxed mb-4">We collect information you provide including: account information (email, password), profile preferences (sectors, notification settings), and payment information processed via Stripe.</p>
              <p className="text-hill-muted leading-relaxed">We automatically collect device information, usage data, and cookies for authentication and analytics.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">3. How We Use Your Information</h2>
              <p className="text-hill-muted leading-relaxed">We use collected information to: deliver Congressional signals based on your preferences, process payments, send email notifications, personalize your experience, improve the service, and ensure security.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">4. Third-Party Services</h2>
              <p className="text-hill-muted leading-relaxed">We use Stripe for payments, Supabase for authentication and data storage, and Abacus.AI for AI analysis. Each has their own privacy policy.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">5. Data Security</h2>
              <p className="text-hill-muted leading-relaxed">We implement encryption in transit (HTTPS/TLS), secure authentication, and access controls. No method of electronic storage is 100% secure.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">6. Your Rights</h2>
              <p className="text-hill-muted leading-relaxed">You may request access, correction, or deletion of your data. Contact us at legal@hillsignal.com.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">7. Contact</h2>
              <p className="text-hill-muted leading-relaxed">Email: <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a></p>
            </section>
          </div>
        </div>
      </main>
      <footer className="py-8 px-4 border-t border-hill-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-hill-muted text-sm">&copy; 2026 HillSignal. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-hill-orange">Privacy Policy</Link>
            <Link href="/terms" className="text-hill-muted hover:text-hill-white transition-colors">Terms of Service</Link>
            <Link href="/" className="text-hill-muted hover:text-hill-white transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
