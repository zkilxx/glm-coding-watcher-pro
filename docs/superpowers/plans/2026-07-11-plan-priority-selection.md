# Dynamic Plan Priority Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically discover visible subscription plans, persist a user-ordered multi-plan queue, and click the highest-priority eligible target once.

**Architecture:** Pure plan identity and prioritization helpers live in `src/plans.js`. The content script extracts bounded visible card summaries and selects only exact queued targets. The popup edits the ordered queue; the service worker persists it and includes the chosen plan in state, logs, and notifications.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, Node.js built-in test runner.

## Global Constraints

- Discover at most 20 visible plans; names at most 120 characters; prices at most 80 characters.
- Match exact normalized name and price only; never fuzzy-match or silently substitute a plan.
- Multiple selections are allowed; queue order is purchase priority.
- Click only the highest-priority eligible selected plan and stop refresh first.
- Monitoring cannot start without at least one selected target.
- Preserve all existing timing, duplicate-click, single-tab, privacy, and platform-control boundaries.

---

### Task 1: Plan identity and priority rules

**Files:** Create `src/plans.js`, create `tests/plans.test.js`.

- [ ] Write failing tests for normalization, bounded summaries, stable fingerprints, duplicate-name differentiation, exact target matching, missing targets, queue moves, and highest-priority eligible selection.
- [ ] Run `node --test tests/plans.test.js`; expect missing-module failure.
- [ ] Implement `normalizePlan`, `fingerprintPlan`, `matchTarget`, `movePriority`, and `chooseEligibleTarget`.
- [ ] Re-run the test; expect all plan-rule tests to pass.
- [ ] Commit with message `Add prioritized plan rules`.

### Task 2: Runtime discovery and chosen-plan state

**Files:** Modify `src/state.js`, `background.js`, `content.js`, `tests/state.test.js`, and `tests/manifest.test.js`.

- [ ] Add failing tests/contracts for persisted `planPriority`, `DISCOVER_PLANS`, exact card association, highest-priority click, no-target start rejection, `selectedPlan`, and refresh clearing before the chosen button click.
- [ ] Run affected tests; expect new assertions to fail.
- [ ] Implement bounded visible-card discovery, messages, exact target matching, prioritized button choice, start validation, and selected-plan logs/notification.
- [ ] Run all tests and syntax checks; expect zero failures.
- [ ] Commit with message `Add dynamic plan discovery`.

### Task 3: Multi-select priority UI and documentation

**Files:** Modify `popup.html`, `popup.css`, `popup.js`, `README.md`, and `tests/manifest.test.js`.

- [ ] Add failing UI/documentation contracts for refresh list, checkboxes, availability, move up/down, removal, priority labels, and no-selection warning.
- [ ] Run manifest tests; expect missing-copy failures.
- [ ] Implement the discovered-plan list and ordered selection queue with accessible controls and persisted updates.
- [ ] Update README with exact matching, fallback behavior, and usage instructions.
- [ ] Run all tests and syntax checks; expect zero failures.
- [ ] Commit with message `Expose plan priority queue`.

### Task 4: Verify and publish

- [ ] Run full tests, syntax checks, `git diff --check`, secret scan, and status inspection.
- [ ] Push commits to remote `main` without force.
- [ ] Verify remote commit equality, public metadata, and zipball availability.
- [ ] Report repository and Download ZIP links with test count and feature summary.
