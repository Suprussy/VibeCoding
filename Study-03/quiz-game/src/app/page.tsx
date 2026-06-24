'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Category, LeaderboardEntry } from '@/types/quiz'
import { getLeaderboard, getPersonalBest } from '@/lib/storage'
import { getQuestionsByCategory } from '@/data'

const CATEGORIES: {
  id: Category
  label: string
  icon: string
  color: string
  border: string
  bg: string
}[] = [
  {
    id: 'bible', label: '성경', icon: '📖',
    color: 'text-amber-400', border: 'hover:border-amber-400', bg: 'hover:bg-amber-400/5',
  },
  {
    id: 'hiphop', label: '외국 힙합', icon: '🎤',
    color: 'text-purple-400', border: 'hover:border-purple-400', bg: 'hover:bg-purple-400/5',
  },
  {
    id: 'nba', label: 'NBA', icon: '🏀',
    color: 'text-red-400', border: 'hover:border-red-400', bg: 'hover:bg-red-400/5',
  },
  {
    id: 'mlb', label: 'MLB', icon: '⚾',
    color: 'text-blue-400', border: 'hover:border-blue-400', bg: 'hover:bg-blue-400/5',
  },
]

export default function Home() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [warn, setWarn] = useState(false)
  const [bests, setBests] = useState<Record<Category, LeaderboardEntry | null>>({
    bible: null, hiphop: null, nba: null, mlb: null,
  })

  useEffect(() => {
    const updated: Record<Category, LeaderboardEntry | null> = {
      bible: null, hiphop: null, nba: null, mlb: null,
    }
    const trimmed = nickname.trim()
    for (const cat of CATEGORIES) {
      if (trimmed) {
        updated[cat.id] = getPersonalBest(trimmed, cat.id)
      } else {
        const board = getLeaderboard(cat.id)
        updated[cat.id] = board[0] ?? null
      }
    }
    setBests(updated)
  }, [nickname])

  function start(category: Category) {
    if (!nickname.trim()) { setWarn(true); return }
    router.push(`/quiz/${category}?nickname=${encodeURIComponent(nickname.trim())}`)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">도전! 마스터 퀴즈</h1>
          <p className="text-gray-500 text-sm">마니아 레벨 4지선다 · 문제당 20초</p>
        </div>

        <div className="mb-8">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setWarn(false) }}
            onKeyDown={(e) => e.key === 'Enter' && nickname.trim() && start('bible')}
            placeholder="닉네임을 입력하세요 (최대 12자)"
            maxLength={12}
            className={`w-full bg-gray-900 border-2 rounded-xl px-4 py-3 text-white placeholder-gray-600
              outline-none focus:ring-0 transition-colors ${
              warn ? 'border-red-500' : 'border-gray-700 focus:border-gray-500'
            }`}
          />
          {warn && (
            <p className="text-red-400 text-xs mt-1.5">닉네임을 먼저 입력해주세요.</p>
          )}
        </div>

        <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-3">
          카테고리 선택
        </p>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => {
            const best = bests[cat.id]
            const questionCount = getQuestionsByCategory(cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => start(cat.id)}
                className={`bg-gray-900 border-2 border-gray-800 rounded-2xl p-6 text-left
                  transition-all duration-200 ${cat.border} ${cat.bg}`}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <div className={`text-lg font-bold ${cat.color}`}>{cat.label}</div>
                <div className="text-gray-600 text-xs mt-1">{questionCount}문제 · 20초</div>
                {best ? (
                  <div className="text-gray-500 text-xs mt-2 border-t border-gray-800 pt-2">
                    {nickname.trim() ? '내 최고' : '최고기록'}{' '}
                    <span className="text-gray-300 font-semibold">{best.score}/{questionCount}</span>
                    {' · '}{best.totalTime}초
                  </div>
                ) : (
                  <div className="text-gray-700 text-xs mt-2 border-t border-gray-800 pt-2">
                    {nickname.trim() ? '도전 기록 없음' : '기록 없음'}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/leaderboard')}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            리더보드 보기 →
          </button>
        </div>
      </div>
    </main>
  )
}
