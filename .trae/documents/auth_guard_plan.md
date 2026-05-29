# MSG / ACTION / Design 页面登录保护方案

## 现状分析

### 登录系统
- `signin.html` + `signin.js`：独立的登录页面，表单验证后跳转到 `profile.html`
- `signup.html` + `signup.js`：独立的注册页面，表单验证后跳转到 `profile.html`
- 登录/注册成功后**没有持久化任何登录状态**（无 token、无 session、无 cookie）
- `index.html`（主 SPA）中，导航栏有 "Sign in" / "Sign up" 按钮，点击直接跳转到对应 HTML 页面

### 路由机制
- 所有页面路由集中在 `main.js` 的 `navigateTo(pageName)` 函数中分发
- `handleRoute()` 解析 URL hash 并调用 `navigateTo()`
- 当前**所有页面均无任何访问控制**，任何人都可以直接访问 MSG、Action、Design

### 需要保护的页面
| 页面 | 路由 hash | navigateTo case | 对应模块 |
|------|-----------|-----------------|----------|
| MSG | `#/msg` | `pageName === 'msg'` | `buildMsgPage()` (内联在 main.js) |
| Action | `#/action` | `pageName === 'action'` | `ActionPage.buildPage()` |
| Design | `#/design-work` | `pageName === 'design-work'` | `DesignPage.buildGrid()` |
| Design List | `#/design-work-list` | `pageName === 'design-work-list'` | `DesignPage.buildList()` |

---

## 参考设计（用户指定）

用户提供的参考图片 `D:\设计文档\Web素材\页面预设\登陆预设.png` 展示了一个复古 CRT 显示器风格的弹窗：

- **画面元素**：一台复古 CRT 显示器，屏幕上有文字提示
- **屏幕文字**："Sorry" 和 "Who are U"（绿色像素风格）
- **背景**：纯黑色，显示器居中
- **弹窗风格**：像素风、复古科技感、CRT 扫描线效果
- **动效要求**：
  - 弹窗出现为**缓慢动画**
  - 字体出现为**打字机效果**（逐字显示）
  - 字体为**像素风格字体**

---

## 实施方案

### 步骤 1：在 `utils.js` 中添加认证状态管理工具

在 `Utils` 对象中新增三个方法，使用 `sessionStorage`（关闭浏览器即失效，比 localStorage 更安全）：

```js
setAuth: function(user) {
    sessionStorage.setItem('vipen_auth', JSON.stringify({
        username: user.username,
        email: user.email,
        loggedAt: Date.now()
    }));
},
getAuth: function() {
    var raw = sessionStorage.getItem('vipen_auth');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
},
isLoggedIn: function() {
    return !!this.getAuth();
},
logout: function() {
    sessionStorage.removeItem('vipen_auth');
}
```

- **选择 `sessionStorage` 而非 `localStorage`**：关闭浏览器后自动清除，更符合安全实践
- **不用 cookie**：保持纯前端实现，无需后端配合

### 步骤 2：修改 `signin.js` — 登录成功后持久化状态

在 [signin.js:L104](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/signin.js#L104) 的 form submit 事件中：
- 登录成功后调用 `Utils.setAuth({ username: 'user', email: email.value })`
- 跳转目标改为 `index.html#/`（回到首页）

**注意**：`signin.html` 当前没有引入 `utils.js`，需要在 HTML 中加入 `<script src="js/core/utils.js"></script>`

### 步骤 3：修改 `signup.js` — 注册成功后持久化状态

在 [signup.js:L274](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/signup.js#L274) 的 form submit 事件中：
- 注册成功后调用 `Utils.setAuth({ username: accountName.value, email: email.value })`
- 跳转目标改为 `index.html#/`

**注意**：`signup.html` 同样需要引入 `utils.js`

### 步骤 4：修改 `main.js` — 添加路由守卫

在 `navigateTo()` 函数中，对以下 4 个 case 添加登录检查：

| case | 检查代码 |
|------|---------|
| `pageName === 'msg'` | 最前面加 `if (!Utils.isLoggedIn()) { window.location.href = 'signin.html'; return; }` |
| `pageName === 'action'` | 同上 |
| `pageName === 'design-work'` | 同上 |
| `pageName === 'design-work-list'` | 同上 |

**守卫逻辑**：在每个受保护 case 的**第一行**（在 `subPageContainer.remove()` 之后、DOM 操作之前）插入检查：
```js
if (!Utils.isLoggedIn()) {
    window.location.href = 'signin.html';
    return;
}
```

> **注意**：不能在 `navigateTo()` 函数入口统一拦截，因为 `home`、`fresh`、`disc-library` 等页面仍可公开访问。

### 步骤 5：修改 `main.js` — 初始化时检查登录状态

在 `main.js` 的 IIFE 初始化阶段（`handleRoute()` 调用之前），检查 `isLoggedIn()` 并更新 Header UI：
- **已登录**：隐藏 "Sign in" / "Sign up" 按钮，显示用户信息/Profile 链接
- **未登录**：保持现有 UI 不变

### 步骤 6：修改 `index.html` — 引入 `utils.js`

`index.html` 已经通过 `<script src="js/core/utils.js"></script>` 引入了 utils.js（检查确认存在）。

### 步骤 7：修改 `signin.html` 和 `signup.html` — 引入 `utils.js`

两个 HTML 文件当前只引入了 `comet-trail.js` 和各自的页面 JS，需要增加：
```html
<script src="js/core/utils.js"></script>
```

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/core/utils.js` | **修改** | 新增 `setAuth`、`getAuth`、`isLoggedIn`、`logout` 四个方法 |
| `js/pages/signin.js` | **修改** | form submit 中调用 `Utils.setAuth()`，跳转到 `index.html#/` |
| `signin.html` | **修改** | 引入 `js/core/utils.js` |
| `js/pages/signup.js` | **修改** | form submit 中调用 `Utils.setAuth()`，跳转到 `index.html#/` |
| `signup.html` | **修改** | 引入 `js/core/utils.js` |
| `js/main.js` | **修改** | 在 `msg`/`action`/`design-work`/`design-work-list` 四个 case 中添加登录守卫；初始化时检查登录状态更新 Header |
| `index.html` | **检查确认** | 确认 `utils.js` 已引入（已验证存在） |

---

## 验证方案

1. **未登录访问受保护页面**：直接访问 `index.html#/msg` / `#/action` / `#/design-work` → 应跳转到 `signin.html`
2. **登录后访问受保护页面**：在 signin 页面输入有效信息提交 → 回到首页 → 点击 MSG/Action/Design → 应正常显示页面
3. **公开页面不受影响**：Fresh、Disc、首页等无需登录即可访问
4. **关闭浏览器后**：重新打开 index.html → 应回到未登录状态（sessionStorage 自动清除）