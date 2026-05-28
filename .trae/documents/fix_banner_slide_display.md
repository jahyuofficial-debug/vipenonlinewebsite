# Fresh 页面轮播后续 Slide 无法展示修复计划

## 问题描述

Fresh 页面的 Hero 轮播组件（`fresh-hero-carousel`）只有第一个 slide（id=0）能正常显示，切换到后续 slide（id>=1）时，背景和内容均无法正常展示。

## 根因分析

### 1. 第二个 Slide 使用了本地绝对路径图片

`freshHeroItems[1]` 的 `bgImage` 使用了本地文件系统绝对路径：

```javascript
bgImage: 'D:\\设计文档\\Web素材\\轮播\\首页轮播Disctrack.png'
```

浏览器无法通过 `file:///` 或 `url(...)` 加载本地绝对路径图片，导致第二个 slide 的背景图加载失败，显示为空白/黑色。

### 2. 轮播切换逻辑本身正确

* `goToFreshSlide()` 函数逻辑正确，通过 `classList.add/remove('active')` 控制 `opacity` 切换

* CSS 中 `.fresh-hero-slide.active { opacity:1; pointer-events:auto }` 定义正确

* `initFreshCarousel()` 中事件绑定和自动轮播定时器均正常

* 因此问题**不是**切换逻辑错误，而是**第二个 slide 的资源无法加载**，造成"后续无法正常展示"的表象

### 3. 第一个 Slide 使用 HTTPS 图片正常显示

`freshHeroItems[0]` 使用 `https://images.unsplash.com/...` 可以正常加载，所以第一个 slide 看起来正常。

## 修复步骤

1. **替换本地图片路径为项目相对路径**

   * 将 `freshHeroItems[1].bgImage` 的本地绝对路径 `'D:\\设计文档\\Web素材\\轮播\\首页轮播Disctrack.png'` 替换为项目相对路径 `'banner/disctrack.png'`

   * 项目 `banner/` 目录下已存在 `disctrack.png` 文件，可直接引用

2. **验证其他 slide 的图片资源**

   * 检查 `freshHeroItems[2/3/4]` 的 `bgImage` 是否均为有效 HTTPS URL（当前是 Unsplash 链接，通常正常）

   * 在修复后通过浏览器 DevTools Network 面板确认所有背景图加载状态

3. **启动本地服务器预览验证**

   * 修改后启动 `npx --yes serve` 预览

   * 进入 Fresh 页面，等待自动轮播或手动点击 dots，确认所有 5 个 slide 均能正常展示

## 涉及文件

* `index.html`：修改 `freshHeroItems` 数组中第 2 个元素的 `bgImage` 字段

## 预期结果

* Fresh 页面 Hero 轮播的 5 个 slide 均能正常显示背景图和内容

* 自动轮播和手动点击 dots 切换均正常工作

