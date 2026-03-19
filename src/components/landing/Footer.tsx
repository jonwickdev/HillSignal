export default function Footer() {
  return (
    <footer className="py-12 px-4 bg-hill-black border-t border-hill-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-hill-white mb-2">
              Hill<span className="text-hill-orange">Signal</span>
            </h3>
            <p className="text-hill-muted text-sm max-w-sm">
              Congressional activity intelligence for informed investors.
              Know what lawmakers know, before the market does.
            </p>
          </div>

          {/* Links */}
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
                <a href="/login" className="text-hill-muted hover:text-hill-white transition-colors">
                  Login
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-hill-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-hill-muted hover:text-hill-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-hill-muted hover:text-hill-white transition-colors">
                  Terms of Service
                </a>
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
            © {new Date().getFullYear()} HillSignal. All rights reserved.
          </p>
          <p className="text-hill-muted text-xs">
            Not financial advice. For informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  )
}
