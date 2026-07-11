import { DEFAULT_SETTINGS, normalizeSettings, createRunState, claimSingleClick, appendBoundedLog } from "./src/state.js";

const STORAGE = { settings: "settings", runs: "runs", logs: "logs" };
const alarmName = (tabId) => `refresh:${tabId}`;
const nowText = () => new Date().toLocaleString("zh-CN", { hour12: false });

async function readStore() {
  const data = await chrome.storage.local.get([STORAGE.settings, STORAGE.runs, STORAGE.logs]);
  return {
    settings: normalizeSettings(data.settings ?? DEFAULT_SETTINGS),
    runs: data.runs ?? {},
    logs: data.logs ?? []
  };
}

async function log(message, level = "info") {
  const { logs } = await readStore();
  await chrome.storage.local.set({ logs: appendBoundedLog(logs, { at: nowText(), level, message }, 200) });
}

async function saveRun(run) {
  const { runs } = await readStore();
  await chrome.storage.local.set({ runs: { ...runs, [run.tabId]: run } });
}

async function configureRefresh(tabId, settings, active) {
  await chrome.alarms.clear(alarmName(tabId));
  if (active && settings.autoRefresh) {
    chrome.alarms.create(alarmName(tabId), { periodInMinutes: settings.refreshSeconds / 60 });
  }
}

async function alertUser(settings) {
  if (settings.notificationsEnabled) {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      title: "GLM Coding 按钮已点击一次",
      message: "请返回页面，手动完成验证和支付。"
    });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await readStore();
  await chrome.storage.local.set({ settings });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const store = await readStore();
    const tabId = Number(message.tabId ?? sender.tab?.id);
    if (message.type === "GET_STATE") return { ...store, run: store.runs[tabId] ?? null };
    if (message.type === "UPDATE_SETTINGS") {
      const settings = normalizeSettings(message.settings);
      await chrome.storage.local.set({ settings });
      return { ok: true, settings };
    }
    if (message.type === "START_MONITORING") {
      const run = createRunState(tabId);
      await saveRun(run);
      await configureRefresh(tabId, store.settings, true);
      await log(`标签页 ${tabId} 开始监测`);
      await chrome.tabs.sendMessage(tabId, { type: "MONITORING_STATE", run, settings: store.settings }).catch(() => {});
      return { ok: true, run };
    }
    if (message.type === "STOP_MONITORING") {
      const run = { ...(store.runs[tabId] ?? {}), tabId, active: false, status: "已停止" };
      await saveRun(run);
      await configureRefresh(tabId, store.settings, false);
      await chrome.tabs.sendMessage(tabId, { type: "MONITORING_STATE", run, settings: store.settings }).catch(() => {});
      return { ok: true, run };
    }
    if (message.type === "CLAIM_CLICK") {
      const result = claimSingleClick(store.runs[tabId]);
      if (result.claimed) await saveRun(result.state);
      return { claimed: result.claimed };
    }
    if (message.type === "CHECK_RECORDED") {
      const current = store.runs[tabId];
      if (current?.active) await saveRun({ ...current, checks: (current.checks ?? 0) + 1, lastCheckAt: Date.now(), status: message.status });
      return { ok: true };
    }
    if (message.type === "ADD_LOG") { await log(message.message, message.level); return { ok: true }; }
    if (message.type === "CLICK_COMPLETED") {
      const run = { ...(store.runs[tabId] ?? {}), active: false, clickClaimed: true, status: "已点击一次，请手动完成后续步骤" };
      await saveRun(run);
      await configureRefresh(tabId, store.settings, false);
      await log(`标签页 ${tabId} 已单次点击购买按钮`);
      await alertUser(store.settings);
      return { ok: true };
    }
    return { ok: false, error: "未知消息" };
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("refresh:")) return;
  const tabId = Number(alarm.name.split(":")[1]);
  const { runs } = await readStore();
  if (runs[tabId]?.active && !runs[tabId]?.clickClaimed) await chrome.tabs.reload(tabId);
  else await chrome.alarms.clear(alarm.name);
});
