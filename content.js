(() => {
  let timer = null;
  let run = null;
  let settings = null;
  const textOf = (node) => String(node?.innerText ?? node?.textContent ?? "").replace(/\s+/g, "").trim();
  const visible = (node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };
  const purchaseLabel = (text) => [/^立即购买$/, /^购买(?:套餐|方案|计划)?$/, /^立即订阅$/, /^订阅(?:套餐|方案|计划)?$/].some((re) => re.test(text));

  function dismissCapacityNotice() {
    const containers = [...document.querySelectorAll('[role="dialog"], .ant-modal, .el-dialog, [aria-modal="true"]')];
    const dialog = containers.find((node) => visible(node) && textOf(node).includes("购买人数过多"));
    if (!dialog) return false;
    const controls = [...dialog.querySelectorAll('button, [role="button"], [aria-label]')];
    const close = controls.find((node) => visible(node) && /^(关闭|取消|确定|知道了|×)$/.test(textOf(node) || node.getAttribute("aria-label") || ""));
    if (!close) return false;
    close.click();
    chrome.runtime.sendMessage({ type: "ADD_LOG", message: "已关闭购买人数过多提示" });
    return true;
  }

  function eligiblePurchaseButton() {
    return [...document.querySelectorAll('button, [role="button"], a')].find((node) => {
      const disabled = node.disabled || node.getAttribute("aria-disabled") === "true" || node.classList.contains("disabled");
      const busy = node.getAttribute("aria-busy") === "true" || /loading|加载中/i.test(node.className);
      return visible(node) && !disabled && !busy && purchaseLabel(textOf(node));
    });
  }

  async function inspect() {
    if (!run?.active || run.clickClaimed) return stopTimer();
    dismissCapacityNotice();
    const button = eligiblePurchaseButton();
    await chrome.runtime.sendMessage({ type: "CHECK_RECORDED", status: button ? "发现可用购买按钮" : "等待购买按钮可用" });
    if (!button) return;
    const claim = await chrome.runtime.sendMessage({ type: "CLAIM_CLICK" });
    if (!claim?.claimed) return stopTimer();
    button.click();
    run.clickClaimed = true;
    run.active = false;
    stopTimer();
    if (settings?.soundEnabled) {
      try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        oscillator.connect(audio.destination); oscillator.frequency.value = 880; oscillator.start(); oscillator.stop(audio.currentTime + 0.25);
      } catch {}
    }
    await chrome.runtime.sendMessage({ type: "CLICK_COMPLETED" });
  }

  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function applyState(nextRun, nextSettings) {
    stopTimer(); run = nextRun; settings = nextSettings;
    if (run?.active && !run.clickClaimed) { inspect(); timer = setInterval(inspect, Math.max(3, settings.detectionSeconds) * 1000); }
  }
  chrome.runtime.onMessage.addListener((message) => { if (message.type === "MONITORING_STATE") applyState(message.run, message.settings); });
  chrome.runtime.sendMessage({ type: "GET_STATE" }).then((state) => applyState(state.run, state.settings)).catch(() => {});
})();
