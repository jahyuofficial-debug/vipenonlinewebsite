# 个人账号数据归档方案

## 一、当前所有与个人账号有关的行为（完整清单）

### 1. 注册 (SignUp) — `signup.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 1.1 | 输入账号名 | `accountName` (3-10位字母数字) | 仅表单，提交后丢失 |
| 1.2 | 输入密码 | `password` (8-15位) | 仅表单，提交后丢失 |
| 1.3 | 确认密码 | `confirmPassword` | 仅表单，提交后丢失 |
| 1.4 | 输入邮箱 | `email` | 仅表单 |
| 1.5 | 发送邮箱验证码 | `email` → API `/auth/send-code` | 服务端 |
| 1.6 | 输入邮箱验证码 | `emailCode` (6位数字) | 仅表单 |
| 1.7 | 同意条款 | `agreementCheckbox` | 仅表单 |
| 1.8 | 提交注册 | `email` + `code` → API `/auth/verify-code` | 服务端 |

### 2. 登录 (SignIn) — `signin.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 2.1 | 输入邮箱 | `email` | 仅表单 |
| 2.2 | 发送验证码 | `email` → API `/auth/send-code` | 服务端 |
| 2.3 | 输入验证码 | `emailCode` (6位数字) | 仅表单 |
| 2.4 | 验证码登录 | `email` + `code` + `hash` + `ts` → API | 服务端 |
| 2.5 | 输入密码 | `password` | 仅表单 |
| 2.6 | 密码登录 | `email` + `password` → API `/auth/login` | 服务端 |
| 2.7 | 切换登录方式 | 验证码 ↔ 密码模式 | 仅 UI 状态 |

### 3. 会话管理 (Session) — `utils.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 3.1 | 写入认证信息 | `{username, email, token, loggedAt}` | `sessionStorage` → `vipen_auth` |
| 3.2 | 读取认证信息 | 同上 | `sessionStorage.getItem('vipen_auth')` |
| 3.3 | 判断登录状态 | `isLoggedIn()` | 读取 sessionStorage |
| 3.4 | 登出 | 清除认证信息 | `sessionStorage.removeItem('vipen_auth')` |

### 4. 个人资料 (Profile) — `profile.js` + `profile.html`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 4.1 | 查看/编辑显示名称 | `displayName` | `profileData` 内存对象 |
| 4.2 | 查看/编辑邮箱 | `email` | `profileData` 内存对象 |
| 4.3 | 邮箱验证 | 新邮箱 → 验证码校验 (硬编码 `123456`) | 仅 UI 模拟 |
| 4.4 | 上传/更换头像 | `avatar` (base64) | `profileData` 内存对象 |
| 4.5 | 切换社交公开状态 | `socialPublic` (true/false) | `profileData` 内存对象 |
| 4.6 | 编辑 Badge 文本 | `badge` | `profileData` 内存对象 |
| 4.7 | 绑定社交账号 | `socials.facebook.username` 等 | `profileData` 内存对象 |
| 4.8 | 保存个人资料 | `POST /api/profile/save`（无实际后端） | 请求发送但无持久化 |

### 5. 内容创作 — `profile.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 5.1 | 发布 Fresh Article | `{type, title, content, images, publishedAt, author, avatar}` | `localStorage` → `vipenPosts` |
| 5.2 | 保存 Fresh 草稿 | `{type, title, content, images, createdAt}` | `localStorage` → `vipenDrafts` |
| 5.3 | 编辑 Fresh 草稿 | 同上 | `localStorage` → `vipenDrafts` |
| 5.4 | 删除 Fresh 草稿 | — | `localStorage` → `vipenDrafts` |
| 5.5 | 发布 Action Update | `{id, type, content, images, publishedAt, author, avatar, hidden, editCount}` | `localStorage` → `vipenActionPosts` |
| 5.6 | 编辑 Action (限1次) | `{content, images, editedAt, editCount}` | `localStorage` → `vipenActionPosts` |
| 5.7 | 隐藏 Action | `{hidden: true}` | `localStorage` → `vipenActionPosts` |
| 5.8 | 删除 Action | — | `localStorage` → `vipenActionPosts` |
| 5.9 | 保存 Action 草稿 | `{type, content, images, createdAt}` | `localStorage` → `vipenActionDrafts` |
| 5.10 | 删除 Action 草稿 | — | `localStorage` → `vipenActionDrafts` |
| 5.11 | 预览文章 | — | 仅 UI |
| 5.12 | 发送文章到邮箱 | `email` (目标邮箱) | 仅 UI |

### 6. 内容互动 — `profile.js` + `main.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 6.1 | 点赞文章 | `{title, author, date}` | `localStorage` → `vipenLikedArticles` |
| 6.2 | 点赞 Disc | `{title, artist}` | `localStorage` → `vipenLikedDisc` |
| 6.3 | 对文章发表评论 | `{user, text}` | 内存 `freshItems[id].comments` |
| 6.4 | 对 Action 点赞 | `isLiked` | 内存 `actionFeed` |

### 7. 通知中心 — `notification.js`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 7.1 | 加载通知列表 | `[{id, type, read, timestamp, fromUser, ...}]` | `localStorage` → `vipen_notifications_{email}` |
| 7.2 | 标记通知已读 | `read = true` | `localStorage` → `vipen_notifications_{email}` |
| 7.3 | 全部标记已读 | — | `localStorage` → `vipen_notifications_{email}` |
| 7.4 | 发送聊天消息 | `{from, text, timestamp}` | `localStorage` → `vipen_chat_{email}` |
| 7.5 | 加载聊天记录 | 同上 | `localStorage` → `vipen_chat_{email}` |

### 8. 主题偏好 — `main.js`（不属于个人数据，全局偏好）
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 8.1 | 切换暗色/亮色主题 | `dark` / `bright` | `localStorage` → `vipen_theme`（全局，不按用户隔离） |

### 9. 路由访问控制 — `main.js`
| 序号 | 行为 | 触发条件 | 说明 |
|------|------|----------|------|
| 9.1 | 访问受保护页面 | `msg`, `action`, `design-work`, `design-work-list`, `profile` | 未登录 → 跳转登录页 |
| 9.2 | 点赞/评论拦截 | Fresh 详情页点赞/评论按钮 | 未登录 → 弹出授权提示 |
| 9.3 | 页面导航时更新认证 UI | `updateAuthUI()` | 根据登录状态显隐 signin/signup/profile 按钮 |

### 10. Manager 后台 — `data/manager/users.json`
| 序号 | 行为 | 数据字段 | 当前存储位置 |
|------|------|----------|-------------|
| 10.1 | 管理用户列表 | `{id, username, email, role, avatar, status, createdAt, lastLogin}` | `data/manager/users.json` |

---

## 二、当前数据存储架构分析

```
┌─────────────────────────────────────────────────────────┐
│                    数据存储现状                          │
├──────────────┬──────────────────────────────────────────┤
│ sessionStorage│ vipen_auth (认证令牌，会话级)            │
├──────────────┼──────────────────────────────────────────┤
│              │ vipenPosts (已发布文章)                   │
│              │ vipenDrafts (文章草稿)                    │
│              │ vipenActionPosts (已发布 Action)          │
│ localStorage │ vipenActionDrafts (Action 草稿)           │
│              │ vipenLikedArticles (点赞的文章)            │
│              │ vipenLikedDisc (点赞的 Disc)              │
│              │ vipen_notifications_{email} (通知)        │
│              │ vipen_chat_{email} (聊天记录)              │
│              │ vipen_theme (主题偏好)                     │
├──────────────┼──────────────────────────────────────────┤
│ 内存对象     │ profileData (当前用户资料)                │
│              │ actionFeed (Action 动态流)                │
│              │ freshItems.comments (评论)                │
├──────────────┼──────────────────────────────────────────┤
│ JSON 文件    │ data/profile.json (静态资料模板)          │
│              │ data/manager/users.json (后台用户管理)     │
├──────────────┼──────────────────────────────────────────┤
│ 服务端 API   │ /api/auth/send-code (发送验证码)          │
│              │ /api/auth/verify-code (验证验证码)        │
│              │ /api/auth/login (密码登录)                 │
│              │ /api/profile/save (保存资料，无后端实现)    │
└──────────────┴──────────────────────────────────────────┘
```

### 当前问题

1. **数据分散**：同一用户的数据散落在 sessionStorage、localStorage 的多个 key、内存对象、JSON 文件中，没有统一的数据模型。
2. **无可移植性**：localStorage 仅存在于当前浏览器，换设备/浏览器后所有数据丢失。
3. **无用户隔离**：`vipenPosts`、`vipenDrafts` 等 key 是全局的，不区分用户——当前因为只有一个用户使用所以没暴露问题，但多用户登录时数据会混乱。
4. **profileData 不持久化**：编辑显示名称、头像、社交绑定等操作后，刷新页面即丢失（因为没有真正写入 localStorage 或后端）。
5. **邮箱验证硬编码**：`profile.js` 中邮箱验证码固定为 `"123456"`，仅用于 UI 演示。
6. **数据冗余**：`profileData` 内存对象和 `sessionStorage.vipen_auth` 都存储了 username/email，但不同步。
7. **通知/聊天数据与用户绑定不完整**：通过 `vipen_notifications_{email}` 做了用户隔离，但其他数据（posts、drafts、likes）没有。

---

## 三、建议：哪些行为应记录到个人数据中

### 原则

1. **可移植性**：用户数据应能在不同设备/浏览器间恢复。
2. **用户隔离**：每个用户的数据必须通过唯一标识（userId/email）隔离。
3. **最小化原则**：只记录必要的个人数据，UI 临时状态不记录。
4. **安全性**：密码、Token 等敏感数据不应明文持久化。

### 建议记录清单

| 优先级 | 类别 | 行为 | 数据字段 | 建议存储方式 | 理由 |
|--------|------|------|----------|-------------|------|
| P0 | 身份 | 登录凭证 | `token` | sessionStorage（当前不变） | 安全考虑，会话级即可 |
| P0 | 身份 | 用户基本信息 | `userId, username, email, avatar, role, createdAt` | 服务端 DB + 客户端缓存 | 核心身份数据，必须持久化 |
| P1 | 资料 | 显示名称 | `displayName` | `localStorage` `vipen_user_{id}` | 用户自定义，需跨会话保留 |
| P1 | 资料 | 头像 | `avatar` | `localStorage` `vipen_user_{id}` | 用户自定义 |
| P1 | 资料 | 社交公开状态 | `socialPublic` | `localStorage` `vipen_user_{id}` | 用户偏好 |
| P1 | 资料 | Badge 文本 | `badge` | `localStorage` `vipen_user_{id}` | 用户自定义 |
| P1 | 资料 | 社交账号绑定 | `socials.{platform}.username` | `localStorage` `vipen_user_{id}` | 用户社交关联 |
| P2 | 内容 | 已发布文章 | `posts[]` | `localStorage` `vipen_posts_{id}` | 用户创作内容 |
| P2 | 内容 | 文章草稿 | `drafts[]` | `localStorage` `vipen_drafts_{id}` | 用户创作内容 |
| P2 | 内容 | 已发布 Action | `actionPosts[]` | `localStorage` `vipen_actions_{id}` | 用户创作内容 |
| P2 | 内容 | Action 草稿 | `actionDrafts[]` | `localStorage` `vipen_actionDrafts_{id}` | 用户创作内容 |
| P2 | 互动 | 点赞的文章 | `likedArticles[]` | `localStorage` `vipen_likes_{id}` | 用户互动历史 |
| P2 | 互动 | 点赞的 Disc | `likedDisc[]` | `localStorage` `vipen_likes_{id}` | 用户互动历史 |
| P2 | 互动 | 发表的评论 | `comments[]` | `localStorage` `vipen_comments_{id}` | 用户互动历史 |
| P3 | 通知 | 通知列表 | `notifications[]` | `localStorage` `vipen_notifications_{id}` | 已按 email 隔离，改为 userId |
| P3 | 消息 | 聊天记录 | `chatMessages{}` | `localStorage` `vipen_chat_{id}` | 已按 email 隔离，改为 userId |

### 不建议记录的行为

| 行为 | 理由 |
|------|------|
| 密码 | 安全红线，永远不存客户端 |
| 验证码 | 临时凭证，过期即失效 |
| 表单临时输入 | UI 状态，无持久化价值 |
| 登录方式偏好 (验证码/密码) | 纯 UI 切换，无需记录 |
| 确认密码 | 仅用于前端校验，不存储 |
| 条款同意状态 | 注册时一次性，无需记录 |
| 预览临时数据 | 仅 UI 预览，无持久化价值 |
| 发送邮件目标地址 | 临时操作参数，不记录 |

---

## 四、推荐的数据模型设计

### 4.1 统一用户数据模型

```json
{
  "userId": "u001",
  "username": "jahyuofficial",
  "email": "jahyuofficial@gmail.com",
  "role": "ManagerGo",
  "profile": {
    "displayName": "Jah 72",
    "avatar": "https://...",
    "badge": "Social Public",
    "socialPublic": true,
    "socials": {
      "facebook": { "username": null },
      "instagram": { "username": null },
      "x": { "username": null },
      "wechat": { "username": null }
    }
  },
  "stats": {
    "createdAt": "2026-01-15T08:00:00Z",
    "lastLogin": "2026-05-30T12:00:00Z"
  }
}
```

### 4.2 localStorage Key 命名规范

将所有用户数据统一收敛到一个 key 下：

```
vipen_user_{userId}  → 用户资料 + 偏好
vipen_posts_{userId}  → 已发布文章
vipen_drafts_{userId}  → 文章草稿
vipen_actions_{userId}  → 已发布 Action
vipen_actionDrafts_{userId}  → Action 草稿
vipen_likes_{userId}  → 点赞记录（文章 + Disc）
vipen_notifications_{userId}  → 通知列表
vipen_chat_{userId}  → 聊天记录
```

### 4.3 数据读写工具函数

在 `utils.js` 中新增：

```js
getUserData: function(key) {
    var auth = this.getAuth();
    if (!auth) return null;
    var userId = auth.username || auth.email;
    var raw = localStorage.getItem('vipen_' + key + '_' + userId);
    try { return JSON.parse(raw); } catch(e) { return null; }
},
setUserData: function(key, data) {
    var auth = this.getAuth();
    if (!auth) return;
    var userId = auth.username || auth.email;
    localStorage.setItem('vipen_' + key + '_' + userId, JSON.stringify(data));
}
```

---

## 五、实施步骤

### 阶段一：数据模型统一（核心）
1. 在 `utils.js` 中添加 `getUserData()` / `setUserData()` 工具函数
2. 修改 `profile.js`，将 `profileData` 改为从 `vipen_user_{userId}` 读写
3. 修改 `profile.js` 中各类编辑操作（名称、头像、社交、Badge），改为调用 `Utils.setUserData()` 持久化
4. 修改 `profile.js` 中 `saveProfileData()` 函数，改为写入 localStorage（现有 `/api/profile/save` 无后端实现）

### 阶段二：用户数据隔离
5. 将 `vipenPosts` → `vipen_posts_{userId}`
6. 将 `vipenDrafts` → `vipen_drafts_{userId}`
7. 将 `vipenActionPosts` → `vipen_actions_{userId}`
8. 将 `vipenActionDrafts` → `vipen_actionDrafts_{userId}`
9. 将 `vipenLikedArticles` + `vipenLikedDisc` → `vipen_likes_{userId}`

### 阶段三：通知和聊天优化
10. 将 `vipen_notifications_{email}` → `vipen_notifications_{userId}`（统一用 userId 而非 email）
11. 将 `vipen_chat_{email}` → `vipen_chat_{userId}`

### 阶段四：登录/登出行为完善
12. 登录时：从 localStorage 加载用户数据到内存
13. 登出时：清除 sessionStorage 认证信息，保留 localStorage 用户数据
14. 切换账号时：正确加载新用户的数据

### 阶段五：迁移兼容
15. 添加数据迁移逻辑：首次加载时检测旧 key 格式，自动迁移到新格式
16. 保留旧 key 一段时间，确保不丢失用户数据

---

## 六、总结

当前项目有 **约 40 个** 与个人账号直接相关的行为，其中：
- **建议记录到个人数据**：约 22 个行为（用户资料、内容、互动、通知）
- **不建议记录**：约 18 个行为（密码、验证码、临时 UI 状态、一次性操作、主题偏好）

核心改进方向：
1. **统一数据模型**：将散落的 profileData 收敛到 `vipen_user_{userId}`
2. **用户隔离**：所有 localStorage key 都带上 userId
3. **持久化**：profile 编辑操作（名称、头像、社交等）改为写入 localStorage
4. **工具函数**：提供 `Utils.getUserData()` / `Utils.setUserData()` 统一入口