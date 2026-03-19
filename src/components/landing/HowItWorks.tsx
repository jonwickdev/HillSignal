import Card from '@/components/ui/Card'

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-hill-dark">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">
            How It Works
          </h2>
          <p className="text-hill-muted max-w-2xl mx-auto">
            From Congressional action to your inbox — in three steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-hill-orange/10 border-2 border-hill-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hill-orange font-bold text-2xl font-mono">1</span>
            </div>
            <h3 className="text-hill-white font-semibold text-lg mb-2">
              We Scan Congress Daily
            </h3>
            <p className="text-hill-muted text-sm">
              Our systems monitor Congress.gov for new bills and USAspending.gov for federal contracts over $10M across 12 sectors.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-hill-orange/10 border-2 border-hill-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hill-orange font-bold text-2xl font-mono">2</span>
            </div>
            <h3 className="text-hill-white font-semibold text-lg mb-2">
              AI Analyzes Market Impact
            </h3>
            <p className="text-hill-muted text-sm">
              Each signal is analyzed for affected stock tickers, sector impact, sentiment (bullish/bearish/neutral), and scored 1-10 on market impact.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-hill-orange/10 border-2 border-hill-orange rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-hill-orange font-bold text-2xl font-mono">3</span>
            </div>
            <h3 className="text-hill-white font-semibold text-lg mb-2">
              You Get the Edge
            </h3>
            <p className="text-hill-muted text-sm">
              Access your dashboard or get a curated daily digest email with the top signals — tickers, analysis, and actionable insights.
            </p>
          </div>
        </div>

        {/* Digest email preview */}
        <div className="mt-16 max-w-2xl mx-auto">
          <p className="text-center text-hill-muted text-sm mb-4 uppercase tracking-wider">Sample daily digest</p>
          <Card className="border-hill-orange/30 overflow-hidden">
            {/* Email header mock */}
            <div className="bg-hill-gray/50 -mx-6 -mt-6 px-6 py-4 mb-4 border-b border-hill-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-hill-orange rounded-full flex items-center justify-center text-white text-xs font-bold">HS</div>
                <div>
                  <p className="text-hill-white text-sm font-semibold">HillSignal Daily Digest</p>
                  <p className="text-hill-muted text-xs font-mono">alert@hillsignal.com</p>
                </div>
              </div>
            </div>

            {/* Sample signal 1 */}
            <div className="mb-4 pb-4 border-b border-hill-border/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-hill-red text-xs font-mono px-1.5 py-0.5 bg-hill-red/10 rounded">BEARISH</span>
                <span className="text-hill-muted text-xs">Impact: 8/10</span>
              </div>
              <p className="text-hill-white text-sm font-semibold mb-1">
                New Tax Bill Targets Asset Holders
              </p>
              <div className="flex gap-2 mb-1">
                <span className="text-hill-orange text-xs font-mono bg-hill-gray px-1.5 py-0.5 rounded">$BRK.B</span>
                <span className="text-hill-orange text-xs font-mono bg-hill-gray px-1.5 py-0.5 rounded">$JPM</span>
                <span className="text-hill-orange text-xs font-mono bg-hill-gray px-1.5 py-0.5 rounded">$GS</span>
              </div>
              <p className="text-hill-muted text-xs leading-relaxed">
                Annual tax on net asset value could pressure financial sector valuations...
              </p>
            </div>

            {/* Sample signal 2 */}
            <div className="mb-4 pb-4 border-b border-hill-border/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-hill-green text-xs font-mono px-1.5 py-0.5 bg-hill-green/10 rounded">BULLISH</span>
                <span className="text-hill-muted text-xs">Impact: 7/10</span>
              </div>
              <p className="text-hill-white text-sm font-semibold mb-1">
                $84M Defense Contract — Cybersecurity Systems
              </p>
              <div className="flex gap-2 mb-1">
                <span className="text-hill-orange text-xs font-mono bg-hill-gray px-1.5 py-0.5 rounded">$LMT</span>
                <span className="text-hill-orange text-xs font-mono bg-hill-gray px-1.5 py-0.5 rounded">$PANW</span>
              </div>
              <p className="text-hill-muted text-xs leading-relaxed">
                DOD awards major cybersecurity infrastructure contract, signals continued federal spending...
              </p>
            </div>

            {/* More signals indicator */}
            <p className="text-hill-orange text-xs font-mono text-center">+ 3 more signals in today&apos;s digest</p>
          </Card>
        </div>
      </div>
    </section>
  )
}
