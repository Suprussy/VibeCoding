# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file todo management app (`todo.html`) — HTML + CSS + JS, no build tools or external libraries. Data persisted in localStorage under key `todos`.

## Architecture

All code lives in `todo.html`:
- **CSS variables** (`--color-work`, `--color-personal`, `--color-study`) drive category theming
- **Data layer**: `loadTodos()` / `saveTodos()` + CRUD functions (`createTodo`, `deleteTodo`, `toggleTodo`, `updateTodo`)
- **Filter system**: `currentFilter` global + `getFilteredTodos()` — progress always computed from full dataset, list renders filtered subset
- **Rendering**: `renderTodos()` orchestrates list + calls `renderProgress()` and `updateTabCounts()`. All DOM built via `createElement` (no `innerHTML`)
- **Inline editing**: `startEdit()` swaps span→input, commits on Enter/blur, cancels on Escape

## Conventions

- Category values: `'work'` | `'personal'` | `'study'`
- Filter values: `'all'` | `'work'` | `'personal'` | `'study'` | `'active'`
- Todo IDs: `Date.now().toString()`
- Badge CSS classes follow pattern `badge-{category}`
- Progress bar fill classes: `progress-fill-{category}`
