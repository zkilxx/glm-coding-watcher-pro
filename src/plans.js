const compact=(v,max)=>String(v??"").replace(/\s+/g,"").trim().slice(0,max);
export function normalizePlan(plan={}){return{name:compact(plan.name,120),price:compact(plan.price,80),pageIndex:Number.isInteger(plan.pageIndex)?plan.pageIndex:0};}
export function fingerprintPlan(plan){const p=normalizePlan(plan);let hash=2166136261;for(const ch of`${p.name}|${p.price}|${p.pageIndex}`){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return`plan-${(hash>>>0).toString(16)}`;}
export function matchTarget(target,plan){const a=normalizePlan(target),b=normalizePlan(plan);return Boolean(a.name)&&a.name===b.name&&a.price===b.price;}
export function movePriority(items,index,delta){const next=[...items],to=index+delta;if(index<0||index>=next.length||to<0||to>=next.length)return next;[next[index],next[to]]=[next[to],next[index]];return next;}
export function chooseEligibleTarget(targets,plans){for(const target of targets??[]){const match=(plans??[]).find((plan)=>plan.eligible&&matchTarget(target,plan));if(match)return match;}return null;}
