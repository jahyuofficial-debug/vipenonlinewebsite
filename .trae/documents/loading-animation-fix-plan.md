# 修复加载动画问题 - 实施方案

## 问题分析

当前 `loading.js` 存在两个缺陷导致不符合需求：

### 缺陷 1：sessionStorage 写入时机太晚
`sessionStorage.setItem('vipen_loading_shown', '1')` 在动画完成（100% + 400ms + 900ms = 约 1.3 秒后）才写入。
如果用户在动画播放期间跳转到 signin/signup，key 不会被写入。
当用户从 signin/signup 返回 index.html 时，key 不存在 → 动画再次完整播放。

### 缺陷 2：HTML 中 `#loading` 默认可见，JS 隐藏有延迟
`index.html` 中 `<div id="loading">` 默认可见。非首次进入时，需要等 `loading.js` 加载并执行 `loading.classList.add('hidden')` 才能隐藏。
脚本加载到执行之间有短暂延迟，导致 loading 一闪而过。

---

## 修复步骤

### 步骤 1：修改 `loading.js` — 立即写入 sessionStorage

**文件：** `js/components/loading.js`

在 `init()` 方法中，确认需要播放动画时，**立即**写入 sessionStorage，而不是等动画完成后：

```js
init: function(onComplete) {
    loading = document.getElementById('loading');
    if (!loading) return;

    var hasShown = sessionStorage.getItem(STORAGE_KEY);
    if (hasShown) {
        loading.classList.add('hidden');
        document.body.style.cursor = 'none';
        if (onComplete) onComplete();
        return;
    }

    // ★ 关键改动：立即标记已触发，防止动画期间跳转导致的二次播放
    sessionStorage.setItem(STORAGE_KEY, '1');

    loadImg = loading.querySelector('.loadImg');
    // ... 后续动画逻辑不变
}
```

同时删除动画完成回调中的 `sessionStorage.setItem(STORAGE_KEY, '1');`（避免重复写入，且已无意义）。

### 步骤 2：修改 `index.html` — 头部内联脚本预隐藏 loading

**文件：** `index.html`

在 `<head>` 的最顶部（CSS 加载之前）添加内联脚本，第一时间检查 sessionStorage 并隐藏 `#loading`：

```html
<head>
<script>
(function(){
    if(sessionStorage.getItem('vipen_loading_shown')){
        document.documentElement.classList.add('loading-skip');
    }
})();
</script>
<meta charset="UTF-8">
...
```

同时在 `reset.css` 或 `layout.css` 中添加一条规则：
```css
html.loading-skip #loading { display: none; }
```

这确保 CSS 解析到此处时立即隐藏 loading，不会出现闪现。

---

## 涉及文件清单

| 文件 | 改动内容 |
|------|----------|
| `js/components/loading.js` | sessionStorage 写入时机从动画完成后 → 动画开始前 |
| `index.html` | `<head>` 顶部添加内联脚本 |
| `css/layout.css` | 添加 `html.loading-skip #loading` 规则 |

## 验证要点

1. 首次访问 `index.html` → loading 动画完整播放 ✓
2. 动画播放中跳转 signin → 返回 index.html → loading 不出现 ✓
3. 动画完整播放后跳转 signin → 返回 index.html → loading 不出现 ✓
4. 刷新页面 → loading 动画完整播放（sessionStorage 被清空）✓