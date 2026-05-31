# 修复 Sign In / Sign Up 背景图缺失问题

## 根因

`signin.css` 和 `signup.css` 中，`::before` 伪元素设置了 `z-index: -1`，作为 `.signin-page` / `.signup-page` 的子元素，负 z-index 使其渲染到父元素 `background: #000`（纯黑）的后面，导致背景图 `REGISTERPAGE.png` 被完全遮盖。

## 修复方案

将背景图直接设置在页面元素自身上，用 `::before` 作为暗色叠加层（替代原来的 `opacity: 0.6` 效果），`::before` 使用正 z-index，页面内容使用更高的 z-index。

### 步骤

1. **修改 `css/pages/signin.css`**：
   - `.signin-page`：将 `background: #000` 改为 `background: #000 url('../../images/REGISTERPAGE.png') center/cover no-repeat`
   - `.signin-page::before`：将背景图替换为 `background: rgba(0,0,0,0.4)`，`z-index` 从 `-1` 改为 `0`，移除 `opacity`
   - `.signin-page .signin-container` 等主要内容容器：添加 `position: relative; z-index: 1` 确保内容在叠加层之上

2. **修改 `css/pages/signup.css`**：
   - 同 signin.css 的修改方式

3. **验证**：
   - 启动 `node server.js` 预览，确认背景图正常显示
   - 确认页面内容可正常交互