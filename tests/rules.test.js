import test from "node:test";
import assert from "node:assert/strict";
import {
  clampDetectionSeconds,
  clampRefreshSeconds,
  isCapacityMessage,
  isPurchaseLabel,
  isEligibleButton
} from "../src/rules.js";
import { TIMING_MODES, normalizeTimingSettings, nextBackoffSeconds, isSprintExpired, classifySuccessSignal } from "../src/rules.js";

test("detection interval never drops below three seconds", () => {
  assert.equal(clampDetectionSeconds(1), 3);
  assert.equal(clampDetectionSeconds(8), 8);
  assert.equal(clampDetectionSeconds("bad"), 3);
});

test("refresh interval never drops below thirty seconds", () => {
  assert.equal(clampRefreshSeconds(5), 30);
  assert.equal(clampRefreshSeconds(60), 60);
  assert.equal(clampRefreshSeconds(undefined), 30);
});

test("capacity notice requires the designated phrase", () => {
  assert.equal(isCapacityMessage(" 当前购买人数过多，请稍后重试 "), true);
  assert.equal(isCapacityMessage("欢迎购买"), false);
});

test("purchase labels are conservative", () => {
  assert.equal(isPurchaseLabel("立即购买"), true);
  assert.equal(isPurchaseLabel("购买套餐"), true);
  assert.equal(isPurchaseLabel("立即订阅"), true);
  assert.equal(isPurchaseLabel("确认支付"), false);
  assert.equal(isPurchaseLabel("登录"), false);
});

test("eligible button must be visible, enabled, idle, and purchase-oriented", () => {
  const base = { text: "立即购买", visible: true, disabled: false, busy: false };
  assert.equal(isEligibleButton(base), true);
  assert.equal(isEligibleButton({ ...base, visible: false }), false);
  assert.equal(isEligibleButton({ ...base, disabled: true }), false);
  assert.equal(isEligibleButton({ ...base, busy: true }), false);
  assert.equal(isEligibleButton({ ...base, text: "确认支付" }), false);
});

test("timing modes clamp to 100ms scan and one-second refresh", () => {
  assert.equal(TIMING_MODES.stable.scanMs, 500);
  assert.equal(TIMING_MODES.balanced.scanMs, 200);
  assert.equal(TIMING_MODES.sprint.scanMs, 100);
  assert.deepEqual(normalizeTimingSettings({ mode: "custom", scanMs: 20, refreshSeconds: 0.2 }), { mode: "custom", scanMs: 100, refreshSeconds: 1 });
});

test("capacity and risk backoff sequences are bounded", () => {
  assert.deepEqual([0,1,2,3,4,5,6].map(i => nextBackoffSeconds("capacity", i, 3, () => 0.5)), [1,1,2,3,5,8,8]);
  assert.deepEqual([0,1,2,3].map(i => nextBackoffSeconds("risk", i, 3, () => 0.5)), [30,60,120,120]);
});

test("balanced delay applies bounded jitter while sprint does not", () => {
  assert.equal(nextBackoffSeconds("ordinary", 0, 5, () => 0), 4.5);
  assert.equal(nextBackoffSeconds("ordinary", 0, 5, () => 1), 5.5);
  assert.equal(nextBackoffSeconds("sprint", 0, 1, () => 0), 1);
});

test("sprint expires after five minutes", () => {
  assert.equal(isSprintExpired({ mode: "sprint", startedAt: 1000 }, 301000), true);
  assert.equal(isSprintExpired({ mode: "balanced", startedAt: 1000 }, 999999), false);
});

test("success signals recognize checkout routes and visible order text", () => {
  assert.equal(classifySuccessSignal({ url: "https://bigmodel.cn/order/123", text: "" }), "route");
  assert.equal(classifySuccessSignal({ url: "https://bigmodel.cn/glm-coding", text: "订单创建成功" }), "content");
  assert.equal(classifySuccessSignal({ url: "https://bigmodel.cn/glm-coding", text: "购买人数过多" }), null);
});
