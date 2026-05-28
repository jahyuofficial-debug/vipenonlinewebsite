# Signup 页面修改计划

## 文件
- `d:\设计文档\TareProcess\Vipen2.0\signup.html`

## 修改需求与实现步骤

### 1. Name 输入框：仅支持英文字符，中文输入时右侧显示红色提示
- 将 Account Name 输入框的验证逻辑修改为：实时检测是否包含非英文字符（`[^a-zA-Z0-9]`）
- 当检测到中文或其他非英文字符时，在输入框右侧显示红色小字 "Only EN characters are supported"
- 该提示位于输入框外部右侧，不影响布局
- 添加 `.error-text` 样式：红色小字，绝对定位在输入框右侧

### 2. 密码眼睛图标：粗描边风格，位于框内最右边，不超出范围
- 修改眼睛 SVG 的 `stroke-width` 从 `1.5` 改为 `2.5`（粗描边）
- 调整 `.password-toggle` 的 `right` 值，确保在框内部最右边
- 确保 `.input-field` 的 `padding-right` 足够容纳图标，图标不超出框范围
- 检查眼睛图标与输入框高度居中对齐

### 3. Email Address：邮箱格式检测，符合规则显示 check 动态符号
- 已有邮箱格式验证 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`，保持不变
- 已有 validation-icon 显示逻辑，确保邮箱验证通过后显示绿色 check 图标
- 确保 check 图标与输入框高度对齐

### 5. Confirm Code：检测机制改为 6 位纯数字
- 修改 `validateEmailCode` 函数：从 `value.length >= 4 && /^[0-9]+$/` 改为 `value.length === 6 && /^[0-9]+$/`
- input 的 `maxlength="6"` 已满足

### 6. Logo 和标题文字修改
- Logo 放大至 400%：`.signup-logo` 的 `width` 和 `height` 从 `.52rem` 改为 `2.08rem`（.52 * 4）
- "Create Account" 改为 "Member_ing"，字体为加粗无衬线：`.signup-title` 内容修改，font-weight 保持 600（或改为 700），font-family 使用无衬线字体
- "Join Vipen to explore more" 改为粗斜体 "Become a Vipen member"：`.signup-subtitle` 内容修改，添加 `font-weight: 700; font-style: italic`

### 7. I agree 添加可点击链接，指向占位规则页面
- 将 "membership rules" 和 "user privacy regulations" 文本替换为可点击的 `<a>` 链接
- 创建占位页面 `rules.html`：纯文字描述 rules 和各种 member 与隐私保护条例信息
- 链接在新标签页打开 `target="_blank"`

### 8. 所有不符合规则的输入：动态抖动 + 边框变红
- 添加 `.shake` 动画关键帧：左右抖动效果
- 添加 `.input-field.error` 样式：边框变为红色
- 在输入框失去焦点（blur）时，如果内容不符合规则，触发抖动动画并将边框变红
- 当用户重新输入并符合规则后，移除 error 类，恢复正常状态
- 抖动动画只触发一次，可通过 JS 控制添加/移除 class

### 9. 所有 check 和眼睛图标与框高度对齐
- 检查 `.validation-icon` 和 `.password-toggle` 的 `top: 50%; transform: translateY(-50%)` 是否正常工作
- 确保图标容器的 `height` 与输入框高度匹配，垂直居中

### 10. 所有输入框的 stroke（边框）改得更粗
- 将 `.input-field` 的 `border` 从 `1px` 改为 `2px`
- 相应调整 hover、focus、error、valid 状态的边框颜色保持协调
- 调整 `padding-right` 确保图标与粗边框不冲突

## 实现顺序
1. 修改 CSS 样式（边框粗细、抖动动画、错误提示样式、logo 大小、标题样式）
2. 修改 HTML 结构（标题文字、链接、新增错误提示元素）
3. 修改 JS 验证逻辑（Name 中文检测、Email Code 6位、抖动触发、错误状态管理）
4. 创建 `rules.html` 占位页面
5. 预览验证
