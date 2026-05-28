# 首页左下角文字修改计划

## 当前状态

首页左下角有两组轮播文字，位于 `#banner .msg` 区域：

| 位置 | 当前值 |
|------|--------|
| 大标题 (h2) | `VipenONline` / `XXXworld`（轮播） |
| 副标题 (h3) | `Blog on blog` / `Design By`（轮播） |

数据定义在 `bannerData` 对象（JS）和 HTML 初始默认值中。

---

## 修改目标

只保留一组，不再轮播：

| 元素 | 修改后值 |
|------|----------|
| 大标题 (h2) | `VipenOnline` |
| 副标题 (h3) | `DesignbyJah72`（手写体，已有样式） |

---

## 待确认

用户输入为 "ViepnOnline"，但项目中品牌名为 "Vipen"。请确认大标题是否为 **`VipenOnline`**（修正拼写），还是保持 **`ViepnOnline`**？

---

## 实施步骤

### 1. 修改 HTML 初始默认值

**文件**: `index.html`

- 第 775 行: `<h2>UUNN&#8594;</h2>` → `<h2>VipenOnline</h2>`
- 第 778 行: `<h3>DeepDesign</h3>` → `<h3>DesignbyJah72</h3>`

### 2. 修改 JS bannerData 数据

**文件**: `index.html`

- 第 969 行: `topics: ['VipenONline', 'XXXworld']` → `topics: ['VipenOnline']`
- 第 970 行: `notes: ['Blog on blog', 'Design By']` → `notes: ['DesignbyJah72']`

### 3. CSS 确认

副标题的 h3 已使用手写体字体栈：
```css
font-family: 'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive, serif;
```
无需修改 CSS。

### 4. 验证

- 启动本地服务器预览
- 确认首页左下角显示 `VipenOnline` 和 `DesignbyJah72`
- 确认不再轮播变化