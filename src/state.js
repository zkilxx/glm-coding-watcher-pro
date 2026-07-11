import { clampDetectionSeconds, clampRefreshSeconds } from "./rules.js";

export const DEFAULT_SETTINGS = Object.freeze({
  detectionSeconds: 5,
  autoRefresh: false,
  refreshSeconds: 60,
  soundEnabled: true,
  notificationsEnabled: true
});

export function normalizeSettings(input = {}) {
  return {
    detectionSeconds: clampDetectionSeconds(input.detectionSeconds ?? DEFAULT_SETTINGS.detectionSeconds),
    autoRefresh: input.autoRefresh === true,
    refreshSeconds: clampRefreshSeconds(input.refreshSeconds ?? DEFAULT_SETTINGS.refreshSeconds),
    soundEnabled: input.soundEnabled !== false,
    notificationsEnabled: input.notificationsEnabled !== false
  };
}

export function createRunState(tabId, now = Date.now()) {
  return {
    tabId,
    runId: `${tabId}-${now}`,
    active: true,
    clickClaimed: false,
    checks: 0,
    lastCheckAt: null,
    status: "监测中"
  };
}

export function claimSingleClick(state) {
  if (!state?.active || state.clickClaimed) return { claimed: false, state };
  return { claimed: true, state: { ...state, clickClaimed: true } };
}

export function appendBoundedLog(logs, entry, limit = 200) {
  return [...(Array.isArray(logs) ? logs : []), entry].slice(-Math.max(1, limit));
}
