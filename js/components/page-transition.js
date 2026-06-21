/**
 * Page Transition — diagonal logo slice animation
 */
var PageTransition = (function() {
'use strict';

var overlay, timer;

function initOverlay() {
    if (overlay) return;
    overlay = document.getElementById('pageTransition');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pageTransition';
        overlay.className = 'pt-overlay';
        overlay.innerHTML = '<div class="pt-logo-wrap">' +
            '<div class="pt-half pt-top-left"><img src="images/vipen-logo.png" alt=""></div>' +
            '<div class="pt-half pt-bottom-right"><img src="images/vipen-logo.png" alt=""></div>' +
            '</div>';
        document.body.appendChild(overlay);
    }
}

function play(callback) {
    initOverlay();
    if (timer) clearTimeout(timer);

    // Reset
    overlay.classList.remove('slicing','hiding','active');

    // Force reflow so reset takes effect
    void overlay.offsetWidth;

    // Show
    overlay.classList.add('active');

    // Start slice after a tiny delay for visual impact
    timer = setTimeout(function() {
        overlay.classList.add('slicing');

        // After slice, fade out the whole overlay
        timer = setTimeout(function() {
            overlay.classList.add('hiding');
            overlay.classList.remove('active');

            timer = setTimeout(function() {
                overlay.classList.remove('slicing','hiding');
                if (callback) callback();
            }, 350);
        }, 650);
    }, 150);
}

return { play: play };

})();
