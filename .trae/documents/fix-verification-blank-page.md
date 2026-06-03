# 修复验证后空白内容页 BUG

## 问题摘要

在 signin/signup 页面通过验证后，页面跳转到 `#/profile`，但 profile 页面使用异步 `fetch` 加载数据，`subPageContainer` 在 fetch 回调中才追加到 DOM，导致 fetch 期间页面完全空白。同时 profile.js 的 `DOMContentLoaded` 处理器在页面非 profile 状态时错误调用 `bindAll()`，造成状态混乱。Design 页面 PIN 验证后使用 `dispatchEvent` 触发重新渲染，可靠性不足。

## 当前状态分析

### 涉及文件

* `js/main.js` — 路由分发 + `navigateTo()` 函数

* `js/pages/profile.js` — ProfilePage 模块 + DOMContentLoaded 处理器

* `js/pages/design.js` — DesignPage 模块 + PIN 验证守卫

* `js/pages/signin.js` — SigninPage 模块

* `js/pages/signup.js` — SignupPage 模块

### 验证流程

1. **Signin/Signup → Profile 流程**：

   * 用户在 signin/signup 表单提交验证码 → API 成功后 `window.location.hash = '#/profile'`

   * `hashchange` 触发 → `handleRoute()` → `navigateTo('profile')`

   * `navigateTo('profile')` 中先 `subPageContainer.remove()` 移除 signin 页面内容

   * 然后 `fetch('data/profile.json')` 异步加载数据

   * **BUG**: 新 `subPageContainer` 在 fetch 回调中才 `app.appendChild()`，期间页面空白

2. **Design PIN 验证流程**：

   * 用户输入 PIN → 三步验证通过

   * `overlay.remove()` 移除守卫遮罩

   * `window.dispatchEvent(new Event('hashchange'))` 触发重新路由

   * `navigateTo('design-work')` 重新构建设计网格

### 根本原因

1. **profile 页面异步加载空白期**：`subPageContainer` 在 fetch 完成后才追加到 DOM，其他页面（如 home、fresh、design-work）都是同步构建并立即追加的。
2. **profile.js** **`DOMContentLoaded`** **处理器多余调用**：在 `index.html` 加载时，该处理器调用 `bindAll()` 但 profile 页面元素不在 DOM 中，设置 `isBound = true` 却未实际绑定事件。
3. **design 页面 dispatchEvent 不可靠**：合成事件在某些环境下可能行为不一致。

## 修改方案

### 修改 1: `js/main.js` — profile 页面改为同步构建

**文件**: `js/main.js`\
**位置**: `navigateTo()` 中 `else if (pageName === 'profile')` 分支（约 763-780 行）

**现状**:

```js
} else if (pageName === 'profile') {
    if (herosTopBg) herosTopBg.classList.remove('hidden');
    banner.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    fetch('data/profile.json')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            ProfilePage.setData(d);
            subPageContainer.innerHTML = ProfilePage.buildPage();
            app.appendChild(subPageContainer);
            ProfilePage.bindAll();
            currentPage = 'profile';
        })
        .catch(function() {
            subPageContainer.innerHTML = ProfilePage.buildPage();
            app.appendChild(subPageContainer);
            ProfilePage.bindAll();
            currentPage = 'profile';
        });
}
```

**改为**:

```js
} else if (pageName === 'profile') {
    if (herosTopBg) herosTopBg.classList.remove('hidden');
    banner.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    subPageContainer.innerHTML = ProfilePage.buildPage();
    app.appendChild(subPageContainer);
    ProfilePage.bindAll();
    currentPage = 'profile';
}
```

**理由**: profile 数据已由 `ProfilePage.bindAll()` 内部从 `Utils.getUserData('user')` 加载，无需额外异步 fetch。与其他页面保持一致的同步构建模式。

### 修改 2: `js/pages/profile.js` — 守卫 DOMContentLoaded 处理器

**文件**: `js/pages/profile.js`\
**位置**: 文件末尾的 `DOMContentLoaded` 处理器（约 1656-1668 行）

**现状**:

```js
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ProfilePage !== 'undefined' && ProfilePage.bindAll) {
        fetch('data/profile.json')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                ProfilePage.setData(d);
                ProfilePage.bindAll();
            })
            .catch(function() {
                ProfilePage.bindAll();
            });
    }
});
```

**改为**:

```js
document.addEventListener('DOMContentLoaded', function() {
    var profileSection = document.getElementById('page-profile');
    if (!profileSection) return;
    if (typeof ProfilePage !== 'undefined' && ProfilePage.bindAll) {
        fetch('data/profile.json')
            .then(function(r) { return r.json(); })
            .then(function(d) {
                ProfilePage.setData(d);
                ProfilePage.bindAll();
            })
            .catch(function() {
                ProfilePage.bindAll();
            });
    }
});
```

**理由**: 添加 `#page-profile` 元素检查，确保只在 profile 页面存在时（`profile.html` 场景）才执行。在 `index.html` 上由 `navigateTo('profile')` 同步调用 `buildPage()` + `bindAll()`，避免冗余处理和状态冲突。

### 修改 3: `js/pages/design.js` — 增强 PIN 验证后重新渲染可靠性

**文件**: `js/pages/design.js`\
**位置**: `bindDesignGuard()` 中 step 3 验证通过处

**现状**:

```js
sessionStorage.setItem('design_verified', 'true');
var overlay = document.getElementById('dwGuardOverlay');
if (overlay) overlay.remove();
window.dispatchEvent(new Event('hashchange'));
```

**改为**:

```js
sessionStorage.setItem('design_verified', 'true');
var overlay = document.getElementById('dwGuardOverlay');
if (overlay && overlay.parentNode) {
    overlay.parentNode.remove();
}
var currentHash = window.location.hash;
if (currentHash) {
    window.location.hash = '';
    setTimeout(function() {
        window.location.hash = currentHash;
    }, 0);
}
```

**理由**:

* 移除整个守卫容器（`overlay.parentNode`）而非仅遮罩层，确保 DOM 清洁

* 使用真实的 hash 变更（先清空再恢复）触发浏览器原生 `hashchange` 事件，比 `dispatchEvent` 更可靠

* `setTimeout` 确保 hash 变更被浏览器正确识别

## 验证步骤

1. 启动本地服务器：`node server.js`
2. 打开 `http://localhost:3000`
3. **测试 Signin → Profile**：导航到 `#/signin`，完成登录验证，确认跳转到 profile 页面后内容立即可见
4. **测试 Signup → Profile**：导航到 `#/signup`，完成注册验证，确认跳转到 profile 页面后内容立即可见
5. **测试 Design PIN 验证**：导航到 `#/design-work`，输入正确 PIN（步骤1依赖后端 API，步骤2输入"贾江洲"，步骤3输入"Vipen"或"VIPEN"），验证通过后确认设计网格内容正确显示
6. **回归测试**：检查 home、fresh、disc-library 等页面是否正常加载

