import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-hill-black border-t border-hill-border">
      {/* Prominent Disclaimer Banner */}
      <div className="bg-hill-dark/80 border-b border-hill-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-hill-muted text-xs leading-relaxed text-center max-w-3xl mx-auto">
            <span className="text-hill-orange font-semibold">Important Disclaimer:</span>{' '}
            HillSignal provides publicly available congressional data for informational purposes only. 
            Nothing on this site constitutes financial advice, a recommendation, or solicitation to buy or sell securities. 
            Always do your own research and consult a licensed financial advisor before making investment decisions. 
            Past congressional activity does not guarantee future market outcomes.
          </p>
        </div>
      </div>

      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-hill-white mb-2">
                Hill<span className="text-hill-orange">Signal</span>
              </h3>
              <p className="text-hill-muted text-sm max-w-sm">
                Congressional activity intelligence for informed investors.
                Track bills, contracts, and legislative moves that move markets.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-hill-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#signals" className="text-hill-muted hover:text-hill-white transition-colors">
                    Signal Feed
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-hill-muted hover:text-hill-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/about" className="text-hill-muted hover:text-hill-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-hill-muted hover:text-hill-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Learn */}
            <div>
              <h4 className="text-hill-white font-semibold mb-4">Learn</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/glossary" className="text-hill-muted hover:text-hill-white transition-colors">
                    Glossary
                  </Link>
                </li>
                <li>
                  <Link href="/what-is-hillsignal" className="text-hill-muted hover:text-hill-white transition-colors">
                    What is HillSignal?
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-hill-muted hover:text-hill-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@hillsignal.com" className="text-hill-muted hover:text-hill-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-hill-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-hill-muted text-sm">
              © 2026 HillSignal. All rights reserved.
            </p>
            <p className="text-hill-muted text-xs">
              Not financial advice. For informational purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
