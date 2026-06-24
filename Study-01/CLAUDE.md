# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A handwritten digit recognizer being developed in two parallel implementations:

- **`desktop_version/`** — Locally-launched app (double-click `.bat`, runs in the system browser via TensorFlow.js). Currently the reference implementation. See `desktop_version/CLAUDE.md`.
- **`web_version/`** — Hosted/served web app. Not yet implemented; tech stack TBD. See `web_version/CLAUDE.md`.

**Terminology note:** in this project "desktop" = launched and run locally on the user's machine; "web" = hosted on a web server. The desktop version happens to use HTML+JS, but it is a desktop app because of how it ships and launches, not because of its tech stack.

When working on a specific version, read that subfolder's `CLAUDE.md` for the details that matter there. Keep changes scoped to one folder unless the user explicitly asks to touch both — the two versions are intentionally independent so they can diverge in stack and dependencies.

## Shared design constraints

Both versions should converge on the same user-visible behavior:

- Draw a digit on a canvas roughly 10x the model input resolution; bilinear-downscale to 28x28 before inference.
- White strokes on black background (matches MNIST orientation).
- Show the predicted digit plus per-class probabilities, not just the argmax.
- Default model is a small CNN: conv(16,3x3)+pool → conv(32,3x3)+pool → flatten → dense(64) → dense(10, softmax), Adam + categorical crossentropy.
