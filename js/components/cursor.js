/** Cursor – custom dot, native cursor suppressed reactively. */
var Cursor = (function () {
  'use strict';

  var cursorEl = null;
  var halfSize = 16;
  var initialized = false;

  return {
    init: function (cursorId) {
      cursorEl = document.getElementById(cursorId || 'cursor');
      if (!cursorEl) return;

      initialized = true;

      // Whitelist: elements that keep their native cursor
      function isFormLike(el) {
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
               el.getAttribute('contenteditable') === 'true';
      }

      document.addEventListener('mousemove', function (e) {
        // Move custom dot
        cursorEl.style.opacity = '1';
        cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';

        // Reactively hide native cursor on whatever element is under the mouse
        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.nodeType === 1 && !isFormLike(el) && el.style) {
          el.style.cursor = 'none';
        }
      }, { passive: true });

      // Initial position
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      cursorEl.style.opacity = '1';
      cursorEl.style.transform = 'translate3d(' + (cx - halfSize) + 'px,' + (cy - halfSize) + 'px,0)';
    },
    isReady: function () { return initialized; }
  };
})();
