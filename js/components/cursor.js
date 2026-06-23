/** Cursor – custom dot, native cursor suppressed reactively. */
var Cursor = (function () {
  'use strict';

  var cursorEl = null;
  var dotEl = null;
  var halfSize = 16;
  var initialized = false;
  var hovered = false;

  // Check if element is interactive / clickable
  function isInteractive(el) {
    var node = el;
    while (node && node.nodeType === 1) {
      var tag = node.tagName;
      if (tag === 'A' || tag === 'BUTTON') return true;
      if (node.getAttribute && node.getAttribute('role') === 'button') return true;
      if (typeof node.onclick === 'function' || node.hasAttribute('onclick')) return true;
      // Common clickable class patterns in Vipen
      if (node.classList) {
        for (var i = 0; i < node.classList.length; i++) {
          var c = node.classList[i];
          if (c.indexOf('card') !== -1 || c.indexOf('btn') !== -1 ||
              c.indexOf('link') !== -1 || c.indexOf('navLink') !== -1 ||
              c.indexOf('toggle') !== -1 || c.indexOf('close') !== -1 ||
              c === 'clickable') return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  return {
    init: function (cursorId) {
      cursorEl = document.getElementById(cursorId || 'cursor');
      if (!cursorEl) return;
      dotEl = cursorEl.querySelector('.inner');

      initialized = true;

      // Show custom cursor, hide native cursor
      document.body.style.cursor = 'none';

      // Whitelist: elements that show native cursor (form fields)
      function isFormLike(el) {
        var tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
               el.getAttribute('contenteditable') === 'true';
      }

      document.addEventListener('mousemove', function (e) {
        // Move custom dot
        cursorEl.style.opacity = '1';
        cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';

        // Check if under clickable element
        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.nodeType === 1) {
          var nowHovered = isInteractive(el);
          if (nowHovered !== hovered) {
            hovered = nowHovered;
            if (dotEl) {
              dotEl.style.width  = hovered ? '20px' : '8px';
              dotEl.style.height = hovered ? '20px' : '8px';
            }
          }
          // Restore native cursor only on form-like elements (body has cursor:none globally)
          if (isFormLike(el) && el.style) {
            el.style.cursor = 'text';
          }
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
