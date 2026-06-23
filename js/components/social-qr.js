/**
 * Social QR Component
 * Bottom-left corner WeChat + Instagram icons
 * Hover to reveal QR code popup
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    var items = document.querySelectorAll('.social-qr-item');

    items.forEach(function(item) {
      var popup = item.querySelector('.social-qr-popup');
      var hideTimer = null;

      // Delay hide on mouse leave to prevent flicker
      item.addEventListener('mouseenter', function() {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
      });

      item.addEventListener('mouseleave', function() {
        hideTimer = setTimeout(function() {
          // CSS handles the hide via :hover, no extra logic needed
        }, 100);
      });

      // Also handle popup itself — keep showing when hovering on popup
      if (popup) {
        popup.addEventListener('mouseenter', function() {
          if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
          }
        });
      }
    });
  });
})();
