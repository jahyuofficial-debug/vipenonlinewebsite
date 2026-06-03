# 修复 Design 页面三重验证后空白问题

## 摘要

Design 页面通过三重验证（PIN → Creator Name → Company）后，页面变为空白，设计作品网格不显示。

## 根因分析

### 问题链路

1. 用户首次进入 `#/design-work` → `main.js` 的 `navigateTo('design-work')` 被调用
2. 登录检查通过，但 `DesignPage.isVerified()` 返回 `false` → 渲染 Guard 验证覆盖层并 `return`
3. 用户依次通过 3 步验证（PIN / Creator Name / Company）
4. [design.js#L427-L430](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/design.js#L427-L430)：验证通过后执行：

```js
sessionStorage.setItem('design_verified', 'true');
var overlay = document.getElementById('dwGuardOverlay');
if (overlay) overlay.remove();
window.location.hash = '#/design-work';
```

5. **Bug 在此**：此时 `window.location.hash` 已经是 `#/design-work`（从步骤 1 开始就一直没变过）。浏览器规范规定：**设置相同 hash 值不会触发 `hashchange` 事件**。
6. 因此 `main.js` 中唯一的路由入口 `window.addEventListener('hashchange', handleRoute)` 不会被执行
7. Guard 覆盖层被移除，但页面的设计作品网格从未被渲染 → **页面空白**

### 触发条件

验证过程中 hash 未被改变。`handleRoute` 是唯一的路由分发入口（[main.js#L1403](file:///d:/设计文档/TareProcess/Vipen2.0/js/main.js#L1403)），当 hash 不变时该入口不会被调用。

## 修复方案

### 修改文件：`js/pages/design.js`

**位置**：`bindDesignGuard` 函数，第三重验证通过后的代码块（约第 427-430 行）

**改动**：在移除覆盖层后，手动 dispatch 一个 `hashchange` 事件，触发 `main.js` 的路由处理器重新分发，从而正确渲染设计作品网格。

```js
// 修改前
sessionStorage.setItem('design_verified', 'true');
var overlay = document.getElementById('dwGuardOverlay');
if (overlay) overlay.remove();
window.location.hash = '#/design-work';

// 修改后
sessionStorage.setItem('design_verified', 'true');
var overlay = document.getElementById('dwGuardOverlay');
if (overlay) overlay.remove();
window.dispatchEvent(new Event('hashchange'));
```

### 原理

- `main.js` 第 1403 行通过 `window.addEventListener('hashchange', handleRoute)` 监听 hash 变化
- 手动 dispatch `hashchange` 事件会同步触发 `handleRoute()`
- `handleRoute` 读取 `window.location.hash`（仍为 `#/design-work`），解析后调用 `navigateTo('design-work')`
- `navigateTo` 内部执行：
  1. 移除旧的 `subPageContainer`（含 Guard 的容器）
  2. 检查 `isVerified()` → 现在返回 `true`，跳过 Guard 渲染
  3. 进入 `else if (pageName === 'design-work')` 分支 → 渲染设计作品网格
  4. `DesignPage.bindGrid()` 绑定扇形卡片交互

## 验证步骤

1. 清除 `sessionStorage`（移除 `design_verified` 键）模拟未验证状态
2. 导航到 `#/design-work`
3. 确认 Guard 验证覆盖层显示
4. 依次输入：
   - PIN：6 位数字（需后端 `/api/manager/verify-pin` 验证通过）
   - Creator Name：`贾江洲`
   - Company：`Vipen` 或 `VIPEN`
5. 验证通过后，确认设计作品网格（扑克牌扇形卡片）正确显示
6. 确认鼠标悬停卡片时预览信息正常显示
7. 确认点击卡片时正确跳转到详情页
