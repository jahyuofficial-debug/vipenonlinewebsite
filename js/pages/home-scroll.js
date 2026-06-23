/**
 * Homepage scroll-driven animation
 * Video shrinks → "VipenOnline" reveals → QR codes appear
 * Uses GSAP ScrollTrigger with pin + scrub
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    // Only run on homepage
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html' && window.location.pathname !== '') return;

    var homeWrapper = document.getElementById('homeWrapper');
    var banner = document.getElementById('banner');
    var brandReveal = document.getElementById('brandReveal');
    var brandText = document.querySelector('.brand-text');
    var maskEl = document.querySelector('#banner .mask');
    var qrArea = document.getElementById('socialQRArea');

    if (!homeWrapper || !banner || !brandText || !qrArea) return;

    gsap.registerPlugin(ScrollTrigger);

    // Build scroll-driven timeline
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: homeWrapper,
        start: 'top top',
        end: '+=250%',  // scroll 2.5x viewport height
        scrub: 1,
        pin: true,
        pinSpacing: true,
      }
    });

    // Phase 1: Video shrinks to 0 (0% → 30%)
    tl.to(banner, {
      scale: 0,
      opacity: 0,
      ease: 'power2.in',
      duration: 0.3
    }, 0);

    // Also fade out the mask overlay
    tl.to(maskEl, {
      opacity: 0,
      duration: 0.3
    }, 0);

    // Phase 2: "VipenOnline" reveals left-to-right, becomes bold (15% → 50%)
    tl.to(brandText, {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'power2.inOut',
      duration: 0.35
    }, 0.15);

    // Font weight gets bolder slightly after text starts appearing
    tl.to(brandText, {
      fontWeight: 700,
      letterSpacing: '0.04rem',
      ease: 'power2.in',
      duration: 0.25
    }, 0.25);

    // Phase 3: QR codes fade in (50% → 70%)
    tl.to(qrArea, {
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      duration: 0.2
    }, 0.50);

    // Set initial y offset for QR so it slides up when appearing
    gsap.set(qrArea, { y: 20 });

    // Clean up old social-qr styles (moved to banner.css)
    // The standalone #socialQR no longer exists
  });

})();
