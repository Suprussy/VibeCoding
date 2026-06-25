---
name: 냉장고 레시피 Next.js 앱 컨텍스트
description: Study-04 프로젝트는 Next.js App Router + better-sqlite3 + OpenRouter LLM(이미지/레시피)을 사용하는 한국어 냉장고 레시피 추천 앱이며, 향후 리뷰 시 반복해서 확인할 구조적 특이점을 정리
type: project
---

Study-04 = "냉장고 레시피" Next.js 14 App Router 앱. 사진 → 재료 인식(google/gemma-4-31b-it:free) → 레시피 추천(nvidia/nemotron-3-super-120b-a12b:free) 플로우.

**Why**: 향후 같은 프로젝트를 리뷰할 때 동일한 아키텍처 가정을 다시 발견하지 않아도 되도록 기록.

**How to apply**:
- 데이터 저장: `better-sqlite3` 로컬 파일 DB(`data/app.db`). 글로벌 캐싱(`globalThis.__sqliteDb`) 패턴. Vercel/serverless 부적합이라는 점을 항상 환기.
- 세션: 평문 토큰을 쿠키에 두고 DB에는 SHA-256 hash 저장. `SESSION_COOKIE='session'`, TTL 30일, bcrypt cost 12, 잠금 임계값 5회/15분.
- 라우트 패턴: 모든 `app/api/**/route.ts`가 `export const runtime = 'nodejs'` 선언. LLM 호출 라우트는 `maxDuration = 60` 설정이 있으나 외부 fetch timeout(`TIMEOUT_MS`)이 더 큰 경우가 있어 정합성 체크 필요.
- LLM 라우트 공통 패턴: AbortController 타임아웃 + 2회 retry + Zod schema validation + `stripCodeFence` + `findExclusionViolation` 안전 가드.
- 클라이언트 상태: sessionStorage 키 `fridge.step1.ingredients`, `fridge.step2.preferences`로 페이지 간 인계.
- 인증 가드: 클라이언트 페이지(`profile`, `library`)는 401 시 `router.replace('/login')` 패턴.
- CSRF/보안 헤더 미설정 상태가 디폴트이므로 보안 리뷰 시 반복 지적 대상.
