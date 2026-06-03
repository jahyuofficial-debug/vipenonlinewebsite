# AUTH\_SECRET 兼容迁移方案

## 问题总结

当前改动将 AUTH\_SECRET 从固定值改为随机生成 → 所有已存储的密码/PIN 哈希无法通过验证。

### 现有数据

| 数据文件         | 内容                      | 旧密钥           |
| ------------ | ----------------------- | ------------- |
| `users.json` | 2 个用户，含 `passwordHash`  | 本地 `''`（空字符串） |
| `pins.json`  | 1 个管理员 PIN，含 `pin_hash` | 本地 `''`（空字符串） |

### HMAC 使用点分类

| 类型                          | 使用点                     | 是否持久化             | 迁移需求   |
| --------------------------- | ----------------------- | ----------------- | ------ |
| 验证码 HMAC（`email\|code\|ts`） | send-code / verify-code | 否（仅一次会话内有效）       | 不需要    |
| 密码哈希（`email\|password`）     | login / register        | 是（存 `users.json`） | **需要** |
| PIN 哈希（`manager_pin_+pin`）  | hashPIN                 | 是（存 `pins.json`）  | **需要** |

***

## 方案：双密钥验证 + 自动迁移

### 核心思路

验证时**先用新密钥、再回退旧密钥**。命中旧密钥则自动迁移到新密钥。

```
┌──────────┐   新密钥哈希   ┌──────────┐
│ 用户输入  │ ───────────→ │ 对比存储  │ → 匹配 → 通过
│ 密码/PIN │              │ 哈希      │
└──────────┘              └──────────┘
                               ↓ 不匹配
                         旧密钥哈希
                               ↓
                         对比存储哈希
                               ↓
                    匹配 → 用新密钥重哈希并存盘 → 通过
                    不匹配 → 拒绝
```

### 关键：旧密钥不能硬编码在源码中

旧密钥通过以下优先级获取（`secret.js` 新增 `getOldAuthSecret()`）：

| 优先级 | 来源                     | 说明                                          |
| --- | ---------------------- | ------------------------------------------- |
| 1   | `OLD_AUTH_SECRET` 环境变量 | 生产环境设置                                      |
| 2   | `.old_auth_secret` 文件  | 本地开发，已加入 `.gitignore`                       |
| 3   | `''`（空字符串）             | **仅用于 server.js 场景的兜底**（旧 server.js 就是空字符串） |

> 优先级 3 不是真正的"硬编码密钥"——空字符串本就不是秘密，它只是本地 dev server 之前的状态。这是唯一一处保留的默认值，且仅用于**读取**旧哈希。

***

## 需修改的文件

### 1. `api/auth/secret.js` — 新增 `getOldAuthSecret()`

```js
var OLD_SECRET_FILE = path.join(process.cwd(), '.old_auth_secret');

function getOldAuthSecret() {
    if (process.env.OLD_AUTH_SECRET !== undefined) {
        return process.env.OLD_AUTH_SECRET;
    }
    try {
        var val = fs.readFileSync(OLD_SECRET_FILE, 'utf8').trim();
        if (val) return val;
    } catch(e) {}
    return '';  // 兼容旧 server.js（本地 dev 就是空字符串）
}

module.exports = { getAuthSecret: getAuthSecret, getOldAuthSecret: getOldAuthSecret };
```

### 2. `server.js` — 修改 3 个验证点

#### 2.1 `handleLogin()` — 密码登录验证（约第 307 行）

```js
var getOldAuthSecret = require('./api/auth/secret').getOldAuthSecret;

// 在 handleLogin 中：
var newHash = crypto.createHmac('sha256', getAuthSecret()).update(email + '|' + password).digest('hex');
var oldSecret = getOldAuthSecret();
var inputHash;

if (/* newHash 匹配 */) {
    // 通过
} else if (oldSecret) {
    var oldHash = crypto.createHmac('sha256', oldSecret).update(email + '|' + password).digest('hex');
    if (/* oldHash 匹配 */) {
        // 迁移：用新密钥重哈希并存盘
        matchedUser.passwordHash = newHash;
        writeManagerJSON('users.json', users, ...);
    } else {
        // 都不匹配 → 拒绝
    }
}
```

#### 2.2 `hashPIN()` — 改为接受旧密钥参数（约第 554 行）

验证时同时用新旧密钥计算哈希。设置新 PIN 时仅用新密钥。

#### 2.3 PIN 验证逻辑（约第 574 行）

在 `handleManagerVerifyPin()` 中：先用新密钥哈希 → 不匹配则用旧密钥哈希 → 匹配则迁移到新密钥。

### 3. `api/auth/login.js` — 密码登录（Vercel 版，约第 81 行）

```js
var getOldAuthSecret = require('./secret').getOldAuthSecret;

var newHash = crypto.createHmac('sha256', getAuthSecret()).update(email + '|' + password).digest('hex');
var oldSecret = getOldAuthSecret();

if (users[i].passwordHash === newHash) {
    matchedUser = users[i];
} else if (oldSecret) {
    var oldHash = crypto.createHmac('sha256', oldSecret).update(email + '|' + password).digest('hex');
    if (users[i].passwordHash === oldHash) {
        matchedUser = users[i];
        // 注意：api/auth/login.js 不写 users.json，迁移仅在 server.js 中执行
        // Vercel 上的迁移需通过 server.js 的 handleVerifyCode 完成
    }
}
```

### 4. `.gitignore` — 新增排除项

```
.old_auth_secret
```

***

## 对用户的影响

### 两个核心保障

**保障 1：密码永久有效**

* 用户注册后，密码哈希用 `.auth_secret`（本地文件）或 `AUTH_SECRET`（环境变量）计算并持久化到 `users.json`

* `.auth_secret` 文件在项目根目录，已加入 `.gitignore`，不会被覆盖或提交

* 只要不手动删除 `.auth_secret` 文件（或清除 `AUTH_SECRET` 环境变量），密码**永远有效**

* 用户主动修改密码时，仅在那一刻用当前密钥重新哈希

* 换句话说：密钥稳定 = 密码永久有效，不需要任何额外操作

**保障 2：PIN 仅 ManagerGo 可管理，永久有效**

* 现有代码已强制校验：只有 `role === 'ManagerGo'` 的用户才能验证/设置 PIN（[server.js#L591](file:///d:/设计文档/TareProcess/Vipen2.0/server.js#L591)、[server.js#L668](file:///d:/设计文档/TareProcess/Vipen2.0/server.js#L668)）

* 普通用户（Viper 角色）无权访问 PIN 相关接口

* PIN 哈希同样依赖 `.auth_secret`，密钥不变则 PIN 不变

* 不主动修改则永久有效

### 本地开发

* **已有账号登录**：首次登录时自动用旧密钥验证 → 密码被新密钥重哈希 → 后续自动使用新密钥

* **PIN 登录**：同理，首次验证时自动迁移

* **验证码登录**：无影响

* **新注册**：直接用新密钥哈希

### Vercel 生产环境

* 需在 Vercel 控制台设置两个环境变量：

  * `AUTH_SECRET` = 新的强随机密钥

  * `OLD_AUTH_SECRET` = `vipen-auth-secret-v2-2026`（旧值，迁移完成后可删除）

* 首次登录成功后自动迁移

***

## 执行步骤

1. 修改 `api/auth/secret.js`：新增 `getOldAuthSecret()`
2. 修改 `server.js`：3 处验证点加入旧密钥回退 + 自动迁移
3. 修改 `api/auth/login.js`：1 处验证点加入旧密钥回退
4. 更新 `.gitignore`
5. 重启服务，测试已有账号密码登录
6. 测试 PIN 验证
7. 验证迁移后 `users.json` 和 `pins.json` 的哈希已更新
8. 确认无误后同步至仓库

