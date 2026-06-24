import { Category, LeaderboardEntry } from '@/types/quiz'

const STORAGE_KEY = 'quiz_leaderboard'
const MAX_ENTRIES_PER_CATEGORY = 10

function getAllEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllEntries(entries: LeaderboardEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getLeaderboard(category: Category): LeaderboardEntry[] {
  const all = getAllEntries()
  return all
    .filter((e) => e.category === category)
    .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime)
    .slice(0, MAX_ENTRIES_PER_CATEGORY)
}

export function saveScore(entry: LeaderboardEntry): void {
  const all = getAllEntries()
  all.push(entry)

  const categories: Category[] = ['bible', 'hiphop', 'nba', 'mlb']
  const trimmed: LeaderboardEntry[] = []

  for (const cat of categories) {
    const catEntries = all
      .filter((e) => e.category === cat)
      .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime)
      .slice(0, MAX_ENTRIES_PER_CATEGORY)
    trimmed.push(...catEntries)
  }

  saveAllEntries(trimmed)
}

export function getTopScores(): LeaderboardEntry[] {
  return getAllEntries().sort((a, b) => b.score - a.score || a.totalTime - b.totalTime)
}

export function getPersonalBest(nickname: string, category: Category): LeaderboardEntry | null {
  const entries = getAllEntries().filter(
    (e) => e.nickname === nickname && e.category === category
  )
  if (entries.length === 0) return null
  return entries.sort((a, b) => b.score - a.score || a.totalTime - b.totalTime)[0]
}
