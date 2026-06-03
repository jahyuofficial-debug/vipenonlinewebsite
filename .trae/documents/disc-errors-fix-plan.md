# Disc 页面错误修复计划

## 问题清单

经过对 `disc.js`、`main.js`、`data.json`、`disc.json` 的全面审查，发现以下问题：

### 1. `main.js` 硬编码 `window.discData` 前两条磁带数据为空（严重）

**位置：** [main.js:L248-L271](file:///d:/设计文档/TareProcess/Vipen2.0/js/main.js#L248-L271)

```js
tapes: [
    { id: 1, title: '', time: '0:00', cover: '', audio: '' },   // 空数据！
    { id: 2, title: '', time: '0:00', cover: '', audio: '' },   // 空数据！
    { id: 3, title: 'Young OG', ... }
]
```

虽然 `data.json` 加载成功后通过 `Object.assign` 覆盖了正确数据，但当 `data.json` 加载失败或延迟时，Disc 页面将显示空白磁带，导致渲染异常。

**修复：** 将硬编码后备数据补充完整，填入正确的歌曲信息。

### 2. `main.js` 使用 `Object.assign` 浅拷贝合并数据（中等）

**位置：** [main.js:L17](file:///d:/设计文档/TareProcess/Vipen2.0/js/main.js#L17)

```js
Object.assign(window.discData, d.disc);
```

`Object.assign` 是浅拷贝，若 `d.disc` 中缺少某些字段（如 `playMode`、`currentTapeIndex`），则不会清理旧的残留值。应使用深拷贝确保完全替换。

**修复：** 改用 `window.discData = JSON.parse(JSON.stringify(d.disc));`

### 3. `disc.js` 缺少 `'use strict';`（违反项目规则 #8）

**位置：** [disc.js:L2](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/disc.js#L2)

IIFE 模块声明后缺少 `'use strict';`，违反项目代码规范第 8 条。

**修复：** 在 IIFE 第一行添加 `'use strict';`

### 4. `disc.js` 中 `favBtn` 点击处理器引用 `nowPlaying.fav` 可能为 `undefined`（轻微）

**位置：** [disc.js:L389](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/disc.js#L389)

```js
np.fav = !np.fav;
```

`nowPlaying` 对象在 `buildDiscPage()` 中创建时未包含 `fav` 字段，首次点击时 `np.fav` 为 `undefined`，`!undefined` = `true` 虽然能正常工作，但不够健壮。

**修复：** 在 `buildDiscPage()` 创建 `nowPlaying` 时增加 `fav: false` 初始字段。

### 5. `loadDiscTrack()` 中 `currentTapeIndex` 未做边界检查（轻微）

**位置：** [disc.js:L277](file:///d:/设计文档/TareProcess/Vipen2.0/js/pages/disc.js#L277)

```js
var tid = window.discData.tapes[window.discData.currentTapeIndex].id;
```

若 `currentTapeIndex` 超出 `tapes` 数组范围（如数据被清空），会抛出 TypeError。

**修复：** 添加边界检查，超出范围时取最后一条或安全返回。

---

## 修复方案（按优先级排序）

### 修复 1：补充 `main.js` 硬编码 `window.discData` 的正确数据

将前两条磁带的 `title`、`cover`、`audio` 从空字符串改为正确的值，与 `data.json` 保持一致：
- id=1: title="酒精", cover/audio 使用正确路径
- id=2: title="翱翔", cover/audio 使用正确路径

### 修复 2：改用深拷贝替代 `Object.assign`

将 `main.js:L17` 的 `Object.assign(window.discData, d.disc)` 改为：
```js
window.discData = JSON.parse(JSON.stringify(d.disc));
```

### 修复 3：`disc.js` 添加 `'use strict';`

在 IIFE 声明后第一行添加 `'use strict';`

### 修复 4：`buildDiscPage()` 中 `nowPlaying` 增加 `fav: false`

### 修复 5：`loadDiscTrack()` 增加边界保护

---

## 涉及文件

| 文件 | 修改项 |
|------|--------|
| `js/main.js` | L248-L271 硬编码补充正确数据；L17 改用深拷贝 |
| `js/pages/disc.js` | 添加 `'use strict';`；`nowPlaying` 增加 `fav: false`；`loadDiscTrack()` 边界检查 |