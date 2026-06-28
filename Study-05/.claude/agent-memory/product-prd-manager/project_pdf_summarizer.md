---
name: project-pdf-summarizer
description: PDF 요약 웹앱 프로젝트 — 단일 HTML 파일, PDF.js + OpenRouter API 기반 한국어 요약 서비스
metadata:
  type: project
---

PDF 문서 요약 웹 애플리케이션 PRD 작성 요청 (2026-06-27).

**핵심 스펙:**
- 파일명: `index_pdf.html` (단일 HTML, 순수 프론트엔드)
- PDF 텍스트 추출: PDF.js (CDN)
- AI 요약: OpenRouter API, 모델 `openrouter/owl-alpha`
- 요약 언어: 한국어

**Why:** 구현 팀이 바로 코딩에 착수할 수 있는 수준의 상세 PRD 요청. 기술 명세(API 스펙, 에러 처리, 토큰 전략)와 프롬프트 설계까지 포함.

**How to apply:** 향후 이 프로젝트 관련 대화 시 위 스펙을 기반으로 답변. 모델명은 `openrouter/owl-alpha`이며 OpenRouter 엔드포인트 사용.

[[user-role-product-builder]]
