'use client'

/**
 * Live Indicator Component
 * Pulsing green dot to indicate real-time data
 */
export default function LiveIndicator({ label = 'LIVE' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-2 h-2 bg-hill-green rounded-full live-indicator" />
        <div className="absolute inset-0 w-2 h-2 bg-hill-green rounded-full animate-ping opacity-75" />
      </div>
      <span className="text-xs font-mono text-hill-green uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}
