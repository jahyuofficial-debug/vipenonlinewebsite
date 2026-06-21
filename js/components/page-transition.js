/**
 * Page Transition — diagonal logo slice animation
 */
var PageTransition = (function() {
'use strict';

var overlay, timer;

function initOverlay() {
    if (overlay) return;
    var el = document.getElementById('pageTransition');
    if (el) { overlay = el; return; }
    overlay = document.createElement('div');
    overlay.id = 'pageTransition';
    overlay.className = 'pt-overlay';
    overlay.innerHTML = '<div class="pt-logo-wrap">' +
        '<div class="pt-half pt-top-left"><img src="images/vipen-logo.png" alt=""></div>' +
        '<div class="pt-half pt-bottom-right"><img src="images/vipen-logo.png" alt=""></div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function play(callback) {
    initOverlay();
    if (timer) clearTimeout(timer);

    // Reset classes
    overlay.classList.remove('anim','fadeout','show');

    // Force reflow
    void overlay.offsetWidth;

    // Show overlay immediately
    overlay.classList.add('show');

    // Start slice animation after brief pause
    timer = setTimeout(function() {
        overlay.classList.add('anim');
        overlay.classList.add('fadeout');

        // After animations complete, hide and call back
        timer = setTimeout(function() {
            overlay.classList.remove('anim','fadeout','show');
            if (callback) callback();
        }, 900); // .55s slice + .3s fade
    }, 120);
}

return { play: play };

})();
