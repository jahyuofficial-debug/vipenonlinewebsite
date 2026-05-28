# 鼠标指针样式匹配计划

将 Vipen 网站的鼠标指针效果修改为与参考网站 `https://mahadikram.com/nutrition-generator.html` 一致。

---

## 参考网站光标特征分析

参考网站使用了以下光标实现方案：

| 特征 | 参考站实现 | Vipen 当前实现 |
|------|-----------|---------------|
| 混合模式 | `mix-blend-mode: difference`（反色效果） | 无 |
| 基础尺寸 | 20px 圆形 | 8px 内点 + 32px 容器 |
| 跟随方式 | `translate3d` 直接定位（无缓动） | `left`/`top` + lerp 缓动（0.35） |
| 悬停效果 | 放大至 80px，变为主题色 | 无悬停效果 |
| 输入框处理 | 光标隐藏（显示原生文本光标） | 无特殊处理 |
| 触屏检测 | 触屏设备隐藏自定义光标 | 无触屏检测 |
| 移动端 | 媒体查询隐藏，恢复默认光标 | 无 |

---

## 实施步骤

### 步骤 1：修改光标 HTML 结构

**文件**：`index.html`

将当前的双层结构：
```html
<div id="cursor"><div class="inner"></div></div>
```
改为单层结构（去除内层 `.inner`，无需再添加子元素）：
```html
<div id="cursor"></div>
```

---

### 步骤 2：修改光标的 CSS 样式

**文件**：`index.html`（`<style>` 标签内，约第 104-105 行）

将当前的：
```css
#cursor{position:fixed;pointer-events:none;z-index:9998;width:32px;height:32px;transform:translate(-50%,-50%);transition:none;will-change:left,top}
#cursor .inner{position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:50%;background:#fff;transform:translate(-50%,-50%)}
```

替换为：
```css
#cursor{position:fixed;top:0;left:0;width:20px;height:20px;background:#fff;border-radius:50%;pointer-events:none;mix-blend-mode:difference;z-index:9999;transition:width .3s,height .3s,background .3s,opacity .2s;opacity:0;will-change:transform}
#cursor.hovered{width:60px;height:60px;opacity:.9;background:#b2b9ff}
#cursor.hidden{opacity:0!important;width:0;height:0}
```

关键变化：
- 添加 `mix-blend-mode: difference` 实现反色效果
- 基础尺寸改为 20px
- 添加 `.hovered` 状态（悬停时放大至 60px，变为 Vipen 主题色 `#b2b9ff`）
- 添加 `.hidden` 状态（输入框隐藏光标）
- 移除内层 `.inner` 样式
- 初始 opacity 为 0（在 mousemove 时才显示）

---

### 步骤 3：修改光标 JavaScript 逻辑

**文件**：`index.html`（`<script>` 标签内，约第 814-831 行）

将当前的光标跟随代码：
```javascript
var cursor = document.getElementById('cursor');
var mouseX = 0, mouseY = 0;
var cursorX = 0, cursorY = 0;
var moveTimeout;

document.addEventListener('mousemove', function(e){
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor(){
    cursorX += (mouseX - cursorX) * 0.35;
    cursorY += (mouseY - cursorY) * 0.35;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();
```

替换为：

```javascript
var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
var cursor = document.getElementById('cursor');

if (!isTouchDevice) {
    document.addEventListener('mousemove', function(e) {
        if (cursor && !cursor.classList.contains('hidden')) {
            cursor.style.opacity = '1';
            cursor.style.transform = 'translate3d(calc(' + e.clientX + 'px - 50%), calc(' + e.clientY + 'px - 50%), 0)';
        }
    });

    document.querySelectorAll('a, button, .dw-card, .fresh-hero-card, .fresh-article, .fresh-hero-news-item, .action-post-img-wrap, .fresh-hero-bg, .dw-list-card, .fresh-detail-back, .dw-detail-back, .slideDots .dot, .fresh-hero-dot, .action-image-lightbox-nav').forEach(function(el) {
        el.addEventListener('mouseenter', function() { cursor && cursor.classList.add('hovered'); });
        el.addEventListener('mouseleave', function() { cursor && cursor.classList.remove('hovered'); });
    });

    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(function(el) {
        el.addEventListener('mouseenter', function() { cursor && cursor.classList.add('hidden'); });
        el.addEventListener('mouseleave', function() { cursor && cursor.classList.remove('hidden'); });
    });
}
```

关键变化：
- 添加触屏设备检测，触屏设备跳过自定义光标
- 使用 `translate3d` 直接定位（无缓动，与参考站一致）
- 添加悬停元素的 `hovered` class 交互
- 添加输入框元素的 `hidden` class 交互

---

### 步骤 4：添加移动端响应式隐藏

**文件**：`index.html`（`<style>` 标签内）

在光标 CSS 后添加移动端媒体查询：
```css
@media(max-width:768px){#cursor{display:none!important}*{cursor:auto!important}body{cursor:auto}a,button{cursor:pointer}}
```

---

### 步骤 5：确保输入框使用原生光标

**文件**：`index.html`（`<style>` 标签内）

确保文本输入框显示原生文本光标，在全局样式中添加：
```css
input[type="text"],input[type="number"],textarea{cursor:text}
```

---

### 步骤 6：预览验证

启动本地服务器 `npx --yes serve -l 3000`，验证以下效果：
1. 光标为 20px 白色圆形，带 `mix-blend-mode: difference` 反色效果
2. 悬停在链接、按钮、卡片等交互元素上时，光标放大至 60px 并变为主题色 `#b2b9ff`
3. 悬停在文本输入框上时，自定义光标隐藏，显示原生文本光标
4. 移动端/触屏设备不显示自定义光标
5. 光标跟随无延迟感（直接定位，无缓动）