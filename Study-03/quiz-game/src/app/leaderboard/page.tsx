'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Category, LeaderboardEntry } from '@/types/quiz'
import { getLeaderboard } from '@/lib/storage'

const TABS: { id: Category; label: string; icon: string; color: string; activeBorder: string; activeBg: string }[] = [
  { id: 'bible', label: '성경', icon: '📖', color: 'text-amber-400', activeBorder: 'border-amber-400', activeBg: 'bg-amber-400/10' },
  { id: 'hiphop', label: '힙합', icon: '🎤', color: 'text-purple-400', activeBorder: 'border-purple-400', activeBg: 'bg-purple-400/10' },
  { id: 'nba', label: 'NBA', icon: '🏀', color: 'text-red-400', activeBorder: 'border-red-400', activeBg: 'bg-red-400/10' },
  { id: 'mlb', label: 'MLB', icon: '⚾', color: 'text-blue-400', activeBorder: 'border-blue-400', activeBg: 'bg-blue-400/10' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const router = useRouter()
  const [active, setActive] = useState<Category>('bible')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    setEntries(getLeaderboard(active))
  }, [active])

  const tab = TABS.find((t) => t.id === active)!

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← 홈
          </button>
          <h1 className="text-2xl font-black">리더보드</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                active === t.id
                  ? `${t.activeBg} ${t.color} ${t.activeBorder}`
                  : 'bg-gray-900 text-gray-500 hover:text-gray-300 border-transparent'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-3">{tab.icon}</p>
            <p className="text-sm">아직 기록이 없습니다.</p>
            <p className="text-xs text-gray-700 mt-1">첫 번째 도전자가 되어보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((e, i) => (
              <div
                key={`${e.nickname}-${e.date}`}
                className="flex items-center gap-4 bg-gray-900 rounded-xl px-4 py-3"
              >
                <span className="text-xl w-7 text-center flex-shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-gray-600 text-sm">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{e.nickname}</p>
                  <p className="text-gray-600 text-xs">
                    {new Date(e.date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-lg ${tab.color}`}>
                    {e.score}<span className="text-gray-600 text-sm font-normal">/10</span>
                  </p>
                  <p className="text-gray-600 text-xs">{e.totalTime}초</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
