# Resend 邮箱验证码登录接入方案

## 一、当前状态分析

| 模块 | 现状 | 问题 |
|------|------|------|
| `server.js` | 纯静态文件服务器（`http` 模块），无任何 API 路由 | 需要支持 API 端点处理验证码 |
| `signin.html` | 邮箱 + 密码登录表单 | 需改为邮箱 + 验证码模式 |
| `signin.js` | 表单验证后直接 `Utils.setAuth()` + 跳转，无后端交互 | 需对接 Resend 发码 / 验码 API |
| `signup.html` | 已有验证码 UI（`sendCodeBtn` / `emailCode` / 倒计时） | 前端 UI 可复用逻辑，但后端未接入 |
| `signup.js` | 发送验证码仅做倒计时动画，`Utils.setAuth()` 假登录 | 需接入真实 API |
| `Utils.setAuth` | 写 `sessionStorage`，无 token | 需扩展支持 server 返回的 token |

---

## 二、实施步骤

### Step 1：改造 `server.js` 为可处理 API 的服务器

**文件**: `server.js`

当前 `server.js` 只处理 `GET` 请求返回静态文件。需要新增对 `POST` 请求的 JSON API 支持，但不引入 Express（项目规则禁止新依赖）。

改动要点：
- 检测请求方法，`GET` → 静态文件（现有逻辑保持不变）
- `POST` → 解析 body，路由到对应 API handler
- 新增内存存储 `codeStore = {}`：`{ email: { code, expiresAt } }`
- 新增两个 API 端点：

**`POST /api/auth/send-code`**
- 接收 `{ email }`
- 生成 6 位随机数字验证码
- 存入 `codeStore`，有效期 5 分钟
- 通过 Resend API（`api.resend.com`）用 Node.js 原生 `https` 模块发送邮件
- 返回 `{ success: true }`

**`POST /api/auth/verify-code`**
- 接收 `{ email, code }`
- 从 `codeStore` 校验验证码是否匹配且未过期
- 通过后清除已用验证码，返回 `{ success: true, token, username }`
- `token` 为简单签名字符串（`base64(email + timestamp + secret)`）

---

### Step 2：扩展 `js/core/config.js` 添加 Resend 配置

**文件**: `js/core/config.js`

在 `CONFIG` 对象中新增：

```js
RESEND_API_KEY: 're_xxxxxx',          // Resend API Key（用户填写）
RESEND_FROM: 'Vipen <noreply@vipen.com>', // 发件人地址
CODE_EXPIRE_SECONDS: 300,              // 验证码有效期（秒）
CODE_COUNTDOWN_SECONDS: 60,            // 发送间隔倒计时（秒）
API_BASE: '/api'                        // API 基础路径
```

---

### Step 3：扩展 `js/core/utils.js` 的认证方法

**文件**: `js/core/utils.js`

改动：
- `setAuth(user)` → 增加 `token` 字段存储，同时保持向后兼容
- `getAuth()` → 返回完整认证信息（含 token）
- 无需新增方法，现有接口足够

---

### Step 4：改造 `signin.html`——邮箱验证码登录 UI

**文件**: `signin.html`

将现有 Password 表单区域替换为验证码输入：

移除：
```html
<!-- 移除整个 passwordGroup 区域 -->
<!-- 移除 forgotLink -->
```

新增：
```html
<div class="input-group email-code-group" id="emailCodeGroup">
    <input type="text" id="emailCode" class="input-field" placeholder="Verification Code" autocomplete="off" maxlength="6">
    <button type="button" class="send-code-btn" id="sendCodeBtn">Send Code</button>
</div>
<div class="send-tip" id="sendTip">Code sent, please check your inbox</div>
```

**登录模式切换**：保留原有密码登录作为备选（可选），默认展示验证码登录。

---

### Step 5：改造 `signin.js`——验证码登录逻辑

**文件**: `js/pages/signin.js`

核心变更：
1. 移除密码相关变量和验证逻辑（`password`, `passwordToggle`, `forgotLink`, `validatePassword`）
2. 新增 `emailCode`, `sendCodeBtn`, `sendTip` 变量
3. 新增 `validateEmailCode(value)` 函数（6位数字）
4. 新增 `sendVerificationCode()` 函数：
   - 校验邮箱有效性
   - `POST /api/auth/send-code` 发送请求
   - 启动 60 秒倒计时（复用 signup.js 的倒计时模式）
   - 显示 `sendTip` 提示
5. 修改 `updateSigninButton()` → 改为校验 email + code 是否都有效
6. 修改 `submit` 事件处理：
   - `POST /api/auth/verify-code`
   - 成功后调用 `Utils.setAuth()` 并跳转
   - 失败则 shake code 输入框
7. 复用 `signup.js` 中的 `sendCodeBtn` 倒计时模式（或提取为共享工具函数到 `utils.js`）

---

### Step 6：补充 `signin.css` 的验证码 UI 样式

**文件**: `css/pages/signin.css`

参考 `signup.css` 中已有的样式，新增：
- `.email-code-group` — flex 布局，input + button 并排
- `.send-code-btn` — 发送按钮样式（参考 signup.css）
- `.send-code-btn.active` — 邮箱有效时激活绿色
- `.send-code-btn:disabled` — 倒计时中禁用样式
- `.send-tip` — 发送成功提示（参考 signup.css）

> 实际上 signup.css 已有完整的验证码组件样式。可考虑将其抽取到 `layout.css` 作为共享样式，或直接在 signin.css 中追加。

---

### Step 7：同步升级 `signup.js` 的注册验证码

**文件**: `js/pages/signup.js`

将 `sendCodeBtn` 的 `click` 事件中的假倒计时改为真实 API 调用：
- `POST /api/auth/send-code` 发码
- 其余验证逻辑不变（signup 已有 code 校验）

---

### Step 8：服务配置与验证

**文件**: `server.js`

在 `server.js` 顶部新增注释说明 Resend API Key 配置方式：
```js
// Resend API Key: 请在环境变量或代码中配置
var RESEND_API_KEY = process.env.RESEND_API_KEY || 're_xxxxxxxx';
```

---

## 三、文件变更清单

| 文件 | 操作类型 | 说明 |
|------|----------|------|
| `server.js` | **重大改动** | 新增 POST API 路由 + Resend 集成 + 验证码存储 |
| `js/core/config.js` | **追加** | 新增 Resend 配置项 |
| `js/core/utils.js` | **小改** | `setAuth` 增加 token 字段 |
| `signin.html` | **中等改动** | 密码区替换为验证码输入区 |
| `js/pages/signin.js` | **重写** | 邮箱验证码登录全流程 |
| `css/pages/signin.css` | **追加** | 验证码输入组件样式 |
| `js/pages/signup.js` | **小改** | 发送验证码接入真实 API |

---

## 四、数据流示意

```
[用户输入邮箱] → 点击 Send Code
    → POST /api/auth/send-code { email }
        → server.js 生成 6 位验证码
        → 存入 codeStore (5min TTL)
        → https.request → api.resend.com/emails
        → 返回 { success: true }
    → 前端启动 60s 倒计时

[用户输入验证码] → 点击 Sign In
    → POST /api/auth/verify-code { email, code }
        → server.js 从 codeStore 校验
        → 通过 → 生成 token，返回 { success, token, username }
        → 前端 Utils.setAuth() → 跳转首页
```

---

## 五、注意事项

1. **不引入新依赖** — 使用 Node.js 内置 `http` / `https` 模块调用 Resend API
2. **Resend API Key** — 需要用户自行在 [resend.com](https://resend.com) 注册获取，配置在 `config.js` 或环境变量中
3. **验证码存储** — 使用内存 Map，服务重启后清空，生产环境建议换 Redis
4. **安全性** — 每邮箱每分钟限制 1 次发送请求（已在 COUNTDOWN 中实现前端限制，后端亦需限流）
5. **server.js 保持单文件** — 遵循项目无框架原则，仅在现有 `http.createServer` 中扩展逻辑