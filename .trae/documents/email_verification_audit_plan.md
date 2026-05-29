# 邮件验证系统状态审查与修复计划

## 一、当前状态结论

**邮件验证系统整体：❌ 不可用**

经实际测试，Resend API 返回 `403` 错误：

```
STATUS: 403
{"statusCode":403,"message":"The vipen.com domain is not verified. Please, add and verify your domain on https://resend.com/domains","name":"validation_error"}
```

**原因**：`vipen.com` 域名未在 Resend 平台完成验证，导致所有发信请求被拒绝。

---

## 二、逐层审查结果

### 2.1 前端层（signin.js / signup.js）

| 项目 | 状态 | 说明 |
|------|------|------|
| signin.js 发码逻辑 | ✅ 可用 | fetch → `/api/auth/send-code`，错误处理完整 |
| signin.js 验码逻辑 | ✅ 可用 | fetch → `/api/auth/verify-code`，token 存储正确 |
| signup.js 发码逻辑 | ⚠️ 有小问题 | 先启倒计时再发 fetch，后端返回错误时能正确回滚，但用户体验有抖动 |
| signup.js 验码逻辑 | ⚠️ 有小问题 | 注册成功时用 `accountName.value` 而非后端返回的 `data.username`（不一致） |

### 2.2 后端层（server.js）

| 项目 | 状态 | 说明 |
|------|------|------|
| API 路由 `/api/auth/send-code` | ✅ 完整 | 邮箱格式校验 → 限流(60s) → 生成6位码 → 调 Resend |
| API 路由 `/api/auth/verify-code` | ✅ 完整 | 校验必填 → 查 codeStore → 过期检查 → 比对 → 返回 token |
| Resend API 集成 | ✅ 代码正确 | 使用原生 `https` 模块，请求格式符合 Resend 规范 |
| 验证码存储 | ✅ 正常 | 内存 Map + 5分钟过期 + 60秒发送间隔 |
| CORS 处理 | ✅ 正常 | OPTIONS 预检 + Access-Control-Allow-Origin |

### 2.3 Resend API Key 与域名

| 项目 | 状态 | 说明 |
|------|------|------|
| API Key `re_BSMWdxmv_...` | ✅ 有效 | Resend 返回了具体错误而非认证失败 |
| 发件域名 `vipen.com` | ❌ 未验证 | **这是核心阻塞问题** |
| API Key 安全性 | ❌ 暴露 | 硬编码在 `server.js` 和 `config.js` 中，已提交到代码仓库 |

---

## 三、问题清单（按严重程度排序）

### 🔴 P0 — 阻塞性问题

**1. Resend 域名未验证（`vipen.com`）**

- **位置**: [server.js:L12](file:///d:/设计文档/TareProcess/Vipen2.0/server.js#L12)
- **问题**: `RESEND_FROM = 'Vipen <noreply@vipen.com>'`，但 `vipen.com` 未在 Resend 验证
- **影响**: 所有邮件发送请求返回 403，验证码邮件无法送达
- **解决**: 分两个可选路径：
  - **路径A（推荐）**: 如果你拥有 `vipen.com` 域名，登录 [resend.com/domains](https://resend.com/domains) 添加并验证该域名（需配置 DNS 记录）
  - **路径B（快速）**: 如果无自有域名，使用 Resend 提供的测试模式。修改 `RESEND_FROM` 使用 Resend 默认发件域（如 `onboarding@resend.dev`），但只能发到你的 Resend 账户邮箱
  - **路径C**: 切换为其他邮件服务（如 SendGrid、Brevo 等），但项目规则禁止引入新依赖

### 🟡 P1 — 高风险问题

**2. API Key 硬编码暴露**

- **位置**: [server.js:L11](file:///d:/设计文档/TareProcess/Vipen2.0/server.js#L11) 和 [config.js:L10](file:///d:/设计文档/TareProcess/Vipen2.0/js/core/config.js#L10)
- **问题**: `re_BSMWdxmv_AVqToyXrPWaKh7wbMHQPaGtz` 直接写在代码中
- **风险**: 任何人拿到源码即可使用你的 Resend 配额发送邮件
- **建议**: 改用环境变量 `process.env.RESEND_API_KEY`，并在 `config.js` 中移除该配置（前端不需要 API Key）

**3. AUTH_SECRET 每次重启变化**

- **位置**: [server.js:L14](file:///d:/设计文档/TareProcess/Vipen2.0/server.js#L14)
- **问题**: `var AUTH_SECRET = 'vipen-auth-secret-' + Date.now();` — 每次重启 secret 都不同
- **影响**: 服务重启后，所有之前签发的 token 都失去意义（虽然目前只存 sessionStorage，不跨会话保留，影响较小）

### 🟢 P2 — 低风险 / 体验问题

**4. signup.js 注册成功用户名不一致**

- **位置**: [signup.js:L307-L309](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/signup.js#L307-L309)
- **问题**: `Utils.setAuth({ username: accountName.value, ... })` 使用前端输入值
- **对比**: signin.js 使用后端返回的 `data.username`
- **建议**: 统一使用后端返回值

**5. 无验证码暴力破解防护**

- **问题**: 后端验证码校验没有错误次数限制，理论上可被枚举（6位数字共100万种组合）
- **建议**: 增加连续错误次数限制（如5次错误后需重新发码）

**6. signup.js 发码倒计时用户体验**

- **问题**: 先启动倒计时再发请求，如果后端立即返回错误（如429限流），倒计时会回滚，用户看到闪烁
- **建议**: 先发请求，收到成功后再启动倒计时

---

## 四、修复步骤

### Step 1: 解决域名验证（P0 阻塞）

| 子步骤 | 操作 | 预计效果 |
|--------|------|----------|
| 1a | 登录 [resend.com](https://resend.com) 进入 Domains 页面 | 查看当前域名列表 |
| 1b | 添加 `vipen.com` 并完成 DNS 验证 | 域名状态变为 Verified |
| 1c | 测试发送验证码 | 邮件正常送达 |

> 如果暂时无法验证域名，可临时使用 `onboarding@resend.dev` 作为发件地址，但只能发给注册 Resend 账户的邮箱。

### Step 2: 安全性改进（P1）

**2a. 移除硬编码 API Key**

`server.js` 中：
```js
// 改前
var RESEND_API_KEY = 're_BSMWdxmv_AVqToyXrPWaKh7wbMHQPaGtz';

// 改后
var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
```

`config.js` 中：删除 `RESEND_API_KEY` 和 `RESEND_FROM` 行（前端不需要这些配置）。

**2b. 固定 AUTH_SECRET**

```js
// 改前
var AUTH_SECRET = 'vipen-auth-secret-' + Date.now();

// 改后
var AUTH_SECRET = process.env.AUTH_SECRET || 'vipen-auth-secret-v2-2026';
```

### Step 3: signup.js 修复（P2）

**3a. 统一用户名来源**

修改 [signup.js:L307-L309](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/signup.js#L307-L309)，使用后端返回值：
```js
// 改前
Utils.setAuth({
    username: accountName.value,
    email: email.value,
    token: data.token
});

// 改后
Utils.setAuth({
    username: data.username || accountName.value,
    email: data.email || email.value,
    token: data.token
});
```

### Step 4: 验证测试

启动服务器 `node server.js`，在 signup/signin 页面完成一遍完整的注册/登录流程，确认邮箱能收到验证码。

---

## 五、文件变更清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `server.js` | 修改 | API Key 改用环境变量；固定 AUTH_SECRET |
| `js/core/config.js` | 修改 | 删除 RESEND_API_KEY / RESEND_FROM（移到 server 端） |
| `js/pages/signup.js` | 修改 | 注册成功时使用后端返回的用户名/邮箱 |
| Resend 平台 | 外部操作 | 验证 `vipen.com` 域名 |

---

## 六、前置条件

在执行任何代码修改前，**必须先完成**：
- [ ] 登录 Resend，确认 `vipen.com` 域名验证状态
- [ ] 如域名不可用，决定使用替代发件域名还是更换邮件服务

> ⚠️ **关键提醒**：如果 `vipen.com` 域名无法验证，任何代码修改都无法使邮件验证系统正常工作。域名验证是唯一阻塞项。