# 加载动画与首页解耦 — 执行计划（修订版）

## 目标

将加载动画的 CSS/JS/HTML 从首页的 `index.html` + `layout.css` 中拆出，形成独立的可复用组件。**行为不变**：仍然只有首次进入 `index.html` 时展示一次加载动画（sessionStorage 控制），其他页面无需加载动画。

## 执行步骤

### Step 1: 新建 `css/loading.css`

从 `layout.css` 的 L4-L16 提取以下 loading 样式到新文件：

* `#loading` 容器样式

* `#loading.hidden` 隐藏态

* `.loadImg` / `.loadImg.zoomOut` 图片动画

* `.loadMsg` / `.progressWrap` / `.progressBar` / `.progressNum` 进度条

* `@keyframes spin` / `@keyframes zoomFade`

### Step 2: 修改 `css/layout.css`

删除已提取的 loading 相关样式（L4-L16），保持其余内容不变。

### Step 3: 重构 `js/components/loading.js` 为自包含组件

将 `Loading` 组件改为**自给自足**——如果 DOM 中不存在 `#loading`，则动态创建完整的 loading HTML 结构并注入 `<body>`，不再依赖 HTML 中硬编码的 `#loading`。

改动点：

* 新增私有函数 `createDOM()` 生成 `#loading` 完整 HTML

* `init()` 中：如果 `document.getElementById('loading')` 为 `null`，执行 `createDOM()` + `appendChild`

* 其余逻辑完全不变（sessionStorage 判断、进度模拟、完成回调）

### Step 4: 更新 `index.html`

* 在 `<head>` 新增：`<link rel="stylesheet" href="css/loading.css">`

* 删除 `<div id="loading">...</div>` 硬编码 HTML 块（原 L77-L86）

* 其余保持不变

### Step 5: 启动验证

* `npx --yes serve -l 3000` 启动服务

* 打开 `http://localhost:3000` → 首次应有加载动画（logo 旋转 + 进度条 → 消失）

* 刷新页面（同 session）→ 不应再出现加载动画

* 点击导航到 fresh/disc 等页面 → 不应出现加载动画

* signin/signup/profile → 无需改动，行为不变

***

## 影响范围（仅 4 个文件）

| 文件                         | 操作                                                     |
| -------------------------- | ------------------------------------------------------ |
| `css/loading.css`          | **新建**                                                 |
| `css/layout.css`           | 删除 L4-L16 的 loading 样式                                 |
| `js/components/loading.js` | 新增 `createDOM()`，`init()` 中动态注入 DOM                    |
| `index.html`               | 新增 `<link>` 引入 `css/loading.css`；删除硬编码 `#loading` HTML |

