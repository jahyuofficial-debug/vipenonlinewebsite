# 修复 Profile 页面点击修改累计次数显示错误 Bug

## 问题描述

Profile 页面的编辑弹窗（`#profileEditModal`）中，多次打开不同的弹窗内容后，DOM 元素会在 `modalBody` 中累积，导致显示错乱。

## 根因

`js/pages/profile.js` 中的 `openModal()` 函数（第 39-72 行）：

1. 当传入 `extraContent`（解绑社交账号 / 邮箱验证）时，直接 `appendChild` 追加内容到 `modalBody`，**从不清理旧内容**
2. 当普通编辑时，只在找不到 `.edit-modal-input` 时才执行 `modalBody.innerHTML = ''` 清理
3. `closeModal()` 只隐藏弹窗，不清理 DOM

## 修复方案

在 `openModal()` 函数开头，**始终先清空 `modalBody` 的内容**，再添加新内容。

### 具体修改

**文件：** `js/pages/profile.js`  
**位置：** `openModal` 函数（约第 39-72 行）

将函数开头的逻辑改为：在添加新内容之前，始终先执行 `modalBody.innerHTML = ''` 清空旧内容。

```js
function openModal(title, value, extraContent) {
    var modal = document.getElementById('profileEditModal');
    var modalTitle = document.getElementById('profileEditModalTitle');
    var modalBody = document.getElementById('profileEditModalBody');
    var modalActions = document.getElementById('profileEditModalActions');
    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = '';

    if (extraContent) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = extraContent;
        while (tempDiv.firstChild) {
            modalBody.appendChild(tempDiv.firstChild);
        }
        if (modalActions) modalActions.style.display = 'none';
    } else {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-modal-input';
        input.id = 'profileEditModalInput';
        input.placeholder = 'Enter value...';
        modalBody.appendChild(input);
        if (modalActions) modalActions.style.display = '';
        input.value = value || '';
        input.placeholder = 'Enter ' + (title ? title.toLowerCase() : 'value') + '...';
        setTimeout(function() { input.focus(); }, 100);
    }
    modal.classList.add('open');
}
```

## 修改要点

1. 在 `modalTitle.textContent = title;` 之后立即执行 `modalBody.innerHTML = ''` 清空旧 DOM
2. 移除原来的 `var input = modalBody.querySelector('.edit-modal-input');` 查找逻辑和条件清理
3. 简化普通编辑模式：直接创建新 input 元素，无需判断是否存在

## 预期效果

- 每次打开弹窗都是干净的内容，不会累积旧 DOM 元素
- 无论先打开哪种类型的弹窗（普通编辑/解绑/验证），切换时都不会出现元素叠加