'use client'

export default function LiveIndicator({ label = 'LIVE' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-hill-green live-indicator" />
      <span className="text-hill-green text-xs font-mono font-semibold tracking-wider">
        {label}
      </span>
    </div>
  )
}
