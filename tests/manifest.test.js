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
  assert.match(content, /clearRefreshTimer\(\);\s*button\.click\(\)/);
  assert.match(content, /classifySuccess/);
  assert.doesNotMatch(background, /chrome\.alarms/);
  assert.match(content,/DISCOVER_PLANS/);assert.match(content,/planPriority/);assert.match(background,/未选择目标套餐/);assert.match(background,/selectedPlan/);
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
  for (const phrase of ["稳健", "平衡", "冲刺", "100", "1 秒", "5 分钟", "点击后立即停止刷新"]) {
    assert.match(popup + readme, new RegExp(phrase.replace(" ", "\\s*")));
  }
});
