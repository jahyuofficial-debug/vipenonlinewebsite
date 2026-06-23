/**
 * Homepage scroll-driven animation (SPA-aware)
 * Dynamically injects VipenOnline + QR content ONLY on homepage
 * Removes from DOM entirely when leaving homepage
 */
(function() {
  'use strict';

  var scrollTriggerInstance = null;
  var setupComplete = false;

  var QR_HTML = '' +
    '<div id="scrollContent" class="scroll-content">' +
      '<div id="brandReveal" class="brand-reveal">' +
        '<span class="brand-text">VipenOnline</span>' +
      '</div>' +
      '<div id="socialQRArea" class="social-qr-area">' +
        '<div class="social-qr-item" data-platform="wechat">' +
          '<svg viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.906 2.314c-3.681 0-6.667 2.546-6.667 5.687 0 3.14 2.986 5.687 6.667 5.687a7.572 7.572 0 0 0 2.179-.317.625.625 0 0 1 .522.074l1.41.826a.226.226 0 0 0 .122.04.217.217 0 0 0 .213-.217c0-.052-.022-.105-.035-.158l-.288-1.096a.432.432 0 0 1 .156-.494A4.96 4.96 0 0 0 22.17 13.99c0-3.14-2.986-5.685-6.666-5.685zm-2.44 3.26c.494 0 .896.407.896.908 0 .5-.402.907-.896.907a.902.902 0 0 1-.896-.907c0-.5.402-.907.896-.907zm4.884 0c.494 0 .896.407.896.908 0 .5-.402.907-.896.907a.902.902 0 0 1-.896-.907c0-.5.402-.907.896-.907z"/></svg>' +
          '<div class="social-qr-popup">' +
            '<img src="images/qr-wechat.png" alt="WeChat QR" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">' +
            '<span class="social-qr-popup-label" style="display:none;">QR coming soon</span>' +
          '</div>' +
        '</div>' +
        '<div class="social-qr-item" data-platform="instagram">' +
          '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>' +
          '<div class="social-qr-popup">' +
            '<img src="images/qr-instagram.png" alt="Instagram QR" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">' +
            '<span class="social-qr-popup-label" style="display:none;">QR coming soon</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function getCurrentPage() {
    return window.location.hash.replace('#/', '') || 'home';
  }

  function isHomepage() {
    return getCurrentPage() === 'home';
  }

  function injectScrollContent() {
    if (document.getElementById('scrollContent')) return;
    var homeWrapper = document.getElementById('homeWrapper');
    if (!homeWrapper) return;
    var temp = document.createElement('div');
    temp.innerHTML = QR_HTML;
    var el = temp.firstChild;
    homeWrapper.appendChild(el);
  }

  function removeScrollContent() {
    var el = document.getElementById('scrollContent');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function killAnimation() {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
    removeScrollContent();
    setupComplete = false;
  }

  function setupAnimation() {
    if (setupComplete) return;

    // Inject DOM synchronously before querying
    injectScrollContent();

    var homeWrapper = document.getElementById('homeWrapper');
    var banner = document.getElementById('banner');
    var brandText = document.querySelector('.brand-text');
    var maskEl = document.querySelector('#banner .mask');
    var qrArea = document.getElementById('socialQRArea');

    if (!homeWrapper || !banner || !brandText || !qrArea) {
      // If elements not found (e.g. wrapper hidden), clean up injected DOM
      removeScrollContent();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(brandText, { clipPath: 'inset(0 100% 0 0)', fontWeight: 300, letterSpacing: '0.02rem' });
    gsap.set(qrArea, { opacity: 0, y: 20 });

    var tl = gsap.timeline({
      scrollTrigger: {
        id: 'homeScrollAnim',
        trigger: homeWrapper,
        start: 'top top',
        end: '+=250%',
        scrub: 1,
        pin: true,
        pinSpacing: true
      }
    });

    scrollTriggerInstance = ScrollTrigger.getById('homeScrollAnim');
    setupComplete = true;

    tl.to(banner, { scale: 0, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0);
    tl.to(maskEl, { opacity: 0, duration: 0.3 }, 0);
    tl.to(brandText, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.inOut', duration: 0.35 }, 0.15);
    tl.to(brandText, { fontWeight: 700, letterSpacing: '0.04rem', ease: 'power2.in', duration: 0.25 }, 0.25);
    tl.to(qrArea, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.50);
  }

  function onHashChange() {
    if (isHomepage()) {
      killAnimation();
      setupAnimation();
      ScrollTrigger.refresh();
    } else {
      killAnimation();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (!isHomepage()) return;
    setupAnimation();
    window.addEventListener('hashchange', onHashChange);
  });

})();
