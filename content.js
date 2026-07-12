(() => {
  let run = null, settings = null, scanTimer = null, sprintTimer = null, observer = null;
  let inspecting = false, cycleToken = 0;
  const textOf = (node) => String(node?.innerText ?? node?.textContent ?? "").replace(/\s+/g, "").trim();
  const visible = (node) => { const s = getComputedStyle(node), r = node.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0; };
  const purchaseLabel = (text) => [/^立即购买$/, /^购买(?:套餐|方案|计划)?$/, /^立即订阅$/, /^订阅(?:套餐|方案|计划)?$/, /^特惠订阅$/].some((re) => re.test(text));
  const planStatusLabel = (text) => purchaseLabel(text) || /^(暂时售罄|售罄|(?:抢购|购买)人数过多(?:，?请刷新再试)?)/.test(text);
  const compact=(v,max)=>String(v??"").replace(/\s+/g,"").trim().slice(0,max);
  const periodKey=(label)=>label.includes("月")?"monthly":label.includes("季")?"quarterly":"annual";
  const periodLabels=["连续包月","连续包季","连续包年"];
  function periodControls(){return periodLabels.map((label)=>({label,node:[...document.querySelectorAll('div,span,button,[role="button"]')].find((n)=>visible(n)&&textOf(n)===label)})).filter((x)=>x.node);}
  function selectedPeriod(){return periodControls().find(({node})=>node.getAttribute("aria-selected")==="true"||/active|selected|checked/i.test(node.className))??periodControls()[0];}
  function discoverPlans(billingPeriod=periodKey(selectedPeriod()?.label??"连续包季")){return [...document.querySelectorAll('button,[role="button"],a')].filter((b)=>visible(b)&&planStatusLabel(textOf(b))).slice(0,20).map((button,pageIndex)=>{let card=button,name="";for(let i=0;i<8&&card.parentElement;i++){card=card.parentElement;const exact=[...card.querySelectorAll('div,span,h1,h2,h3,h4')].map(textOf).find((t)=>/^(Lite|Pro|Max)$/.test(t));if(exact&&/[¥￥]\d/.test(textOf(card))){name=exact;break;}}const raw=textOf(card);const price=(raw.match(/[¥￥]\d+(?:\.\d+)?(?:\/(?:月|年))?/)||[""])[0];return{name,price:compact(price,80),billingPeriod,pageIndex,eligible:purchaseLabel(textOf(button))&&!button.disabled&&button.getAttribute("aria-disabled")!=="true"&&button.getAttribute("aria-busy")!=="true",button};}).filter((p)=>p.name);}
  function plansReady(){return periodControls().length===periodLabels.length&&discoverPlans().length>0;}
  const signature=()=>discoverPlans().map((p)=>`${p.name}:${p.price}:${p.eligible}`).join("|");
  function waitForChange(before){return new Promise((resolve)=>{const started=Date.now(),tick=()=>{if(signature()!==before||Date.now()-started>=2000)resolve();else setTimeout(tick,50);};setTimeout(tick,50);});}
  async function discoverAllPeriods(){const controls=periodControls(),original=selectedPeriod(),plans=[],errors=[];for(const item of controls){try{const before=signature();item.node.click();await waitForChange(before);plans.push(...discoverPlans(periodKey(item.label)).map(({button,...p})=>p));}catch(error){errors.push(`${item.label}: ${error.message}`);}}const restore=original?.node;if(restore){restore.click();await waitForChange(signature());}const seen=new Set();return{plans:plans.filter((p)=>{const k=`${p.name}|${p.billingPeriod}|${p.price}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,9),errors};}
  function chosenPlan(){for(const target of settings?.planPriority??[]){const match=discoverPlans().find((p)=>p.eligible&&p.name===compact(target.name,120)&&p.price===compact(target.price,80)&&(!target.billingPeriod||p.billingPeriod===target.billingPeriod));if(match)return match;}return null;}
  const classifySuccess = () => /\/(order|checkout|payment)(\/|\?|$)/i.test(location.href) || /(订单创建成功|购买成功|支付二维码|确认订单|订单编号)/.test(textOf(document.body));
  function clearRefreshTimer() {}
  function clearRuntimeTimers() { cycleToken += 1; if (scanTimer) clearInterval(scanTimer); if (sprintTimer) clearTimeout(sprintTimer); observer?.disconnect(); scanTimer = sprintTimer = observer = null; }
  function publish(patch) { run={...run,...patch};updateMonitorControl(run.status);chrome.runtime.sendMessage({ type: "RUNTIME_STATUS", patch }).catch(() => {}); }
  function removeMonitorControl(){document.getElementById("glm-watcher-control")?.remove();}
  function updateMonitorControl(status=run?.status??"检查套餐中"){const host=document.getElementById("glm-watcher-control");const node=host?.shadowRoot?.querySelector("[data-status]");if(node)node.textContent=status;}
  function mountMonitorControl(){
    if(document.getElementById("glm-watcher-control"))return;
    const host=document.createElement("div");host.id="glm-watcher-control";const root=host.attachShadow({mode:"open"});
    root.innerHTML=`<style>:host{all:initial;position:fixed;right:20px;top:20px;z-index:2147483647;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}.card{width:230px;padding:14px;border:1px solid rgba(37,99,235,.2);border-radius:14px;background:rgba(255,255,255,.97);box-shadow:0 12px 34px rgba(16,24,40,.2);color:#172033}.title{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:750}.dot{width:8px;height:8px;border-radius:50%;background:#16a36a;box-shadow:0 0 0 3px #dff6eb}.status{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:9px 10px;border-radius:9px;background:#eff6ff;color:#667085;font-size:11px}.status b{color:#1d4ed8;font-size:12px;text-align:right}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.metric{color:#667085;font-size:11px}.metric b{display:block;margin-top:3px;color:#172033;font-size:18px;font-variant-numeric:tabular-nums}button{width:100%;height:34px;border:0;border-radius:8px;background:#dc2626;color:#fff;font:700 12px Inter,"PingFang SC",sans-serif;cursor:pointer}button:hover{background:#b91c1c}button:disabled{cursor:wait;opacity:.65}button:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}</style><div class="card" role="status"><div class="title"><span class="dot"></span>GLM 监测运行中</div><div class="status"><span>当前状态</span><b data-status>${run?.status??"检查套餐中"}</b></div><div class="metrics"><span class="metric">刷新次数<b>${run?.refreshCount??0}</b></span><span class="metric">检测间隔<b>${settings?.scanMs??200}ms</b></span></div><button type="button">停止监测</button></div>`;
    const button=root.querySelector("button");button.addEventListener("click",async()=>{if(button.disabled)return;button.disabled=true;button.textContent="正在停止…";try{const result=await chrome.runtime.sendMessage({type:"STOP_MONITORING"});if(!result?.ok)throw new Error(result?.error||"停止失败");removeMonitorControl();}catch{button.disabled=false;button.textContent="重试停止";}});
    document.documentElement.append(host);
  }
  async function reloadImmediately(status=pageAvailabilityStatus()) {
    if (!run?.active || run.clickClaimed) return;
    publish({ nextRefreshAt: null, backoffReason: "unavailable", status });
    await chrome.runtime.sendMessage({type:"REFRESH_RECORDED"});
    location.reload();
  }
  function capacityVisible(){return /(?:抢购|购买)人数过多(?:，?请刷新再试)?/.test(textOf(document.body));}
  function pageAvailabilityStatus(){if(capacityVisible())return "抢购人数过多";if(discoverPlans().some((p)=>/^(暂时售罄|售罄)/.test(textOf(p.button))))return "暂时售罄";return "检查套餐中";}
  function eligiblePurchaseButton() {
    return [...document.querySelectorAll('button,[role="button"],a')].find((n) => visible(n) && !n.disabled && n.getAttribute("aria-disabled") !== "true" && n.getAttribute("aria-busy") !== "true" && !/loading|加载中/i.test(n.className) && purchaseLabel(textOf(n)));
  }
  async function inspect() {
    if (inspecting || !run?.active) return; inspecting = true;
    const token = cycleToken;
    try {
      if (run.clickClaimed) { if (classifySuccess()) { clearRuntimeTimers(); publish({ active:false,status:"已进入订单或支付步骤" }); } return; }
      const capacity=capacityVisible();
      if(!plansReady()){if(capacity)return reloadImmediately();publish({status:"等待套餐加载"});return;}
      const availabilityStatus=pageAvailabilityStatus();publish({status:pageAvailabilityStatus()});
      let currentKey=periodKey(selectedPeriod()?.label??"连续包季");
      for (const target of settings.planPriority ?? []) {
        if (token!==cycleToken || !run?.active) return;
        if (target.billingPeriod && target.billingPeriod!==currentKey) {
          const control=periodControls().find((item)=>periodKey(item.label)===target.billingPeriod);
          if (!control) continue;
          const before=signature();control.node.click();await waitForChange(before);currentKey=target.billingPeriod;
        }
        const selected=discoverPlans(currentKey).find((p)=>p.name===compact(target.name,120)&&p.price===compact(target.price,80));
        await chrome.runtime.sendMessage({type:"CHECK_RECORDED",status:selected?.eligible?"发现可购买套餐":availabilityStatus});
        if (!selected?.eligible) continue;
        publish({status:"发现可购买套餐"});
        const claim=await chrome.runtime.sendMessage({type:"CLAIM_CLICK"});if(!claim?.claimed)return clearRuntimeTimers();
        clearRefreshTimer();selected.button.click();run.clickClaimed=true;
        publish({clickClaimed:true,selectedPlan:{name:selected.name,price:selected.price,billingPeriod:currentKey},nextRefreshAt:null,backoffReason:"clicked",status:"已自动点击，刷新已停止"});
        if(settings.soundEnabled)try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.25);}catch{}
        await chrome.runtime.sendMessage({type:"CLICK_COMPLETED",selectedPlan:{name:selected.name,price:selected.price,billingPeriod:currentKey}});return;
      }
      if (token===cycleToken) reloadImmediately();
    } finally { inspecting = false; }
  }
  function applyState(nextRun, nextSettings) {
    clearRuntimeTimers(); run = nextRun; settings = nextSettings;
    run?.active&&!run.clickClaimed?mountMonitorControl():removeMonitorControl();
    if (!run?.active) return;
    observer = new MutationObserver(() => queueMicrotask(inspect)); observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["disabled","aria-disabled","class"]});
    scanTimer = setInterval(inspect, Math.max(100, settings.scanMs));
    if (settings.mode === "sprint") sprintTimer = setTimeout(() => { settings={...settings,mode:"balanced",scanMs:200,refreshSeconds:3}; publish({mode:"balanced",status:"冲刺结束，已恢复平衡模式"}); applyState(run,settings); },300000);
    inspect();
  }
  chrome.runtime.onMessage.addListener((m,sender,sendResponse) => { if (m.type === "MONITORING_STATE") applyState(m.run,m.settings); if(m.type === "DISCOVER_PLANS"){discoverAllPeriods().then(sendResponse);return true;} });
  chrome.runtime.sendMessage({type:"GET_STATE"}).then((s)=>applyState(s.run,s.settings)).catch(()=>{});
})();
