/*
 * 修复线上 disc/index.json 中"裸文件名"导致的歌曲无法播放问题
 * ==================================================================
 * 背景：
 *   design-upload-v2.html 旧代码第 1422 行把新替换音频的 audio 字段设成了裸文件名
 *   (如 "STATU_AWAY.mp3")，既不是 blob: URL 也不是完整 https URL，于是 save.js
 *   的 blob: 检查漏掉了它，裸文件名被原样写进 R2 上的 disc/index.json。
 *   主站播放器拿这个字符串当 audio.src，浏览器按相对路径解析后 404，无法播放。
 *
 * 现状（已用 HEAD 验证）：
 *   - STATU:AWAY  → 文件已在 R2 (200)，仅 URL 未回填 → 本脚本可直接修好
 *   - SHADOWS      → 文件已在 R2 (200)，仅 URL 未回填 → 本脚本可直接修好
 *   - Escape(...)  → 文件未在 R2 (404)，需在后台重新点"替换音频"上传后再保存
 *
 * 用法：
 *   1. 打开 https://vipenonline.com/design-upload-v2 （保持已登录状态）
 *   2. 浏览器 F12 → Console 控制台
 *   3. 复制下面 "==BEGIN==" 到 "==END==" 之间的全部内容，回车执行
 *   4. 看控制台输出，确认 fixed / missing 数量
 *
 * 安全性：只修改 disc/index.json（通过 /api/disc/save，仅提交 json 不上传文件）；
 *         对每条修复都会先用 HEAD 校验 R2 上文件确实存在，不存在则清空并提示，
 *         绝不臆造 URL。属于定向字段修正，不会覆盖其它字段。
 *
 * 注意：此脚本会写入线上 R2 的 disc/index.json（生产数据）。
 *       执行前请确认上述说明，执行即代表你同意修改。
 */

/* ==BEGIN==
(async () => {
  const R2 = 'https://pub-162f7a76795447d39c6186670b92ffa0.r2.dev';

  // 1. 拉取线上最新 disc/index.json
  const r = await fetch(R2 + '/disc/index.json?ts=' + Date.now());
  if (!r.ok) { console.error('拉取 disc/index.json 失败:', r.status); return; }
  const tracks = await r.json();
  console.log('共读取', tracks.length, '首，开始检查 audio 字段...');

  // HEAD 可能被 CORS 限制，回退到 GET
  async function exists(url) {
    try {
      const h = await fetch(url, { method: 'HEAD' });
      if (h.status === 0) throw new Error('cors');
      return h.ok;
    } catch (e) {
      try { const g = await fetch(url); return g.ok; } catch (e2) { return false; }
    }
  }

  // 2. 逐条修正：audio 非 https URL 的，拼候选地址并校验
  const fixed = [], missing = [];
  for (const t of tracks) {
    if (!t.audio || /^https?:\/\//.test(t.audio)) continue; // 已是完整 URL，跳过

    // 复现 save.js 的路径规则：
    //   safeFolder = folder.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_')
    //   R2 文件名 = audio 现值本身（save.js 上传时已对文件名做 safeName 替换，现值即实际文件名）
    const safeFolder = (t.folder || '').replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
    const url = R2 + '/' + encodeURIComponent(safeFolder) + '/' + encodeURIComponent(t.audio);

    if (await exists(url)) {
      t.audio = url;
      fixed.push(t.folder + '  ->  ' + url);
    } else {
      t.audio = ''; // 文件不在 R2，清空避免伪值；需在后台重新上传
      missing.push(t.folder + '  (R2 无此文件，已清空，需重新上传)');
    }
  }

  // 3. 推送修正后的 json（不带任何文件，save.js 只会原样保存 json）
  const fd = new FormData();
  fd.append('json', JSON.stringify(tracks));
  const sv = await fetch('/api/disc/save', { method: 'POST', body: fd });
  const j = await sv.json();

  console.log('==== 修复结果 ====');
  console.log('save.js 返回:', j);
  console.log('已修复 URL (' + fixed.length + ' 首，应可直接播放):');
  fixed.forEach(s => console.log('  ✓', s));
  console.log('缺失文件 (' + missing.length + ' 首，需在后台重新上传音频):');
  missing.forEach(s => console.log('  ✗', s));
  if (!fixed.length && !missing.length) console.log('  (没有需要修复的项，audio 字段均正常)');
})();
==END==
*/
