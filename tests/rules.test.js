import test from "node:test";
import assert from "node:assert/strict";
import {
  clampDetectionSeconds,
  clampRefreshSeconds,
  isCapacityMessage,
  isPurchaseLabel,
  isEligibleButton
} from "../src/rules.js";

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
