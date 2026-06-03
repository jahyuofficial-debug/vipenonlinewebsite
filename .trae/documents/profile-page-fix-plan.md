# Profile Page 修复计划

## 问题诊断

`css/pages/profile.css` 文件存在两处数据损坏：

### 损坏区域 1: 第 279~329 行

`.profile-logout-btn` 规则在 `transition: background .2s, color .2s` 处被截断，随后 279~329 行是二进制乱码数据。原始代码中应该存在的以下规则被破坏：
- `.profile-logout-btn` 的闭合 `}`
- `.profile-logout-btn:hover` 悬停样式
- `.profile-logout-btn svg` 图标样式

第 330 行起 `.profile-right` 规则恢复正常。

### 损坏区域 2: 第 1864~2126 行

`.confirm-body` 规则后出现大量无选择器的孤立 CSS 属性片段（如 `background: #f5f5f5;` 等），这些是垃圾数据，需要删除。

## 修复方案

### 修改文件: `css/pages/profile.css`

**操作 1 — 修复损坏区域 1（第 279~329 行）:**

将乱码行替换为正确的 CSS：

```css
;user-select:none}
.profile-page .profile-logout-btn:hover{background:rgba(255,255,255,.15);color:#fff}
.profile-page .profile-logout-btn svg{width:.16rem;height:.16rem}
.profile-page .profile-logout-btn span{display:none}
```

**操作 2 — 修复损坏区域 2（第 1863~2126 行）:**

- 第 1862 行 `.confirm-body` 缺少闭合 `}`，补充 `}`
- 删除第 1864~2126 行的所有孤立 CSS 片段

## 文件变更摘要

| 文件 | 操作 | 说明 |
|------|------|------|
| `css/pages/profile.css` | 替换 L279-L329 | 补全 `.profile-logout-btn` 规则及 hover/svg/span 子样式 |
| `css/pages/profile.css` | 修复 L1862 + 删除 L1864-L2126 | 闭合 `.confirm-body` 并删除垃圾片段 |

## 验证步骤

1. 修改后启动 `node server.js` 预览 profile 页面
2. 确认页面布局正常：左侧头像/名称/邮箱/社交图标/注销按钮，右侧内容面板
3. 确认退出登录按钮显示正确（带图标）
4. 确认退出确认弹窗正常
