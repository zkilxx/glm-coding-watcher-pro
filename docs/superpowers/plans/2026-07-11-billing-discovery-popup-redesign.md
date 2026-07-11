# Billing Discovery and Popup Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover monthly, quarterly, and annual subscription variants automatically and rebuild the popup to match the accepted visual concept.

**Architecture:** Pure helpers normalize billing periods and exact plan identities. The content script sequentially switches visible period controls, waits for page state changes, extracts up to nine variants, then restores the original period. The popup renders the accepted open-list design with filters, progress, partial errors, queue controls, settings, actions, and activity.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/HTML/CSS, Node.js test runner, Chrome browser QA.

## Global Constraints

- Scan `连续包月`, `连续包季`, and `连续包年`; restore the original selection.
- Wait at most 2 seconds per period and return partial results plus errors.
- Discovery never clicks a subscription button.
- Exact target identity is `{name, billingPeriod, price}`; no cross-period substitution.
- Preserve single-tab, single-click, timing, privacy, and manual-payment boundaries.
- Match `docs/design/subscription-popup-concept.png`; use real RMB page prices only.

---

### Task 1: Billing-period identity

**Files:** Modify `src/plans.js`, `tests/plans.test.js`, `src/state.js`, and `tests/state.test.js`.

- [ ] Write failing tests for period normalization, exact cross-period identity, nine-variant deduplication, queue persistence, and legacy target migration.
- [ ] Run affected tests and verify expected failures.
- [ ] Implement `normalizeBillingPeriod`, period-aware fingerprints/matching, `dedupePlanVariants`, and safe state normalization.
- [ ] Run tests and commit `Add billing-period plan identity`.

### Task 2: Sequential page discovery

**Files:** Modify `content.js`, `background.js`, and `tests/manifest.test.js`.

- [ ] Add failing contracts for all three period labels, sequential switching, selected-period restoration, 2-second timeout, progress/errors, and no subscription click during discovery.
- [ ] Run tests and verify failures.
- [ ] Implement asynchronous `DISCOVER_PLANS` scanning with mutation/change waiting and partial results.
- [ ] Verify all tests and syntax; commit `Discover all billing periods`.

### Task 3: Popup redesign

**Files:** Replace `popup.html`, `popup.css`, and `popup.js`; update `README.md` and `tests/manifest.test.js`.

- [ ] Add failing UI contracts for header/status, segmented timing, period filters, table rows, priority queue, progress/errors, settings, actions, activity, logs, and safety notice.
- [ ] Run tests and verify failures.
- [ ] Implement design tokens and full popup matching the accepted concept, with true white surfaces, navy text, cobalt accent, open rows, responsive 420px width, accessible states, and vertical scrolling.
- [ ] Update README and run all tests/syntax checks; commit `Redesign billing-aware popup`.

### Task 4: Browser and visual QA

- [ ] Reload the unpacked extension and GLM Coding page.
- [ ] Verify all three periods and up to nine variants, filtering, multi-select, priority moves, settings, start/stop, persistence, and partial-error rendering without clicking purchase.
- [ ] Capture the popup screenshot at its native size; use `view_image` on both concept and implementation.
- [ ] Write a five-point fidelity ledger, fix every material mismatch, rerun tests, and commit any corrections.

### Task 5: Publish

- [ ] Run full verification, syntax, diff, secret scan, and status checks.
- [ ] Push to remote `main` without force.
- [ ] Verify remote commit equality, public metadata, and ZIP availability.
- [ ] Report links, test count, functional QA, visual comparison, and any unavoidable deviation.
