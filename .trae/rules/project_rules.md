# Vipen Project Rules

## Preview Rule

**每次修改代码后，必须启动本地服务器预览效果并提供预览地址给用户。**

- 使用 `node server.js` 在项目目录启动 HTTP 服务（端口 3000）
- 通过 OpenPreview 工具打开预览页面
- 在回复中明确给出预览地址：`http://localhost:3000`
- 若服务已在运行中，直接提供地址即可

---

## Git 仓库同步

**GitHub 仓库地址：** `https://github.com/jahyuofficial-debug/vipenonlinewebsite.git`

当用户说"同步至仓库"或类似表达时，执行以下操作：

```bash
git add -A
git commit -m "sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push origin main
```

- 若远程仓库尚未关联，先执行 `git remote add origin https://github.com/jahyuofficial-debug/vipenonlinewebsite.git`
- 若推送因冲突失败，先 `git pull origin main --rebase` 再推送

### 隐私安全检查

**核心原则：AI 只负责扫描和报告，最终决策权完全交给用户。绝不替用户做任何推送决定。**

**同步前必须扫描待提交文件，如发现以下隐私敏感内容，立即暂停并通知用户确认：**

- **密钥 / Token / 密码**：API Key、Access Token、数据库密码、JWT Secret 等
- **个人身份信息**：真实姓名、身份证号、手机号、邮箱地址、家庭住址
- **配置文件中的敏感信息**：`.env` 文件、含密钥的 `config.js`、数据库连接字符串
- **证书文件**：`.pem`、`.key`、`.crt`、`.p12` 等
- **`node_modules/` 目录**：应通过 `.gitignore` 排除，避免提交大量第三方依赖

**处理流程：**

1. 执行 `git add -A` 前先 `git status` 查看待提交文件列表
2. 逐一检查新增/修改文件内容，确认无隐私泄露风险
3. 若发现敏感文件，**必须逐一列出文件清单，并详细说明每个隐患的潜在后果**（如：密钥泄露可能导致 API 额度被盗用、账号被恶意操控；个人身份信息泄露可能导致身份冒用；node_modules 泄露可能暴露依赖漏洞等）
4. **将决策权完全交给用户**，以明确选项形式征求用户意见（如：`是否排除 xxx 文件后继续推送？`），**用户未明确同意前，绝对不执行推送**
5. 若用户取消推送，协助创建 `.gitignore` 排除相关文件
6. **事后补救**：若用户确认某些敏感文件已被误推送到远程，提醒用户立即在 GitHub 上撤销该提交并轮换相关密钥/Token

---

## 一、目录约定（严格遵守）

```
Vipen2.0/
├── css/
│   ├── reset.css          # 全局重置，非必要不修改
│   ├── utilities.css       # 通用原子类 (.fw-600, .f-14 等)
│   ├── layout.css          # 全局布局：header / loading / cursor / drawer
│   ├── mini-player.css     # MiniPlayer 组件样式
│   └── pages/              # 每个页面独立一个 CSS 文件
│       └── xxx.css
├── js/
│   ├── core/               # 核心工具（不依赖任何页面）
│   │   ├── config.js       # 所有魔法数字放这里
│   │   └── utils.js        # 纯工具函数
│   ├── components/          # 可复用 UI 组件（不依赖任何页面）
│   │   └── xxx.js
│   ├── pages/              # 每个页面独立一个 JS，使用 IIFE 模块模式
│   │   └── xxx.js
│   └── main.js             # 入口：初始化 + 路由调度 + 全局事件绑定
├── data/                   # 页面 Mock 数据（JSON），每个页面一个文件
├── images/ banner/ audio/ Disc/  # 静态资源
├── index.html / signin.html / signup.html / profile.html  # 入口 HTML
└── server.js               # 本地 Node 服务器
```

### 铁律

1. **不放错目录就是最好的重构。** 新文件必须归入对应目录。
2. **页面 CSS → `css/pages/`，页面 JS → `js/pages/`，页面数据 → `data/`**，三者命名保持一致（如 `fresh.css` / `fresh.js` / `fresh.json`）。
3. `js/core/` 和 `js/components/` 禁止引用任何页面模块，只能被引用。
4. **禁止在 `js/core/` 或 `js/components/` 中操作 DOM by id** ——它们只能接收参数或操作传入的容器元素。

---

## 二、JS 代码规范

### 2.1 模块模式

页面和组件一律使用 **IIFE 模块模式**，对外暴露返回对象：

```js
var FreshPage = (function() {
    'use strict';
    // 私有变量
    var heroCurrent = 0;

    // 私有函数
    function buildCards() { ... }

    // 公开 API
    return {
        buildPage: function() { ... },
        bindAll: function() { ... },
        setData: function(data) { ... }
    };
})();
```

- **全局命名空间**：页面模块命名为 `XxxPage`（如 `FreshPage`、`DiscPage`），组件命名为 `Xxx`（如 `MiniPlayer`、`Cursor`）。
- **数据驱动**：每个页面模块必须提供 `setData(data)` / `buildPage()` / `bindAll()` 三件套。

### 2.2 数据与逻辑分离

- **严禁在 main.js 中硬编码超过 5 行的 Mock 数据。**
- 数据统一放在 `data/*.json`，main.js 通过 `fetch()` 加载。
- main.js 中只保留路由调度、全局事件绑定、模块初始化——**不做页面渲染**。

### 2.3 配置集中

所有可调参数（间隔时间、尺寸、阈值）必须定义在 `js/core/config.js` 的 `CONFIG` 对象中：

```js
var CONFIG = {
    BANNER_INTERVAL: 4000,
    FRESH_HERO_INTERVAL: 5000,
    ...
};
```

代码中 **禁止出现裸魔法数字**。

### 2.4 工具函数

- `js/core/utils.js` 只放**纯函数**（不依赖外部状态、不操作 DOM）。
- 重复出现的逻辑（如 `formatTime`、`throttle`）必须提取到 `Utils`。

### 2.5 路由与导航

- 路由集中在 `main.js` 的 `handleRoute()` 中分发。
- `navigateTo()` 函数中每个 case 的重复模式应抽取为辅助函数，**禁止每个 page 写 10 行重复的 DOM 操作代码**。
- 添加新页面时：只需在 `navigateTo` 中加一个 case，调用 `XxxPage.buildPage()` + `XxxPage.bindAll()`。

### 2.6 避免全局污染

- **禁止新增裸全局变量**。页面模块使用 `var XxxPage` 挂载到 window 已是约定上限。
- 临时状态变量尽量收敛到对应模块的 IIFE 闭包中。
- `main.js` 中现有的全局变量应在后续迭代中逐步迁移到模块内部。

---

## 三、CSS 代码规范

### 3.1 分层原则

| 文件 | 职责 | 修改频率 |
|------|------|----------|
| `reset.css` | 全局标签重置 + 滚动条 | 极少 |
| `utilities.css` | 原子工具类 | 按需追加 |
| `layout.css` | header / loading / cursor / drawer / menu 等全局 UI | 低频 |
| `mini-player.css` | MiniPlayer 组件 | 中频 |
| `pages/xxx.css` | 单页面样式，用 `#page-xxx` 或 `.xxx-page` 包裹 | 高频 |

### 3.2 页面样式隔离

每个页面的 CSS 必须使用**页面级命名空间**包裹，防止样式泄漏：

```css
/* pages/fresh.css */
.fresh-page { ... }
.fresh-page .fresh-hero-carousel { ... }
```

- 禁止在页面 CSS 中直接覆盖全局元素（如直接写 `header { ... }`）。
- 禁止在页面 CSS 中使用 `!important`。

### 3.3 rem 单位约定

项目基准：**1920px 设计稿 → `html { font-size: calc(100vw / 19.2) }`**

- 所有尺寸使用 `rem`，换算公式：`设计稿 px / 100 = rem`
- 例：设计稿 24px → `0.24rem`

### 3.4 禁止事项

- 禁止在 HTML 元素上写内联 `<style>`。
- 禁止大量嵌套（最多 3 层）。
- 同一样式在两个文件中重复出现 → 抽到 `layout.css` 或对应组件文件。

---

## 四、HTML 规范

- 每个页面仅引入**该页面需要的** CSS 和 JS 文件，不要全量加载。
- `<script>` 引用顺序：`core/` → `components/` → `pages/` → `main.js`。
- 语义化标签优先（`<section>` / `<nav>` / `<header>`），避免纯 `<div>` 堆砌。

---

## 五、禁止的行为（防屎山十条）

1. ❌ **不要在 main.js 中追加超过 30 行的新函数** → 新功能归入对应页面模块或组件。
2. ❌ **不要跨页面直接操作其他页面的 DOM** → 通过路由或事件通信。
3. ❌ **不要复制粘贴代码** → 出现 3 次以上的逻辑必须提取为函数。
4. ❌ **不要写超过 200 行的单文件** → 超过则拆分为子模块。
5. ❌ **不要在 CSS 中用 ID 选择器写样式** → ID 留给 JS，CSS 用 class。
6. ❌ **不要在页面 JS 中 hardcode 数据对象** → 放 `data/` 目录。
7. ❌ **不要在没有命名空间的情况下添加全局 CSS** → 页面样式必须包裹在页面 class 下。
8. ❌ **不要跳过 `'use strict'`** → 每个 IIFE 模块第一行写。
9. ❌ **不要引入新依赖** → 本项目是纯 Vanilla JS，禁止引入 jQuery / React / Vue 等。
10. ❌ **不要写注释** → 代码即文档，函数命名自解释。

---

## 六、代码风格速查

```js
// 模块声明
var ModuleName = (function() {
    'use strict';
    ...
    return { ... };
})();

// 命名规范
// 变量：camelCase  → heroCurrent, miniPlayer
// 模块/命名空间：PascalCase → FreshPage, MiniPlayer
// CSS class：kebab-case → .fresh-hero-carousel
// CSS id：camelCase  → #miniPlayerVinyl

// 条件判断
if (!el) return;           // 提前 return，减少嵌套

// 事件绑定
el.addEventListener('click', function(e) {
    e.stopPropagation();
    ...
});

// 数据获取
fetch('data/xxx.json')
    .then(function(r) { return r.json(); })
    .then(function(d) { XxxPage.setData(d); })
    .catch(function() { console.log('Using fallback data'); });
```

---

## 七、UI 资源选型

### 7.1 Icon 图标

**所有图标统一从 Lucide 选取：** `https://lucide.dev?utm_source=chatgpt.com`

- 需要图标时，直接去 Lucide 搜索对应的图标名称，使用其 SVG 或图标名称引用。
- 禁止从其他图标库（如 Font Awesome、Material Icons）混入图标。

### 7.2 组件

**所有 UI 组件统一从 shadcn/ui 选取：** `https://ui.shadcn.com/`

- 设计新功能或新页面时，先查看 shadcn/ui 中是否有合适的组件。
- 组件风格、交互模式参考 shadcn/ui 的设计语言。

---

## 八、用户行为数据规范

**触发条件：** 当用户说"此为用户行为"或"用户行为数据"时，按以下规则处理。

### 8.1 核心原则

1. **数据归属用户**：所有用户行为数据必须通过 `userId` 隔离，禁止全局共享。
2. **持久化优先**：用户创作的内容、偏好、互动记录必须写入 `localStorage`，刷新不丢失。
3. **最小化原则**：只记录必要的个人数据，UI 临时状态不记录。
4. **安全性**：密码、Token 等敏感数据绝不写入 `localStorage`（Token 仅存 `sessionStorage`）。

### 8.2 用户行为数据分类

#### ✅ 必须记录到用户个人数据的行为

| 类别 | 行为 | 数据字段 | 存储位置 |
|------|------|----------|----------|
| 身份 | 登录凭证 | `token` | `sessionStorage` → `vipen_auth` |
| 身份 | 用户基本信息 | `userId, username, email, avatar, role` | `localStorage` → `vipen_user_{userId}` |
| 资料 | 显示名称 | `displayName` | `localStorage` → `vipen_user_{userId}` |
| 资料 | 头像 | `avatar` | `localStorage` → `vipen_user_{userId}` |
| 资料 | 社交公开状态 | `socialPublic` | `localStorage` → `vipen_user_{userId}` |
| 资料 | Badge 文本 | `badge` | `localStorage` → `vipen_user_{userId}` |
| 资料 | 社交账号绑定 | `socials.{platform}.username` | `localStorage` → `vipen_user_{userId}` |
| 内容 | 已发布文章 | `posts[]` | `localStorage` → `vipen_posts_{userId}` |
| 内容 | 文章草稿 | `drafts[]` | `localStorage` → `vipen_drafts_{userId}` |
| 内容 | 已发布 Action | `actionPosts[]` | `localStorage` → `vipen_actions_{userId}` |
| 内容 | Action 草稿 | `actionDrafts[]` | `localStorage` → `vipen_actionDrafts_{userId}` |
| 互动 | 点赞的文章 | `likedArticles[]` | `localStorage` → `vipen_likes_{userId}` |
| 互动 | 点赞的 Disc | `likedDisc[]` | `localStorage` → `vipen_likes_{userId}` |
| 互动 | 发表的评论 | `comments[]` | `localStorage` → `vipen_comments_{userId}` |
| 通知 | 通知列表 | `notifications[]` | `localStorage` → `vipen_notifications_{userId}` |
| 消息 | 聊天记录 | `chatMessages{}` | `localStorage` → `vipen_chat_{userId}` |

#### ❌ 禁止记录到用户个人数据的行为

| 行为 | 理由 |
|------|------|
| 密码 | 安全红线，永远不存客户端 |
| 验证码 | 临时凭证，过期即失效 |
| 表单临时输入 | UI 状态，无持久化价值 |
| 登录方式偏好（验证码/密码） | 纯 UI 切换，无需记录 |
| 确认密码 | 仅用于前端校验，不存储 |
| 条款同意状态 | 注册时一次性，无需记录 |
| 预览临时数据 | 仅 UI 预览，无持久化价值 |
| 发送邮件目标地址 | 临时操作参数，不记录 |
| 主题偏好（暗色/亮色） | 全局偏好，不属于个人数据，存 `localStorage` → `vipen_theme`（不按用户隔离） |

### 8.3 统一用户数据模型

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

### 8.4 localStorage Key 命名规范

所有用户数据 key 必须包含 `userId` 以隔离不同用户：

```
vipen_user_{userId}           → 用户资料
vipen_posts_{userId}          → 已发布文章
vipen_drafts_{userId}         → 文章草稿
vipen_actions_{userId}        → 已发布 Action
vipen_actionDrafts_{userId}   → Action 草稿
vipen_likes_{userId}          → 点赞记录（文章 + Disc 合并）
vipen_notifications_{userId}  → 通知列表
vipen_chat_{userId}           → 聊天记录
```

### 8.5 数据读写工具函数

在 `js/core/utils.js` 中提供统一入口：

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

### 8.6 新功能开发检查清单

当开发涉及用户行为的新功能时，必须逐项确认：

1. 该行为是否属于用户个人数据？（对照 8.2 节分类）
2. 若是，使用了哪个 localStorage key？是否带 `userId` 后缀？
3. 是否通过 `Utils.getUserData()` / `Utils.setUserData()` 读写？
4. 登出时是否保留用户数据？（只清除 sessionStorage，不清除 localStorage）
5. 切换账号时是否正确加载新用户数据？
6. 是否添加了旧数据迁移逻辑（如从旧 key 格式迁移）？

---

## 九、Vercel 部署规范

**核心原则：一切以网站上线为主。部署目标平台为 Vercel。**

### 9.1 项目即站点

- 本项目根目录即为 Vercel 部署的站点根目录，所有入口 HTML 文件（`index.html`、`signin.html` 等）必须位于项目根目录。
- 静态资源（`css/`、`js/`、`images/` 等目录）保持现有层级，**不要移动到 `/public` 或其他子目录**。
- 新增的页面 HTML 文件直接放在项目根目录，与现有页面保持一致。

### 9.2 vercel.json 配置

项目根目录下的 [vercel.json](file:///d:/设计文档/TareProcess/Vipen2.0/vercel.json) 为 Vercel 部署配置文件，包含路由重写和 CORS 头设置。新增路由时同步更新该文件。

### 9.3 上线前检查清单

每次修改代码后，必须确保网站可正常上线：

1. **纯静态资源**：本项目的所有资源（HTML、CSS、JS、图片、JSON）必须是纯静态文件，不依赖任何服务端运行时（`server.js` 仅用于本地开发预览，不上线）。
2. **无外部框架依赖**：所有页面必须保持纯 Vanilla JS，不引入任何第三方前端框架/库。
3. **路径兼容**：所有 `fetch()`、`<img src>`、`<link href>`、`<script src>` 的路径使用相对路径（不以 `/` 开头），确保在 Vercel 任意域名下正常工作。
4. **大小写敏感**：Vercel 部署环境（Linux）区分文件名大小写，所有文件引用路径必须与实际文件名大小写完全一致。
5. **禁止本地绝对路径**：代码中不得出现 `D:\`、`C:\`、`localhost:3000` 等仅本地有效的路径。

### 9.4 vercel.json 软路由规则

Vercel 支持通过 `rewrites` 实现 SPA 风格的 URL 美化（无需 HTML 文件扩展名）：

```
/manager  →  /manager.html
```

新增需要美化 URL 的页面时，在 [vercel.json](file:///d:/设计文档/TareProcess/Vipen2.0/vercel.json) 的 `rewrites` 中添加对应规则。

### 9.5 Serverless Functions 限制

**Hobby 计划每个 Deployment 最多 12 个 Serverless Functions。**

- 本项目部署在 Vercel Hobby 计划，`api/` 目录下的每个文件对应一个 Serverless Function。
- 如需新增 API 端点，确保总数不超过 12 个。
- 超过限制后将无法部署，需合并功能相近的端点或升级计划。