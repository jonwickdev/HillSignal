'use client'

interface StatsBarProps {
  totalSignals: number
  sectorCount: number
}

export default function StatsBar({ totalSignals, sectorCount }: StatsBarProps) {
  return (
    <section className="py-12 px-4 bg-hill-dark border-y border-hill-border">
      <div className="max-w-5xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold font-mono text-hill-orange">
              {totalSignals.toLocaleString()}
            </p>
            <p className="text-hill-muted text-sm mt-1">Congressional Actions Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold font-mono text-hill-green">
              {sectorCount}
            </p>
            <p className="text-hill-muted text-sm mt-1">Market Sectors Covered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold font-mono text-hill-white">
              Daily
            </p>
            <p className="text-hill-muted text-sm mt-1">AI Analysis Updates</p>
          </div>
        </div>

        {/* Data source badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <p className="text-hill-muted text-xs uppercase tracking-wider">Powered by</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="text-hill-text/80 text-sm font-mono border border-hill-border/60 rounded px-3 py-1 bg-hill-black/40">
              Congress.gov
            </span>
            <span className="text-hill-text/80 text-sm font-mono border border-hill-border/60 rounded px-3 py-1 bg-hill-black/40">
              SAM.gov
            </span>
            <span className="text-hill-text/80 text-sm font-mono border border-hill-border/60 rounded px-3 py-1 bg-hill-black/40">
              USAspending.gov
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
