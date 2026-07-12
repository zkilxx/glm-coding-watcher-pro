# Advanced Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a polished 60-second 1080p MP4 demonstrating the extension with advanced, restrained technology-product motion design.

**Architecture:** A self-contained Remotion project in `video/` uses the repository screenshots as assets, frame-driven CSS 3D transforms, SVG particles, masks, numeric counters, captions, and an original generated ambient soundtrack.

**Tech Stack:** Remotion, React, TypeScript, FFmpeg, H.264/AAC.

## Global Constraints

- 1920×1080, 30fps, 55–65 seconds.
- No CSS animations or nondeterministic motion; all animation uses `useCurrentFrame()`.
- Keep subtitles inside an 80px horizontal and 100px vertical safe area.
- Do not display personal data, CAPTCHA details, payment data, or fabricated purchase success.

---

### Task 1: Scaffold composition and assets

**Files:**
- Create: `video/package.json`
- Create: `video/src/Root.tsx`
- Create: `video/src/Demo.tsx`
- Create: `video/public/`

- [ ] Add Remotion dependencies and copy the four approved screenshots.
- [ ] Register a 1920×1080, 30fps, 1800-frame composition.
- [ ] Render one title frame to verify the toolchain.

### Task 2: Build advanced scenes

**Files:**
- Modify: `video/src/Demo.tsx`
- Create: `video/src/captions.ts`

- [ ] Implement particle space, gradient glows, perspective cards, cursor feedback, magnetic reorder, rolling refresh counter, focus lock, liquid-mask transitions, and neon ending.
- [ ] Add JSON captions using the Remotion Caption shape.
- [ ] Render representative frames at 3s, 12s, 21s, 31s, 42s, 52s, and 58s.

### Task 3: Sound and final render

**Files:**
- Create: `video/public/ambient.wav`
- Create: `video/public/click.wav`
- Create: `video/public/whoosh.wav`
- Create: `dist/glm-coding-watcher-demo.mp4`

- [ ] Generate an original ambient track and short UI sound effects.
- [ ] Mix audio at restrained levels and render H.264/AAC MP4.
- [ ] Validate duration, codec, resolution, frame rate, audio, and extracted keyframes.
- [ ] Add the final video path and preview details to README.

