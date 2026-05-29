# 安全配置 RESEND\_API\_KEY 方案

## 目标

将 Resend API Key 安全地配置到项目中，确保不会随着代码一起提交到 GitHub 仓库。

## 关键发现

用户的 API Key 已经存放在项目目录之外的安全位置：
`D:\设计文档\Web素材\APIkeys\ResendAPI.txt`

这是一个**硬件级别的安全隔离**——Key 文件不在项目目录内，Git 永远追踪不到。

## 实现步骤

### 步骤 1：修改 `server.js` 读取外部 Key 文件

在 `server.js` 的 Key 读取逻辑中，增加从用户指定的外部路径读取 Key。优先级从高到低：

1. 环境变量 `process.env.RESEND_API_KEY`（生产环境部署）
2. 外部文件 `D:\设计文档\Web素材\APIkeys\ResendAPI.txt`（本地开发，文件在项目目录之外）
3. `resend-key.txt`（项目内兼容方案，需 `.gitignore` 排除）

代码逻辑：

```
var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var RESEND_KEY_FILE = process.env.RESEND_KEY_FILE || 'D:\\设计文档\\Web素材\\APIkeys\\ResendAPI.txt';

if (!RESEND_API_KEY) {
    try {
        RESEND_API_KEY = fs.readFileSync(RESEND_KEY_FILE, 'utf8').trim();
    } catch (e) {}
}

if (!RESEND_API_KEY) {
    try {
        RESEND_API_KEY = fs.readFileSync(path.join(ROOT, 'resend-key.txt'), 'utf8').trim();
    } catch (e) {}
}

if (!RESEND_API_KEY) {
    console.warn('[WARNING] RESEND_API_KEY is not set. Email sending will fail.');
    console.warn('[WARNING] Configured key file path: ' + RESEND_KEY_FILE);
    console.warn('[WARNING] Option 1: Place your API key at the path above');
    console.warn('[WARNING] Option 2: Set env var: $env:RESEND_API_KEY="re_xxxx"');
    console.warn('[WARNING] Get your API key at https://resend.com/api-keys');
} else {
    console.log('[OK] RESEND_API_KEY loaded (length=' + RESEND_API_KEY.length + ')');
}
```

### 步骤 2：确保 `.gitignore` 排除 `resend-key.txt`

万一用户以后在项目内创建了 `resend-key.txt`，需要确保它不会被提交。检查/更新 `.gitignore` 加入：

```
resend-key.txt
```

### 步骤 3：重启服务器验证

重启 `node server.js`，确认外部 Key 文件被正确加载。

## 最终效果

| 方案                   | 文件位置                                  | 是否在项目内 |     会被 Git 追踪？    |
| -------------------- | ------------------------------------- | :----: | :---------------: |
| 外部文件（主方案）            | `D:\设计文档\Web素材\APIkeys\ResendAPI.txt` |  ❌ 项目外 |       ❌ 绝对安全      |
| 环境变量                 | 系统环境                                  |  ❌ 项目外 |       ❌ 绝对安全      |
| `resend-key.txt`（备用） | 项目根目录                                 |  ✅ 项目内 | ❌ `.gitignore` 排除 |

## 安全性说明

* 外部文件 `D:\设计文档\Web素材\APIkeys\ResendAPI.txt` 在项目目录之外，Git **完全无法触及**

* 无需创建 `.env` 文件，零额外文件

* 改动极小：只修改 `server.js` 中的读取逻辑，增加一个文件路径

* 其他开发者 fork 项目后，只需将自己的 Key 路径设为环境变量 `RESEND_KEY_FILE` 即可

