var MiniPlayer = (function() {
    'use strict';

    var miniPlayer = null;
    var miniPlayerVinyl = null;
    var miniPlayerVinylLabel = null;
    var miniPlayerCoverImg = null;
    var miniPlayerTitle = null;
    var miniPlayerArtist = null;
    var miniPlayerClose = null;
    var miniPlayerPrevBtn = null;
    var miniPlayerNextBtn = null;
    var miniPlayerPlayBtn = null;
    var miniPlayerPlayIcon = null;
    var miniPlayerProgressTrack = null;
    var miniPlayerProgressBar = null;
    var miniPlayerCurrentTime = null;
    var miniPlayerDuration = null;
    var miniPlayerCardCover = null;

    var visible = false;
    var wasPlaying = false;
    var drag = { isDragging: false, hasMoved: false, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 };

    var callbacks = {};

    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' + s : s);
    }

    function updatePlayIcon() {
        if (!miniPlayerPlayIcon) return;
        if (typeof discAudio !== 'undefined' && discAudio && !discAudio.paused) {
            miniPlayerPlayIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        } else {
            miniPlayerPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        }
    }

    function updateProgress() {
        if (typeof discAudio === 'undefined' || !discAudio || !discAudio.duration) return;
        if (miniPlayerProgressBar) {
            miniPlayerProgressBar.style.width = (discAudio.currentTime / discAudio.duration * 100) + '%';
        }
        if (miniPlayerCurrentTime) miniPlayerCurrentTime.textContent = formatTime(discAudio.currentTime);
        if (miniPlayerDuration) miniPlayerDuration.textContent = formatTime(discAudio.duration);
    }

    function syncWithDisc() {
        if (typeof discData === 'undefined') return;
        var tapes = discData.tapes || [];
        var currentIndex = discData.currentTapeIndex || 0;
        var currentTape = tapes[currentIndex] || {};
        var cover = currentTape.cover || '';
        var isIndexedDB = typeof DiscDB !== 'undefined' && DiscDB.isIndexedDBRef(cover);
        var validCover = cover && !isIndexedDB ? cover : '';
        if (miniPlayerVinylLabel) miniPlayerVinylLabel.style.backgroundImage = validCover ? 'url(' + validCover + ')' : '';
        if (miniPlayerCoverImg) {
            miniPlayerCoverImg.src = validCover;
            if (!validCover) {
                miniPlayerCoverImg.style.display = 'none';
                if (miniPlayerCardCover) miniPlayerCardCover.style.background = 'linear-gradient(135deg,#1a1a2e,#16213e)';
            } else {
                miniPlayerCoverImg.style.display = '';
            }
        }
        if (miniPlayerTitle) miniPlayerTitle.textContent = currentTape.title || 'Unknown Track';
        updateProgress();
        updatePlayIcon();
    }

    function setProgressFromX(clientX) {
        if (!miniPlayerProgressTrack || typeof discAudio === 'undefined' || !discAudio || !discAudio.duration) return;
        var rect = miniPlayerProgressTrack.getBoundingClientRect();
        var percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        discAudio.currentTime = percent * discAudio.duration;
        updateProgress();
        if (callbacks.onProgressChange) callbacks.onProgressChange();
    }

    function isControlElement(target) {
        return target.closest('.mini-player-close') ||
               target.closest('.mini-player-card-btn') ||
               target.closest('.mini-player-card-play-btn') ||
               target.closest('.mini-player-card-progress') ||
               target.closest('.mini-player-card-cover');
    }

    function togglePlayPause() {
        if (typeof discAudio === 'undefined' || !discAudio) return;
        if (discAudio.paused) {
            discAudio.play().catch(function(){});
        } else {
            discAudio.pause();
        }
    }

    function updateState(currentPage, discIsPlaying, discVisited) {
        if (!miniPlayer) return;
        var isDiscPage = currentPage === 'disc-library';
        var isPlayingOnDiscPage = isDiscPage && discIsPlaying;
        var shouldShow = visible && !isDiscPage;

        if (!discVisited) {
            miniPlayer.classList.add('hidden', 'no-interaction');
            miniPlayer.classList.remove('playing', 'paused');
            return;
        }

        if (isPlayingOnDiscPage) {
            miniPlayer.classList.add('no-interaction');
            miniPlayer.classList.remove('hidden');
        } else if (shouldShow) {
            miniPlayer.classList.remove('hidden', 'no-interaction');
            if (discIsPlaying) {
                miniPlayer.classList.add('playing');
                miniPlayer.classList.remove('paused');
            } else {
                miniPlayer.classList.add('paused');
                miniPlayer.classList.remove('playing');
            }
        } else {
            miniPlayer.classList.add('hidden');
            miniPlayer.classList.remove('no-interaction');
        }
        updatePlayIcon();
    }

    return {
        init: function(opts) {
            opts = opts || {};
            callbacks = opts.callbacks || {};

            miniPlayer = document.getElementById('miniPlayer');
            if (!miniPlayer) return;

            miniPlayerVinyl = document.getElementById('miniPlayerVinyl');
            miniPlayerVinylLabel = document.getElementById('miniPlayerVinylLabel');
            miniPlayerCoverImg = document.getElementById('miniPlayerCoverImg');
            miniPlayerTitle = document.getElementById('miniPlayerTitle');
            miniPlayerArtist = document.getElementById('miniPlayerArtist');
            miniPlayerClose = document.getElementById('miniPlayerClose');
            miniPlayerPrevBtn = document.getElementById('miniPlayerPrevBtn');
            miniPlayerNextBtn = document.getElementById('miniPlayerNextBtn');
            miniPlayerPlayBtn = document.getElementById('miniPlayerPlayBtn');
            miniPlayerPlayIcon = document.getElementById('miniPlayerPlayIcon');
            miniPlayerProgressTrack = document.getElementById('miniPlayerProgressTrack');
            miniPlayerProgressBar = document.getElementById('miniPlayerProgressBar');
            miniPlayerCurrentTime = document.getElementById('miniPlayerCurrentTime');
            miniPlayerDuration = document.getElementById('miniPlayerDuration');
            miniPlayerCardCover = document.getElementById('miniPlayerCardCover');

            miniPlayer.addEventListener('mousedown', function(e) {
                if (isControlElement(e.target)) return;
                drag.isDragging = true;
                drag.hasMoved = false;
                drag.startX = e.clientX;
                drag.startY = e.clientY;
                var rect = miniPlayer.getBoundingClientRect();
                drag.initialLeft = rect.left;
                drag.initialTop = rect.top;
                miniPlayer.style.transition = 'none';
                miniPlayer.style.cursor = 'grabbing';
            });

            miniPlayer.addEventListener('touchstart', function(e) {
                if (isControlElement(e.target)) return;
                drag.isDragging = true;
                drag.hasMoved = false;
                var touch = e.touches[0];
                drag.startX = touch.clientX;
                drag.startY = touch.clientY;
                var rect = miniPlayer.getBoundingClientRect();
                drag.initialLeft = rect.left;
                drag.initialTop = rect.top;
                miniPlayer.style.transition = 'none';
            }, { passive: false });

            miniPlayer.addEventListener('mouseenter', function(e) {
                if (!isControlElement(e.target)) {
                    miniPlayer.style.cursor = 'grab';
                }
            });

            miniPlayer.addEventListener('mouseleave', function() {
                miniPlayer.style.cursor = 'grab';
            });

            if (miniPlayerClose) {
                miniPlayerClose.addEventListener('click', function() {
                    if (typeof discAudio !== 'undefined' && discAudio) discAudio.pause();
                    visible = false;
                    updateState(callbacks.getCurrentPage ? callbacks.getCurrentPage() : '', typeof discIsPlaying !== 'undefined' ? discIsPlaying : false, typeof discVisited !== 'undefined' ? discVisited : false);
                });
            }

            if (miniPlayerPrevBtn) {
                miniPlayerPrevBtn.addEventListener('click', function() {
                    if (callbacks.prevTrack) callbacks.prevTrack();
                });
            }

            if (miniPlayerNextBtn) {
                miniPlayerNextBtn.addEventListener('click', function() {
                    if (callbacks.nextTrack) callbacks.nextTrack();
                });
            }

            if (miniPlayerPlayBtn) {
                miniPlayerPlayBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    togglePlayPause();
                });
            }

            if (miniPlayerProgressTrack) {
                miniPlayerProgressTrack.addEventListener('click', function(e) {
                    e.stopPropagation();
                    setProgressFromX(e.clientX);
                });
            }

            if (miniPlayerCardCover) {
                miniPlayerCardCover.addEventListener('click', function(e) {
                    if (drag.hasMoved) return;
                    if (callbacks.goToDiscPage) callbacks.goToDiscPage();
                });
            }
        },

        show: function() {
            visible = true;
            syncWithDisc();
        },

        hide: function() {
            visible = false;
        },

        isVisible: function() {
            return visible;
        },

        updateState: updateState,
        updateProgress: updateProgress,
        updatePlayIcon: updatePlayIcon,
        syncWithDisc: syncWithDisc,

        handleMouseMove: function(e) {
            if (!drag.isDragging || !miniPlayer) return;
            var dx = e.clientX - drag.startX;
            var dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.hasMoved = true;
            var newLeft = drag.initialLeft + dx;
            var newTop = drag.initialTop + dy;
            var maxLeft = window.innerWidth - miniPlayer.offsetWidth;
            var maxTop = window.innerHeight - miniPlayer.offsetHeight;
            newLeft = Math.max(0, Math.min(maxLeft, newLeft));
            newTop = Math.max(0, Math.min(maxTop, newTop));
            miniPlayer.style.left = newLeft + 'px';
            miniPlayer.style.top = newTop + 'px';
            miniPlayer.style.right = 'auto';
            miniPlayer.style.bottom = 'auto';
        },

        handleTouchMove: function(e) {
            if (!drag.isDragging || !miniPlayer) return;
            var touch = e.touches[0];
            var dx = touch.clientX - drag.startX;
            var dy = touch.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.hasMoved = true;
            var newLeft = drag.initialLeft + dx;
            var newTop = drag.initialTop + dy;
            var maxLeft = window.innerWidth - miniPlayer.offsetWidth;
            var maxTop = window.innerHeight - miniPlayer.offsetHeight;
            newLeft = Math.max(0, Math.min(maxLeft, newLeft));
            newTop = Math.max(0, Math.min(maxTop, newTop));
            miniPlayer.style.left = newLeft + 'px';
            miniPlayer.style.top = newTop + 'px';
            miniPlayer.style.right = 'auto';
            miniPlayer.style.bottom = 'auto';
        },

        handleMouseUp: function() {
            if (drag.isDragging) {
                drag.isDragging = false;
                if (miniPlayer) {
                    miniPlayer.style.transition = 'transform .2s,opacity .3s';
                    miniPlayer.style.cursor = 'grab';
                }
            }
        }
    };
})();