/** Cursor – custom dot replaces native pointer entirely. */
var Cursor = (function () {
  'use strict';

  var cursorEl = null;
  var halfSize = 16;
  var initialized = false;
  var killed = false;

  function killNative() {
    if (killed) return;
    killed = true;
    // Walk every existing element and force cursor:none with inline !important.
    // Inline !important is the absolute highest CSS priority — nothing overrides it.
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      all[i].style.setProperty('cursor', 'none', 'important');
    }
    // Also cover html / body directly (belt + suspenders)
    var root = document.documentElement;
    root.style.setProperty('cursor', 'none', 'important');
    document.body.style.setProperty('cursor', 'none', 'important');
    // Let form elements keep their native cursors for text editing
    var forms = document.querySelectorAll('input, textarea, select, [contenteditable="true"]');
    for (var j = 0; j < forms.length; j++) {
      forms[j].style.setProperty('cursor', 'auto', 'important');
    }
    // Watch for dynamically added elements
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          for (var k = 0; k < m.addedNodes.length; k++) {
            var n = m.addedNodes[k];
            if (n.nodeType === 1) {
              n.style.setProperty('cursor', 'none', 'important');
              // Also check descendants
              var desc = n.querySelectorAll ? n.querySelectorAll('*') : [];
              for (var d = 0; d < desc.length; d++) {
                desc[d].style.setProperty('cursor', 'none', 'important');
              }
              // Restore form cursors inside
              var f = n.querySelectorAll ? n.querySelectorAll('input, textarea, select, [contenteditable="true"]') : [];
              for (var e = 0; e < f.length; e++) {
                f[e].style.setProperty('cursor', 'auto', 'important');
              }
            }
          }
        });
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  return {
    init: function (cursorId) {
      cursorEl = document.getElementById(cursorId || 'cursor');
      if (!cursorEl) return;

      initialized = true;
      killNative();

      document.addEventListener('mousemove', function (e) {
        cursorEl.style.opacity = '1';
        cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';
      }, { passive: true });

      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      cursorEl.style.opacity = '1';
      cursorEl.style.transform = 'translate3d(' + (cx - halfSize) + 'px,' + (cy - halfSize) + 'px,0)';
    },
    isReady: function () { return initialized; }
  };
})();
