var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var halfSize = 16;
    var initialized = false;

    return {
        init: function(cursorId) {
            cursorEl = document.getElementById(cursorId || 'cursor');
            if (!cursorEl) return;

            initialized = true;

            document.addEventListener('mousemove', function(e) {
                cursorEl.style.opacity = '1';
                cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';
            }, { passive: true });

            // Show cursor immediately at screen center
            var cx = window.innerWidth / 2;
            var cy = window.innerHeight / 2;
            cursorEl.style.opacity = '1';
            cursorEl.style.transform = 'translate3d(' + (cx - halfSize) + 'px,' + (cy - halfSize) + 'px,0)';
        },
        isReady: function() { return initialized; }
    };
})();
