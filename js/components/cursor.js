var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var mouseX = 0, mouseY = 0;
    var cursorX = 0, cursorY = 0;
    var animating = false;

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.35;
        cursorY += (mouseY - cursorY) * 0.35;
        if (cursorEl) {
            cursorEl.style.left = cursorX + 'px';
            cursorEl.style.top = cursorY + 'px';
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
            });

            if (!animating) {
                animating = true;
                animateCursor();
            }
        }
    };
})();