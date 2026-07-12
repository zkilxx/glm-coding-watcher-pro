import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

test("manifest is narrowly scoped Manifest V3", async () => {
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background.service_worker, "background.js");
  assert.equal(manifest.background.type, "module");
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.deepEqual(manifest.host_permissions, ["https://bigmodel.cn/glm-coding*"]);
  assert.deepEqual(manifest.content_scripts[0].matches, ["https://bigmodel.cn/glm-coding*"]);
  assert.deepEqual([...manifest.permissions].sort(), ["notifications", "storage", "tabs"]);
});

test("runtime is mutation-driven and clears refresh before click", async () => {
  const content = await readFile("content.js", "utf8");
  const background = await readFile("background.js", "utf8");
  assert.match(content, /new MutationObserver/);
  assert.match(content, /function clearRuntimeTimers/);
  assert.match(content, /clearRefreshTimer\(\);removeMonitorControl\(\);selected\.button\.click\(\)/);
  assert.match(content, /classifySuccess/);
  assert.doesNotMatch(background, /chrome\.alarms/);
  assert.match(content,/DISCOVER_PLANS/);assert.match(content,/planPriority/);assert.match(background,/未选择目标套餐/);assert.match(background,/selectedPlan/);
  assert.match(content,/特惠订阅/);assert.match(content,/暂时售罄/);assert.match(content,/Lite\|Pro\|Max/);
  for(const label of["连续包月","连续包季","连续包年"])assert.match(content,new RegExp(label));assert.match(content,/2000/);assert.match(content,/restore/);
});

test("manifest references local runtime files", async () => {
  for (const file of ["background.js", "content.js", "popup.html", "popup.css", "popup.js"]) {
    await access(file);
  }
});

test("repository documents installation and safety boundaries", async () => {
  for (const file of ["README.md", "LICENSE", "SECURITY.md", ".gitignore"]) await access(file);
  const readme = await readFile("README.md", "utf8");
  for (const phrase of ["验证码", "登录", "限流", "风控", "支付确认", "Download ZIP"]) assert.match(readme, new RegExp(phrase));
});

test("popup and README explain success-oriented timing", async () => {
  const popup = await readFile("popup.html", "utf8");
  const readme = await readFile("README.md", "utf8");
  for (const phrase of ["稳健", "平衡", "冲刺", "100", "不可购买立即刷新", "5 分钟", "点击后立即停止刷新"]) {
    assert.match(popup + readme, new RegExp(phrase.replace(" ", "\\s*")));
  }
});
test("popup keeps live status without redrawing priority editing",async()=>{const popup=await readFile("popup.js","utf8");const background=await readFile("background.js","utf8");assert.match(popup,/function renderRuntime/);assert.match(popup,/setInterval\(.*refreshRuntime.*500\)/s);assert.match(popup,/监测运行中/);assert.match(background,/nextRefreshAt:\s*null/);});
test("active monitoring always refreshes unavailable pages",async()=>{const content=await readFile("content.js","utf8");const html=await readFile("popup.html","utf8");assert.doesNotMatch(content,/settings\?\.autoRefresh/);assert.doesNotMatch(html,/id="autoRefresh"/);assert.match(html,/不可购买立即刷新/);assert.match(content,/location\.reload\(\)/);});
test("unavailable targets reload immediately without a refresh timer",async()=>{const content=await readFile("content.js","utf8");const html=await readFile("popup.html","utf8");assert.doesNotMatch(content,/refreshTimer\s*=\s*setTimeout/);assert.doesNotMatch(content,/等待页面刷新/);assert.doesNotMatch(html,/id="refresh"/);assert.match(content,/if \(token===cycleToken\) reloadImmediately\(\)/);});
test("monitor waits for rendered plan cards before deciding to reload",async()=>{const content=await readFile("content.js","utf8");assert.match(content,/function plansReady\(\)/);assert.match(content,/periodControls\(\)\.length===periodLabels\.length/);assert.match(content,/discoverPlans\(\)\.length>0/);assert.match(content,/if\(!plansReady\(\)\)\{publish\(\{status:"等待套餐加载"\}\);return;\}/);});
test("persistent page status card survives monitoring reloads",async()=>{const content=await readFile("content.js","utf8");assert.match(content,/function mountMonitorControl\(\)/);assert.match(content,/attachShadow\(\{mode:"open"\}\)/);assert.match(content,/type:"STOP_MONITORING"/);assert.match(content,/停止监测/);assert.match(content,/top:20px/);assert.match(content,/刷新次数/);assert.match(content,/refreshCount/);assert.match(content,/run\?\.active&&!run\.clickClaimed\?mountMonitorControl\(\):removeMonitorControl\(\)/);});
test("reload records a real refresh before navigating",async()=>{const content=await readFile("content.js","utf8");const background=await readFile("background.js","utf8");assert.match(content,/await chrome\.runtime\.sendMessage\(\{type:"REFRESH_RECORDED"\}\);\s*location\.reload\(\)/);assert.match(background,/message\.type === "REFRESH_RECORDED"/);});
test("popup monitoring settings form clear vertical groups",async()=>{const css=(await readFile("popup-actions.css","utf8")).replace(/\s+/g,"");const html=await readFile("popup.html","utf8");const readme=await readFile("README.md","utf8");assert.match(html,/popup-actions\.css/);assert.match(html,/settings-field/);assert.match(html,/settings-switches/);assert.match(css,/\.actions\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);assert.match(css,/\.actionsbutton\{[^}]*width:100%/);assert.match(readme,/网页右上角/);});
test("README embeds every feature screenshot",async()=>{const readme=await readFile("README.md","utf8");for(const name of["popup-overview","plan-priority","monitor-settings","page-status-card"]){const path=`docs/images/${name}.png`;await access(path);assert.match(readme,new RegExp(path.replace("/","\\/")));}assert.match(readme,/## 功能截图/);});
