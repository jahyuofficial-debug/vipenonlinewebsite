var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var halfSize = 16;
    var initialized = false;

    function ensureNoNativeCursor() {
        if (document.getElementById('cursor-hide-native')) return;
        var s = document.createElement('style');
        s.id = 'cursor-hide-native';
        s.textContent = '*,*::before,*::after{cursor:none!important}input,textarea,select,[contenteditable=true]{cursor:auto!important}';
        document.head.appendChild(s);
        // inline !important on html root covers viewport edges where no child element sits
        document.documentElement.style.setProperty('cursor', 'none', 'important');
    }

    return {
        init: function(cursorId) {
            cursorEl = document.getElementById(cursorId || 'cursor');
            if (!cursorEl) return;

            initialized = true;
            ensureNoNativeCursor();

            document.addEventListener('mousemove', function(e) {
                cursorEl.style.opacity = '1';
                cursorEl.style.transform = 'translate3d(' + (e.clientX - halfSize) + 'px,' + (e.clientY - halfSize) + 'px,0)';
            }, { passive: true });

            var cx = window.innerWidth / 2;
            var cy = window.innerHeight / 2;
            cursorEl.style.opacity = '1';
            cursorEl.style.transform = 'translate3d(' + (cx - halfSize) + 'px,' + (cy - halfSize) + 'px,0)';
        },
        isReady: function() { return initialized; }
    };
})();
