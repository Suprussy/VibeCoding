# PRD — Step 3: 사용자 프로필 및 레시피 저장

## 1. 개요
사용자별 프로필을 생성하고, Step 2에서 생성한 레시피를 개인 보관함에 저장/관리할 수 있도록 한다. 영속화를 도입함으로써 단일 세션의 한계를 넘어 재방문 시에도 결과를 활용할 수 있게 한다.

## 2. 목표
- 가입/로그인 흐름과 개인 프로필 관리 기능을 도입한다.
- Step 2에서 생성한 레시피 객체를 사용자 계정에 저장하고, 목록/상세 조회/삭제할 수 있게 한다.
- 사용자의 식이 선호(알레르기, 비건 등)를 프로필에 보관하여 Step 2의 옵션 패널에 자동 적용한다.

## 3. 의존성
- Step 1, Step 2가 완성되어 있어야 한다.
- Step 2의 레시피 출력 스키마(섹션 5.4)는 본 단계의 저장 스키마의 부분집합이다.

## 4. 사용자 스토리
- (US-1) 사용자로서 이메일/비밀번호 또는 OAuth로 가입/로그인하고 싶다.
- (US-2) 사용자로서 마음에 든 레시피를 "저장"하여 보관함에서 다시 보고 싶다.
- (US-3) 사용자로서 저장한 레시피에 메모/별점/태그를 달고 싶다.
- (US-4) 사용자로서 프로필에 알레르기/식이 선호를 저장해 두면, Step 2 옵션이 자동으로 채워지길 원한다.
- (US-5) 사용자로서 계정과 모든 데이터를 삭제(탈퇴)할 수 있어야 한다.

## 5. 기능 요구사항
### 5.1 인증
- 방식: 이메일+비밀번호 (필수), Google OAuth (선택, 동일 계정 매핑 지원).
- 세션: HTTP-only, Secure 쿠키. CSRF 방지(SameSite=Lax + 토큰).
- 비밀번호: 최소 10자, 해시 알고리즘 Argon2id 또는 bcrypt(cost ≥ 12).
- 로그인 실패 5회 → 15분 잠금.

### 5.2 프로필
- 화면: `/profile`
- 필드:
  - 닉네임(필수, 2~20자)
  - 아바타(선택, 1MB 이내)
  - 기본 인분(default 2)
  - 알레르기/제외 재료(태그)
  - 식이 옵션(채식/비건/글루텐프리 등 다중 선택)
  - 선호 카테고리(한식/일식/중식/양식/무관)
- 저장 시 Step 2의 옵션 패널 기본값으로 즉시 반영된다.

### 5.3 레시피 저장
- 트리거: Step 2 결과 카드의 "저장" 버튼.
- 저장 시점에 Step 2 응답(섹션 5.4 스키마)을 그대로 직렬화 + 저장 메타데이터를 부가:
  ```json
  {
    "saved_id": "uuid",
    "user_id": "uuid",
    "saved_at": "2026-05-05T12:34:56Z",
    "source": {
      "ingredients_snapshot": [...],
      "preferences_snapshot": {...},
      "model": "nvidia/nemotron-3-super-120b-a12b:free"
    },
    "user_notes": "",
    "user_rating": null,
    "user_tags": [],
    "recipe": { /* Step 2 Recipe 객체 그대로 */ }
  }
  ```
- 동일 `recipe.id` 중복 저장은 차단(보관함 내 유니크).

### 5.4 보관함
- 화면: `/library`
- 기능:
  - 목록: 카드 그리드, 정렬(저장일/별점/제목), 검색(제목/태그/재료).
  - 필터: 카테고리, 난이도, 별점, 사용자 태그.
  - 상세: 5.3의 저장된 객체를 Step 2 상세 화면 컴포넌트로 재사용.
  - 편집: `user_notes`, `user_rating`, `user_tags` 만 수정 가능. 레시피 본문은 불변.
  - 삭제: 단건/다건 선택 삭제.
  - 내보내기: 단건 JSON / 마크다운 다운로드.

### 5.5 데이터 모델
- `users(id, email, password_hash, created_at, deleted_at)`
- `profiles(user_id PK/FK, nickname, avatar_url, default_servings, diet jsonb, exclusions jsonb, preferred_cuisine, updated_at)`
- `saved_recipes(saved_id PK, user_id FK, recipe jsonb, source jsonb, user_notes, user_rating int CHECK 1..5, user_tags jsonb, saved_at, deleted_at)`
- `auth_sessions(token PK hash, user_id, expires_at, ip, user_agent)`
- 인덱스: `saved_recipes(user_id, saved_at DESC)`, `saved_recipes USING gin (recipe jsonb_path_ops)` (검색용).

### 5.6 API
- `POST /api/auth/register`
- `POST /api/auth/login` / `POST /api/auth/logout`
- `GET /api/profile` / `PUT /api/profile`
- `GET /api/recipes/saved?cursor=&q=&sort=`
- `POST /api/recipes/saved` (Step 2 결과 + 메타 저장)
- `GET /api/recipes/saved/:id`
- `PATCH /api/recipes/saved/:id` (notes/rating/tags 만)
- `DELETE /api/recipes/saved/:id`
- `DELETE /api/account` (계정 + 연관 데이터 영구 삭제)

모든 보호된 라우트는 세션 검증 미들웨어를 통과해야 한다.

### 5.7 권한 / 보안
- 한 사용자는 자신의 `saved_recipes` 만 읽기/쓰기/삭제 가능. 서버에서 `user_id` 강제 매칭.
- API 키(`OPENROUTER_API_KEY`)는 Step 1·2와 동일하게 서버 전용.
- 입력 검증: zod(또는 동급) 스키마로 모든 페이로드 검증.
- 감사 로그: 인증 이벤트, 계정 삭제는 별도 테이블에 기록(개인정보 제외).

### 5.8 빈 상태 / 에러
- 보관함 비어 있음: "저장된 레시피가 없습니다 — 첫 사진을 올려보세요" + Step 1 진입 CTA.
- 저장 실패(중복/네트워크): 토스트 + 재시도 버튼.
- 만료된 세션: 자동 로그아웃 + 로그인 페이지 리디렉션, 직전 위치 보존.

## 6. UI/UX
- 글로벌 헤더에 로그인 상태 표시 + 보관함 진입 링크.
- 미로그인 상태에서도 Step 1·2는 사용 가능(저장 버튼만 비활성, 클릭 시 로그인 유도 모달).
- 프로필에서 변경한 식이 옵션은 다음 Step 2 진입부터 즉시 반영(낙관적 UI).

## 7. 기술 스택(권장)
- 인증: Auth.js(NextAuth) 또는 Lucia.
- DB: Postgres (Neon/Supabase/Railway 등).
- ORM: Prisma 또는 Drizzle.
- 파일(아바타): S3 호환 스토리지(Supabase Storage / R2).

## 8. 환경변수(추가)
- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (선택)
- `STORAGE_BUCKET_URL` / `STORAGE_ACCESS_KEY` (아바타 사용 시)

## 9. 완료 조건 (Acceptance Criteria)
- [ ] 신규 가입 → 로그인 → 프로필 편집 → Step 1 → Step 2 → "저장" → 보관함에서 조회까지 end-to-end로 동작한다.
- [ ] 다른 사용자의 `saved_recipe` 에 접근하면 403 을 반환한다(권한 테스트 통과).
- [ ] 프로필의 알레르기/식이 옵션이 Step 2 옵션 패널 기본값에 반영된다.
- [ ] 동일 `recipe.id` 를 두 번 저장하면 두 번째 호출이 409 를 반환한다.
- [ ] 계정 삭제 시 모든 `saved_recipes`, 프로필, 세션이 영구 삭제된다.
- [ ] 비밀번호는 평문으로 어디에도 저장/로그되지 않는다(코드 리뷰 + 로그 점검).

## 10. 비범위 (Out of Scope)
- 레시피 공개 공유/소셜 기능(좋아요, 댓글, 팔로우).
- 다중 디바이스 동기화 충돌 해결(현재는 last-write-wins).
- 모바일 푸시 알림.
- 다국어 i18n.
