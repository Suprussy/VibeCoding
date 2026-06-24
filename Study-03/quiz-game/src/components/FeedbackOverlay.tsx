interface Props {
  isCorrect: boolean
  isTimeout: boolean
  explanation: string
}

export default function FeedbackOverlay({ isCorrect, isTimeout, explanation }: Props) {
  const label = isTimeout ? '⏰ 시간 초과!' : isCorrect ? '✓ 정답!' : '✗ 오답!'
  const labelColor = isCorrect ? 'text-green-400' : 'text-red-400'
  const boxClass = isCorrect
    ? 'bg-green-950/95 border-green-600'
    : 'bg-red-950/95 border-red-600'

  return (
    <div className="fixed inset-x-0 bottom-0 flex justify-center px-4 pb-6 z-50 pointer-events-none">
      <div className={`w-full max-w-2xl rounded-2xl p-4 animate-fade-in border ${boxClass}`}>
        <p className={`text-base font-bold mb-1 ${labelColor}`}>{label}</p>
        <p className="text-gray-300 text-sm leading-relaxed">{explanation}</p>
      </div>
    </div>
  )
}
