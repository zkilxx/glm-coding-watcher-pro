# Refresh-First Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make page reload mandatory whenever an active cycle finds no eligible selected target.

**Architecture:** The content script schedules refresh from active run state and interval settings only, ignoring legacy `autoRefresh`. The popup removes the toggle and presents refresh interval as a required monitoring setting. Existing backoff, priority cycling, cancellation, and single-click protection remain intact.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, Node.js tests, Chrome实机 QA.

## Global Constraints

- Active + no eligible target always schedules full-page reload.
- Minimum refresh interval is one second.
- DOM events never cancel a scheduled reload unless stop/click/success occurs.
- Stop, click, and success clear refresh and cycle state.
- Remove the optional auto-refresh UI; ignore legacy stored values.

---

### Task 1: Mandatory refresh runtime

- Modify `content.js` and `tests/manifest.test.js`.
- [ ] Add failing contracts proving scheduling does not read `settings.autoRefresh`, all-unavailable calls `scheduleRefresh`, and reload remains guarded by active/unclaimed state.
- [ ] Implement mandatory scheduling and status `等待刷新`.
- [ ] Run tests/syntax and commit `Make monitoring refresh mandatory`.

### Task 2: Remove optional refresh UI

- Modify `popup.html`, `popup.js`, `popup.css`, `src/state.js`, `README.md`, and tests.
- [ ] Add failing UI/docs contracts for `页面刷新间隔` and absence of the auto-refresh control.
- [ ] Remove toggle and legacy form dependence; normalize active refresh behavior.
- [ ] Run all tests/syntax and commit `Remove optional refresh toggle`.

### Task 3: 实机 QA and publish

- [ ] Reload the extension with legacy auto-refresh off.
- [ ] Start monitoring sold-out targets and confirm countdown, full page reload, priority restart, and stop cancellation.
- [ ] Run full verification, push to `main`, and verify remote equality and ZIP availability.
