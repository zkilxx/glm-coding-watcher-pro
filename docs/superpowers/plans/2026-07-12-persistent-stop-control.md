# Persistent Stop Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a usable stop control on the GLM page across automatic refreshes and align the popup action buttons.

**Architecture:** The existing content script owns a Shadow DOM floating control whose lifecycle follows the tab-scoped run state. It sends the existing `STOP_MONITORING` message to the background; popup layout remains CSS-only.

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
- Produces: `mountMonitorControl()`, `removeMonitorControl()`, and a Shadow DOM stop button.

- [ ] **Step 1: Write the failing test**

Add assertions that `content.js` creates a Shadow DOM host, labels the stop button, sends `STOP_MONITORING`, mounts for an active run, and removes it for an inactive run.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --test-name-pattern="persistent page stop control"`
Expected: FAIL because the control functions do not exist.

- [ ] **Step 3: Write minimal implementation**

Create one fixed host with an isolated Shadow DOM. Its stop handler disables itself, sends `{type:"STOP_MONITORING"}`, removes the host on success, and displays `重试停止` on failure. Call the lifecycle function from `applyState()` and remove the host after successful clicking.

- [ ] **Step 4: Run tests**

Run: `npm test && node --check content.js`
Expected: all tests pass and syntax check exits zero.

- [ ] **Step 5: Commit**

```bash
git add content.js tests/manifest.test.js
git commit -m "Add persistent in-page stop control"
```

### Task 2: Popup action alignment and documentation

**Files:**
- Modify: `popup.css`
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

Set equal grid columns, `align-items:stretch`, full-width buttons, consistent height, and `white-space:nowrap`. Document that the page control returns after reload and can stop monitoring without reopening the popup.

- [ ] **Step 4: Run full verification**

Run: `npm test && node --check background.js && node --check content.js && node --check popup.js && git diff --check`
Expected: all tests pass and all checks exit zero.

- [ ] **Step 5: Validate in Chrome and commit**

Reload the unpacked extension, start monitoring, confirm the floating control reappears after refresh, stop from the page, and inspect popup button alignment. Then commit:

```bash
git add popup.css README.md tests/manifest.test.js
git commit -m "Align popup actions and document page stop"
```

