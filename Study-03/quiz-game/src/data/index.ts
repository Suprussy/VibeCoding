import bibleQuestions from './bible'
import hiphopQuestions from './hiphop'
import nbaQuestions from './nba'
import mlbQuestions from './mlb'
import { Category, Question } from '@/types/quiz'

export { bibleQuestions, hiphopQuestions, nbaQuestions, mlbQuestions }

export const allQuestions: Question[] = [
  ...bibleQuestions,
  ...hiphopQuestions,
  ...nbaQuestions,
  ...mlbQuestions,
]

export function getQuestionsByCategory(category: Category): Question[] {
  return allQuestions.filter((q) => q.category === category)
}
