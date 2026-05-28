# 3D GameBoy 可交互模型 - 实现计划

## 概述
基于参考图 `GameBoy.png`（经典 DMG-01 GameBoy），使用 Three.js 构建一个真正的 3D 可交互模型，可嵌入网页作为 3D 资产使用。用户可以通过鼠标拖拽旋转/缩放模型，体验真实的 3D 效果。

## 项目输出目录
`D:\设计文档\Web素材\图片类\资产\gameboy3d\`

## 技术选型
- **Three.js**（CDN 引入，无需构建工具）：提供 WebGL 渲染、材质、光照
- **OrbitControls**：实现鼠标/触摸拖拽旋转、缩放交互
- **原生 HTML/CSS/JS**：纯前端方案，可直接在浏览器打开

---

## 模型结构分析（经典 GameBoy DMG-01）

GameBoy 经典款由以下关键部分组成：

1. **主体机身** — 浅灰色圆角长方体，正面微微凸起
2. **屏幕区域** — 深灰色内凹面板，内含墨绿色 LCD 显示屏
3. **D-Pad（十字键）** — 左侧黑色十字方向键，稍微凸起
4. **A/B 按钮** — 右侧 A（红色）、B（紫红色）圆形按钮，倾斜排列
5. **SELECT / START 按钮** — 中间偏下，灰色胶囊形按钮，倾斜排列
6. **扬声器格栅** — 右下角，多条斜线凹槽
7. **品牌标识** — 屏幕上方"Nintendo GAME BOY"字样（用贴图/纹理实现）

---

## 实现步骤

### 步骤 1：创建项目文件结构
```
gameboy3d/
├── index.html      # 主页面，包含 Three.js 容器
├── style.css       # 页面样式（背景、布局、提示文字）
└── script.js       # Three.js 核心逻辑（建模、渲染、交互）
```

### 步骤 2：HTML 页面搭建
- 引入 Three.js CDN（ES Module Import Map 方式）
- 创建 Canvas 容器 `#gameboy-canvas`
- 添加操作提示文字（鼠标拖拽旋转 / 滚轮缩放）
- 响应式适配，确保移动端也能使用

### 步骤 3：Three.js 核心场景搭建
- 初始化 Scene、Camera（PerspectiveCamera）
- 初始化 WebGLRenderer，开启抗锯齿、阴影
- 配置灯光系统：
  - 环境光（AmbientLight）— 基础照明
  - 主方向光（DirectionalLight）— 模拟主光源，投射阴影
  - 辅助点光（PointLight）— 增加立体感
- 添加深色背景（与现有 tape 项目风格类似）

### 步骤 4：GameBoy 主体建模（使用 Three.js 几何体组合）

采用 CSG（Constructive Solid Geometry）思路，通过 `BoxGeometry` + 圆角处理构建各个部件：

**4.1 主体机身**
- 使用 `RoundedBoxGeometry` 或 `BoxGeometry` + `ExtrudeGeometry` 构建圆角长方体
- 颜色：浅灰色 `#c0c0c0` 或 `#d4d0c8`（经典 GameBoy 灰）
- 材质：`MeshStandardMaterial`，`roughness: 0.35`，`metalness: 0.1`

**4.2 屏幕区域面板（内凹）**
- 深灰色矩形面板，嵌入机身正面
- 颜色：`#3a3a3a` 至 `#4a4a4a`
- 包含屏幕边框凸起效果

**4.3 LCD 屏幕**
- 墨绿色显示屏 `#8bac0f`（经典 GameBoy 绿）
- 使用 `MeshBasicMaterial` 模拟自发光效果
- 屏幕表面添加轻微高光反射层

**4.4 D-Pad（十字方向键）**
- 使用 `BoxGeometry` 构建十字形状（通过组合或自定义 BufferGeometry）
- 颜色：深灰色/黑色 `#222222`
- 稍微凸起于机身表面

**4.5 A/B 按钮**
- 使用 `CylinderGeometry` 或 `SphereGeometry`（扁平圆柱体）
- A 按钮：红色 `#c03030`
- B 按钮：紫红色 `#6a2c70`
- 倾斜排列，与机身呈约 30° 夹角

**4.6 SELECT / START 按钮**
- 使用 `CapsuleGeometry`（或 `BoxGeometry` + 圆角）实现胶囊/药丸形状
- 颜色：深灰色 `#555555`
- 倾斜排列

**4.7 扬声器格栅**
- 右下角区域，使用多个细长 `BoxGeometry` 模拟条纹凹槽
- 颜色：机身同色但有深色凹槽

**4.8 细节装饰**
- 屏幕下方"Nintendo GAME BOY"文字（使用 Canvas 生成贴图 Texture）
- 机身侧面纹路

### 步骤 5：交互系统
- 使用 Three.js `OrbitControls` 实现：
  - 鼠标左键拖拽 → 旋转模型
  - 鼠标滚轮 → 缩放
  - 鼠标右键拖拽 → 平移
- 添加触摸支持（移动端）
- 自动旋转开关（可选，默认关闭）
- 惯性效果（参考现有 tape 项目的脚本）

### 步骤 6：动画与优化
- 添加轻微的浮动动画（可选）
- 响应式设计：移动端适配
- 性能优化：合理的几何体分段数、阴影贴图分辨率

### 步骤 7：样式与页面美化
- 深色渐变背景（复用 tape 项目的风格）
- 操作提示文字（半透明、淡入淡出动画）
- 底部阴影投影

### 步骤 8：测试与验证
- 在浏览器中打开 `index.html` 验证效果
- 测试鼠标拖拽旋转、滚轮缩放
- 测试移动端触摸交互
- 检查渲染性能

---

## 关键设计决策
1. **纯几何体建模**（不使用外部 3D 模型文件）：所有部件通过 Three.js 基础几何体构建并组合
2. **CDN 引入 Three.js**：无需 npm/build 工具，直接可使用
3. **与现有 tape 项目风格一致**：保持代码结构、CSS 风格、交互习惯的统一
4. **独立可复用**：整个 `gameboy3d/` 目录可作为独立 3D 资产复制到任何网页项目中使用

---

## 文件清单
| 文件 | 说明 |
|------|------|
| `index.html` | 入口文件，引入 Three.js CDN，定义画布容器 |
| `style.css` | 页面样式，背景、提示文字、响应式 |
| `script.js` | Three.js 核心：场景、灯光、模型构建、OrbitControls、渲染循环 |
