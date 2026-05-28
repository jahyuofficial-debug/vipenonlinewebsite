# 伪3D胶带模型 - 实施计划

## 项目概述
在 `Material3D` 目录下，使用纯 HTML/CSS/JS 实现一个可交互的伪3D胶带卷模型。核心目标是**可交互**——支持鼠标拖拽旋转查看不同角度。

---

## 技术方案

### 核心技术
- **HTML**：构建胶带模型的 DOM 结构（多层嵌套 div 表示胶带卷的各层）
- **CSS**：使用 `perspective`、`rotateX`、`rotateY`、`radial-gradient`、`linear-gradient`、`box-shadow` 等实现伪3D立体效果
- **JavaScript**：监听鼠标拖拽事件，实时更新 CSS Transform 实现旋转交互

### 伪3D 实现原理
1. 胶带卷是一个**扁圆柱体**——顶面是同心圆环，侧面有一定厚度
2. 使用 CSS `perspective` 创建 3D 透视空间
3. 使用多层 `div` 配合 `radial-gradient` 模拟胶带卷的同心环纹理
4. 使用 `box-shadow` 和渐变模拟光照高光和阴影，增强立体感
5. 通过 JS 监听 `mousedown`/`mousemove`/`mouseup` 计算拖拽角度，实时更新 `transform: rotateX() rotateY()`

---

## 文件结构

```
Material3D/
└── tape/
    ├── index.html      # 主页面，包含胶带模型的 HTML 结构
    ├── style.css       # 样式文件，伪3D效果的核心实现
    └── script.js       # 交互逻辑，鼠标拖拽旋转
```

---

## 实施步骤

### 步骤 1：创建 HTML 结构 (`index.html`)

构建胶带模型的 DOM 层级：

```
.scene（3D 透视容器）
  └── .tape-wrapper（旋转层，用于接收 JS 的 transform）
        └── .tape-model（胶带卷主体）
              ├── .tape-top（顶面 —— 同心圆环 + 半透明质感）
              │     ├── .tape-ring-1（外圈 — 胶带层）
              │     ├── .tape-ring-2（中间圈 — 胶带层）
              │     ├── .tape-ring-3（内圈 — 胶带层）
              │     └── .tape-core（中心孔 — 纸筒芯）
              ├── .tape-side（侧面 —— 厚度，展示多层胶带堆叠）
              └── .tape-shadow（底部阴影）
```

要点：
- 顶面使用多个同心圆表示胶带的圈层纹理
- 中心有纸筒芯（棕色/浅棕色）
- 侧面展示胶带卷的厚度
- 整体置于 3D 透视容器中

### 步骤 2：CSS 伪3D 样式设计 (`style.css`)

#### 2.1 基础布局
- 全屏居中布局，深色背景衬托胶带模型
- `.scene` 容器设置 `perspective: 1000px` 创建 3D 空间
- `.tape-wrapper` 设置 `transform-style: preserve-3d`

#### 2.2 胶带卷顶面
- 使用 `border-radius: 50%` 创建圆形
- 使用 `radial-gradient` 创建同心环纹理：
  - 透明/半透明交替的圆环模拟胶带缠绕的层次
  - 高光区域（径向渐变模拟光照）
- 胶带半透明质感：`background` 使用 `rgba` 或 `hsla`

#### 2.3 胶带卷侧面
- 使用 `::before`/`::after` 伪元素或独立 div
- 多层 `box-shadow` 模拟厚度
- `linear-gradient` 模拟侧面光照（上方亮、下方暗）

#### 2.4 光影效果
- `box-shadow` 多层叠加模拟立体阴影
- 高光条（使用伪元素 + 渐变模拟镜面反射）
- 地面投影阴影

#### 2.5 初始姿态
- 默认 `transform: rotateX(-30deg) rotateY(15deg)` 呈现一个自然的 3D 视角

### 步骤 3：JavaScript 交互逻辑 (`script.js`)

#### 3.1 拖拽旋转
- `mousedown`：记录起始位置，标记 `isDragging = true`
- `mousemove`：计算鼠标移动 delta，转换为旋转角度增量
  - 水平移动 → `rotateY` 变化
  - 垂直移动 → `rotateX` 变化
- `mouseup` / `mouseleave`：标记 `isDragging = false`

#### 3.2 惯性动画（可选增强）
- 松开鼠标时记录速度，使用 `requestAnimationFrame` 实现惯性衰减旋转

#### 3.3 触摸支持
- 添加 `touchstart` / `touchmove` / `touchend` 事件，支持移动端交互

#### 3.4 性能优化
- 使用 `transform` 而非 `top/left` 等属性，利用 GPU 加速
- 使用 `will-change: transform` 提示浏览器优化
- 拖拽时使用 `requestAnimationFrame` 节流

### 步骤 4：测试与调优
- 在浏览器中打开 `index.html`，验证拖拽旋转效果
- 调整透视参数和光照效果，确保伪3D效果逼真
- 测试不同屏幕尺寸下的表现

---

## 预期效果
1. 页面中央展示一个伪3D胶带卷模型，有明显的立体感和材质感
2. 鼠标拖拽可以自由旋转模型，从不同角度观察胶带卷
3. 支持移动端触摸拖拽
4. 松手后有惯性衰减动画，交互体验流畅自然
