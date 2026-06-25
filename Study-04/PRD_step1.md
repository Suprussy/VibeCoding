# PRD — Step 1: 냉장고 이미지 인식

## 1. 개요
사용자가 냉장고 내부 사진을 업로드하면, 비전 모델이 사진 속 식재료를 인식해 구조화된 재료 목록(JSON)으로 반환한다. 본 단계는 전체 서비스의 입력 파이프라인을 담당한다.

## 2. 목표
- 단일 이미지를 받아 식재료 목록을 추출하는 최소 기능 제품(MVP)을 완성한다.
- OpenRouter를 통해 호출하는 모델은 **`google/gemma-4-31b-it:free`** 로 고정한다.
- API 키는 서버 측 환경변수 `OPENROUTER_API_KEY` 에서만 읽고, 클라이언트 번들에 노출하지 않는다.

## 3. 사용자 스토리
- (US-1) 사용자로서 냉장고 사진을 업로드해, 인식된 재료 목록을 화면에서 확인하고 싶다.
- (US-2) 사용자로서 인식 결과가 부정확할 경우, 항목을 직접 추가/수정/삭제하고 싶다.
- (US-3) 사용자로서 인식 진행 상태(로딩/실패/성공)를 명확히 보고 싶다.

## 4. 기능 요구사항
### 4.1 이미지 입력
- 입력 방식: 파일 업로드(`<input type="file" accept="image/*">`) + 드래그앤드롭.
- 허용 포맷: JPEG, PNG, WebP.
- 최대 파일 크기: **8 MB**. 초과 시 클라이언트에서 즉시 차단.
- 클라이언트 미리보기(썸네일) 제공.

### 4.2 서버 처리
- 클라이언트는 이미지를 `multipart/form-data` 또는 base64 data URL로 서버 라우트(`POST /api/recognize`)에 전송.
- 서버는 이미지를 base64로 인코딩하여 OpenRouter Chat Completions API에 전달.
  - 엔드포인트: `https://openrouter.ai/api/v1/chat/completions`
  - 모델: `google/gemma-4-31b-it:free`
  - 메시지 형식: `messages: [{ role: "user", content: [{ type: "text", text: <prompt> }, { type: "image_url", image_url: { url: <dataUrl> } }] }]`
  - 헤더: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer`, `X-Title`.
- 모델 응답을 JSON으로 파싱하여 클라이언트에 반환.

### 4.3 프롬프트 & 출력 스키마
모델에게 다음 JSON 스키마로만 응답하도록 지시한다(자연어 금지).
```json
{
  "ingredients": [
    {
      "name": "토마토",
      "quantity_estimate": "3개",
      "confidence": 0.0
    }
  ],
  "notes": "사진에 부분적으로 가려진 항목은 제외함"
}
```
- `name`: 한국어 일반 명사.
- `quantity_estimate`: 모델이 추정 가능한 경우만, 불가능하면 `"unknown"`.
- `confidence`: 0.0 ~ 1.0.
- 응답이 스키마를 벗어나면 서버에서 1회 재시도, 그래도 실패 시 4.5의 에러를 반환.

### 4.4 결과 화면
- 인식된 재료를 카드/체크박스 리스트로 표시.
- 각 항목: 이름, 수량 추정, 신뢰도 배지(예: 높음/중간/낮음).
- 액션: 항목 추가, 이름 수정, 삭제, 전체 초기화.
- "다음 단계로" 버튼은 Step 2에서 사용할 수 있도록 최종 재료 배열을 세션 상태(또는 URL/스토어)에 저장한다.

### 4.5 에러 처리
| 케이스 | 처리 |
| --- | --- |
| 파일 크기/포맷 위반 | 클라이언트에서 즉시 안내, 업로드 차단 |
| OpenRouter 4xx | 사용자에게 "이미지를 인식하지 못했습니다" 표시, 원인 로깅 |
| OpenRouter 5xx / 타임아웃(>30s) | 1회 자동 재시도, 실패 시 사용자에게 재시도 버튼 노출 |
| 응답 JSON 파싱 실패 | 1회 재시도, 실패 시 빈 목록과 함께 직접 입력 모드로 폴백 |

## 5. UI/UX
- 단일 페이지(`/`): ① 업로드 영역 → ② 분석 중 스피너 → ③ 재료 목록 편집 → ④ "레시피 추천 받기" CTA.
- 모바일 우선 반응형. 사진 촬영을 위해 `capture="environment"` 속성 사용.
- 접근성: 업로드 영역 키보드 포커스 가능, 결과 항목 `aria-label` 부여.

## 6. 기술 스택(권장)
- **프레임워크**: Next.js (App Router) — 서버 라우트로 API 키 보호.
- **언어**: TypeScript.
- **스타일**: Tailwind CSS.
- **상태**: 단계 간 데이터 공유를 위해 Zustand 또는 React Context.
- **HTTP**: 서버에서 `fetch` 사용, 추가 의존성 없음.

## 7. 환경변수
- `OPENROUTER_API_KEY` (필수, 서버 전용)
- `OPENROUTER_REFERER` (선택, OpenRouter 통계용)
- `OPENROUTER_APP_TITLE` (선택)

## 8. 완료 조건 (Acceptance Criteria)
- [ ] 8MB 이내 JPEG/PNG/WebP 이미지를 업로드할 수 있다.
- [ ] 업로드 후 평균 30초 이내에 재료 목록이 표시된다.
- [ ] 모델이 반환한 JSON이 4.3 스키마를 따른다(서버 검증).
- [ ] 사용자는 결과 목록을 자유롭게 편집할 수 있다.
- [ ] 클라이언트 번들에 `OPENROUTER_API_KEY` 가 포함되지 않는다(빌드 산출물 검증).
- [ ] 네트워크 실패 시 명확한 에러 메시지와 재시도 수단이 제공된다.

## 9. 비범위 (Out of Scope)
- 다중 이미지 동시 업로드.
- 이미지 내 객체 위치(바운딩 박스) 표시.
- 재료 데이터베이스 매칭/표준화.
- 회원가입/로그인(Step 3에서 다룸).
