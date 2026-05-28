# 顶部 Hero 导航重构实施计划

## 一、需求分析

根据设计文档 [Heros.md](file:///d:\设计文档\TareProcess\Vipen2.0\doc\Heros.md) 和参考图 [Heros.png](file:///D:\设计文档\Web素材\页面预设\Heros.png)，当前顶部导航需要从传统的功能型导航改造为**沉浸式世界观入口（World-driven Navigation）**，核心设计哲学是：

> "让导航像世界入口，而不是菜单栏。"

## 二、当前状态 vs 目标状态对比

| 维度 | 当前状态 | 目标状态 |
|------|----------|----------|
| **布局** | 三栏等分（Logo - 导航 - 音乐按钮） | 横向中心聚焦 + 两侧功能收纳 |
| **导航项** | Fresh / Design Work / Disc Library / Action / MSG | Fresh / Design Work / Disc Library / News Action / MSG |
| **字体** | 小字号(0.14rem)、紧凑排列 | 偏大、偏轻、展示性字体、间距巨大 |
| **Active状态** | hover变色(#b2b9ff) | 白色高亮，其余灰色半透明 |
| **右侧功能** | 音乐按钮 | 齿轮设置 + Sign in + Sign up |
| **高度** | 普通导航栏高度 | 明显偏高的 Hero Navigation Layer |
| **Logo位置** | 贴边 | 向内收缩，留呼吸感 |

## 三、具体改动清单

### 3.1 HTML 结构调整

1. **导航项文本更新**
   - `Action` → `News Action`

2. **右侧功能区重构**
   - 移除音乐按钮（`headerMusicBtn`）
   - 新增：齿轮设置图标按钮（打开右侧 Drawer）
   - 新增：`Sign in` 按钮（页面跳转）
   - 新增：`Sign up` 按钮（页面跳转）

3. **移动端菜单同步更新**
   - `menuOverlay` 中的导航项同步更新

### 3.2 CSS 样式调整

1. **header 整体高度与内边距**
   - 增加 padding，让顶部区域更"宽"
   - 当前：`padding:.3rem .5rem`
   - 目标：增大垂直 padding，营造 Hero Navigation Layer 感

2. **Logo 区域**
   - 向内收缩，增加左侧留白感
   - 保持 Logo 高度不变

3. **导航项（navItems）**
   - 字体大小：从 `.14rem` 增大到展示性字号（约 `.18rem` 或更大）
   - 字重：偏轻（400 或 300）
   - 间距：从 `gap:.4rem` 大幅增大
   - 去掉 hover underline 效果
   - Active 状态：白色（`#fff`）
   - Inactive 状态：半透明灰色（`rgba(255,255,255,.35)` 或类似）
   - hover 状态：从变色改为轻微提升透明度

4. **右侧功能区样式**
   - 齿轮图标：简约线条风格
   - Sign in：透明背景 + 白色边框按钮
   - Sign up：白色背景 + 深色文字按钮（或反色）
   - 整体与导航项保持视觉平衡

5. **scrolled 状态**
   - 保持背景模糊和缩小效果
   - 确保缩小后仍保留足够的 Hero 感

6. **dimmed 状态**
   - 保持现有逻辑（首页 banner 时导航半透明）

### 3.3 JavaScript 逻辑调整

1. **路由高亮持久化**
   - 当前：没有明确的 active nav 状态管理
   - 目标：根据 `currentPage` 给对应导航项添加 `active` class
   - 需要持久化，刷新/回退/深链接进入都应正确高亮

2. **设置按钮交互**
   - 点击齿轮图标：打开右侧 Slide Panel（Drawer）
   - 不跳转页面，用 Overlay / Drawer 方式
   - 需要新增设置面板 DOM 和开关逻辑

3. **Sign in / Sign up 按钮**
   - 点击跳转独立页面（目前可用 placeholder 或 alert 占位）
   - 路由：`#/signin`、`#/signup`

4. **音乐按钮移除**
   - 移除 `headerMusicBtn` 相关的事件监听和逻辑
   - BGM 自动播放逻辑可保留（通过其他方式触发）

5. **移动端适配**
   - 移动端菜单项同步更新文本
   - 确保移动端下新的右侧功能区（设置/登录/注册）有合适的处理

### 3.4 新增组件：设置侧边栏（Settings Drawer）

- 从右侧滑入的 Panel
- 背景：深色 + 模糊
- 内容区域：预留设置项位置（主题、音效等）
- 关闭按钮：右上角 ×
- 打开/关闭动画：slide + fade

## 四、实施步骤

1. **修改 HTML 结构**
   - 更新导航项文本
   - 重构右侧功能区（移除音乐按钮，添加设置/登录/注册）
   - 同步更新移动端菜单
   - 添加设置 Drawer DOM

2. **修改 CSS 样式**
   - 调整 header 高度和 padding
   - 调整 Logo 位置
   - 重构 navItems 样式（字体、间距、active/inactive 状态）
   - 添加右侧功能区样式
   - 添加设置 Drawer 样式

3. **修改 JavaScript 逻辑**
   - 添加路由高亮管理
   - 添加设置 Drawer 开关逻辑
   - 添加 Sign in / Sign up 路由处理
   - 移除音乐按钮逻辑
   - 同步更新移动端相关逻辑

4. **测试验证**
   - 各页面路由切换时导航高亮是否正确
   - 设置 Drawer 打开/关闭动画
   - 首页 banner 时 dimmed 状态
   - 滚动后 scrolled 状态
   - 移动端菜单

## 五、文件变更范围

- `index.html`：HTML 结构、CSS 样式、JavaScript 逻辑全部在此文件中

## 六、设计要点提醒

- **字体承担状态层级**：不是用颜色区分 active/inactive，而是用白色 vs 灰色半透明
- **弱功能化**：UI 看起来不像工具，而是世界入口
- **空间感**：巨大留白、偏大的字体、偏轻的字重
- **Logo 与功能解耦**：Logo 左置且向内收缩，与导航保持大间距
- **设置不跳页**：齿轮按钮打开 Drawer，不打断当前浏览
