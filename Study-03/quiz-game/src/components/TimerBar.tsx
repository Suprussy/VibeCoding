'use client'

interface Props {
  timeLeft: number
  maxTime: number
}

export default function TimerBar({ timeLeft, maxTime }: Props) {
  const pct = (timeLeft / maxTime) * 100
  const urgent = timeLeft <= 5

  return (
    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${
          urgent ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
