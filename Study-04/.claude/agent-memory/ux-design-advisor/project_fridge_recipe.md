---
name: 냉장고 레시피 앱 프로젝트 컨텍스트
description: Next.js 14 App Router 기반 한국어 냉장고 레시피 서비스의 스택, 디자인 시스템, UX 패턴 정보
type: project
---

Next.js 14 App Router + TypeScript + Tailwind CSS 기반의 한국어 서비스.

**디자인 시스템 패턴:**
- 카드: `bg-white rounded-2xl border border-slate-200 p-5`
- Primary CTA: `bg-emerald-600 text-white hover:bg-emerald-700`
- 파괴적 액션(삭제): `text-rose-600 hover:bg-rose-50` / 확인 버튼은 `bg-rose-600 text-white`
- 보조 버튼: `border border-slate-300 text-slate-700 hover:bg-slate-50`
- 스켈레톤: `bg-slate-200 rounded animate-pulse`
- 에러 알림: `role="alert"` + `border-rose-200 bg-rose-50 text-rose-700`

**적용된 UX 개선 이력 (2026-05-18):**
- `app/library/page.tsx`: window.confirm() → 인라인 삭제 확인 UI (deletingId state 패턴)
- `app/library/page.tsx`: 텍스트 로딩 → 스켈레톤 UI (animate-pulse)
- `app/library/page.tsx`: 검색 input에 aria-label="레시피 검색" 추가
- `app/recipes/page.tsx`: hydrate 전 빈 화면 → 최소 스켈레톤 UI

**Why:** 모바일 UX 개선 및 WCAG 2.1 접근성 준수.
**How to apply:** 이후 confirm() 사용 패턴이 발견되면 동일한 deletingId state 방식으로 교체 권장. 신규 로딩 상태는 항상 스켈레톤 UI 사용.
