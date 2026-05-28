# 修复首页 Banner 轮播空背景问题（方案二 + Banner 独立文件夹）

## 当前状态

`bannerData` 配置了 4 个轮播，但仅第 0 个正常工作：

| 轮播 | 标题 | 背景 | 状态 |
|------|------|------|------|
| 0 | UUNN→ / DeepDesign | `video/bg_opt.mp4` | ✅ 正常 |
| 1 | Disctrack / 全新音乐体验 | `D:\设计文档\Web素材\轮播\首页轮播Disctrack.png` | ❌ 外部路径 |
| 2 | 空 | 无 | ❌ 空 |
| 3 | 空 | 无 | ❌ 空 |

项目已有素材：
- `video/bg_opt.mp4` — 轮播 0 视频
- `video/bg.mp4` — 未使用的视频
- `images/首页轮播Disctrack.png` — Disctrack 图片

---

## 修复步骤

### 步骤 1：创建 `banner/` 文件夹并整理素材
- 新建 `banner/` 目录
- 将 `video/bg_opt.mp4` → 移动至 `banner/bg_opt.mp4`
- 将 `video/bg.mp4` → 移动至 `banner/bg.mp4`
- 将 `images/首页轮播Disctrack.png` → 移动至 `banner/disctrack.png`
- 删除空的 `video/` 目录（如果没有其他文件）

### 步骤 2：更新 `index.html` 中的视频路径
- `bgVideo` 的 `src` 从 `video/bg_opt.mp4` 改为 `banner/bg_opt.mp4`

### 步骤 3：修复 `bannerData` 填充 4 个轮播
```javascript
var bannerData = {
    topics: ['UUNN→', 'Disctrack', 'Vipen Studio', 'Coming Soon'],
    notes:  ['DeepDesign', '全新音乐体验', '创意设计工作室', '更多精彩即将呈现'],
    bgType: ['video', 'image', 'video', 'video'],
    bgImage: ['', 'banner/disctrack.png', '', ''],
    current: 0
};
```

### 步骤 4：验证
- 启动本地服务器，确认 4 个轮播都能正常切换
- 确认视频和图片资源正确加载
- 确认自动轮播（5 秒）正常工作

---

## 修改涉及的文件
- `index.html` — 修改 `bgVideo` 的 src（第 764 行）+ 修改 `bannerData`（第 966-972 行）

## 文件操作
- 新建 `banner/` 目录
- 移动 `video/bg_opt.mp4`、`video/bg.mp4` → `banner/`
- 移动 `images/首页轮播Disctrack.png` → `banner/disctrack.png`
- 删除空的 `video/` 目录

---

## 完成后的目录结构
```
banner/
  ├── bg_opt.mp4      # 轮播 0 背景视频
  ├── bg.mp4           # 轮播 2、3 背景视频
  └── disctrack.png    # 轮播 1 背景图片
```

---

待用户确认后开始实施。