const CAPACITY_PHRASE = "购买人数过多";
const PURCHASE_LABELS = [/^立即购买$/, /^购买(?:套餐|方案|计划)?$/, /^立即订阅$/, /^订阅(?:套餐|方案|计划)?$/];

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
