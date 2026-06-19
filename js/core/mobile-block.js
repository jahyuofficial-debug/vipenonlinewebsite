/**
 * Mobile device detection & block
 * Blocks mobile users from accessing the desktop-only site.
 */

(function () {
  // ── Detection ───────────────────────────────────────────
  var ua = navigator.userAgent || '';
  var isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);
  var w = window.innerWidth;

  // Dual check: screen ≤ 768px OR mobile user agent
  if (!isMobileUA && w > 768) return;

  // ── Inject blocking page ────────────────────────────────
  var html = document.documentElement;
  var body = document.body;

  // Freeze everything
  document.write(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Vipen</title>' +
    '<link rel="Shortcut Icon" href="images/favicon.png">' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'html,body{width:100%;height:100%;overflow:hidden}' +
    'body{' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:#050508;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'color:#fff;' +
      'text-align:center;' +
      'padding:24px;' +
    '}' +
    '.block-wrap{' +
      'max-width:360px;' +
    '}' +
    '.block-icon{' +
      'font-size:48px;margin-bottom:24px;' +
      'animation:float 3s ease-in-out infinite;' +
    '}' +
    '.block-title{' +
      'font-size:20px;font-weight:700;line-height:1.4;margin-bottom:12px;' +
      'color:rgba(255,255,255,.9);' +
    '}' +
    '.block-desc{' +
      'font-size:14px;line-height:1.7;' +
      'color:rgba(255,255,255,.45);' +
    '}' +
    '.block-brand{' +
      'margin-top:40px;font-size:12px;' +
      'color:rgba(255,255,255,.18);' +
      'letter-spacing:.06em;text-transform:uppercase;' +
    '}' +
    '@keyframes float{' +
      '0%,100%{transform:translateY(0)}' +
      '50%{transform:translateY(-8px)}' +
    '}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="block-wrap">' +
      '<div class="block-icon">&#x1F6A7;</div>' +
      '<div class="block-title">Sorry, this website does not support mobile browsing yet.</div>' +
      '<div class="block-desc">Please visit us on a desktop or laptop computer. Mobile support is on the way and will be available soon.</div>' +
      '<div class="block-brand">Vipen</div>' +
    '</div>' +
    '</body>' +
    '</html>'
  );

  // Stop any further JS execution
  if (window.stop) window.stop();
  throw new Error('Mobile blocked');
})();
