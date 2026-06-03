var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var halfSize = 16;

    return {
        init: function(cursorId) {
            cursorEl = document.getElementById(cursorId || 'cursor');
            if (!cursorEl) return;

            document.addEventListener('mousemove', function(e) {
                cursorEl.style.opacity = '1';
                cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';
            }, { passive: true });
        }
    };
})();