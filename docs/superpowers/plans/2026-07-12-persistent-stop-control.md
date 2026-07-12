# Persistent Stop Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a right-top status card with a usable stop control and real refresh count across automatic refreshes, and reorganize the popup monitoring settings.

**Architecture:** The content script owns a Shadow DOM status card whose lifecycle follows the tab-scoped run state. The background persists `refreshCount` through a `REFRESH_RECORDED` message before every reload; the popup monitoring settings use a dedicated structured layout stylesheet.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript, Shadow DOM, CSS, Node test runner.

## Global Constraints

- Add no permissions or runtime dependencies.
- Show the floating control only while monitoring is active and no click has been claimed.
- Do not automate CAPTCHA, login, rate-limit bypass, risk-control bypass, order confirmation, or payment.

---

### Task 1: Persistent in-page stop control

**Files:**
- Modify: `content.js`
- Test: `tests/manifest.test.js`

**Interfaces:**
- Consumes: `run.active`, `run.clickClaimed`, and background message `STOP_MONITORING`.
- Produces: `mountMonitorControl()`, `removeMonitorControl()`, a Shadow DOM status card, and a stop button.

- [ ] **Step 1: Write the failing test**

Add assertions that `content.js` creates a Shadow DOM host, labels the stop button, sends `STOP_MONITORING`, mounts for an active run, and removes it for an inactive run.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="persistent page stop control"`
Expected: FAIL because the control functions do not exist.

- [ ] **Step 3: Write minimal implementation**

Create one right-top fixed host with an isolated Shadow DOM. Render running state, `run.refreshCount`, `settings.scanMs`, and a full-width stop button. Its stop handler disables itself, sends `{type:"STOP_MONITORING"}`, removes the host on success, and displays `重试停止` on failure.

- [ ] **Step 4: Run tests**

Run: `npm test && node --check content.js`
Expected: all tests pass and syntax check exits zero.

- [ ] **Step 5: Commit**

```bash
git add content.js tests/manifest.test.js
git commit -m "Add persistent in-page stop control"
```

### Task 2: Persist real refresh count

**Files:**
- Modify: `background.js`
- Modify: `content.js`
- Modify: `src/state.js`
- Test: `tests/state.test.js`
- Test: `tests/manifest.test.js`

**Interfaces:**
- Consumes: `REFRESH_RECORDED` from the active content script.
- Produces: `run.refreshCount`, initialized to `0` and incremented before `location.reload()`.

- [ ] **Step 1: Write failing tests** for zero initialization, increment handling, and refresh-before-reload ordering.
- [ ] **Step 2: Run tests and confirm failure:** `npm test`.
- [ ] **Step 3: Implement minimal counter persistence** in state, background, and content script.
- [ ] **Step 4: Run tests:** `npm test && node --check background.js && node --check content.js`.
- [ ] **Step 5: Commit:** `git commit -m "Track real page refresh count"`.

### Task 3: Popup monitoring settings and action alignment

**Files:**
- Create: `popup-actions.css`
- Modify: `popup.html`
- Modify: `README.md`
- Test: `tests/manifest.test.js`

**Interfaces:**
- Consumes: existing `.actions`, `#start`, and `#stop` markup.
- Produces: equal-width action columns and documented page stop behavior.

- [ ] **Step 1: Write the failing style test**

Assert `.actions` uses `grid-template-columns:repeat(2,minmax(0,1fr))`, buttons use `width:100%`, and README mentions `网页右下角`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="popup actions align"`
Expected: FAIL against the current `1.3fr 1fr` layout.

- [ ] **Step 3: Implement the CSS and docs**

Create a vertical monitoring-settings panel: a full-width DOM interval field, a separate two-row notification switch group, then equal action columns with full-width buttons. Document that the right-top status card restores its count after reload and can stop monitoring without reopening the popup.

- [ ] **Step 4: Run full verification**

Run: `npm test && node --check background.js && node --check content.js && node --check popup.js && git diff --check`
Expected: all tests pass and all checks exit zero.

- [ ] **Step 5: Validate in Chrome and commit**

Reload the unpacked extension, start monitoring, confirm the floating control reappears after refresh, stop from the page, and inspect popup button alignment. Then commit:

```bash
git add popup.css README.md tests/manifest.test.js
git commit -m "Align popup actions and document page stop"
```
