# 音乐播放小组件液态玻璃播放器重构计划

## 1. 产品概述

对现有 Disc 页面迷你播放器（mini-player）进行视觉与交互重构。默认状态下保持原有黑胶唱片小圆盘样式；当用户指针悬停时，组件展开为一个液态玻璃（Liquid Glass）材质的小型播放器面板，包含完整的播放控制功能。组件与 Disc 页面的播放状态、进度、歌曲信息保持实时同步，功能按钮互通。

## 2. 核心特性

### 2.1 默认状态（黑胶小圆盘）
- 保持现有 `.mini-player-vinyl` 黑胶唱片样式不变
- 显示当前歌曲封面作为唱片中心标签
- 播放时唱片旋转动画，暂停时停止
- 支持拖拽移动位置

### 2.2 悬停展开状态（液态玻璃播放器）
- 悬停时黑胶唱片缩小消失，展开播放器面板
- 面板采用液态玻璃材质效果：
  - `backdrop-filter: blur(24px) saturate(180%)`
  - 半透明背景 `rgba(255,255,255,.06)`
  - 高光边框 `border: 1px solid rgba(255,255,255,.2)`
  - 内阴影 `box-shadow: inset 0 1px 0 rgba(255,255,255,.15), 0 .08rem .4rem rgba(0,0,0,.5)`
  - 圆角 `border-radius: .16rem`
- 面板内容从上到下依次为：
  1. **右上角关闭按钮**：圆形，悬停高亮，点击后隐藏 mini-player 并暂停播放
  2. **歌曲封面图**：正方形，圆角，显示当前歌曲封面
  3. **歌曲标题**：居中显示，单行省略
  4. **进度条**：与 Disc 页面完全同步，显示当前播放进度，支持点击跳转
  5. **时间显示**：左当前时间 / 右总时长
  6. **控制按钮区**：上一曲、播放/暂停、下一曲，三个按钮横向排列

### 2.3 状态与功能互通
- **播放状态互通**：组件中点击播放/暂停，Disc 页面同步更新；反之亦然
- **歌曲信息互通**：切歌、加载歌曲时，两边同步更新封面与标题
- **进度条互通**：组件进度条与 Disc 页面进度条实时同步，均反映 `discAudio.currentTime`
- **功能按钮一致**：上一曲/下一曲逻辑与 Disc 页面完全一致（支持顺序/随机/单曲循环模式）

## 3. 核心流程

```
用户悬停 mini-player
    ↓
黑胶唱片缩小消失 (transform: scale(0), opacity: 0)
    ↓
液态玻璃面板展开 (opacity: 1, transform: scale(1))
    ↓
用户可点击面板内按钮操作播放
    ↓
所有操作同步更新 discAudio / discData / Disc 页面 UI
    ↓
用户点击关闭按钮
    ↓
暂停播放 + 隐藏 mini-player
```

## 4. 用户界面设计

### 4.1 设计风格
- **材质**：液态玻璃（Liquid Glass）—— 高模糊、低透明度、细腻边框高光
- **配色**：延续现有暗色主题，白色文字与图标，金色进度条 `#c4a35a`
- **圆角**：`.16rem` 面板圆角，`.08rem` 封面圆角，按钮圆形
- **动画**：`cubic-bezier(.25,.46,.45,.94)` 缓动，`.35s` 过渡时长

### 4.2 面板布局
```
┌─────────────────────────────┐
│  ┌─────┐                    │
│  │Cover│  歌曲标题           │
│  └─────┘                    │
│  ───────●────────────────   │
│  0:00              -2:20    │
│  ◀◀  ⏸  ▶▶               │
└─────────────────────────────┘
```
- 面板宽度：`2.8rem`
- 内边距：`.16rem`
- 关闭按钮：右上角，`.2rem` 圆形

## 5. 技术实现

### 5.1 修改范围
- **文件**：`d:\设计文档\TareProcess\Vipen2.0\index.html`
- **CSS 区域**：`.mini-player` 相关样式（第 16-44 行附近）
- **HTML 区域**：`#miniPlayer` DOM 结构（第 641-667 行）
- **JS 区域**：mini-player 相关逻辑（第 2817-3033 行）

### 5.2 具体修改点

#### CSS 修改
1. `.mini-player-card` 样式重构为液态玻璃材质
2. 新增 `.mini-player-card-progress` 进度条样式
3. 新增 `.mini-player-card-time` 时间显示样式
4. 新增 `.mini-player-card-controls` 控制按钮容器样式
5. 新增 `.mini-player-card-play-btn` 播放/暂停主按钮样式（白色圆形背景）
6. 调整展开动画，使黑胶消失与面板展开更协调

#### HTML 修改
1. 在 `.mini-player-card` 内新增：
   - 进度条容器 `<div class="mini-player-card-progress">`
   - 时间显示行 `<div class="mini-player-card-time-row">`
   - 控制按钮区 `<div class="mini-player-card-controls">`
   - 播放/暂停主按钮 `<button class="mini-player-card-play-btn">`
2. 移除原有的仅含上一曲/下一曲的 `.mini-player-card-info`，替换为完整控制区

#### JS 修改
1. 新增 `updateMiniPlayerProgress()` 函数，同步进度条与时间
2. 在 `updateDiscProgress()` 中调用 `updateMiniPlayerProgress()`
3. 为 mini-player 进度条添加点击跳转功能（与 Disc 页面一致）
4. 为 mini-player 播放/暂停按钮绑定点击事件（调用 `togglePauseFromMiniPlayer()`）
5. 确保 `syncMiniPlayerWithDisc()` 同步更新进度条初始状态

### 5.3 状态同步机制
- `discAudio` 作为唯一音频源
- `discIsPlaying` 作为唯一播放状态标志
- `discData.currentTapeIndex` 作为唯一当前歌曲索引
- `updateDiscProgress()` 每 500ms 更新一次，同时更新 mini-player 进度
- 所有 UI 更新均通过监听 `discAudio` 事件（play/pause/ended/loadedmetadata）触发
