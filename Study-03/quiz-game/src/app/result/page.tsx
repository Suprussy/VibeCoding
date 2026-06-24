'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnswerRecord, Category, LeaderboardEntry } from '@/types/quiz'
import { saveScore } from '@/lib/storage'

interface QuizResult {
  nickname: string
  category: Category
  score: number
  totalTime: number
  records: AnswerRecord[]
  questions: {
    id: string
    question: string
    answer: number
    explanation: string
    options: [string, string, string, string]
  }[]
}

const SCORE_MSG = [
  { min: 10, msg: '🏆 완벽한 마스터!' },
  { min: 8, msg: '🎉 거의 다 왔어요!' },
  { min: 6, msg: '👍 꽤 잘하셨네요!' },
  { min: 0, msg: '💪 다시 도전해봐요!' },
]

const CAT_LABEL: Record<Category, string> = {
  bible: '📖 성경',
  hiphop: '🎤 외국 힙합',
  nba: '🏀 NBA',
  mlb: '⚾ MLB',
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('quiz_result')
    if (!raw) { router.replace('/'); return }
    setResult(JSON.parse(raw))
  }, [router])

  if (!result) return null

  const { nickname, category, score, totalTime, records, questions } = result
  const total = questions.length
  const message = SCORE_MSG.find((m) => score >= m.min)?.msg ?? ''

  function handleSave() {
    if (saved || !result) return
    const entry: LeaderboardEntry = {
      nickname,
      category,
      score,
      totalTime,
      date: new Date().toISOString(),
    }
    saveScore(entry)
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Score header */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm mb-3">
            {CAT_LABEL[category]} · {nickname}
          </p>
          <div className="text-7xl font-black mb-2 animate-count-up tracking-tight">
            {score}
            <span className="text-gray-600 text-4xl font-bold">/{total}</span>
          </div>
          <p className="text-2xl font-bold mb-2">{message}</p>
          <p className="text-gray-500 text-sm">총 소요 시간 {totalTime}초</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-10">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
              saved
                ? 'bg-green-900/50 text-green-400 border border-green-800 cursor-default'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            {saved ? '✓ 저장 완료' : '리더보드에 저장'}
          </button>
          <button
            onClick={() => router.push('/leaderboard')}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition-all"
          >
            리더보드
          </button>
        </div>

        {/* Question review */}
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
          문제 리뷰
        </h2>
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const r = records[i]
            const correct = r?.correct
            return (
              <div
                key={q.id}
                className={`rounded-xl p-4 border ${
                  correct
                    ? 'border-green-900 bg-green-950/50'
                    : 'border-red-900 bg-red-950/50'
                }`}
              >
                <div className="flex gap-3">
                  <span className={`flex-shrink-0 font-bold text-lg leading-none mt-0.5 ${
                    correct ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {correct ? '✓' : '✗'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 mb-2 leading-relaxed">{q.question}</p>

                    {!correct && (
                      <p className="text-xs text-red-400 mb-1">
                        내 선택:{' '}
                        {r?.selected !== null && r?.selected !== undefined
                          ? q.options[r.selected]
                          : '타임아웃'}
                      </p>
                    )}
                    <p className="text-xs text-green-400 mb-1.5">
                      정답: {q.options[q.answer]}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() =>
              router.push(`/quiz/${category}?nickname=${encodeURIComponent(nickname)}`)
            }
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition-all"
          >
            재도전
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-gray-700 transition-all"
          >
            홈으로
          </button>
        </div>
      </div>
    </main>
  )
}
