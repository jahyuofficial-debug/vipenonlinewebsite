(function () {
    var longPressTimer;
    var longPressDuration = 500;
    var touchStartX, touchStartY;
    var touchMoved = false;

    function blockEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    document.addEventListener('contextmenu', blockEvent);

    document.addEventListener('dragstart', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'img' || tag === 'video' || tag === 'source' || tag === 'canvas') {
            return blockEvent(e);
        }
    });

    document.addEventListener('selectstart', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'img' || tag === 'video') {
            return blockEvent(e);
        }
    });

    document.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            touchMoved = false;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            var target = e.target;
            var tag = (target.tagName || '').toLowerCase();
            if (tag === 'img' || tag === 'video' || tag === 'canvas') {
                longPressTimer = setTimeout(function () {
                    var evt = new Event('contextmenu', { bubbles: true, cancelable: true });
                    target.dispatchEvent(evt);
                }, longPressDuration);
            }
        }
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
        if (e.touches.length === 1 && longPressTimer) {
            var dx = Math.abs(e.touches[0].clientX - touchStartX);
            var dy = Math.abs(e.touches[0].clientY - touchStartY);
            if (dx > 10 || dy > 10) {
                touchMoved = true;
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', function () {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (touchMoved) {
            touchMoved = false;
        }
    });

    document.addEventListener('touchcancel', function () {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        touchMoved = false;
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'F12') {
            return blockEvent(e);
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            return blockEvent(e);
        }
        if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U' || e.key === 'p' || e.key === 'P')) {
            return blockEvent(e);
        }
    });

    function applyProtectionStyles() {
        var style = document.createElement('style');
        style.id = 'anti-scrape-styles';
        style.textContent = [
            'img, video, canvas, source {',
            '  -webkit-user-select: none !important;',
            '  -moz-user-select: none !important;',
            '  -ms-user-select: none !important;',
            '  user-select: none !important;',
            '  -webkit-user-drag: none !important;',
            '  -khtml-user-drag: none !important;',
            '  -moz-user-drag: none !important;',
            '  -o-user-drag: none !important;',
            '  user-drag: none !important;',
            '  -webkit-touch-callout: none !important;',
            '  pointer-events: auto;',
            '}',
            'img, video {',
            '  -webkit-tap-highlight-color: transparent !important;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyProtectionStyles);
    } else {
        applyProtectionStyles();
    }

    var observer = new MutationObserver(function () {
        var styleEl = document.getElementById('anti-scrape-styles');
        if (!styleEl) {
            applyProtectionStyles();
        }
    });
    observer.observe(document.head, { childList: true, subtree: false });
})();