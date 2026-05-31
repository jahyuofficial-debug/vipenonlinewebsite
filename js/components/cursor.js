var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var mouseX = 0, mouseY = 0;
    var cursorX = 0, cursorY = 0;
    var halfSize = 16;
    var initialized = false;
    var animating = false;

    function animateCursor() {
        var dx = mouseX - cursorX;
        var dy = mouseY - cursorY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var factor = dist < 3 ? 0.7 : (dist < 30 ? 0.55 : 0.65);
        cursorX += dx * factor;
        cursorY += dy * factor;
        if (cursorEl) {
            cursorEl.style.transform = 'translate3d(' + (cursorX - halfSize) + 'px,' + (cursorY - halfSize) + 'px,0)';
        }
        requestAnimationFrame(animateCursor);
    }

    return {
        init: function(cursorId) {
            cursorEl = document.getElementById(cursorId || 'cursor');
            if (!cursorEl) return;

            document.addEventListener('mousemove', function(e) {
                mouseX = e.clientX;
                mouseY = e.clientY;
                if (!initialized) {
                    initialized = true;
                    cursorX = e.clientX;
                    cursorY = e.clientY;
                    cursorEl.style.opacity = '1';
                }
            }, { passive: true });

            if (!animating) {
                animating = true;
                animateCursor();
            }
        }
    };
})();