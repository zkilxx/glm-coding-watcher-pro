# README Feature Screenshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four privacy-safe, repository-hosted feature screenshots and explanatory captions to the GitHub README.

**Architecture:** Capture the real unpacked extension and GLM page through Chrome, store PNG files under `docs/images/`, and reference them with relative Markdown paths.

**Tech Stack:** Chrome Manifest V3, PNG, Markdown, Node test runner.

## Global Constraints

- Do not show account avatars, CAPTCHA details, payment data, or unrelated tabs.
- Do not fabricate purchase success or verification states.
- Use repository-relative image paths only.

---

### Task 1: Capture feature images

**Files:**
- Create: `docs/images/popup-overview.png`
- Create: `docs/images/plan-priority.png`
- Create: `docs/images/monitor-settings.png`
- Create: `docs/images/page-status-card.png`

- [ ] Reload the local extension and prepare each real UI state.
- [ ] Capture focused screenshots with personal information excluded.
- [ ] Verify all four PNG files decode and have non-zero dimensions.

### Task 2: Add README screenshot guide

**Files:**
- Modify: `README.md`
- Test: `tests/manifest.test.js`

- [ ] Add a failing test for all four image paths and files.
- [ ] Add a “功能截图” section with headings, images, alternative text, and concise captions.
- [ ] Run `npm test` and Markdown path checks.
- [ ] Open the GitHub README after publishing and verify every image renders.

