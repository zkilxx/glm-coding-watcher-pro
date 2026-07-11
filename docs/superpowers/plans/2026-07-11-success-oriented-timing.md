# Success-Oriented Timing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed low-frequency polling with event-driven detection, three timing modes, adaptive refresh backoff, and reliable stop-after-click behavior.

**Architecture:** Pure timing and success-classification helpers remain independently testable in `src/`. The content script owns sub-30-second DOM scans and refresh timers, while the service worker retains persistent state, the atomic click claim, notifications, and the single-active-tab invariant. The popup exposes presets, effective timing, countdowns, warnings, and run status.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, MutationObserver, Node.js built-in test runner.

## Global Constraints

- DOM detection minimum: 100 ms; refresh minimum: 1 second.
- Sprint mode maximum: 5 minutes, then return to Balanced.
- Automatic refresh remains off by default.
- At most one monitored tab and one click claim may be active.
- Stop all refreshes immediately after a successful click claim and ordinary click.
- Never bypass CAPTCHA, authentication, queues, rate limits, risk controls, payment, payment confirmation, Chrome throttling, or private APIs.

---

### Task 1: Timing modes and adaptive backoff

**Files:**
- Modify: `src/rules.js`
- Modify: `src/state.js`
- Modify: `tests/rules.test.js`
- Modify: `tests/state.test.js`

**Interfaces:**
- Produce: `TIMING_MODES`, `normalizeTimingSettings(input)`, `nextBackoffSeconds(reason, attempt, base, random)`, `isSprintExpired(run, now)`, and `classifySuccessSignal(input)`.

- [ ] Write failing tests for 100 ms scan and 1 second refresh minimums, Stable/Balanced/Sprint presets, ±10 percent jitter, capacity sequence `1,1,2,3,5,8`, risk sequence `30,60,120`, five-minute Sprint expiry, and URL/text success signals.
- [ ] Run `node --test tests/rules.test.js tests/state.test.js`; expect assertion/import failures for the new interfaces.
- [ ] Implement the minimal pure functions and update defaults to Balanced with refresh disabled.
- [ ] Re-run the two test files; expect all tests to pass.
- [ ] Commit with message `Add adaptive timing modes`.

### Task 2: Event-driven runtime and stop semantics

**Files:**
- Modify: `background.js`
- Modify: `content.js`
- Modify: `tests/manifest.test.js`

**Interfaces:**
- Background adds single-active-tab enforcement, `CLICK_COMPLETED` immediate stop state, and `RUNTIME_STATUS` updates.
- Content uses one `MutationObserver`, one fallback scan timer, one refresh timeout, and one Sprint-expiry timeout; `clearRuntimeTimers()` cancels all four.

- [ ] Add failing static/runtime-contract tests asserting `MutationObserver`, `clearRuntimeTimers`, success confirmation, and removal of sub-30-second `chrome.alarms` refresh scheduling.
- [ ] Run `node --test tests/manifest.test.js`; expect new contract assertions to fail.
- [ ] Refactor content runtime to debounce mutations, scan at the active mode interval, compute state-dependent refresh delays, stop refresh before clicking, observe success without a second click, and expire Sprint into Balanced.
- [ ] Refactor background state so starting one tab stops the previous tab, click completion disables refresh immediately, and runtime status/countdowns persist for the popup.
- [ ] Run all tests plus `node --check background.js content.js popup.js`; expect zero failures.
- [ ] Commit with message `Add event-driven purchase monitoring`.

### Task 3: Preset UI and user guidance

**Files:**
- Modify: `popup.html`
- Modify: `popup.css`
- Modify: `popup.js`
- Modify: `README.md`
- Modify: `tests/manifest.test.js`

**Interfaces:**
- Popup presets: `stable`, `balanced`, `sprint`, `custom`; inputs use milliseconds for detection and seconds for refresh.
- Runtime display: next refresh, backoff reason, Sprint remaining, and foreground/high-frequency warning.

- [ ] Add failing documentation/UI contract tests for three preset labels, 100 ms, 1 second, five-minute limit, and click-stops-refresh copy.
- [ ] Run `node --test tests/manifest.test.js`; expect missing-copy failures.
- [ ] Implement preset controls, effective timing display, warning states, runtime countdowns, and updated Chinese README instructions.
- [ ] Run `npm test` and all JavaScript syntax checks; expect zero failures.
- [ ] Commit with message `Document and expose timing presets`.

### Task 4: Release verification and publication

**Files:**
- Inspect all tracked files; modify only to fix verified in-scope defects.

- [ ] Run `npm test`, syntax checks, `git diff --check`, secret-pattern scan, and `git status -sb`.
- [ ] Push the feature branch commits to remote `main` without force.
- [ ] Verify public repository metadata, remote commit equality, and GitHub zipball availability.
- [ ] Report repository and Download ZIP links with test count and timing/safety summary.
