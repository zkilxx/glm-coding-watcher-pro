# Capacity Text Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve normal priority checking and auto-clicking when “购买人数过多” is visible, while refreshing immediately if plan cards are unavailable or no target can be purchased.

**Architecture:** The content script reads the phrase from `document.body`, removes modal-specific dismissal, and uses the phrase only to choose between waiting for ordinary page loading and immediate refresh.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript, Node test runner.

### Task 1: Add regression tests

- [ ] Assert body-text detection and absence of modal dismissal selectors.
- [ ] Assert capacity text plus unready plans invokes `reloadImmediately()`.
- [ ] Assert the capacity check does not return before the priority loop.
- [ ] Run the focused test and confirm failure.

### Task 2: Implement and verify

- [ ] Replace dialog dismissal with `capacityVisible()` body-text detection.
- [ ] Refresh on unready plans only when capacity text is present; otherwise wait.
- [ ] Leave the existing priority loop and click claim unchanged.
- [ ] Run full tests, syntax checks, Chrome flow verification, commit, and publish.

