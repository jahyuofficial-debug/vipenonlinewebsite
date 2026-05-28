# Fresh页面轮播Hero重构实施计划

## 概述

将Fresh页面从当前的 **列表+标签页** 布局改为 **轮播Hero区域 + 文章列表** 布局。

## 实施步骤

### 步骤1：添加轮播数据 `freshHeroItems`

在 `<script>` 中 `freshCategories` 之前添加轮播数据数组，每个轮播项包含：
- `id`: 唯一标识
- `bgGradient`: 背景渐变色（无实际图片时使用）
- `mainTitle`: 左侧大标题（如 "SGA"）
- `subTitle`: 左侧副标题（如 "荣获26年常规赛MVP"）
- `cardTitle`: 右侧紫色卡片标题
- `cardDesc`: 右侧紫色卡片描述
- `cardTag`: 右侧卡片标签
- `newsItems`: 右侧新闻列表项数组，每项含 `label` 和 `text`

### 步骤2：添加全新CSS样式

在 `<style>` 标签中替换现有的 `.fresh-page` 相关样式，新增：
- `.fresh-hero-carousel` — 全屏高度轮播容器
- `.fresh-hero-slide` — 单个轮播页（绝对定位叠加）
- `.fresh-hero-bg` — 背景层（渐变/图片）
- `.fresh-hero-mask` — 遮罩层
- `.fresh-hero-content` — 左侧标题内容
- `.fresh-hero-main-title` — 大标题
- `.fresh-hero-sub-title` — 副标题
- `.fresh-hero-panel` — 右侧面板容器
- `.fresh-hero-card` — 紫色推荐卡片
- `.fresh-hero-card-tag` — 卡片标签
- `.fresh-hero-card-title` — 卡片标题
- `.fresh-hero-card-desc` — 卡片描述
- `.fresh-hero-news` — 右侧新闻列表
- `.fresh-hero-news-item` — 单个新闻项
- `.fresh-hero-dots` — 底部轮播指示点
- `.fresh-hero-dot` — 单个指示点
- `.fresh-section-title` — 下方文章区域标题
- 保留 `.fresh-tabs`、`.fresh-article-list`、`.fresh-article` 等文章列表样式（去掉页面级别的 padding）
- 响应式适配（移动端变化）

### 步骤3：重写 `buildFreshPage()` 函数

新的 `buildFreshPage()` 将生成：
1. **轮播Hero区域**：包含所有 slide，通过 active 类控制显示
2. **轮播指示点**：底部居中
3. **下方文章列表区域**：标题 "Latest Stories" + 标签页筛选 + 文章列表
   - 保留原有的分类标签筛选功能
   - 保留原有的文章列表功能
   - 保留原有的文章点击进入详情功能

### 步骤4：实现轮播JavaScript逻辑

新增函数：
- `initFreshCarousel()` — 初始化轮播，绑定事件，启动自动播放
- `goToFreshSlide(index)` — 切换到指定slide
- 自动轮播间隔：5秒
- 底部指示点点击交互

### 步骤5：更新 `navigateTo('fresh')` 中的初始化逻辑

在 `navigateTo()` 中 Fresh 分支添加 `initFreshCarousel()` 调用，并保留原有的 `bindFreshTabClicks()` 和 `bindFreshArticleClicks()`。

### 步骤6：保留原有功能不变

- `buildFreshTabs()` — 不变
- `buildFreshArticles()` — 不变
- `buildFreshDetail()` — 不变
- `navigateToFreshDetail()` — 不变
- `bindFreshTabClicks()` — 不变
- `bindFreshArticleClicks()` — 不变

### 步骤7：响应式适配

移动端（max-width: 768px）：
- Hero轮播高度调整为 70vh
- 右侧面板改为下方布局
- 标题字号缩小
- 文章列表适配

### 步骤8：启动预览测试

- 使用 `npx --yes serve` 启动本地服务
- 验证轮播自动播放和手动切换
- 验证文章列表筛选和点击进入详情
- 验证响应式布局
