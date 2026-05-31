# 个人页面性能优化计划

## 问题诊断

用户在个人页面点击可编辑元素时出现明显卡顿，经代码分析发现以下性能瓶颈：

### 1. 事件监听器堆积 (profile.js)
- **位置**: `bindAll()` 函数 (L190-677)
- **问题**: 每次调用 `bindAll()` 都为同一元素添加新监听器，不清理旧的
- **影响**: 多次导航到profile页面后，点击一次触发多次事件处理

### 2. 重复 DOM 查询
- **位置**: `bindAll()` 中大量重复的 `document.getElementById()`
- **问题**: 相同元素被查询多次（如 saveBtn 被查询3次以上）
- **影响**: 不必要的DOM遍历开销

### 3. innerHTML 重写模式
- **位置**: `openModal()` (L37-59), `handleSocialClick()` (L116-144), `sendEmailVerification()` (L151-187)
- **问题**: 每次打开模态框都重写整个 modalBody.innerHTML，包括按钮克隆+替换的低效模式
- **影响**: DOM重新解析和事件监听器泄漏

### 4. 全量图片渲染
- **位置**: `renderFreshImages()` (L365-385), `renderActionImages()` (L522-545)
- **问题**: 每次添加/删除图片都清空并重建整个图片列表DOM
- **影响**: 图片越多性能越差

### 5. CSS 性能问题
- **位置**: profile.css 中多个模态框使用 `backdrop-filter: blur()`
- **问题**: 在打开/关闭动画期间触发大量重绘和合成
- **影响**: 动画卡顿，特别是低端设备

## 修复方案

### 步骤 1: 优化事件绑定机制
- 添加 `isBound` 标志确保 `bindAll()` 只执行一次
- 或添加 `unbindAll()` 在重新绑定前清理旧监听器
- 使用事件委托减少监听器数量

### 步骤 2: DOM 查询缓存
- 在 `bindAll()` 顶部统一查询所有DOM元素并缓存
- 后续操作使用缓存变量而非重复查询

### 步骤 3: 重构 openModal 函数
- 使用 DOM 操作替代 innerHTML 重写
- 按钮事件直接绑定，不使用 cloneNode 模式
- 预创建模态框模板，显示/隐藏时只更新内容

### 步骤 4: 优化图片渲染
- 实现增量更新：只添加/删除变化的DOM节点
- 使用 DocumentFragment 批量操作

### 步骤 5: CSS 优化
- 为使用 backdrop-filter 的元素添加 `will-change: backdrop-filter`
- 考虑使用半透明背景替代部分 blur 效果
- 优化动画性能，使用 transform 和 opacity

### 步骤 6: 添加防抖/节流
- 为快速点击操作添加防抖
- 优化 toast 显示逻辑避免重复触发

## 实施步骤

1. 修改 `js/pages/profile.js` - 重构 bindAll 和事件绑定
2. 优化 `openModal` 和相关模态框函数
3. 重构图片渲染函数
4. 修改 `css/pages/profile.css` - 添加性能优化属性
5. 测试验证性能改善

## 预期效果

- 点击响应时间减少 70%+
- 内存使用减少 40%+
- 模态框打开/关闭动画流畅度提升
- 多次导航后无性能退化
