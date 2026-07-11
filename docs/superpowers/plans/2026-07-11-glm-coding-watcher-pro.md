# GLM Coding Watcher Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, validate, document, and publish a dependency-free Chrome Manifest V3 extension that safely monitors the GLM Coding purchase page.

**Architecture:** Pure JavaScript modules keep page matching rules independently testable, while a content script handles visible DOM interactions and a service worker owns persistent state, refresh alarms, notifications, and the atomic click claim. A popup controls settings and exposes bounded logs. No build step or remote service is used.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, Node.js built-in test runner, Git, GitHub.

## Global Constraints

- Repository name: `glm-coding-watcher-pro`; visibility: public; default branch: `main`.
- Detection interval minimum: 3 seconds; refresh interval minimum: 30 seconds; refresh disabled by default.
- One purchase-button click per explicitly started monitoring run.
- Never bypass or automate CAPTCHA, authentication, queues, rate limits, risk controls, payment, or payment confirmation.
- Never call private or undocumented purchase APIs, forge requests, hide automation, or transmit browsing data.
- Use no runtime dependencies, analytics, telemetry, or build step.

---

### Task 1: Pure monitoring rules

**Files:**
- Create: `src/rules.js`
- Create: `tests/rules.test.js`
- Create: `package.json`

**Interfaces:**
- Produces: `clampDetectionSeconds(value): number`, `clampRefreshSeconds(value): number`, `isCapacityMessage(text): boolean`, `isPurchaseLabel(text): boolean`, and `isEligibleButton(snapshot): boolean`.

- [ ] **Step 1: Write failing rule tests** covering 3-second and 30-second clamps, exact capacity phrase matching, accepted purchase labels, and rejection of hidden/disabled/busy buttons using `node:test` and `node:assert/strict`.
- [ ] **Step 2: Verify RED** with `node --test tests/rules.test.js`; expect module-not-found failure for `src/rules.js`.
- [ ] **Step 3: Implement minimal exported pure functions** in `src/rules.js`; normalize text whitespace and require purchase-oriented labels such as “立即购买”, “购买”, or “订阅”.
- [ ] **Step 4: Verify GREEN** with `node --test tests/rules.test.js`; expect all rule tests to pass.
- [ ] **Step 5: Commit** `package.json`, `src/rules.js`, and `tests/rules.test.js` with message `Add tested monitoring rules`.

### Task 2: Persistent state and duplicate-click guard

**Files:**
- Create: `src/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Consumes: safe interval values returned by `src/rules.js`.
- Produces: `DEFAULT_SETTINGS`, `normalizeSettings(input): object`, `createRunState(tabId, now): object`, `claimSingleClick(state): {claimed:boolean,state:object}`, and `appendBoundedLog(logs, entry, limit): object[]`.

- [ ] **Step 1: Write failing state tests** for safe defaults, interval normalization, explicit new-run IDs, first-claim success, second-claim rejection, and a 200-entry log bound.
- [ ] **Step 2: Verify RED** with `node --test tests/state.test.js`; expect module-not-found failure for `src/state.js`.
- [ ] **Step 3: Implement minimal immutable state helpers** with `autoRefresh: false`, `soundEnabled: true`, and `notificationsEnabled: true` defaults.
- [ ] **Step 4: Verify GREEN** with `node --test tests/state.test.js`; expect all state tests to pass.
- [ ] **Step 5: Commit** both files with message `Add guarded monitoring state`.

### Task 3: Chrome extension runtime

**Files:**
- Create: `manifest.json`
- Create: `background.js`
- Create: `content.js`
- Create: `popup.html`
- Create: `popup.css`
- Create: `popup.js`
- Create: `icons/icon16.png`
- Create: `icons/icon32.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`
- Create: `tests/manifest.test.js`

**Interfaces:**
- Background messages: `GET_STATE`, `START_MONITORING`, `STOP_MONITORING`, `UPDATE_SETTINGS`, `CLAIM_CLICK`, `ADD_LOG`, and `CLICK_COMPLETED`.
- Content events: inspect visible button-like nodes, dismiss matching capacity dialog, request atomic click claim, click once, then notify completion.
- Popup: read/update settings, start/stop monitoring for the active BigModel tab, render state and logs.

- [ ] **Step 1: Write failing manifest tests** asserting Manifest V3, narrow `https://bigmodel.cn/glm-coding*` content-script match, required permissions only, local popup, service worker, and packaged icons.
- [ ] **Step 2: Verify RED** with `node --test tests/manifest.test.js`; expect missing-manifest failure.
- [ ] **Step 3: Create Manifest V3 and focused runtime files** using the tested pure rules/state logic adapted for browser loading; use `chrome.storage.local` and `chrome.alarms`, stop after `CLICK_COMPLETED`, and never interact with CAPTCHA/login/payment controls.
- [ ] **Step 4: Add conservative page handling** that checks visibility and disabled/busy state, closes only matching capacity dialogs with an obvious close/cancel control, and leaves all verification/payment steps untouched.
- [ ] **Step 5: Verify GREEN and syntax** with `node --test tests/*.test.js` plus `node --check background.js`, `node --check content.js`, and `node --check popup.js`; expect zero failures.
- [ ] **Step 6: Commit** runtime, UI, icons, and tests with message `Build Manifest V3 monitoring extension`.

### Task 4: Documentation and repository hygiene

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `SECURITY.md`
- Modify: `package.json`

**Interfaces:**
- README documents unpacked installation, settings, safe operating boundaries, permissions, troubleshooting, and GitHub Download ZIP installation.

- [ ] **Step 1: Add a documentation validation test** to `tests/manifest.test.js` that fails while README, LICENSE, SECURITY, or `.gitignore` is absent and checks README safety phrases.
- [ ] **Step 2: Verify RED** with `node --test tests/manifest.test.js`; expect missing-document failures.
- [ ] **Step 3: Write complete Chinese documentation**, MIT license text for 2026, security policy, ignore rules, and `npm test` script.
- [ ] **Step 4: Verify GREEN** with `npm test`; expect all tests to pass.
- [ ] **Step 5: Commit** the documentation files with message `Document installation and safety boundaries`.

### Task 5: Release validation and public GitHub publication

**Files:**
- Inspect: all tracked files
- Modify only if validation reveals an in-scope defect.

**Interfaces:**
- Produces a public `main` branch and two URLs: repository and `archive/refs/heads/main.zip`.

- [ ] **Step 1: Run complete validation**: `npm test`, JavaScript syntax checks, `git diff --check`, secret-pattern scan, and `git status -sb`; expect zero failures and no unintended files.
- [ ] **Step 2: Confirm publication capability** using authenticated GitHub tooling or the signed-in GitHub web UI; do not expose tokens in output.
- [ ] **Step 3: Create public repository** named `glm-coding-watcher-pro` without generated starter files, add it as `origin`, and push local `main`.
- [ ] **Step 4: Verify remote state** by reading the public repository metadata and checking that the archive URL returns successfully.
- [ ] **Step 5: Report** the exact repository and Download ZIP links, plus the test count and safety boundary summary.
