var CookieConsent = (function() {
    'use strict';

    var STORAGE_KEY = 'vipen_cookie_consent';
    var container = null;

    function hasConsented() {
        return localStorage.getItem(STORAGE_KEY) !== null;
    }

    function build() {
        if (hasConsented()) return;
        container = document.createElement('div');
        container.className = 'cookie-consent';
        container.innerHTML =
            '<div class="cookie-consent-card">' +
            '<button class="cookie-consent-close" title="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
            '<p class="cookie-consent-text">To better understand your preferences, may we use cookies?</p>' +
            '<div class="cookie-consent-actions">' +
            '<button class="cookie-consent-btn cookie-consent-accept">Accept All</button>' +
            '<button class="cookie-consent-btn cookie-consent-essential">Only Essential</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(container);
    }

    function bind() {
        if (!container) return;

        var acceptBtn = container.querySelector('.cookie-consent-accept');
        var essentialBtn = container.querySelector('.cookie-consent-essential');
        var closeBtn = container.querySelector('.cookie-consent-close');

        function consent(type) {
            localStorage.setItem(STORAGE_KEY, type);
            container.classList.add('cookie-consent-hidden');
            setTimeout(function() {
                if (container && container.parentNode) {
                    container.parentNode.removeChild(container);
                }
                container = null;
            }, 400);
        }

        acceptBtn.addEventListener('click', function() {
            consent('all');
        });

        essentialBtn.addEventListener('click', function() {
            consent('essential');
        });

        closeBtn.addEventListener('click', function() {
            consent('essential');
        });

        requestAnimationFrame(function() {
            container.classList.add('cookie-consent-visible');
        });
    }

    function init() {
        if (hasConsented()) return;
        build();
        bind();
    }

    return {
        init: init,
        hasConsented: hasConsented
    };
})();
