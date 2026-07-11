const $ = (id) => document.getElementById(id);
let tabId = null;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.startsWith("https://bigmodel.cn/glm-coding")) throw new Error("请先打开 GLM Coding 页面");
  return tab;
}

function formSettings() {
  return { detectionSeconds: Number($("detection").value), autoRefresh: $("autoRefresh").checked, refreshSeconds: Number($("refresh").value), soundEnabled: $("sound").checked, notificationsEnabled: $("notifications").checked };
}

function render(data) {
  const { settings, run, logs } = data;
  $("detection").value = settings.detectionSeconds; $("autoRefresh").checked = settings.autoRefresh;
  $("refresh").value = settings.refreshSeconds; $("refresh").disabled = !settings.autoRefresh;
  $("sound").checked = settings.soundEnabled; $("notifications").checked = settings.notificationsEnabled;
  $("status").textContent = run?.status ?? "未开始"; $("dot").classList.toggle("active", Boolean(run?.active));
  $("checks").textContent = run?.checks ?? 0; $("last").textContent = run?.lastCheckAt ? new Date(run.lastCheckAt).toLocaleTimeString("zh-CN", { hour12: false }) : "—";
  $("logs").replaceChildren(...(logs ?? []).slice(-30).reverse().map((entry) => { const row = document.createElement("div"); row.textContent = `${entry.at} ${entry.message}`; return row; }));
}

async function save() { const result = await chrome.runtime.sendMessage({ type: "UPDATE_SETTINGS", settings: formSettings() }); return result.settings; }
async function refresh() { const data = await chrome.runtime.sendMessage({ type: "GET_STATE", tabId }); render(data); }

document.addEventListener("DOMContentLoaded", async () => {
  try { tabId = (await activeTab()).id; await refresh(); }
  catch (error) { $("status").textContent = error.message; $("start").disabled = true; }
});
$("autoRefresh").addEventListener("change", () => { $("refresh").disabled = !$("autoRefresh").checked; });
$("start").addEventListener("click", async () => { await save(); await chrome.runtime.sendMessage({ type: "START_MONITORING", tabId }); await refresh(); });
$("stop").addEventListener("click", async () => { await chrome.runtime.sendMessage({ type: "STOP_MONITORING", tabId }); await refresh(); });
for (const id of ["detection", "refresh", "sound", "notifications"]) $(id).addEventListener("change", save);
