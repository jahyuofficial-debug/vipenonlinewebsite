# Disc 页面歌曲名与音频不一致修复计划

## 问题根因

经过完整排查，问题的根源在于 **`nowPlaying` 是一个独立的内嵌数据对象**，与管理员通过后台界面管理的 `tapes` 数组是分离的：

### 数据流全景

```
data.json / main.js 硬编码
  ├── nowPlaying: { title: "酒精", audio: "酒精.mp3", cover: "..." }  ← 内嵌，管理员看不到
  └── tapes: [{ title: "酒精", ... }, ...]                            ← 管理员可管理

localStorage (vipen_mgr_disc_tapes)
  └── tapes: [管理员添加的歌曲...]  ← 覆盖 data.json 的 tapes

main.js 初始化:
  discAudio.src = nowPlaying.audio  ← 用的是内嵌的 "酒精" 音频！

DiscPage.buildPage():
  nowPlaying ← tapes[currentTapeIndex]  ← 显示同步了，但音频源没同步
```

### 矛盾点

| 项目 | 数据来源 | 问题 |
|------|----------|------|
| 页面显示（歌名/封面） | `nowPlaying` ← `tapes[currentTapeIndex]` | 上次修复已同步 ✅ |
| 实际播放音频 | `discAudio.src` ← `nowPlaying.audio`（初始化时） | **未同步，仍播放内嵌的"酒精"** ❌ |
| 管理员后台 | `localStorage` → `vipen_mgr_disc_tapes` | 不包含 `nowPlaying`，看不到"酒精" ❌ |

**结论：`nowPlaying` 是内嵌在项目中的死数据，管理员无法通过后台管理它，导致首次进入 Disc 时播放的是管理员从未添加过的歌曲。**

## 修复方案

### 1. 修改 `js/pages/disc.js` — `buildDiscPage()`

在构建页面时，从 `tapes[currentTapeIndex]` 派生 `nowPlaying` 并同步音频源：

```js
function buildDiscPage() {
    var tapes = window.discData.tapes || [];
    var currentIndex = window.discData.currentTapeIndex || 0;
    if (tapes[currentIndex]) {
        window.discData.nowPlaying = {
            title: tapes[currentIndex].title || 'Unknown Track',
            artist: tapes[currentIndex].artist || 'Vipen Music',
            duration: tapes[currentIndex].time || '0:00',
            current: '0:00',
            cover: tapes[currentIndex].cover || ''
        };
        if (tapes[currentIndex].audio) {
            discAudio.src = tapes[currentIndex].audio;
            discAudio.load();
        }
    }
    // ... 后续构建逻辑不变
```

### 2. 修改 `js/main.js` — 删除硬编码的 `nowPlaying`

**删除** `main.js` 第 286-319 行硬编码 `window.discData` 中的 `nowPlaying` 字段：

```js
// 修改前
window.discData = {
    nowPlaying: { ... },  // ← 删除这个字段
    tapes: [ ... ],
    playMode: 'sequence',
    currentTapeIndex: 0
};

// 修改后
window.discData = {
    tapes: [ ... ],
    playMode: 'sequence',
    currentTapeIndex: 0
};
```

### 3. 修改 `js/main.js` — 初始化音频源

将 `discAudio.src` 的初始化从 `nowPlaying.audio` 改为 `tapes[currentTapeIndex].audio`：

```js
// 修改前
discAudio = new Audio();
discAudio.src = window.discData.nowPlaying.audio;
discAudio.load();

// 修改后
discAudio = new Audio();
var initTapes = window.discData.tapes || [];
var initIdx = window.discData.currentTapeIndex || 0;
if (initTapes[initIdx] && initTapes[initIdx].audio) {
    discAudio.src = initTapes[initIdx].audio;
    discAudio.load();
}
```

### 4. 修改 `data.json` — 删除 `disc` 中的 `nowPlaying` 字段

移除 `data.json` 中 `disc` 的 `nowPlaying` 字段，只保留 `tapes`、`playMode`、`currentTapeIndex`。

### 影响范围

| 文件 | 修改内容 |
|------|----------|
| `js/pages/disc.js` | `buildDiscPage()` 同步音频源 |
| `js/main.js` | 删除硬编码 `nowPlaying`；初始化 `discAudio.src` 改为从 `tapes` 获取 |
| `data.json` | 删除 `disc.nowPlaying` 字段 |
| `data/disc.json` | 同步删除 `nowPlaying` 字段（如存在） |

### 修复后的效果

- 首次进入 Disc 页面：从 `tapes[0]` 获取歌曲名、封面、音频源 → 三者一致
- 管理员后台：所有歌曲都在 `tapes` 中，管理员可见、可管理
- 不再有内嵌的"幽灵"歌曲