# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Build & Run
설치: npm install
개발 서버: npm run dev
빌드: npm run build

Linting
린트: npm run lint


도전! 마스터 퀴즈 — 프로젝트 가이드
프로젝트 개요
4개 카테고리(성경, 외국 힙합, NBA, MLB)의 도전적인 4지선다 퀴즈 게임.
각 카테고리 10문제, 총 40문제. 타이머, 즉시 피드백, 리더보드 포함.

기술 스택
Next.js 14 (App Router) + TypeScript + Tailwind CSS
상태관리: React useState/useReducer (외부 라이브러리 없이)
데이터 저장: localStorage (리더보드)

폴더 구조
quiz-game/
├── app/
│   ├── page.tsx                  # 홈 화면 (닉네임 입력 + 카테고리 선택)
│   ├── quiz/[category]/page.tsx  # 퀴즈 진행 화면
│   ├── result/page.tsx           # 결과 화면
│   └── leaderboard/page.tsx      # 리더보드
├── components/
│   ├── TimerBar.tsx              # 타이머 시각화
│   ├── ChoiceButton.tsx          # 선택지 버튼
│   ├── ProgressBar.tsx           # 문제 진행률 바
│   └── FeedbackOverlay.tsx       # 정답/오답 피드백 + 해설
├── data/
│   ├── bible.ts                  # 성경 퀴즈 10문제
│   ├── hiphop.ts                 # 외국 힙합 퀴즈 10문제
│   ├── nba.ts                    # NBA 퀴즈 10문제
│   ├── mlb.ts                    # MLB 퀴즈 10문제
│   └── index.ts                  # 전체 export
├── types/
│   └── quiz.ts                   # 타입 정의
├── lib/
│   └── storage.ts                # 리더보드 localStorage 유틸
└── tailwind.config.ts

타입 정의 (types/quiz.ts)

tsexport type Category = 'bible' | 'hiphop' | 'nba' | 'mlb'

export interface Question {
  id: string
  category: Category
  question: string
  options: [string, string, string, string]
  answer: number        // 0~3 정답 인덱스
  explanation: string   // 해설
}

export interface LeaderboardEntry {
  nickname: string
  category: Category
  score: number         // 정답 수 (0~10)
  totalTime: number     // 소요 시간(초)
  date: string          // ISO 날짜 문자열
}

export interface AnswerRecord {
  questionId: string
  selected: number | null   // null = 타임아웃
  correct: boolean
}

퀴즈 데이터 규칙

난이도: 마니아/전문가 수준 (단순 상식 X)
각 파일은 Question[] 배열을 default export
id 형식: "bible_001", "hiphop_003" 등

카테고리별 출제 방향
카테고리출제 포인트📖 성경구약/신약 균형, 구체적 수치·인물·사건 (예: 팔린 가격, 재위 기간 등)🎤 외국 힙합90~2010년대 중심, 앨범명·피처링·레이블·역사적 사건🏀 NBA역대 기록·통계·MVP·파이널 수치 기반⚾ MLB역대 기록·월드시리즈·전설적 선수 수치 기반

게임 로직 규칙
문제당 타이머: 20초
타이머 0초 도달 시: 자동 오답 처리 (selected: null)
선택지 클릭 시: 타이머 즉시 정지
피드백 표시 후: 2초 뒤 자동으로 다음 문제 진행
10문제 완료 시: /result로 이동 (점수·닉네임·소요시간 전달)

리더보드 규칙 (lib/storage.ts)
저장소: localStorage
정렬 기준: 점수 내림차순 → 소요시간 오름차순 (동점 시)
카테고리별 상위 10개만 유지
필수 함수:
getLeaderboard(category: Category): LeaderboardEntry[]
saveScore(entry: LeaderboardEntry): void
getTopScores(): LeaderboardEntry[] (전체 합산)

UI/스타일 규칙
테마: 다크 (bg-gray-950 기본)
카테고리별 포인트 컬러:
성경: amber-400
힙합: purple-400
NBA: red-400
MLB: blue-400
정답: green-500 / 오답: red-500
반응형: 모바일 우선, 최대 너비 max-w-2xl 중앙 정렬

커스텀 애니메이션 (tailwind.config.ts)
tskeyframes: {
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%': { transform: 'translateX(-8px)' },
    '40%': { transform: 'translateX(8px)' },
    '60%': { transform: 'translateX(-6px)' },
    '80%': { transform: 'translateX(6px)' },
  },
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  countUp: {
    '0%': { opacity: '0', transform: 'scale(0.5)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
},
animation: {
  shake: 'shake 0.4s ease-in-out',
  'fade-in': 'fadeIn 0.3s ease-out',
  'count-up': 'countUp 0.5s ease-out',
},

결과 화면 점수 메시지
점수메시지10/10🏆 완벽한 마스터!8~9/10🎉 거의 다 왔어요!6~7/10👍 꽤 잘하셨네요!5 이하💪 다시 도전해봐요!

엣지 케이스 처리
닉네임 미입력 시 게임 시작 불가 (경고 메시지 표시)
리더보드 데이터 없을 때 빈 상태 UI 표시
퀴즈 중 새로고침 시 홈으로 리다이렉트
타이머 5초 이하 시 빨간색 + 빠른 깜빡임 경고


구현 단계

✅ STEP 1 — 프로젝트 세팅 & 데이터
Next.js 14 프로젝트 생성 (TypeScript + Tailwind)
위 폴더 구조 생성
types/quiz.ts 타입 정의
4개 카테고리 × 10문제 데이터 파일 작성 (마니아 난이도)
lib/storage.ts 유틸 함수 작성
npm run dev 정상 실행 확인

✅ STEP 2 — 핵심 게임 로직 & UI
홈 화면: 닉네임 입력 + 카테고리 선택 카드 4개
퀴즈 페이지: 타이머 + 진행률 바 + 선택지 + 즉시 피드백
결과 화면: 점수 + 문제별 요약 + 리더보드 저장 버튼
공통 컴포넌트 분리 (TimerBar, ChoiceButton, ProgressBar, FeedbackOverlay)

✅ STEP 3 — 리더보드 & Polish
리더보드 페이지: 카테고리별 탭 + 상위 10명 + 메달 아이콘
애니메이션: shake(오답), fadeIn(문제 전환), countUp(점수)
홈 화면 카드에 개인 최고 기록 표시
반응형 모바일 대응
전체 흐름 최종 점검


퀴즈 문제 교차 검증 가이드라인

모든 문제 작성 시 확인사항
1. 정답이 하나뿐인가?
- 다른 해석 가능 시 조건 명시 (예: 면적 기준, 2024년 기준)
2. 최상급 표현에 기준이 있는가?
- '가장 큰', '최초의' 등 표현에 측정 기준 명시
3. 시간과 범위가 명확한가?
- 변할 수 있는 정보는 시점 명시
- 지리적, 분류적 범위 한정
4. 교차 검증했는가?
- 의심스러운 정보는 2개 이상 출처 확인
- 논란 있는 내용은 주류 학설 기준