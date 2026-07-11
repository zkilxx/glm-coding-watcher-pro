# Priority-Cycle Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent live polling from overwriting plan selections and actively inspect selected targets across billing periods in strict priority order.

**Architecture:** Popup rendering separates stable editable state from volatile runtime state. Pure cycle helpers build a period-aware target sequence. The content script runs one cancellable asynchronous cycle, switches periods only when needed, checks every target, and refreshes only after all selected targets are unavailable.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, Node.js test runner, Chrome实机 QA.

## Global Constraints

- Live polling never redraws plans, priority rows, filters, or settings.
- Exact target identity remains `{name, billingPeriod, price}`.
- Unavailable targets are valid and do not block start.
- Strict priority order across periods; no duplicate switch for consecutive same-period targets.
- Only one monitoring cycle; stop/click/success cancels cycle and timers.
- Preserve all platform-control and manual-payment boundaries.

---

### Task 1: Cycle planning helpers

- Modify `src/plans.js`; create/update `tests/plans.test.js`.
- [ ] Add failing tests for strict target order, period-switch deduplication, missing/unavailable continuation, and first eligible selection.
- [ ] Run tests, implement minimal helpers, rerun, and commit `Add priority cycle planning`.

### Task 2: Popup state ownership

- Modify `popup.js` and `tests/manifest.test.js`.
- [ ] Add failing contracts proving the 500ms poll calls a volatile-only renderer and never `renderPlans`.
- [ ] Split full initial render from `renderRuntime`; make checkbox updates optimistic and reconcile saved data.
- [ ] Run tests/syntax and commit `Keep priority editing stable`.

### Task 3: Cross-period monitoring runtime

- Modify `content.js`, `background.js`, and `tests/manifest.test.js`.
- [ ] Add failing contracts for one cycle lock, ordered target iteration, period switching, 2-second waits, all-unavailable refresh, and cancellation.
- [ ] Implement the cancellable cycle and explicit target/period status updates.
- [ ] Run all tests/syntax and commit `Monitor targets across billing periods`.

### Task 4: 实机 QA and publish

- [ ] Reload the workspace extension; select targets spanning month/quarter/year.
- [ ] Verify queue changes immediately and remains stable while status/counts update.
- [ ] Start with all targets sold out; confirm period cycling, continued refresh, stop cancellation, and no purchase click.
- [ ] Run full verification, push to `main`, and verify remote equality and ZIP availability.
