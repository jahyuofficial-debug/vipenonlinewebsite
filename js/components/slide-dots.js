var SlideDots = (function() {
    'use strict';

    var dotSelector = '#slideDots .dot';
    var slideDuration = 5000;
    var totalSlides = 1;
    var changeSlideFn = null;

    var autoSlideInterval = null;
    var progressAnimFrame = null;
    var progressStartTime = 0;
    var slideChangeTimeout = null;

    function startProgress() {
        stopProgress();
        var activeDot = document.querySelector(dotSelector + '.active');
        if (!activeDot) return;
        var progressBar = activeDot.querySelector('.dot-progress');
        if (!progressBar) return;
        progressBar.style.width = '0%';
        progressStartTime = performance.now();
        function tick(now) {
            var elapsed = now - progressStartTime;
            var pct = Math.min((elapsed / slideDuration) * 100, 100);
            progressBar.style.width = pct + '%';
            if (pct < 100) {
                progressAnimFrame = requestAnimationFrame(tick);
            }
        }
        progressAnimFrame = requestAnimationFrame(tick);
    }

    function stopProgress() {
        if (progressAnimFrame) {
            cancelAnimationFrame(progressAnimFrame);
            progressAnimFrame = null;
        }
        var allBars = document.querySelectorAll(dotSelector + ' .dot-progress');
        allBars.forEach(function(bar) { bar.style.width = '0%'; });
    }

    function goToNextSlide() {
        if (changeSlideFn) {
            changeSlideFn('next');
        }
    }

    function startAutoSlide() {
        stopAutoSlide();
        startProgress();
        autoSlideInterval = setInterval(function() {
            goToNextSlide();
        }, slideDuration);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
        if (slideChangeTimeout) {
            clearTimeout(slideChangeTimeout);
            slideChangeTimeout = null;
        }
        stopProgress();
    }

    function updateDots(currentIndex) {
        var dots = document.querySelectorAll(dotSelector);
        dots.forEach(function(dot, i) {
            if (i === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    return {
        init: function(config) {
            config = config || {};
            dotSelector = config.dotSelector || '#slideDots .dot';
            slideDuration = config.slideDuration || 5000;
            totalSlides = config.totalSlides || 1;
            changeSlideFn = config.changeSlide || null;

            var dots = document.querySelectorAll(dotSelector);
            dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                    var idx = parseInt(this.getAttribute('data-index'));
                    if (changeSlideFn) changeSlideFn(idx);
                });
            });
        },

        startAutoSlide: startAutoSlide,
        stopAutoSlide: stopAutoSlide,
        startProgress: startProgress,
        stopProgress: stopProgress,
        updateDots: updateDots,

        resetAutoSlideInterval: function() {
            if (autoSlideInterval) {
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(function() {
                    goToNextSlide();
                }, slideDuration);
            }
        },

        setSlideChangeTimeout: function(timeout) {
            slideChangeTimeout = timeout;
        }
    };
})();