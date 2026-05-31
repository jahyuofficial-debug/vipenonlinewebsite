# 改造 Profile 邮箱编辑流程

## 目标

将当前两阶段弹窗流程（编辑 → 关闭 → 再弹出验证码弹窗）改为**单弹窗内联流程**。

## 新流程

```
点击邮箱 → 弹窗出现（输入框 + 灰色 Verify 按钮，无 Cancel/Save）
  → 用户输入新邮箱 → Verify 按钮变绿（可点击）
    → 点击 Verify → Verify 按钮变为验证码输入框
      → 用户输入验证码 → 逐字符自动校验
        → 正确 → 关闭弹窗 → Toast "Email verified!"
        → 错误 → 验证码输入框变红
```

## 修改涉及

### 1. `js/pages/profile.js`

| 位置 | 改动 |
|------|------|
| 新增函数 `openEmailEditModal()` | 构建邮箱编辑弹窗，含输入框 + Verify 按钮（灰色），处理输入监听和 Verify 点击 |
| 新增函数 `transformToCodeInput(container, email)` | 将 Verify 按钮区域变成验证码输入框，监听输入自动校验 |
| 修改 `bindAll()` 中邮箱点击事件 | 调用 `openEmailEditModal()` 而非 `openModal()` |
| 修改 `bindAll()` 中 Save 按钮的 email 分支 | 移除（不再需要 Save 按钮处理 email） |
| 删除 `sendEmailVerification()` | 不再需要两阶段弹窗 |

### 2. `css/pages/profile.css`

| 新增 class | 作用 |
|------------|------|
| `.email-edit-wrap` | 邮箱编辑弹窗自定义内容容器 |
| `.email-verify-btn` | Verify 按钮，默认灰色，有效输入时变绿 |
| `.email-verify-btn.disabled` | 灰色不可点击态 |
| `.email-code-input` | 验证码输入框（取代按钮位置） |
| `.email-code-input.error` | 红色错误态 |

## 验证码校验逻辑

- 验证码硬编码为 `"123456"`（demo 用）
- 每次输入变化时检查当前值是否等于 `"123456"`
- 等于则通过，不等则标红

## 预期效果

- 编辑邮箱时弹窗只有输入框和 Verify 按钮，无 Cancel/Save
- 输入为空时按钮灰色不可点
- 输入不为空时按钮变绿可点击
- 点击 Verify 后按钮区域变成验证码输入框
- 输入正确验证码自动关闭弹窗并提示成功
- 输入错误验证码输入框变红