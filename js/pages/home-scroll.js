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
        '<svg viewBox="0 0 900 140" class="brand-text-svg" xmlns="http://www.w3.org/2000/svg">' +
          '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" class="brand-text-path" id="brandTextPath">VipenOnline</text>' +
        '</svg>' +
      '</div>' +
      '<div class="brand-footer-logo" id="brandFooterLogo"><img src="images/logo-bg.png" alt=""></div>' +
      '<div id="socialQRArea" class="social-qr-area">' +
        '<div class="social-qr-item" data-platform="wechat">' +
          '<svg viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm3.906 2.314c-3.681 0-6.667 2.546-6.667 5.687 0 3.14 2.986 5.687 6.667 5.687a7.572 7.572 0 0 0 2.179-.317.625.625 0 0 1 .522.074l1.41.826a.226.226 0 0 0 .122.04.217.217 0 0 0 .213-.217c0-.052-.022-.105-.035-.158l-.288-1.096a.432.432 0 0 1 .156-.494A4.96 4.96 0 0 0 22.17 13.99c0-3.14-2.986-5.685-6.666-5.685zm-2.44 3.26c.494 0 .896.407.896.908 0 .5-.402.907-.896.907a.902.902 0 0 1-.896-.907c0-.5.402-.907.896-.907zm4.884 0c.494 0 .896.407.896.908 0 .5-.402.907-.896.907a.902.902 0 0 1-.896-.907c0-.5.402-.907.896-.907z"/></svg>' +
        '</div>' +
        '<div class="social-qr-item" data-platform="instagram">' +
          '<svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>' +
        '</div>' +
        '<div class="social-qr-item" data-platform="google">' +
          '<svg viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>' +
        '</div>' +
      '</div>' +
      '<div class="brand-footer" id="brandFooter">' +
        '<div class="brand-design-by">Design by Jah72</div>' +
        '<div class="brand-copyright">© 2026 Vipen Studio. All rights reserved</div>' +
      '</div>' +
      '<div id="socialQRPopup" class="social-qr-popup">' +
        '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="QR" id="socialQRImg">' +
        '<span class="social-qr-text" id="socialQRText"></span>' +
        '<span class="social-qr-popup-label">QR coming soon</span>' +
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

    // Bind shared QR popup hover behavior
    var popup = document.getElementById('socialQRPopup');
    var img = document.getElementById('socialQRImg');
    var text = document.getElementById('socialQRText');
    var label = popup ? popup.querySelector('.social-qr-popup-label') : null;
    if (popup && img && text) {
      var qrMap = {
        wechat: { type: 'image', src: 'images/qr-wechat.png' },
        instagram: { type: 'image', src: 'images/qr-instagram.png' },
        google: { type: 'text', content: 'jahyuofficial@gmail.com' }
      };
      var items = document.querySelectorAll('.social-qr-item');
      items.forEach(function(item) {
        item.addEventListener('mouseenter', function() {
          var platform = this.getAttribute('data-platform');
          var data = qrMap[platform];
          if (!data) return;
          if (data.type === 'image') {
            img.src = data.src;
            img.style.display = 'block';
            text.style.display = 'none';
            if (label) label.style.display = 'none';
          } else {
            img.style.display = 'none';
            text.textContent = data.content;
            text.style.display = 'block';
            if (label) label.style.display = 'none';
          }
          popup.classList.add('visible');
        });
        item.addEventListener('mouseleave', function() {
          popup.classList.remove('visible');
        });
      });
      // Keep popup visible when hovering on popup itself
      popup.addEventListener('mouseenter', function() {
        popup.classList.add('visible');
      });
      popup.addEventListener('mouseleave', function() {
        popup.classList.remove('visible');
      });
    }

    // Logo hover: show when hovering footer text
    var footerEl = document.getElementById('brandFooter');
    var logoEl = document.getElementById('brandFooterLogo');
    if (footerEl && logoEl) {
      footerEl.addEventListener('mouseenter', function() { logoEl.classList.add('visible'); });
      footerEl.addEventListener('mouseleave', function() { logoEl.classList.remove('visible'); });
      logoEl.addEventListener('mouseenter', function() { logoEl.classList.add('visible'); });
      logoEl.addEventListener('mouseleave', function() { logoEl.classList.remove('visible'); });
    }
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
    var brandSvg = document.querySelector('.brand-text-svg');
    var brandPath = document.getElementById('brandTextPath');
    var footerEl = document.getElementById('brandFooter');
    var maskEl = document.querySelector('#banner .mask');
    var qrArea = document.getElementById('socialQRArea');

    if (!homeWrapper || !banner || !brandPath || !qrArea) {
      // If elements not found (e.g. wrapper hidden), clean up injected DOM
      removeScrollContent();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Initial state: text hidden, fill white
    gsap.set(brandSvg, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(brandPath, { fill: '#fff' });
    gsap.set(footerEl, { opacity: 0 });
    gsap.set(qrArea, { opacity: 0, y: 20 });

    var tl = gsap.timeline({
      scrollTrigger: {
        id: 'homeScrollAnim',
        trigger: homeWrapper,
        start: 'top top',
        end: '+=180%',
        scrub: 1,
        pin: true,
        pinSpacing: true
      }
    });

    scrollTriggerInstance = ScrollTrigger.getById('homeScrollAnim');
    setupComplete = true;

    // Phase 1: Video shrinks to 0 (0% → 25%)
    tl.to(banner, { scale: 0, opacity: 0, ease: 'power2.in', duration: 0.25 }, 0);
    tl.to(maskEl, { opacity: 0, duration: 0.25 }, 0);

    // Phase 2: Text reveals left→right (15% → 65%)
    tl.to(brandSvg, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.inOut', duration: 0.50 }, 0.15);

    // Phase 3: Fill turns fluorescent green (58% → 64%)
    tl.to(brandPath, { fill: '#39ff14', ease: 'power2.in', duration: 0.06 }, 0.58);

    // Phase 4: Copyright + Logo base reveal (58% → 68%)
    tl.to(footerEl, { opacity: 1, ease: 'power2.out', duration: 0.10 }, 0.58);
    tl.to('.brand-footer-logo', { opacity: 0.18, ease: 'power2.out', duration: 0.10 }, 0.62);

    // Phase 5: Social QR icons fade in (72% → 88%)
    tl.to(qrArea, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.16 }, 0.72);
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
