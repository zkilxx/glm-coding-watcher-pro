(() => {
  let run = null, settings = null, scanTimer = null, refreshTimer = null, sprintTimer = null, observer = null;
  let capacityAttempts = 0, riskAttempts = 0, inspecting = false, cycleToken = 0;
  const textOf = (node) => String(node?.innerText ?? node?.textContent ?? "").replace(/\s+/g, "").trim();
  const visible = (node) => { const s = getComputedStyle(node), r = node.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0; };
  const purchaseLabel = (text) => [/^立即购买$/, /^购买(?:套餐|方案|计划)?$/, /^立即订阅$/, /^订阅(?:套餐|方案|计划)?$/, /^特惠订阅$/].some((re) => re.test(text));
  const planStatusLabel = (text) => purchaseLabel(text) || /^(暂时售罄|售罄)/.test(text);
  const compact=(v,max)=>String(v??"").replace(/\s+/g,"").trim().slice(0,max);
  const periodKey=(label)=>label.includes("月")?"monthly":label.includes("季")?"quarterly":"annual";
  const periodLabels=["连续包月","连续包季","连续包年"];
  function periodControls(){return periodLabels.map((label)=>({label,node:[...document.querySelectorAll('div,span,button,[role="button"]')].find((n)=>visible(n)&&textOf(n)===label)})).filter((x)=>x.node);}
  function selectedPeriod(){return periodControls().find(({node})=>node.getAttribute("aria-selected")==="true"||/active|selected|checked/i.test(node.className))??periodControls()[0];}
  function discoverPlans(billingPeriod=periodKey(selectedPeriod()?.label??"连续包季")){return [...document.querySelectorAll('button,[role="button"],a')].filter((b)=>visible(b)&&planStatusLabel(textOf(b))).slice(0,20).map((button,pageIndex)=>{let card=button,name="";for(let i=0;i<8&&card.parentElement;i++){card=card.parentElement;const exact=[...card.querySelectorAll('div,span,h1,h2,h3,h4')].map(textOf).find((t)=>/^(Lite|Pro|Max)$/.test(t));if(exact&&/[¥￥]\d/.test(textOf(card))){name=exact;break;}}const raw=textOf(card);const price=(raw.match(/[¥￥]\d+(?:\.\d+)?(?:\/(?:月|年))?/)||[""])[0];return{name,price:compact(price,80),billingPeriod,pageIndex,eligible:purchaseLabel(textOf(button))&&!button.disabled&&button.getAttribute("aria-disabled")!=="true"&&button.getAttribute("aria-busy")!=="true",button};}).filter((p)=>p.name);}
  const signature=()=>discoverPlans().map((p)=>`${p.name}:${p.price}:${p.eligible}`).join("|");
  function waitForChange(before){return new Promise((resolve)=>{const started=Date.now(),tick=()=>{if(signature()!==before||Date.now()-started>=2000)resolve();else setTimeout(tick,50);};setTimeout(tick,50);});}
  async function discoverAllPeriods(){const controls=periodControls(),original=selectedPeriod(),plans=[],errors=[];for(const item of controls){try{const before=signature();item.node.click();await waitForChange(before);plans.push(...discoverPlans(periodKey(item.label)).map(({button,...p})=>p));}catch(error){errors.push(`${item.label}: ${error.message}`);}}const restore=original?.node;if(restore){restore.click();await waitForChange(signature());}const seen=new Set();return{plans:plans.filter((p)=>{const k=`${p.name}|${p.billingPeriod}|${p.price}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,9),errors};}
  function chosenPlan(){for(const target of settings?.planPriority??[]){const match=discoverPlans().find((p)=>p.eligible&&p.name===compact(target.name,120)&&p.price===compact(target.price,80)&&(!target.billingPeriod||p.billingPeriod===target.billingPeriod));if(match)return match;}return null;}
  const classifySuccess = () => /\/(order|checkout|payment)(\/|\?|$)/i.test(location.href) || /(订单创建成功|购买成功|支付二维码|确认订单|订单编号)/.test(textOf(document.body));
  const capacityDelay = () => [1,1,2,3,5,8][Math.min(capacityAttempts++,5)];
  const riskDelay = () => [30,60,120][Math.min(riskAttempts++,2)];
  const ordinaryDelay = () => settings.mode === "sprint" ? settings.refreshSeconds : Math.round(settings.refreshSeconds * (0.9 + Math.random() * 0.2) * 10) / 10;

  function clearRefreshTimer() { if (refreshTimer) clearTimeout(refreshTimer); refreshTimer = null; }
  function clearRuntimeTimers() { cycleToken += 1; if (scanTimer) clearInterval(scanTimer); if (sprintTimer) clearTimeout(sprintTimer); clearRefreshTimer(); observer?.disconnect(); scanTimer = sprintTimer = observer = null; }
  function publish(patch) { chrome.runtime.sendMessage({ type: "RUNTIME_STATUS", patch }).catch(() => {}); }
  function scheduleRefresh(reason = "ordinary") {
    clearRefreshTimer();
    if (!run?.active || run.clickClaimed) return;
    const seconds = reason === "capacity" ? capacityDelay() : reason === "risk" ? riskDelay() : ordinaryDelay();
    publish({ nextRefreshAt: Date.now() + seconds * 1000, backoffReason: reason, status: "等待页面刷新" });
    refreshTimer = setTimeout(() => { if (run?.active && !run.clickClaimed) location.reload(); }, seconds * 1000);
  }
  function dismissCapacityNotice() {
    const dialog = [...document.querySelectorAll('[role="dialog"],.ant-modal,.el-dialog,[aria-modal="true"]')].find((n) => visible(n) && textOf(n).includes("购买人数过多"));
    if (!dialog) return false;
    const close = [...dialog.querySelectorAll('button,[role="button"],[aria-label]')].find((n) => visible(n) && /^(关闭|取消|确定|知道了|×)$/.test(textOf(n) || n.getAttribute("aria-label") || ""));
    if (close) close.click();
    return true;
  }
  function eligiblePurchaseButton() {
    return [...document.querySelectorAll('button,[role="button"],a')].find((n) => visible(n) && !n.disabled && n.getAttribute("aria-disabled") !== "true" && n.getAttribute("aria-busy") !== "true" && !/loading|加载中/i.test(n.className) && purchaseLabel(textOf(n)));
  }
  async function inspect() {
    if (inspecting || !run?.active) return; inspecting = true;
    const token = cycleToken;
    try {
      if (run.clickClaimed) { if (classifySuccess()) { clearRuntimeTimers(); publish({ active:false,status:"已进入订单或支付步骤" }); } return; }
      const capacity = dismissCapacityNotice();
      const pageText = textOf(document.body);
      const risk = /(请求过于频繁|访问受限|风控|429)/.test(pageText);
      let currentKey=periodKey(selectedPeriod()?.label??"连续包季");
      for (const target of settings.planPriority ?? []) {
        if (token!==cycleToken || !run?.active) return;
        if (target.billingPeriod && target.billingPeriod!==currentKey) {
          const control=periodControls().find((item)=>periodKey(item.label)===target.billingPeriod);
          if (!control) continue;
          const before=signature();control.node.click();await waitForChange(before);currentKey=target.billingPeriod;
        }
        publish({status:`检查 ${target.name}（${target.billingPeriod||"当前周期"}）`});
        const selected=discoverPlans(currentKey).find((p)=>p.name===compact(target.name,120)&&p.price===compact(target.price,80));
        await chrome.runtime.sendMessage({type:"CHECK_RECORDED",status:selected?.eligible?"发现可用购买按钮":`等待 ${target.name} 可用`});
        if (!selected?.eligible) continue;
        const claim=await chrome.runtime.sendMessage({type:"CLAIM_CLICK"});if(!claim?.claimed)return clearRuntimeTimers();
        clearRefreshTimer();selected.button.click();run.clickClaimed=true;
        publish({clickClaimed:true,selectedPlan:{name:selected.name,price:selected.price,billingPeriod:currentKey},nextRefreshAt:null,backoffReason:"clicked",status:`已点击 ${selected.name}，等待手动完成后续步骤`});
        if(settings.soundEnabled)try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.25);}catch{}
        await chrome.runtime.sendMessage({type:"CLICK_COMPLETED",selectedPlan:{name:selected.name,price:selected.price,billingPeriod:currentKey}});return;
      }
      if (token===cycleToken) scheduleRefresh(risk ? "risk" : capacity ? "capacity" : "ordinary");
    } finally { inspecting = false; }
  }
  function applyState(nextRun, nextSettings) {
    clearRuntimeTimers(); run = nextRun; settings = nextSettings;
    if (!run?.active) return;
    observer = new MutationObserver(() => queueMicrotask(inspect)); observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["disabled","aria-disabled","class"]});
    scanTimer = setInterval(inspect, Math.max(100, settings.scanMs));
    if (settings.mode === "sprint") sprintTimer = setTimeout(() => { settings={...settings,mode:"balanced",scanMs:200,refreshSeconds:3}; publish({mode:"balanced",status:"冲刺结束，已恢复平衡模式"}); applyState(run,settings); },300000);
    inspect();
  }
  chrome.runtime.onMessage.addListener((m,sender,sendResponse) => { if (m.type === "MONITORING_STATE") applyState(m.run,m.settings); if(m.type === "DISCOVER_PLANS"){discoverAllPeriods().then(sendResponse);return true;} });
  chrome.runtime.sendMessage({type:"GET_STATE"}).then((s)=>applyState(s.run,s.settings)).catch(()=>{});
})();
