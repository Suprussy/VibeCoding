---
name: project-study05-pdf-summarizer
description: Study-05 project is a single-file PDF summarizer HTML app using PDF.js + OpenRouter API
metadata:
  type: project
---

Study-05 contains `index_pdf.html` — a vanilla-JS, single-file PDF summarizer.

**Why:** Learning/vibe-coding project building an AI-powered document tool.

**How to apply:** When reviewing or modifying Study-05, treat it as a standalone no-build HTML file. No npm, no bundler. All logic is in inline `<script>` with function declarations (accessible on `window`) and `let`/`const` state vars (NOT on `window`).

Key facts about the architecture:
- PDF.js 3.11.174 loaded from cdnjs CDN (synchronous `<script>` in `<head>`)
- `pdfjsLib.GlobalWorkerOptions.workerSrc` configured in body `<script>` after CDN loads
- `pdfjsLib.getDocument` is **non-configurable** (cannot be overridden with assignment) — mock `window.extractTextFromPDF` instead when testing
- OpenRouter API model: `openrouter/owl-alpha`
- API key stored in `sessionStorage` under key `pdfsum_api_key`
- State vars (`extractedText`, `currentFile`) are `let` declarations in script scope, NOT on `window`
- All functions (`handleFile`, `extractTextFromPDF`, etc.) are function declarations, accessible on `window`

Bugs fixed in first QA pass (2026-06-27):
1. `dragleave` child-element flicker — added `_dragCounter` + `dragenter` to prevent premature removal of `drag-over` class
2. `parseSummaryResponse` regex — changed `/\s*```$/` to `/\s*```\s*$/` to handle trailing newline after closing backticks

Playwright test location: `/tmp/test_pdf_app.mjs` (run from `/tmp` — uses `./node_modules/playwright`)
HTTP server for testing: `python -m http.server 8765 --directory "C:\Users\supru\Desktop\VibeCoding\Study-05"`
