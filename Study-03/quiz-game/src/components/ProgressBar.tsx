interface Props {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-amber-400' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}
