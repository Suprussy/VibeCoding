<!-- Created: 2026-04-08 -->

# CLAUDE.md — Desktop Version

This file provides guidance to Claude Code (claude.ai/code) when working with the **desktop version** of the handwritten digit recognizer.

In this project, "desktop" means the app is launched and runs locally on the user's machine (double-click a launcher, no web server). The current implementation happens to use HTML + TensorFlow.js rendered in the system browser, but it is treated as a desktop app because it ships as local files and is launched via a `.bat`.

## Files

- `digit_recognizer.html` — single-file implementation (UI, MNIST loading, CNN, training, inference).
- `Run Digit Recognizer.bat` — Windows launcher that opens the HTML in the default browser via `%~dp0`. Must stay in the same folder as the HTML.

No build system, no package manager, no server. TensorFlow.js is loaded from a CDN. **Keep the single-file structure** — do not split into modules, introduce a bundler, or add npm dependencies unless explicitly asked.

## Running

- Double-click `Run Digit Recognizer.bat`, or open `digit_recognizer.html` directly in any modern browser.
- On first load the page downloads the MNIST sprite + labels from `storage.googleapis.com/learnjs-data/model-builder/`, builds a small CNN, and trains in-browser (~30–60s) before enabling the Predict button. Internet is required on first load.

## Architecture notes

The script in `digit_recognizer.html` is organized into clearly-marked sections (`// =====` banners).

- **MnistData**: Loads the 65,000-image grayscale sprite PNG by drawing 5,000-row chunks onto an offscreen canvas and reading the red channel as normalized intensity. Labels come from a separate uint8 file. Sliced into 55k train / 10k test. `nextTrainBatch` returns random batches as `tf.tensor4d` / `tf.tensor2d`.
- **buildModel**: Two conv+maxpool blocks (16/32 filters, 3x3) → flatten → dense(64) → dense(10, softmax). Adam + categorical crossentropy.
- **train**: 200 mini-batches of size 128 via `model.trainOnBatch`, yielding to the browser with `tf.nextFrame()` every 10 steps so the UI stays responsive. Tensors disposed after each step.
- **canvasToTensor / predict**: User draws on a 280x280 canvas (10x MNIST resolution). `tf.browser.fromPixels(..., 1)` reads it, normalizes, and `tf.image.resizeBilinear` downscales to 28x28. The canvas is initialized black with white stroke to match MNIST's white-on-black convention — preserve this if you change the drawing UI.

## Things to be careful about

- All tensors created outside `tf.tidy` (training batches, prediction in/out) must be explicitly `.dispose()`d to avoid GPU memory leaks. Follow the existing pattern.
- The MNIST sprite/labels URLs are external dependencies; the app will not work fully offline on first load. If true offline operation is needed, bundle the data locally.
- The `.bat` launcher uses `%~dp0` so it must stay in the same folder as the HTML file.
