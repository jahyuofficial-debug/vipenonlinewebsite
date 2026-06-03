# 个人主页社交媒体绑定 — 需求对齐与实施计划

## 一、需求文档核心要求（来自 InsAuth.md）

> 同理：**所有社交媒体平台（Facebook / Instagram / X / WeChat 等）均遵循相同原理。**

| # | 要求 | 说明 |
|---|------|------|
| 1 | 用户填写**用户名**，而非完整 URL | 例如 `john_doe`，不是 `https://www.instagram.com/john_doe/` |
| 2 | 保存后系统自动拼接完整链接 | `https://www.{platform}.com/{username}/` |
| 3 | 已填用户名的平台 → 显示图标 | 点击图标在新标签页打开对应社交主页 |
| 4 | 未填用户名的平台 → **不显示图标** | 不显示灰色占位图标 |
| 5 | **不做 OAuth / Token / 回调 / 绑定验证** | 纯外部社交链接展示功能 |
| 6 | 数据库：每个平台一个 `VARCHAR(100) NULL` 字段 | 仅存用户名 |

---

## 二、当前实现 vs 需求差异

| 维度 | 当前实现（旧） | 需求要求（新） | 差距 |
|------|---------------|---------------|------|
| 数据模型 | `socials: { linked: bool, url: string }` | `socials: { username: string \| null }` | **核心模型不同** |
| 图标显隐 | 始终显示，未绑定变灰 `.unlinked` | 无用户名时**完全隐藏** | **行为不同** |
| 点击行为 | 未绑定→打开虚假 `bindUrl`；已绑定→弹窗确认解绑 | 直接打开 `https://{platform}.com/{username}/` 新标签页 | **完全不同** |
| 编辑入口 | 无编辑入口 | 点击图标触发编辑弹窗，填入用户名 | **缺失** |
| 平台配置 | `bindUrl: 'https://xxx.com/vipen/bind'` | `baseUrl: 'https://www.xxx.com/'` | **完全重构** |
| 数据存放 | 硬编码在 `profile.js` 中 | 应放 `data/profile.json` + 后端 `server.js` API | **规范不符** |

---

## 三、技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端架构 | **Vanilla JS（纯原生）** + IIFE 模块模式 | 保持项目零依赖约束 |
| 数据持久化 | `data/profile.json`（读）+ `POST /api/profile/save`（写） | 通过 `server.js` 的 `fs.writeFile` 持久化 |
| 前端数据加载 | `fetch('data/profile.json')` | 符合项目规范：数据与逻辑分离 |
| CSS | 纯 CSS + rem 单位 + `.profile-page` 命名空间 | 遵循现有规范 |

---

## 四、实施步骤

### Step 1：创建 `data/profile.json`

将 `profileData` 从 `profile.js` 中抽取为独立 JSON 文件，并改造 socials 数据模型：

```json
{
    "displayName": "Jah 72",
    "email": "jahyuofficial@gmail.com",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
    "badge": "Social Public",
    "socialPublic": true,
    "socials": {
        "facebook": { "username": "jahyuofficial" },
        "instagram": { "username": null },
        "x": { "username": "jahyuofficial" },
        "wechat": { "username": null }
    }
}
```

**注意**：`username: null` 表示未填写。

---

### Step 2：改造 `socialPlatforms` 配置

将 `bindUrl` 替换为 `baseUrl`：

```js
var socialPlatforms = {
    facebook: { name: 'Facebook', color: '#1877f2', baseUrl: 'https://www.facebook.com/' },
    instagram: { name: 'Instagram', color: '#e4405f', baseUrl: 'https://www.instagram.com/' },
    x: { name: 'X', color: '#fff', baseUrl: 'https://x.com/' },
    wechat: { name: 'WeChat', color: '#07c160', baseUrl: 'https://weixin.qq.com/' }
};
```

---

### Step 3：重构 `buildPage()` — 条件渲染社交图标

**旧逻辑**：静态输出 4 个 `<a>` 标签。

**新逻辑**：根据 `profileData.socials[platform].username` 动态决定是否渲染该图标：

```js
function buildSocialIconsHTML() {
    var html = '<div class="profile-social-icons">';
    var platforms = ['facebook', 'instagram', 'x', 'wechat'];
    for (var i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        var cfg = socialPlatforms[p];
        var data = profileData.socials[p];
        if (!data || !data.username) continue; // 无用户名 → 不渲染
        
        var href = cfg.baseUrl + data.username + '/';
        html += '<a href="' + href + '" class="social-icon-link ' + p + '" aria-label="' + cfg.name + '" target="_blank" rel="noopener noreferrer">';
        // SVG icon...
        html += '</a>';
    }
    html += '</div>';
    return html;
}
```

**SVG 图标使用 Lucide 图标库（遵循项目规范）**：
- 从 `https://lucide.dev` 查找对应平台图标
- 若无对应品牌图标，保留当前硬编码的 SVG path

---

### Step 4：重构 `renderSocialIcons()` — 动态刷新

每次数据变更后调用，完全重新渲染社交图标区域：

```js
function renderSocialIcons() {
    var container = cachedDom.socialContainer;
    if (!container) return;
    
    var parent = container.parentNode;
    if (!parent) return;
    
    // 重建 HTML
    var temp = document.createElement('div');
    temp.innerHTML = buildSocialIconsHTML();
    var newContainer = temp.querySelector('.profile-social-icons');
    
    parent.replaceChild(newContainer, container);
    cachedDom.socialContainer = newContainer;
}
```

---

### Step 5：重构 `handleSocialClick()` — 直达社交主页

**旧逻辑**：未绑定→打开 bindUrl；已绑定→确认解绑弹窗。

**新逻辑**：已填写用户名 → 打开 `https://{platform}.com/{username}/` 新标签页。

社交图标本身已是 `<a href="...">` 链接，`target="_blank"` 即可自动处理。无需 JS 拦截点击。

**但保留点击编辑能力**：点击图标时，弹出编辑弹窗让用户修改用户名：

```js
function openSocialEditModal(platform) {
    var cfg = socialPlatforms[platform];
    var current = profileData.socials[platform] ? profileData.socials[platform].username || '' : '';
    
    var bodyHTML =
        '<div class="social-edit-wrap">' +
        '<p class="social-edit-hint">Enter your ' + cfg.name + ' username (not full URL)</p>' +
        '<div class="social-edit-input-row">' +
        '<span class="social-edit-prefix">' + cfg.baseUrl + '</span>' +
        '<input type="text" class="edit-modal-input social-username-input" id="socialUsernameInput" placeholder="username" value="' + current + '">' +
        '</div>' +
        '</div>';
    
    openModal(cfg.name + ' Username', '', bodyHTML);
    
    // 绑定保存逻辑
    var saveBtn = document.getElementById('profileEditModalSave');
    if (saveBtn) {
        var newSave = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSave, saveBtn);
        newSave.addEventListener('click', function() {
            var input = document.getElementById('socialUsernameInput');
            var username = input ? input.value.trim() : '';
            if (!username) {
                showToast('Please enter a username', true);
                return;
            }
            profileData.socials[platform] = { username: username };
            renderSocialIcons();
            showToast(cfg.name + ' username saved');
            closeModal();
        });
    }
}
```

**交互流程**：
1. 用户点击已有用户名的社交图标 → 弹出编辑弹窗（预填当前用户名）
2. 用户修改 → 保存 → 图标链接更新
3. 点击图标上的链接区域 → `target="_blank"` 跳转至社交主页

**简化为双重交互**：图标默认行为是跳转（`<a href>` + `target="_blank"`），长按/右键可触发编辑。或者：添加一个小的编辑铅笔图标覆盖在社交图标上供编辑。

**最终方案（推荐）**：每个社交图标旁边加一个小的铅笔图标，点击铅笔→编辑用户名；点击图标主体→跳转主页。

---

### Step 6：更新 `server.js` — 添加 `/api/profile/save` 端点

提供简单的 JSON 文件持久化：

```js
// 在 handleAPIRoute 中添加路由
} else if (apiPath === '/api/profile/save') {
    handleSaveProfile(res, body);
}

function handleSaveProfile(res, body) {
    var filePath = path.join(ROOT, 'data', 'profile.json');
    var json = JSON.stringify(body, null, 2);
    fs.writeFile(filePath, json, 'utf8', function(err) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to save profile' });
            return;
        }
        sendJSON(res, 200, { success: true });
    });
}
```

前端在保存社交用户名后调用：

```js
fetch('/api/profile/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
});
```

---

### Step 7：更新 `setData()` — 适配新数据模型

同步更新公开 API：

```js
setData: function(data) {
    if (data.displayName !== undefined) profileData.displayName = data.displayName;
    if (data.email !== undefined) profileData.email = data.email;
    if (data.avatar !== undefined) profileData.avatar = data.avatar;
    if (data.badge !== undefined) profileData.badge = data.badge;
    if (data.socialPublic !== undefined) profileData.socialPublic = data.socialPublic;
    if (data.socials) {
        // 确保新模型兼容性
        for (var key in data.socials) {
            if (data.socials.hasOwnProperty(key)) {
                profileData.socials[key] = data.socials[key];
            }
        }
    }
}
```

---

### Step 8：更新 `main.js` 路由 — 数据从 JSON 加载

在 `#/profile` 路由 case 中，先用 `fetch` 加载 `data/profile.json`，再渲染页面：

```js
} else if (pageName === 'profile') {
    // ... 现有 DOM 准备逻辑 ...
    
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
            // fallback: 使用内置默认数据
            subPageContainer.innerHTML = ProfilePage.buildPage();
            app.appendChild(subPageContainer);
            ProfilePage.bindAll();
            currentPage = 'profile';
        });
}
```

对于 `profile.html` 独立页面，通过 `DOMContentLoaded` 中同样 fetch。

---

### Step 9：更新 CSS

移除旧的 `.unlinked` / `.linked` 样式，新增：

1. `.social-edit-wrap` — 编辑弹窗中用户名输入区域布局
2. `.social-edit-hint` — 提示文字样式
3. `.social-edit-prefix` — URL 前缀显示样式（灰色不可编辑）
4. `.social-edit-input-row` — 输入行 flex 布局
5. `.social-icon-link` — 有用户名时保持彩色，去除 unlinked/linked 状态类

---

### Step 10：测试验证

1. 启动 `node server.js`，打开 `http://localhost:3000`
2. 登录后进入个人主页（`#/profile`）
3. 验证：facebook/X 有用户名 → 显示彩色图标；instagram/wechat 无用户名 → 不显示图标
4. 点击已有用户名的图标 → 在新标签页打开对应社交主页
5. 点击编辑按钮 → 弹窗输入用户名 → 保存 → 图标出现
6. 修改用户名 → 保存 → 链接更新

---

## 五、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `data/profile.json` | **新建** | 抽取 profile 数据 |
| `js/pages/profile.js` | **重构** | 数据模型、渲染逻辑、编辑交互 |
| `css/pages/profile.css` | **修改** | 移除 unlinked/linked 样式，新增编辑弹窗样式 |
| `js/main.js` | **修改** | profile 路由改为 fetch JSON |
| `server.js` | **修改** | 新增 `/api/profile/save` |

---

## 六、不变项

- 头像编辑、用户名编辑、邮箱编辑、徽章切换、登出等功能 **保持不变**
- Yo/Hi 卡片、编辑器弹窗 **不变**
- 整体页面布局结构 **不变**
- 其他社交平台新增（如 GitHub、Discord）不在本次范围内，但架构预留扩展能力
