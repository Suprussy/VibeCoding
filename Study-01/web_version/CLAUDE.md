<!-- Created: 2026-04-08 -->

# CLAUDE.md — Web Version

This file provides guidance to Claude Code (claude.ai/code) when working with the **web version** of the handwritten digit recognizer.

In this project, "web" means the app is intended to be **hosted and served from a web server** (not just opened as a local file). The locally-launched HTML lives in `../desktop_version/` instead.

## Status

**Not yet implemented.** This folder is scaffolded for a hosted web port. The implementation in `../desktop_version/digit_recognizer.html` is the reference — match its behavior (draw on canvas → 28x28 → CNN → predicted digit + probability bars) when building this out.

## Tech stack

The framework has not been chosen yet. **Confirm with the user before adding dependencies or generating boilerplate.** Reasonable options:

- **Static site (plain HTML/JS + TF.js)** — simplest path; closest to the desktop version. Just needs hosting (GitHub Pages, Netlify, etc.). Could literally start as a copy of the desktop HTML.
- **React/Vite or Next.js + TF.js** — better if the user wants components, routing, or SSR.
- **Server-side inference (FastAPI/Flask + PyTorch/TensorFlow)** — if the model should not run in the browser. Adds backend hosting requirements.

## Behavioral parity with the desktop version

Whatever stack is chosen, preserve these design choices from the desktop version (they exist for good reasons — see `../desktop_version/CLAUDE.md`):

- Drawing surface ~10x the model input resolution (e.g. 280x280 for a 28x28 model), with bilinear downscaling.
- White strokes on a black background to match MNIST orientation.
- Same CNN topology unless the user asks otherwise: conv(16,3x3)+pool → conv(32,3x3)+pool → flatten → dense(64) → dense(10, softmax), Adam + categorical crossentropy.
- Show per-class probabilities, not just the argmax.

## Things to think about that differ from the desktop version

- A hosted site can ship a **pre-trained model file** alongside the assets so users do not wait 30–60s for training on every visit. Strongly preferred for a public web deployment.
- Consider bundle size: the desktop version pulls TF.js from a CDN per launch, which is fine locally but matters for first-paint on a public site.
- If model inference moves server-side, the canvas-to-tensor preprocessing must match between client and server exactly, or accuracy will silently degrade.
