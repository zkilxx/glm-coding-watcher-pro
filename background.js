import { DEFAULT_SETTINGS, normalizeSettings, createRunState, claimSingleClick, recordRefresh, appendBoundedLog } from "./src/state.js";

const STORAGE = { settings: "settings", runs: "runs", logs: "logs" };
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

async function alertUser(settings, selectedPlan) {
  if (settings.notificationsEnabled) {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      title: "GLM Coding 按钮已点击一次",
      message: `${selectedPlan?.name ? `已选择 ${selectedPlan.name}。` : ""}请返回页面，手动完成验证和支付。`
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
      if (!store.settings.planPriority.length) return { ok:false,error:"未选择目标套餐" };
      for (const prior of Object.values(store.runs)) {
        if (prior.active && prior.tabId !== tabId) {
          const stopped = { ...prior, active: false, status: "已由其他标签页接管" };
          await saveRun(stopped);
          await chrome.tabs.sendMessage(prior.tabId, { type: "MONITORING_STATE", run: stopped, settings: store.settings }).catch(() => {});
        }
      }
      const run = { ...createRunState(tabId), mode: store.settings.mode };
      await saveRun(run);
      await log(`标签页 ${tabId} 开始监测`);
      await chrome.tabs.sendMessage(tabId, { type: "MONITORING_STATE", run, settings: store.settings }).catch(() => {});
      return { ok: true, run };
    }
    if (message.type === "STOP_MONITORING") {
      const run = { ...(store.runs[tabId] ?? {}), tabId, active: false, status: "已停止", nextRefreshAt: null, backoffReason: null };
      await saveRun(run);
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
    if (message.type === "REFRESH_RECORDED") {
      const current = store.runs[tabId];
      const next = recordRefresh(current);
      if (next) await saveRun(next);
      return { ok: true, run: next };
    }
    if (message.type === "RUNTIME_STATUS") {
      const current = store.runs[tabId];
      if (current) await saveRun({ ...current, ...message.patch });
      return { ok: true };
    }
    if (message.type === "ADD_LOG") { await log(message.message, message.level); return { ok: true }; }
    if (message.type === "DISCOVER_PLANS") return chrome.tabs.sendMessage(tabId,{type:"DISCOVER_PLANS"});
    if (message.type === "CLICK_COMPLETED") {
      const run = { ...(store.runs[tabId] ?? {}), active: false, clickClaimed: true, selectedPlan:message.selectedPlan??null, status: "已点击一次，请手动完成后续步骤" };
      await saveRun(run);
      await log(`标签页 ${tabId} 已单次点击套餐：${message.selectedPlan?.name??"未知"}`);
      await alertUser(store.settings,message.selectedPlan);
      return { ok: true };
    }
    return { ok: false, error: "未知消息" };
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
