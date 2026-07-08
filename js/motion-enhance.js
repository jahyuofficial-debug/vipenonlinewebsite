/* ============================================================
   Vipen Motion Enhancement — Global scroll reveal & hover effects
   Added 2026-07-06 for Black × Gold × Green redesign
   ============================================================ */
(function() {
  'use strict';

  /* ── 1. Scroll Reveal (IntersectionObserver) ── */
  function initRevealObserver() {
    if (!window.IntersectionObserver) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    var els = document.querySelectorAll('.reveal-up, .reveal-fade, .fresh-article, .action-post, .dw-card, .msg-item');
    els.forEach(function(el) { observer.observe(el); });
  }

  /* ── 2. Magnetic hover effect for buttons (desktop only) ── */
  function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var buttons = document.querySelectorAll('.authBtn, .fresh-carousel-arrow, .disc-glass-btn, .mini-player-card-btn, .mini-player-card-play-btn');
    buttons.forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px) scale(1.05)';
      });
      btn.addEventListener('mouseleave', function() {
        btn.style.transform = '';
      });
    });
  }

  /* ── 3. Golden cursor trail (subtle, desktop only) ── */
  function initCursorTrail() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var trail = document.createElement('div');
    trail.style.cssText = 'position:fixed;width:6px;height:6px;border-radius:50%;background:rgba(212,168,83,.4);pointer-events:none;z-index:9999;transition:opacity .6s;opacity:0;box-shadow:0 0 8px rgba(212,168,83,.3);';
    document.body.appendChild(trail);
    var lastX = 0, lastY = 0, timer = null;
    document.addEventListener('mousemove', function(e) {
      trail.style.left = (e.clientX - 3) + 'px';
      trail.style.top = (e.clientY - 3) + 'px';
      trail.style.opacity = '1';
      clearTimeout(timer);
      timer = setTimeout(function() { trail.style.opacity = '0'; }, 100);
    });
  }

  /* ── 4. Parallax on hero scroll (desktop only) ── */
  function initParallax() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var hero = document.getElementById('banner');
    if (!hero) return;
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          var y = window.scrollY || window.pageYOffset;
          var rate = y * 0.15;
          var video = hero.querySelector('.bannerVideo, .banner-img-bg');
          if (video) video.style.transform = 'translateY(' + rate + 'px)';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── 5. Stagger reveal for lists ── */
  function initStaggerReveal() {
    var lists = document.querySelectorAll('.action-feed-list, .fresh-article-list, .msg-list');
    lists.forEach(function(list) {
      var items = list.querySelectorAll('.action-post, .fresh-article, .msg-item');
      items.forEach(function(item, i) {
        item.style.transitionDelay = (i * 0.06) + 's';
      });
    });
  }

  /* ── 6. Smooth scroll for anchor links ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach(function(a) {
      a.addEventListener('click', function(e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initRevealObserver();
      initMagneticButtons();
      initCursorTrail();
      initParallax();
      initStaggerReveal();
      initSmoothScroll();
    });
  } else {
    initRevealObserver();
    initMagneticButtons();
    initCursorTrail();
    initParallax();
    initStaggerReveal();
    initSmoothScroll();
  }
})();
