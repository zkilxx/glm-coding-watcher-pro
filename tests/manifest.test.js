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
  assert.deepEqual([...manifest.permissions].sort(), ["alarms", "notifications", "storage", "tabs"]);
});

test("manifest references local runtime files", async () => {
  for (const file of ["background.js", "content.js", "popup.html", "popup.css", "popup.js"]) {
    await access(file);
  }
});
