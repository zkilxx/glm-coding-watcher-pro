const CAPACITY_PHRASE = "购买人数过多";
const PURCHASE_LABELS = [/^立即购买$/, /^购买(?:套餐|方案|计划)?$/, /^立即订阅$/, /^订阅(?:套餐|方案|计划)?$/, /^特惠订阅$/];

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, "").trim();
}

function clampSeconds(value, minimum) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.floor(parsed)) : minimum;
}

export function clampDetectionSeconds(value) {
  return clampSeconds(value, 3);
}

export function clampRefreshSeconds(value) {
  return clampSeconds(value, 30);
}

export function isCapacityMessage(text) {
  return normalizeText(text).includes(CAPACITY_PHRASE);
}

export function isPurchaseLabel(text) {
  const normalized = normalizeText(text);
  return PURCHASE_LABELS.some((pattern) => pattern.test(normalized));
}

export function isEligibleButton(snapshot) {
  return Boolean(
    snapshot?.visible &&
    !snapshot?.disabled &&
    !snapshot?.busy &&
    isPurchaseLabel(snapshot?.text)
  );
}

export const TIMING_MODES = Object.freeze({
  stable: Object.freeze({ scanMs: 500, refreshSeconds: 10 }),
  balanced: Object.freeze({ scanMs: 200, refreshSeconds: 3 }),
  sprint: Object.freeze({ scanMs: 100, refreshSeconds: 1 })
});

export function normalizeTimingSettings(input = {}) {
  const mode = ["stable", "balanced", "sprint", "custom"].includes(input.mode) ? input.mode : "balanced";
  const preset = TIMING_MODES[mode] ?? input;
  const scanMs = Math.max(100, Number.isFinite(Number(input.scanMs ?? preset.scanMs)) ? Number(input.scanMs ?? preset.scanMs) : 200);
  const refreshSeconds = Math.max(1, Number.isFinite(Number(input.refreshSeconds ?? preset.refreshSeconds)) ? Number(input.refreshSeconds ?? preset.refreshSeconds) : 3);
  return { mode, scanMs, refreshSeconds };
}

export function nextBackoffSeconds(reason, attempt = 0, base = 3, random = Math.random) {
  if (reason === "capacity") return [1, 1, 2, 3, 5, 8][Math.min(attempt, 5)];
  if (reason === "risk") return [30, 60, 120][Math.min(attempt, 2)];
  if (reason === "sprint") return Math.max(1, base);
  return Math.round(Math.max(1, base * (0.9 + random() * 0.2)) * 10) / 10;
}

export function isSprintExpired(run, now = Date.now()) {
  return run?.mode === "sprint" && now - Number(run.startedAt ?? now) >= 300000;
}

export function classifySuccessSignal({ url = "", text = "" } = {}) {
  if (/\/(?:order|checkout|payment)(?:\/|\?|$)/i.test(url)) return "route";
  const normalized = normalizeText(text);
  if (/(订单创建成功|购买成功|支付二维码|确认订单|订单编号)/.test(normalized)) return "content";
  return null;
}
