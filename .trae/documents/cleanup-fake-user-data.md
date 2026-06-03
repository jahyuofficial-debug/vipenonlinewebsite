# 虚假用户数据清理计划

## 概述

清除项目中所有虚假/占位用户数据和硬编码凭证，为网站上线做准备。策略：保留现有数据结构和品牌名（VipenOnline、Design By Jah72），清空所有假用户内容，移除安全风险代码。

---

## 变更清单

### 一、安全风险修复（最高优先级）

#### 1. [server.js](file:///d:/设计文档/TareProcess/Vipen2.0/server.js)

**问题**：硬编码了测试账号密码（`jjz889527`）、默认 PIN 码（`145982`）、PIN 认证后门。

**变更**：
- **删除** 第 16 行 `var DEFAULT_PIN = '145982';`
- **删除** 第 46-52 行 `TEST_ACCOUNTS` 对象（含明文密码 `jjz889527`）
- **删除** 第 638-650 行 — 使用 `DEFAULT_PIN` 自动创建 PIN 记录的后门逻辑
- **删除** 第 656-659 行 — 使用 `DEFAULT_PIN` 绕过 PIN 验证的后门逻辑
- PIN 认证改为：无 PIN 记录 → 返回"PIN not set up"；PIN 不匹配 → 返回"Invalid PIN"

---

### 二、数据文件清空

#### 2. [data/manager/users.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/manager/users.json)

清空为 `[]`（移除 u001-u006 全部 6 个假用户）

#### 3. [data/manager/pins.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/manager/pins.json)

清空为 `[]`（移除 u001 的 PIN 记录）

#### 4. [data/manager/logs.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/manager/logs.json)

清空为 `[]`（移除所有含 `jahyuofficial` 的管理日志）

#### 5. [data/manager/settings.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/manager/settings.json)

- 第 2 行：`"contact": "Jahyuofficial@gmail.com"` → `"contact": "contact@vipenonline.com"`（与 contactEmail 保持一致）
- 其余不变（品牌名保留）

#### 6. [data/profile.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/profile.json)

将 `displayName` 清空，`email` 清空，`avatar` 设为空字符串：

```json
{
  "displayName": "",
  "email": "",
  "avatar": "",
  "badge": "",
  "socialPublic": false
}
```

#### 7. [data/action.json](file:///d:/设计文档/TareProcess/Vipen2.0/data/action.json)

清空为 `[]`（移除全部 40 条以 `Chen Mobai` 为主体的假 Action）

#### 8. [data.json](file:///d:/设计文档/TareProcess/Vipen2.0/data.json)（fallback 数据）

将 `action` 字段对应的数组清空为 `[]`。其余字段（banner / fresh / design / disc）保留原始内容结构（这些是内容数据，非用户数据）。

---

### 三、JS 代码清理

#### 9. [js/pages/profile.js](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/profile.js)

**问题**：硬编码了 `Jah 72`、`jahyuofficial@gmail.com` 等假默认值；`initMockLikes()` 初始化假点赞数据。

**变更**：

修改 `profileData` 默认值（第 22-33 行）：

```js
var profileData = {
    displayName: '',
    email: '',
    avatar: '',
    badge: '',
    socialPublic: false,
    socials: {
        facebook: { username: null },
        instagram: { username: null },
        x: { username: null }
    }
};
```

删除 `initMockLikes()` 函数**定义**（第 1136-1155 行）及其所有**调用**。同时移除 `bindAll()` 中对其的调用。

#### 10. [js/pages/design.js](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/design.js)

第 395 行：`email: 'jahyuofficial@gmail.com'` 硬编码在 PIN 验证请求中。

**变更**：改为从 `Utils.getAuth()` 动态获取当前登录用户的邮箱：

```js
var auth = Utils.getAuth();
var email = auth ? (auth.email || '') : '';
// ...
body: JSON.stringify({ pin: val, email: email })
```

#### 11. [js/components/notification.js](file:///d:/设计文档/TareProcess/Vipen2.0/js/components/notification.js)

`getMockData()` 函数（第 70-90 行）返回 11 条假通知。

**变更**：改为返回空数组：

```js
function getMockData() {
    return [];
}
```

---

### 四、HTML 清理

#### 12. [profile.html](file:///d:/设计文档/TareProcess/Vipen2.0/profile.html)

**问题**：HTML 中硬编码了 `Jah 72`、`jahyuofficial@gmail.com`、假头像 URL 等。

**变更**（保留元素结构，清空占位文本和 src）：

| 行号 | 元素 | 变更 |
|------|------|------|
| 22 | `<img src="..." id="profileAvatarImg">` | `src` 设为空 `""` |
| 29 | `<h1 id="profileDisplayName">Jah 72</h1>` | 文本改为空 |
| 30 | `<p id="profileEmail">jahyuofficial@gmail.com</p>` | 文本改为空 |
| 32 | `<div id="profileBadge">Social Public</div>` | 文本改为空 |
| 172 | `<img id="actionEditorAvatar" src="...">` | `src` 设为空 `""` |
| 173 | `<span id="actionEditorUsername">Jah 72</span>` | 文本改为空 |

---

## 不变更的文件

以下文件已确认不含假用户数据，无需修改：

- `data/fresh.json` — 内容数据，非用户数据
- `data/design.json` — 设计作品数据，非用户数据
- `data/disc.json` — 唱片数据，非用户数据
- `data/banner.json` — Banner 配置，非用户数据
- `data/home-banner.json` — 品牌名保留不动
- `signin.html` — 无硬编码默认值
- `signup.html` — 无硬编码默认值
- `index.html` — 品牌名保留不动
- `js/main.js` — 路由调度，无假数据
- `js/core/config.js` — 配置参数
- `js/core/utils.js` — 工具函数
- 其他 `js/pages/*.js` 文件 — 不含假用户信息

---

## 验证步骤

1. 启动本地服务器 `node server.js`，确认无报错
2. 打开 `http://localhost:3000`，确认 Fresh / Action / Disc 页面正常加载（Action 区域显示空状态）
3. 打开 Profile 页面，确认显示空白表单而非假用户信息
4. 打开通知面板，确认无假通知
5. 测试 ManagerGo PIN 登录：无预设用户时，应显示"Access denied"
6. 确认品牌名 VipenOnline、Design By Jah72 在首页正常显示
