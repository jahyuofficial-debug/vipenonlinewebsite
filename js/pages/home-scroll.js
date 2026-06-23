/**
 * Homepage scroll-driven animation (SPA-aware)
 * Video shrinks → "VipenOnline" reveals → QR codes appear
 * Uses GSAP ScrollTrigger with pin + scrub
 * Listens for hash-based SPA navigation to activate/deactivate
 */
(function() {
  'use strict';

  var scrollTriggerInstance = null;
  var setupComplete = false;

  function getCurrentPage() {
    var hash = window.location.hash.replace('#/', '');
    return hash || 'home';
  }

  function isHomepage() {
    return getCurrentPage() === 'home';
  }

  function killAnimation() {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
    // Clean up inline styles set by GSAP/ScrollTrigger pinning
    var homeWrapper = document.getElementById('homeWrapper');
    if (homeWrapper) {
      homeWrapper.removeAttribute('style');
    }
    var brandText = document.querySelector('.brand-text');
    if (brandText) {
      brandText.style.clipPath = 'inset(0 100% 0 0)';
      brandText.style.fontWeight = '300';
      brandText.style.letterSpacing = '0.02rem';
    }
    var qrArea = document.getElementById('socialQRArea');
    if (qrArea) {
      qrArea.style.opacity = '0';
    }
    setupComplete = false;
  }

  function isVisible(el) {
    if (!el) return false;
    return el.offsetParent !== null || (el.style && el.style.display !== 'none');
  }

  function setupAnimation() {
    if (setupComplete) return; // Prevent duplicate setup

    var homeWrapper = document.getElementById('homeWrapper');
    var banner = document.getElementById('banner');
    var brandText = document.querySelector('.brand-text');
    var maskEl = document.querySelector('#banner .mask');
    var qrArea = document.getElementById('socialQRArea');

    if (!homeWrapper || !banner || !brandText || !qrArea) return;
    if (!isVisible(homeWrapper)) return; // Don't setup if wrapper is hidden

    gsap.registerPlugin(ScrollTrigger);

    // Reset elements to initial animation state
    gsap.set(banner, { clearProps: 'all' });
    gsap.set(maskEl, { clearProps: 'all' });
    gsap.set(brandText, { clipPath: 'inset(0 100% 0 0)', fontWeight: 300, letterSpacing: '0.02rem', clearProps: 'all' });
    gsap.set(qrArea, { opacity: 0, y: 20, clearProps: 'all' });

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

    // Phase 1: Video shrinks to 0 (0% → 30%)
    tl.to(banner, { scale: 0, opacity: 0, ease: 'power2.in', duration: 0.3 }, 0);
    tl.to(maskEl, { opacity: 0, duration: 0.3 }, 0);

    // Phase 2: "VipenOnline" reveals left-to-right, becomes bold (15% → 50%)
    tl.to(brandText, { clipPath: 'inset(0 0% 0 0)', ease: 'power2.inOut', duration: 0.35 }, 0.15);
    tl.to(brandText, { fontWeight: 700, letterSpacing: '0.04rem', ease: 'power2.in', duration: 0.25 }, 0.25);

    // Phase 3: QR codes fade in (50% → 70%)
    tl.to(qrArea, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.50);
  }

  function onHashChange() {
    if (isHomepage()) {
      killAnimation(); // Clean up any stale state
      // Small delay to let main.js set display:block first
      requestAnimationFrame(function() {
        setupAnimation();
        ScrollTrigger.refresh();
      });
    } else {
      killAnimation();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (!isHomepage()) return;
    setupAnimation();

    // Listen for SPA page navigation
    window.addEventListener('hashchange', onHashChange);
  });

})();
