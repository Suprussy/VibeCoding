# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"냉장고 파먹기" (Fridge Recipe) — a Korean-language web app where users upload a fridge photo, an AI recognizes ingredients, and then generates recipe recommendations based on those ingredients and user preferences. Users can register, save recipes to a personal library, and export them.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run typecheck  # TypeScript check (tsc --noEmit)
npm run lint       # ESLint
```

No test framework is configured.

## Architecture

Next.js 14 (App Router, Pages use `'use client'`), Tailwind CSS, better-sqlite3, Zod validation.

### User Flow (3 steps)

1. **`/` (Home)** — Upload fridge photo → call `POST /api/recognize` → display recognized ingredients. Ingredients are passed to step 2 via `sessionStorage`.
2. **`/recipes`** — Set preferences (servings, difficulty, cuisine, diet, exclusions) → call `POST /api/recipes` → display 1–3 AI-generated recipes. Logged-in users can save recipes.
3. **`/library`** — View/search/edit/export saved recipes (requires auth).

### AI Integration (OpenRouter)

Both AI endpoints go through OpenRouter (`https://openrouter.ai/api/v1/chat/completions`), using free-tier models:
- **Ingredient recognition** (`app/api/recognize/route.ts`): `google/gemma-4-31b-it:free` — sends fridge image as base64, expects JSON with ingredient list.
- **Recipe generation** (`app/api/recipes/route.ts`): `nvidia/nemotron-3-super-120b-a12b:free` — sends ingredients + preferences, expects JSON with 1–3 recipes.

Both endpoints use a retry loop (max 2 attempts), Zod schema validation on AI responses, and code-fence stripping. The recipe endpoint additionally validates that excluded ingredients don't appear in results (`findExclusionViolation`).

### Auth System

Cookie-based sessions stored in SQLite (`auth_sessions` table). Session tokens are SHA-256 hashed before storage. Includes account lockout after 5 failed login attempts (15-minute cooldown). Auth state is checked client-side via `GET /api/auth/me` on each page that needs it (no shared React context/provider).

### Database

Single SQLite file at `data/app.db` (auto-created, gitignored). Uses WAL mode. The `db` singleton is cached on `globalThis` to survive Next.js HMR reloads. Tables: `users`, `profiles`, `saved_recipes`, `auth_sessions`. JSON columns (`diet`, `exclusions`, `user_tags_json`, `recipe_json`, `source_json`) are stored as serialized strings.

### Validation

`lib/validate.ts` defines Zod schemas shared between API input validation and AI response validation. `lib/types.ts` has the TypeScript types used by client components.

### Environment

Requires `OPENROUTER_API_KEY` in `.env`. See `.env.example`.

## Conventions

- All UI text is in Korean.
- API routes return `{ error: 'error_code' }` with appropriate HTTP status on failure.
- Prepared statements are module-level constants (better-sqlite3 pattern).
- No global state management — each page fetches its own data, passes ingredients between steps via `sessionStorage`.
