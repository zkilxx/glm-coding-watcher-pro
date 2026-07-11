import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  createRunState,
  claimSingleClick,
  appendBoundedLog
} from "../src/state.js";

test("settings use safe defaults", () => {
  assert.deepEqual(DEFAULT_SETTINGS, {
    mode: "balanced",
    scanMs: 200,
    autoRefresh: false,
    refreshSeconds: 3,
    soundEnabled: true,
    notificationsEnabled: true
  });
});

test("settings normalize unsafe intervals and booleans", () => {
  assert.deepEqual(normalizeSettings({ mode: "custom", scanMs: 10, autoRefresh: true, refreshSeconds: 0 }), {
    mode: "custom",
    scanMs: 100,
    autoRefresh: true,
    refreshSeconds: 1,
    soundEnabled: true,
    notificationsEnabled: true
  });
});

test("new run is scoped to a tab and starts unclaimed", () => {
  const state = createRunState(42, 12345);
  assert.equal(state.tabId, 42);
  assert.equal(state.runId, "42-12345");
  assert.equal(state.active, true);
  assert.equal(state.clickClaimed, false);
});

test("single click claim succeeds exactly once", () => {
  const initial = createRunState(42, 12345);
  const first = claimSingleClick(initial);
  const second = claimSingleClick(first.state);
  assert.equal(first.claimed, true);
  assert.equal(first.state.clickClaimed, true);
  assert.equal(second.claimed, false);
});

test("logs retain only the newest entries", () => {
  let logs = [];
  for (let index = 0; index < 205; index += 1) logs = appendBoundedLog(logs, { index }, 200);
  assert.equal(logs.length, 200);
  assert.equal(logs[0].index, 5);
  assert.equal(logs.at(-1).index, 204);
});
