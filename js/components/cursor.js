var Cursor = (function() {
    'use strict';

    var cursorEl = null;
    var halfSize = 16;
    var initialized = false;

    return {
        init: function(cursorId) {
            cursorEl = document.getElementById(cursorId || 'cursor');
            if (!cursorEl) {
                // Fallback: restore native cursor if custom element missing
                document.body.style.cursor = 'auto';
                return;
            }

            initialized = true;

            // Global rule to hide the native cursor so only the custom one shows.
            // Exclude form elements and contenteditable so text editing still works.
            var style = document.createElement('style');
            style.id = 'cursor-hide-native';
            style.textContent = [
                'html.cursor-custom-active,',
                'html.cursor-custom-active body,',
                'html.cursor-custom-active *:not(input):not(textarea):not(select):not([contenteditable="true"])',
                '{ cursor: none !important; }'
            ].join('');
            document.head.appendChild(style);
            document.documentElement.classList.add('cursor-custom-active');

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
