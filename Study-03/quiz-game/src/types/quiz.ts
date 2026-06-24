export type Category = 'bible' | 'hiphop' | 'nba' | 'mlb'

export interface Question {
  id: string
  category: Category
  question: string
  options: [string, string, string, string]
  answer: number
  explanation: string
}

export interface LeaderboardEntry {
  nickname: string
  category: Category
  score: number
  totalTime: number
  date: string
}

export interface AnswerRecord {
  questionId: string
  selected: number | null
  correct: boolean
}
