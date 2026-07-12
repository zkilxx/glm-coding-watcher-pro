# Floating Monitor Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在网页右上角悬浮窗实时显示抢购人数过多、暂时售罄、检查中、发现可购买套餐和点击完成状态。

**Architecture:** 内容脚本用一个纯状态分类函数读取页面与套餐按钮，再通过现有运行状态消息持久化。悬浮窗增加状态节点，由统一渲染函数在挂载和每次检查时更新，因此页面刷新后可从后台状态恢复。

**Tech Stack:** Chrome Manifest V3、原生 JavaScript、Shadow DOM、Node.js `node:test`。

## Global Constraints

- 不改变套餐优先级、立即刷新、单次点击和停止监测语义。
- 不关闭提示框，不绕过验证码、登录、限流、风控或支付确认。
- 未知状态显示“检查套餐中”。

---

### Task 1: 页面状态分类与持久化

**Files:**
- Modify: `content.js`
- Test: `tests/manifest.test.js`

**Interfaces:**
- Produces: `pageAvailabilityStatus(): "抢购人数过多" | "暂时售罄" | "检查套餐中"`
- Consumes: `textOf(document.body)`, `discoverPlans()`, `publish(patch)`

- [ ] **Step 1: Write the failing test**

在 `tests/manifest.test.js` 增加断言，要求 `content.js` 定义 `pageAvailabilityStatus()`，识别 `(?:抢购|购买)人数过多`、`暂时售罄|售罄`，并在检查套餐前发布分类状态。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="floating status classifies" tests/manifest.test.js`

Expected: FAIL，因为 `pageAvailabilityStatus` 尚不存在。

- [ ] **Step 3: Write minimal implementation**

在 `content.js` 增加：

```js
function pageAvailabilityStatus(){
  if(capacityVisible()) return "抢购人数过多";
  if(discoverPlans().some((p)=>/^(暂时售罄|售罄)/.test(textOf(p.button)))) return "暂时售罄";
  return "检查套餐中";
}
```

在 `inspect()` 完成页面就绪判断后调用 `publish({status:pageAvailabilityStatus()})`；发现目标时先发布“发现可购买套餐”，点击后发布“已自动点击，刷新已停止”。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="floating status classifies" tests/manifest.test.js`

Expected: PASS。

### Task 2: 悬浮窗实时状态渲染

**Files:**
- Modify: `content.js`
- Test: `tests/manifest.test.js`

**Interfaces:**
- Produces: `updateMonitorControl(status)`
- Consumes: `run.status`, `run.refreshCount`, `settings.scanMs`

- [ ] **Step 1: Write the failing test**

增加断言，要求 Shadow DOM 包含 `.status` 和“当前状态”，并要求 `publish()` 同步调用 `updateMonitorControl()`。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="floating card renders current status" tests/manifest.test.js`

Expected: FAIL，因为状态节点与更新函数尚不存在。

- [ ] **Step 3: Write minimal implementation**

给悬浮窗增加整行状态徽标：

```html
<div class="status"><span>当前状态</span><b data-status></b></div>
```

实现：

```js
function updateMonitorControl(status=run?.status??"检查套餐中"){
  const host=document.getElementById("glm-watcher-control");
  const node=host?.shadowRoot?.querySelector("[data-status]");
  if(node) node.textContent=status;
}
```

`publish(patch)` 在发送后台消息前合并 `run={...run,...patch}` 并调用 `updateMonitorControl(run.status)`，确保无需重挂载即可更新。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="floating card renders current status" tests/manifest.test.js`

Expected: PASS。

### Task 3: 回归、真实页面验证与发布

**Files:**
- Modify: `manifest.json`
- Test: `tests/*.test.js`

**Interfaces:**
- Consumes: Task 1、Task 2 的状态分类和渲染接口
- Produces: 可发布的扩展版本 `1.0.2`

- [ ] **Step 1: Run full automated verification**

Run: `npm test && node --check background.js && node --check content.js && node --check popup.js && git diff --check`

Expected: 全部测试通过，语法与格式检查无输出。

- [ ] **Step 2: Verify against the live GLM page**

在当前 GLM 页面只读检查按钮文字；当前按钮为“暂时售罄｜日期 补货”时，确认分类结果为“暂时售罄”。不得启动监测、点击购买或处理验证码。

- [ ] **Step 3: Bump and commit**

将 `manifest.json` 版本改为 `1.0.2`，然后运行：

```bash
git add content.js manifest.json tests/manifest.test.js
git commit -m "Show live availability in monitor card"
```

- [ ] **Step 4: Push and verify remote**

Run: `git push origin agent/build-glm-coding-watcher-pro:main`

Expected: 本地提交哈希与 `refs/heads/main` 一致。
