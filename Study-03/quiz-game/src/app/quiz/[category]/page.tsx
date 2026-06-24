'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Category, AnswerRecord } from '@/types/quiz'
import { getQuestionsByCategory } from '@/data'
import TimerBar from '@/components/TimerBar'
import ProgressBar from '@/components/ProgressBar'
import ChoiceButton from '@/components/ChoiceButton'
import FeedbackOverlay from '@/components/FeedbackOverlay'

const TIMER_SECS = 20
const FEEDBACK_MS = 2000

const COLORS: Record<Category, string> = {
  bible: 'text-amber-400',
  hiphop: 'text-purple-400',
  nba: 'text-red-400',
  mlb: 'text-blue-400',
}
const LABELS: Record<Category, string> = {
  bible: '📖 성경',
  hiphop: '🎤 외국 힙합',
  nba: '🏀 NBA',
  mlb: '⚾ MLB',
}

function QuizContent() {
  const router = useRouter()
  const params = useParams()
  const category = params.category as Category
  const nickname = useSearchParams().get('nickname') ?? ''

  const questions = useRef(getQuestionsByCategory(category)).current
  const startTimeRef = useRef(Date.now())
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordsRef = useRef<AnswerRecord[]>([])
  const processedRef = useRef(false)
  const qIdxRef = useRef(0)

  const [qIdx, setQIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  useEffect(() => { qIdxRef.current = qIdx }, [qIdx])

  useEffect(() => {
    const valid: Category[] = ['bible', 'hiphop', 'nba', 'mlb']
    if (!nickname || !valid.includes(category) || !questions.length) {
      router.replace('/')
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current)
      timerIdRef.current = null
    }
  }, [])

  const processAnswer = useCallback((choice: number | null) => {
    if (processedRef.current) return
    processedRef.current = true
    clearTimer()

    const idx = qIdxRef.current
    const q = questions[idx]
    const record: AnswerRecord = {
      questionId: q.id,
      selected: choice,
      correct: choice === q.answer,
    }
    const nextRecords = [...recordsRef.current, record]
    recordsRef.current = nextRecords

    setSelected(choice)
    setAnswered(true)

    const isLast = idx === questions.length - 1

    setTimeout(() => {
      if (isLast) {
        const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000)
        sessionStorage.setItem('quiz_result', JSON.stringify({
          nickname,
          category,
          score: nextRecords.filter((r) => r.correct).length,
          totalTime,
          records: nextRecords,
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            explanation: q.explanation,
            options: q.options,
          })),
        }))
        router.push('/result')
      } else {
        processedRef.current = false
        const next = idx + 1
        qIdxRef.current = next
        setQIdx(next)
        setTimeLeft(TIMER_SECS)
        setSelected(null)
        setAnswered(false)
      }
    }, FEEDBACK_MS)
  }, [clearTimer, questions, nickname, category, router])

  // Timer resets on each new question
  useEffect(() => {
    setTimeLeft(TIMER_SECS)
    let remaining = TIMER_SECS

    timerIdRef.current = setInterval(() => {
      remaining -= 1
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearTimer()
        processAnswer(null)
      }
    }, 1000)

    return clearTimer
  }, [qIdx, clearTimer, processAnswer])

  if (!questions.length || !nickname) return null

  const q = questions[qIdx]

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <span className={`font-bold text-sm ${COLORS[category]}`}>{LABELS[category]}</span>
          <span className="text-gray-500 text-sm truncate max-w-[120px]">{nickname}</span>
        </div>

        <ProgressBar current={qIdx} total={questions.length} />
        <p className="text-gray-600 text-xs text-center mt-1.5 mb-5">
          {qIdx + 1} / {questions.length}
        </p>

        <div className="mb-1">
          <TimerBar timeLeft={timeLeft} maxTime={TIMER_SECS} />
          <p className={`text-right text-xs mt-1 font-semibold ${
            timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-600'
          }`}>
            {timeLeft}초
          </p>
        </div>

        <div
          key={qIdx}
          className="bg-gray-900 rounded-2xl p-6 mb-6 min-h-[120px] flex items-center animate-fade-in"
        >
          <p className="text-base font-medium leading-relaxed">{q.question}</p>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => (
            <ChoiceButton
              key={i}
              option={opt}
              index={i}
              selected={selected}
              correctAnswer={q.answer}
              isAnswered={answered}
              onClick={() => processAnswer(i)}
            />
          ))}
        </div>
      </div>

      {answered && (
        <FeedbackOverlay
          isCorrect={selected === q.answer}
          isTimeout={selected === null}
          explanation={q.explanation}
        />
      )}
    </main>
  )
}

export default function QuizPage() {
  return (
    <Suspense>
      <QuizContent />
    </Suspense>
  )
}
