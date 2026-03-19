import Card from '@/components/ui/Card'

export default function ProblemSolution() {
  return (
    <section className="py-20 px-4 bg-hill-black">
      <div className="max-w-6xl mx-auto">
        {/* Problem section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white text-center mb-4">
            The Problem: <span className="text-hill-red">Information Asymmetry</span>
          </h2>
          <p className="text-hill-muted text-center max-w-2xl mx-auto mb-12">
            Congress passes bills. Federal contracts get awarded. Markets move. By the time you read about it,
            the smart money has already acted.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <div className="text-4xl mb-4">📉</div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                You're Always Behind
              </h3>
              <p className="text-hill-muted text-sm">
                News cycles are slow. By the time mainstream media covers congressional action,
                institutional investors have already repositioned.
              </p>
            </Card>

            <Card>
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                Information is Fragmented
              </h3>
              <p className="text-hill-muted text-sm">
                Bills, federal contracts, legislative actions — scattered across dozens of sources.
                Impossible to track manually.
              </p>
            </Card>

            <Card>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                Insiders Have the Edge
              </h3>
              <p className="text-hill-muted text-sm">
                Lobbyists, DC insiders, and institutions pay thousands for real-time political
                intelligence. Retail investors get table scraps.
              </p>
            </Card>
          </div>
        </div>

        {/* Solution section */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-hill-white text-center mb-4">
            The Solution: <span className="text-hill-green">HillSignal</span>
          </h2>
          <p className="text-hill-muted text-center max-w-2xl mx-auto mb-12">
            We monitor Congress so you don't have to. Real-time signals translated into
            actionable market intelligence.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-hill-green/30">
              <div className="w-12 h-12 bg-hill-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                Real-Time Signals
              </h3>
              <p className="text-hill-muted text-sm">
                Get notified within minutes of significant congressional activity. New bills,
                federal contract awards, legislative actions — delivered to your inbox.
              </p>
            </Card>

            <Card className="border-hill-green/30">
              <div className="w-12 h-12 bg-hill-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                Market Impact Analysis
              </h3>
              <p className="text-hill-muted text-sm">
                Every signal includes affected tickers, sector impact scores, and sentiment analysis.
                Know exactly what matters to your portfolio.
              </p>
            </Card>

            <Card className="border-hill-green/30">
              <div className="w-12 h-12 bg-hill-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-hill-white font-semibold text-lg mb-2">
                Personalized Alerts
              </h3>
              <p className="text-hill-muted text-sm">
                Filter by sector, ticker, or committee. Get only the signals that matter to you.
                Defense, Healthcare, Tech — your call.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
