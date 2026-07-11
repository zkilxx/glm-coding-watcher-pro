import { normalizeTimingSettings } from "./rules.js";

export const DEFAULT_SETTINGS = Object.freeze({
  mode: "balanced",
  scanMs: 200,
  autoRefresh: false,
  refreshSeconds: 3,
  soundEnabled: true,
  notificationsEnabled: true
  ,planPriority: []
});

export function normalizeSettings(input = {}) {
  const timing = normalizeTimingSettings(input);
  return {
    ...timing,
    autoRefresh: input.autoRefresh === true,
    soundEnabled: input.soundEnabled !== false,
    notificationsEnabled: input.notificationsEnabled !== false
    ,planPriority: Array.isArray(input.planPriority) ? input.planPriority.slice(0,20).map(({fingerprint,name,price,billingPeriod})=>({fingerprint:String(fingerprint??""),name:String(name??"").slice(0,120),price:String(price??"").slice(0,80),billingPeriod:String(billingPeriod??"")})) : []
  };
}

export function createRunState(tabId, now = Date.now()) {
  return {
    tabId,
    runId: `${tabId}-${now}`,
    active: true,
    clickClaimed: false,
    mode: "balanced",
    startedAt: now,
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
