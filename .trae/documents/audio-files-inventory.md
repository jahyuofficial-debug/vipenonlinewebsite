# 项目音频文件清单

## 扫描结果

项目中共有 **4 个音频文件**：

---

### 1. BGM 背景音乐

| 属性 | 值 |
|------|-----|
| 文件路径 | `audio/time.wav` |
| 引用位置 | `index.html` 第 49 行 `<audio id="bgm" src="audio/time.wav" preload="auto" loop></audio>` |
| 用途 | 全局背景音乐，循环播放 |

---

### 2. Disc 曲目 — 酒精

| 属性 | 值 |
|------|-----|
| 文件路径 | `Disc/MusicAlbum/酒精/酒精.mp3` |
| 引用位置 | `js/main.js:368`、`data.json:530`、`data/disc.json:8` |
| 用途 | Disc 页面曲目数据 |

---

### 3. Disc 曲目 — 翱翔

| 属性 | 值 |
|------|-----|
| 文件路径 | `Disc/MusicAlbum/翱翔/翱翔.mp3` |
| 引用位置 | `js/main.js:375`、`data.json:537`、`data/disc.json:15` |
| 用途 | Disc 页面曲目数据 |

---

### 4. Disc 曲目 — Young OG

| 属性 | 值 |
|------|-----|
| 文件路径 | `Disc/MusicAlbum/YoungOG/soundclouddownloader.io_           Kris Wu Yifan  - Young OG.mp3.mp3` |
| 引用位置 | `js/main.js:382`、`data.json:544`、`data/disc.json:22` |
| 用途 | Disc 页面曲目数据 |
| ⚠️ 注意 | 文件名含多余空格，且后缀为 `.mp3.mp3`（双重后缀） |

---

## 总结

- **1 个 BGM**：`audio/time.wav`（WAV 格式，在 `index.html` 中通过 `<audio>` 标签加载）
- **3 个 Disc 曲目**：均为 MP3 格式，位于 `Disc/MusicAlbum/` 下各专辑子目录，在 `js/main.js` 和 JSON 数据文件中引用