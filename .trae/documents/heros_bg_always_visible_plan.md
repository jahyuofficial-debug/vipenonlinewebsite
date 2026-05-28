# Heros 底色始终显示在顶端（除首页外）实现计划

## 需求分析

用户希望 Heros 专区的雅黑渐变底色不仅在 Fresh 页面显示，而是始终显示在页面顶端（除首页 Home 外）。也就是说，当用户切换到 Design Work、Disc Library、Action、MSG 等非首页页面时，页面顶部仍然保留 Heros 的渐变底色区域。

## 当前代码结构分析

1. **Heros 区域** (`fresh-hero-carousel`) 目前只在 `buildFreshPage()` 函数中构建，仅属于 Fresh 页面
2. **其他子页面** (Design Work、Disc Library、Action、MSG) 使用 `pageTemplates` 中的占位符模板，背景是纯黑 `#000`
3. **页面切换逻辑**在 `navigateTo()` 函数中：切换到非 home 页面时，banner 隐藏，根据页面名称构建不同的子页面内容

## 实现方案

### 方案：将 Heros 底色提取为独立的固定顶部区域

将 Heros 的渐变底色从 Fresh 页面中提取出来，作为一个独立的固定顶部区域，在所有非首页页面中显示。

### 具体修改步骤

#### 步骤 1：创建独立的 Heros 顶部背景区域

在 CSS 中新增一个 `.heros-top-bg` 类：

```css
.heros-top-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #000 100%);
  z-index: 0;
  pointer-events: none;
}
.heros-top-bg.hidden {
  display: none;
}
```

#### 步骤 2：在 HTML 中添加 Heros 背景元素

在 `<div id="app">` 内部、banner 之前添加：

```html
<div id="herosTopBg" class="heros-top-bg hidden"></div>
```

#### 步骤 3：修改页面切换逻辑

在 `navigateTo()` 函数中：

- 当切换到 **home** 页面时：隐藏 `herosTopBg`
- 当切换到 **非 home** 页面时：显示 `herosTopBg`

修改 `navigateTo()` 函数，在页面切换时控制 `herosTopBg` 的显示/隐藏。

#### 步骤 4：调整子页面样式

各子页面的内容需要能够显示在 `herosTopBg` 之上，需要确保子页面内容有正确的 `z-index` 和 `position`。

- `.sub-page` 已有 `position: relative; z-index: 1`，可以正常显示在背景之上
- 需要确保 `fresh-page`、`dw-page` 等页面类型也有正确的层级

#### 步骤 5：移除 Fresh 页面中独立的 Heros 渐变

由于 Heros 渐变已经提取为全局固定背景，Fresh 页面中的 `.fresh-hero-carousel` 的背景可以改为透明或移除渐变：

```css
.fresh-hero-carousel {
  background: transparent;
}
```

### 修改文件清单

| 文件 | 修改类型 | 修改内容 |
|------|----------|----------|
| `index.html` (CSS 部分) | 新增 | 添加 `.heros-top-bg` 和 `.heros-top-bg.hidden` 样式 |
| `index.html` (CSS 部分) | 修改 | `.fresh-hero-carousel` 背景改为 `transparent` |
| `index.html` (HTML 部分) | 新增 | 在 `#app` 内添加 `<div id="herosTopBg" class="heros-top-bg hidden">` |
| `index.html` (JS 部分) | 修改 | 在 `navigateTo()` 函数中添加 `herosTopBg` 显示/隐藏逻辑 |

### 预期效果

- 首页 (Home)：显示视频背景 banner，不显示 Heros 渐变底色
- Fresh 页面：显示 Heros 渐变底色在顶端，轮播内容正常显示
- Design Work / Disc Library / Action / MSG 页面：显示 Heros 渐变底色在顶端，页面内容在其上正常显示
- Sign In / Sign Up 页面：显示 Heros 渐变底色在顶端

## 注意事项

1. `herosTopBg` 使用 `position: fixed` 且 `pointer-events: none`，不会影响页面交互
2. 各子页面需要保持 `position: relative` 和适当的 `z-index` 以确保内容显示在背景之上
3. 需要测试页面滚动时背景是否保持固定
