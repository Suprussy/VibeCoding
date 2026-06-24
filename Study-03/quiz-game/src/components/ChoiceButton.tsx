'use client'

const LABELS = ['①', '②', '③', '④']

interface Props {
  option: string
  index: number
  selected: number | null
  correctAnswer: number
  isAnswered: boolean
  onClick: () => void
}

export default function ChoiceButton({
  option, index, selected, correctAnswer, isAnswered, onClick,
}: Props) {
  let base = 'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 text-sm '
  let shake = false

  if (!isAnswered) {
    base += 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800 cursor-pointer'
  } else if (index === correctAnswer) {
    base += 'border-green-500 bg-green-500/10 text-green-300'
  } else if (selected !== null && index === selected) {
    base += 'border-red-500 bg-red-500/10 text-red-300'
    shake = true
  } else {
    base += 'border-gray-800 bg-gray-900 opacity-40'
  }

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={`${base} ${shake ? 'animate-shake' : ''}`}
    >
      <span className="text-gray-400 mr-2 font-bold">{LABELS[index]}</span>
      {option}
    </button>
  )
}
