# 修复注册页面预览会员规则后返回页面显示非常小的问题

## 问题根因分析

### 现象
用户在 SPA（`index.html`）中进入注册页面（`#/signup`）→ 点击"预览会员规则"链接 → 在新标签页打开 `rules.html` → 在 `rules.html` 中点击左上角"Back to Sign Up"返回 → `signup.html` 加载后页面所有元素显示非常小。

### 根因
1. **`rem` 基准值依赖 `reset.css`**：项目所有 `rem` 单位的正确渲染依赖于 `html { font-size: calc(100vw / 19.2); }` 这个规则。设计稿 1920px 下 `1rem = 100px`。

2. **SPA 中有 `reset.css`，所以正常**：当用户在 `index.html`（SPA）中访问 `#/signup` 时，`index.html` 加载了 `reset.css`，`html` 的 `font-size` 被正确设置为 `calc(100vw / 19.2)`，所有 `rem` 值计算正确。

3. **独立 `signup.html` 未加载 `reset.css`**：`signup.html` 只引入了 `css/pages/signup.css`，没有引入 `reset.css`。独立加载时，`html` 的 `font-size` 使用浏览器默认值（约 16px），导致所有 `rem` 值计算极小。例如：
   - `.signup-logo { width: 3.6rem; }` → 设计意图 360px，实际 3.6 × 16 = 57.6px
   - `.signup-title { font-size: .48rem; }` → 设计意图 48px，实际 0.48 × 16 = 7.68px

4. **同样的问题也存在于 `signin.html`**。

### 关键代码路径
- [signup.html](file:///d:/设计文档/TareProcess/Vipen2.0/signup.html) - 第 12 行只引入 `css/pages/signup.css`，未引入 `reset.css`
- [signin.html](file:///d:/设计文档/TareProcess/Vipen2.0/signin.html) - 同样只引入 `css/pages/signin.css`，未引入 `reset.css`
- [reset.css](file:///d:/设计文档/TareProcess/Vipen2.0/css/reset.css) - 第 2 行定义 `html { font-size: calc(100vw / 19.2); }`
- [rules.html](file:///d:/设计文档/TareProcess/Vipen2.0/rules.html) - 第 10 行内联样式有 `html { font-size: calc(100vw / 19.2); }`，所以 rules.html 本身不受影响

## 修复方案

### 方案：在 `signup.html` 和 `signin.html` 中添加 `html` 的 `font-size` 声明

最简单且最安全的修复方式：在 `signup.html` 和 `signin.html` 的 `<head>` 中添加内联 `<style>`，设置 `html` 的 `font-size` 和基础重置样式，与 `reset.css` 保持一致。

### 实施步骤

1. **修改 `signup.html`**：在 `<head>` 中添加内联 `<style>` 标签，设置 `html { font-size: calc(100vw / 19.2); }` 和基础 reset 样式
2. **修改 `signin.html`**：同样添加内联 `<style>` 标签
3. **重启服务器并预览验证**：确认修复后页面正常显示