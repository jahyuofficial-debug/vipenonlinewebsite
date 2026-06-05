var DiscPage = (function() {
'use strict';

var discProgressInterval = null;
var discIsPlaying = false;
var discVisualizerInterval = null;
var discVisualizerBars = 12;
var discVisualizerAnimId = null;
var discAudioCtx = null;
var discAnalyser = null;
var discFreqData = null;
var discBgCurrentBrightness = 0.55;
var discBgBaseBrightness = 0.55;
var discAudioEventsInited = false;
var discLoadedTrackIndex = -1;
var userBehavior = { likedTracks: [] };

function buildVisualizerBars() {
    var bars = '';
    for (var i = 0; i < discVisualizerBars; i++) {
        bars += '<div class="disc-visualizer-bar" style="height:15%"></div>';
    }
    return bars;
}

function updateVisualizer() {
    var container = document.getElementById('discVisualizer');
    if (!container) return;
    var bars = container.querySelectorAll('.disc-visualizer-bar');
    bars.forEach(function(bar) {
        var h = Math.floor(Math.random() * 70 + 15);
        bar.style.height = h + '%';
    });
}

function startVisualizer() {
    if (discVisualizerInterval) clearInterval(discVisualizerInterval);
    discVisualizerInterval = setInterval(updateVisualizer, 120);
}

function stopVisualizer() {
    if (discVisualizerInterval) {
        clearInterval(discVisualizerInterval);
        discVisualizerInterval = null;
    }
    var container = document.getElementById('discVisualizer');
    if (!container) return;
    var bars = container.querySelectorAll('.disc-visualizer-bar');
    bars.forEach(function(bar) {
        bar.style.height = '15%';
    });
}

function formatDiscTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
}

function getAlbumCardClass(index, activeIndex, total) {
    var diff = index - activeIndex;
    if (diff === 0) return 'active';
    if (diff === -1 || (activeIndex === 0 && index === total - 1)) return 'prev-1';
    if (diff === 1 || (activeIndex === total - 1 && index === 0)) return 'next-1';
    return 'hidden';
}

function buildAlbumCarousel() {
    var tapes = window.discData.tapes || [];
    var activeIndex = window.discData.currentTapeIndex || 0;
    var cards = '';
    for (var i = 0; i < tapes.length; i++) {
        var tape = tapes[i];
        var cls = getAlbumCardClass(i, activeIndex, tapes.length);
        var artist = tape.artist || 'Vipen Music';
        var coverSrc = (tape.cover && !DiscDB.isIndexedDBRef(tape.cover)) ? tape.cover : '';
        cards += '<div class="disc-album-card ' + cls + '" data-disc-id="' + tape.id + '">' +
            '<img src="' + coverSrc + '" alt="' + (tape.title || '') + '" onerror="this.style.display=\'none\';this.parentNode.style.background=\'linear-gradient(135deg,#1a1a2e,#16213e)\'">' +
            '<div class="disc-album-info">' +
            '<div class="disc-album-title">' + (tape.title || 'Unknown') + '</div>' +
            '<div class="disc-album-artist">' + artist + '</div>' +
            '</div></div>';
    }
    return cards;
}

function buildDiscPage() {
    var tapes = window.discData.tapes || [];
    var currentIndex = window.discData.currentTapeIndex || 0;
    var currentTape = tapes[currentIndex] || {};
    window.discData.nowPlaying = {
        title: currentTape.title || 'Unknown Track',
        artist: currentTape.artist || 'Vipen Music',
        duration: currentTape.time || '0:00',
        current: '0:00',
        cover: currentTape.cover || '',
        fav: false
    };
    if (currentTape.audio && discLoadedTrackIndex !== currentIndex && !DiscDB.isIndexedDBRef(currentTape.audio)) {
        discAudio.src = currentTape.audio;
        discAudio.load();
        discLoadedTrackIndex = currentIndex;
    } else if (DiscDB.isIndexedDBRef(currentTape.audio) && discLoadedTrackIndex !== currentIndex) {
        DiscDB.resolveTapeUrls(currentTape).then(function() {
            discAudio.src = currentTape.audio;
            discAudio.load();
            discLoadedTrackIndex = currentIndex;
        });
    }
    var progressPercent = 0;
    if (discAudio.duration) {
        progressPercent = (discAudio.currentTime / discAudio.duration) * 100;
    }

    var modeClass = window.discData.playMode === 'shuffle' ? ' active' : '';
    var modeIcon = window.discData.playMode === 'shuffle' ?
        '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>' :
        window.discData.playMode === 'repeat-one' ?
        '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-6H9v2h4v-2z"/></svg>' :
        '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';

    var coverUrl = (currentTape.cover && !DiscDB.isIndexedDBRef(currentTape.cover)) ? currentTape.cover : '';
    var trackTitle = currentTape.title || 'Unknown Track';
    var artist = currentTape.artist || 'Vipen Music';

    var currentTapeId = currentTape.id;
    var isFav = userBehavior.likedTracks.indexOf(currentTapeId) !== -1;
    var favClass = isFav ? ' active' : '';

    return '<section id="page-disc-library" class="disc-page">' +
        '<div class="disc-bg" id="discBg" style="background-image:url(' + coverUrl + ')"></div>' +
        '<div class="disc-bg-overlay"></div>' +
        '<div class="disc-content">' +

        '<div class="disc-album-carousel" id="discAlbumCarousel">' +
        buildAlbumCarousel() +
        '</div>' +

        '<div class="disc-glass-player" id="discGlassPlayer">' +
        '<div class="disc-glass-controls">' +
        '<button class="disc-glass-btn" id="discPrevBtn" title="Previous">' +
        '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>' +
        '</button>' +
        '<button class="disc-glass-btn play" id="discPlayBtn" title="Play/Pause">' +
        '<svg viewBox="0 0 24 24" id="discPlayIcon"><path d="M8 5v14l11-7z"/></svg>' +
        '</button>' +
        '<button class="disc-glass-btn" id="discNextBtn" title="Next">' +
        '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>' +
        '</button>' +
        '</div>' +

        '<div class="disc-glass-center">' +
        '<div class="disc-glass-track-info">' +
        '<div class="disc-glass-mini-cover">' +
        '<img src="' + coverUrl + '" alt="' + trackTitle + '" id="discGlassMiniCover" onerror="this.style.display=\'none\'">' +
        '</div>' +
        '<div class="disc-glass-meta">' +
        '<div class="disc-glass-title" id="discGlassTitle">' + trackTitle + '</div>' +
        '<div class="disc-glass-subtitle" id="discGlassSubtitle">' + artist + '</div>' +
        '</div>' +
        '<div class="disc-visualizer" id="discVisualizer">' + buildVisualizerBars() + '</div>' +
        '<button class="disc-fav-btn' + favClass + '" id="discFavBtn" title="Favorite">' +
        '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>' +
        '</button>' +
        '</div>' +
        '<div class="disc-glass-progress-wrap">' +
        '<span class="disc-glass-time" id="discCurrentTime">0:00</span>' +
        '<div class="disc-glass-progress-track" id="discProgressTrack">' +
        '<div class="disc-glass-progress-bar" id="discProgressBar" style="width:' + progressPercent + '%"></div>' +
        '</div>' +
        '<span class="disc-glass-time" id="discDuration">' + (currentTape.time || '0:00') + '</span>' +
        '</div>' +
        '</div>' +

        '<div class="disc-glass-extras">' +
        '<button class="disc-glass-extra-btn' + modeClass + '" id="discPlayModeBtn" title="Play Mode">' + modeIcon + '</button>' +
        '<div class="disc-glass-volume-wrap" id="discVolumeWrap">' +
        '<button class="disc-glass-extra-btn" id="discVolumeToggleBtn" title="Volume">' +
        '<svg viewBox="0 0 24 24" id="discVolumeIcon"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>' +
        '</button>' +
        '<div class="disc-glass-volume-track" id="discVolumeTrack">' +
        '<div class="disc-glass-volume-bar" id="discVolumeBar" style="width:70%"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '</div></div></section>';
}

function updateCarousel() {
    var carousel = document.getElementById('discAlbumCarousel');
    if (!carousel) return;
    var tapes = window.discData.tapes || [];
    var activeIndex = window.discData.currentTapeIndex || 0;
    var cards = carousel.querySelectorAll('.disc-album-card');
    cards.forEach(function(card, i) {
        card.className = 'disc-album-card ' + getAlbumCardClass(i, activeIndex, tapes.length);
    });
}

function syncDiscUIWithAudioState() {
    var titleEl = document.getElementById('discGlassTitle');
    var subtitleEl = document.getElementById('discGlassSubtitle');
    var bgEl = document.getElementById('discBg');
    var miniCoverEl = document.getElementById('discGlassMiniCover');
    var dur = document.getElementById('discDuration');
    var bar = document.getElementById('discProgressBar');
    var cur = document.getElementById('discCurrentTime');

    var tapes = window.discData.tapes || [];
    var currentIndex = window.discData.currentTapeIndex || 0;
    var currentTape = tapes[currentIndex] || {};

    if (titleEl) titleEl.textContent = currentTape.title || 'Unknown Track';
    if (subtitleEl) subtitleEl.textContent = currentTape.artist || 'Vipen Music';
    if (bgEl) {
        var cover = currentTape.cover || '';
        bgEl.style.backgroundImage = cover && !DiscDB.isIndexedDBRef(cover) ? 'url(' + cover + ')' : '';
    }
    if (miniCoverEl) {
        var miniCover = currentTape.cover || '';
        miniCoverEl.src = miniCover && !DiscDB.isIndexedDBRef(miniCover) ? miniCover : '';
    }
    if (dur && discAudio.duration) dur.textContent = formatDiscTime(discAudio.duration);
    if (bar && discAudio.duration) bar.style.width = (discAudio.currentTime / discAudio.duration * 100) + '%';
    if (cur) cur.textContent = formatDiscTime(discAudio.currentTime);

    updateCarousel();
    syncDiscPlayPauseUI();
}

function updateDiscProgress() {
    var bar = document.getElementById('discProgressBar');
    var cur = document.getElementById('discCurrentTime');
    var dur = document.getElementById('discDuration');
    if (bar && discAudio.duration) {
        bar.style.width = (discAudio.currentTime / discAudio.duration * 100) + '%';
    }
    if (cur) cur.textContent = formatDiscTime(discAudio.currentTime);
    if (dur && discAudio.duration) dur.textContent = formatDiscTime(discAudio.duration);
    MiniPlayer.updateProgress();
}

function togglePlayPause() {
    if (discIsPlaying) {
        discAudio.pause();
    } else {
        discAudio.play().catch(function(){});
    }
}

function syncDiscPlayPauseUI() {
    var playIcon = document.getElementById('discPlayIcon');
    if (discIsPlaying) {
        if (playIcon) playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        if (discProgressInterval) clearInterval(discProgressInterval);
        discProgressInterval = setInterval(updateDiscProgress, 500);
        if (window.currentPage === 'disc-library') startVisualizer();
    } else {
        if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        if (discProgressInterval) clearInterval(discProgressInterval);
        stopVisualizer();
    }
}

function showDiscToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'disc-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 2500);
}

function loadDiscTrack(index) {
    if (index < 0) index = window.discData.tapes.length - 1;
    if (index >= window.discData.tapes.length) index = 0;
    window.discData.currentTapeIndex = index;
    var tape = window.discData.tapes[index];
    if (!tape || !tape.audio) {
        console.warn('Disc track data missing at index', index);
        showDiscToast('Track data not available');
        return;
    }
    window.discData.nowPlaying = {
        title: tape.title || 'Unknown Track',
        artist: tape.artist || 'Vipen Music',
        duration: tape.time || '0:00',
        current: '0:00',
        cover: tape.cover || '',
        audio: tape.audio || ''
    };

    function doLoad() {
        if (window.currentPage === 'disc-library') {
            var titleEl = document.getElementById('discGlassTitle');
            var subtitleEl = document.getElementById('discGlassSubtitle');
            var bgEl = document.getElementById('discBg');
            var miniCoverEl = document.getElementById('discGlassMiniCover');
            var favBtn = document.getElementById('discFavBtn');
            if (titleEl) titleEl.textContent = tape.title || 'Unknown Track';
            if (subtitleEl) subtitleEl.textContent = tape.artist || 'Vipen Music';
            if (bgEl) bgEl.style.backgroundImage = 'url(' + (tape.cover || '') + ')';
            if (miniCoverEl) miniCoverEl.src = tape.cover || '';
            if (favBtn) {
                var tapes = window.discData.tapes;
                var currentIdx = window.discData.currentTapeIndex;
                if (currentIdx < 0 || currentIdx >= tapes.length) return;
                var tid = tapes[currentIdx].id;
                var liked = userBehavior.likedTracks.indexOf(tid) !== -1;
                favBtn.classList.toggle('active', liked);
            }
            updateCarousel();
        }

        var wasPlaying = discIsPlaying;
        discLoadedTrackIndex = index;
        discAudio.src = tape.audio;
        discAudio.load();
        if (wasPlaying) {
            discAudio.play().catch(function(){});
        }
    }

    if (DiscDB.isIndexedDBRef(tape.audio) || DiscDB.isIndexedDBRef(tape.cover)) {
        DiscDB.resolveTapeUrls(tape).then(function() {
            window.discData.nowPlaying.audio = tape.audio;
            window.discData.nowPlaying.cover = tape.cover;
            doLoad();
        });
    } else if (DiscDB.isDataUrl(tape.audio) || DiscDB.isDataUrl(tape.cover)) {
        DiscDB.migrateTape(tape).then(function() {
            var updated = JSON.stringify(window.discData.tapes);
            localStorage.setItem('vipen_mgr_disc_tapes', updated);
            return DiscDB.resolveTapeUrls(tape);
        }).then(function() {
            window.discData.nowPlaying.audio = tape.audio;
            window.discData.nowPlaying.cover = tape.cover;
            doLoad();
        });
    } else {
        doLoad();
    }
}

function getNextTrackIndex() {
    if (window.discData.playMode === 'shuffle') {
        var nextIndex;
        do { nextIndex = Math.floor(Math.random() * window.discData.tapes.length); }
        while (nextIndex === window.discData.currentTapeIndex && window.discData.tapes.length > 1);
        return nextIndex;
    }
    var nextIndex = window.discData.currentTapeIndex + 1;
    if (nextIndex >= window.discData.tapes.length) nextIndex = 0;
    return nextIndex;
}

function getPrevTrackIndex() {
    if (window.discData.playMode === 'shuffle') {
        var prevIndex;
        do { prevIndex = Math.floor(Math.random() * window.discData.tapes.length); }
        while (prevIndex === window.discData.currentTapeIndex && window.discData.tapes.length > 1);
        return prevIndex;
    }
    var prevIndex = window.discData.currentTapeIndex - 1;
    if (prevIndex < 0) prevIndex = window.discData.tapes.length - 1;
    return prevIndex;
}

function cleanup() {
    if (discProgressInterval) {
        clearInterval(discProgressInterval);
        discProgressInterval = null;
    }
    stopVisualizer();
}

function initDiscAudioEvents() {
    if (discAudioEventsInited) return;
    discAudioEventsInited = true;
    discAudio.addEventListener('ended', function() {
        if (window.discData.playMode === 'repeat-one') {
            discAudio.currentTime = 0;
            discAudio.play().catch(function(){});
        } else {
            var nextIndex = getNextTrackIndex();
            loadDiscTrack(nextIndex);
            MiniPlayer.syncWithDisc();
            discAudio.play().catch(function(){});
        }
    });
    discAudio.addEventListener('loadedmetadata', function() {
        var dur = document.getElementById('discDuration');
        if (dur && discAudio.duration) dur.textContent = formatDiscTime(discAudio.duration);
    });
    discAudio.addEventListener('play', function() {
        if (!discIsPlaying) {
            discIsPlaying = true;
            miniPlayerWasPlaying = true;
            syncDiscPlayPauseUI();
            MiniPlayer.updateState(currentPage, discIsPlaying, discVisited);
        }
    });
    discAudio.addEventListener('pause', function() {
        if (discIsPlaying) {
            discIsPlaying = false;
            miniPlayerWasPlaying = false;
            syncDiscPlayPauseUI();
            MiniPlayer.updateState(currentPage, discIsPlaying, discVisited);
        }
    });
}

function bindDiscPlayerInteractions() {
    var playBtn = document.getElementById('discPlayBtn');
    var prevBtn = document.getElementById('discPrevBtn');
    var nextBtn = document.getElementById('discNextBtn');
    var playModeBtn = document.getElementById('discPlayModeBtn');
    var volumeToggleBtn = document.getElementById('discVolumeToggleBtn');
    var volumeTrack = document.getElementById('discVolumeTrack');
    var volumeBar = document.getElementById('discVolumeBar');
    var volumeIcon = document.getElementById('discVolumeIcon');
    var progressTrack = document.getElementById('discProgressTrack');
    var progressBar = document.getElementById('discProgressBar');
    if (!playBtn) return;

    var carousel = document.getElementById('discAlbumCarousel');
    if (carousel) {
        carousel.addEventListener('click', function(e) {
            var card = e.target.closest('.disc-album-card');
            if (!card) return;
            var discId = parseInt(card.getAttribute('data-disc-id'));
            var tapes = window.discData.tapes;
            for (var i = 0; i < tapes.length; i++) {
                if (tapes[i].id === discId) {
                    loadDiscTrack(i);
                    MiniPlayer.syncWithDisc();
                    discAudio.play().catch(function(){});
                    break;
                }
            }
        });
    }

    var favBtn = document.getElementById('discFavBtn');
    if (favBtn) {
        favBtn.addEventListener('click', function() {
            var np = window.discData.nowPlaying;
            var tapes = window.discData.tapes;
            var currentIdx = window.discData.currentTapeIndex;
            if (currentIdx < 0 || currentIdx >= tapes.length) return;
            var tapeId = tapes[currentIdx].id;
            np.fav = !np.fav;
            favBtn.classList.toggle('active', np.fav);
            var idx = userBehavior.likedTracks.indexOf(tapeId);
            if (np.fav && idx === -1) {
                userBehavior.likedTracks.push(tapeId);
            } else if (!np.fav && idx !== -1) {
                userBehavior.likedTracks.splice(idx, 1);
            }
            console.log('User liked tracks:', userBehavior.likedTracks);
        });
    }

    var isMuted = false;
    var currentVolume = 0.7;
    var volumeVisible = false;
    var volumeHideTimer = null;

    discAudio.volume = currentVolume;

    syncDiscPlayPauseUI();

    playBtn.addEventListener('click', function() {
        togglePlayPause();
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            var idx = getPrevTrackIndex();
            loadDiscTrack(idx);
            if (!discIsPlaying) {
                discAudio.play().catch(function(){});
            }
            MiniPlayer.syncWithDisc();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var idx = getNextTrackIndex();
            loadDiscTrack(idx);
            if (!discIsPlaying) {
                discAudio.play().catch(function(){});
            }
            MiniPlayer.syncWithDisc();
        });
    }

    if (playModeBtn) {
        playModeBtn.addEventListener('click', function() {
            var modes = ['sequence', 'shuffle', 'repeat-one'];
            var currentIndex = modes.indexOf(window.discData.playMode);
            window.discData.playMode = modes[(currentIndex + 1) % modes.length];
            playModeBtn.classList.toggle('active', window.discData.playMode === 'shuffle');
            var iconSvg = window.discData.playMode === 'shuffle' ?
                '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>' :
                window.discData.playMode === 'repeat-one' ?
                '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-6H9v2h4v-2z"/></svg>' :
                '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>';
            playModeBtn.innerHTML = iconSvg;
        });
    }

    function updateVolumeIcon(vol, muted) {
        if (!volumeIcon) return;
        if (muted || vol <= 0) {
            volumeIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else {
            volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3z"/>';
        }
    }

    function showVolumeTrack() {
        volumeVisible = true;
        if (volumeTrack) volumeTrack.classList.add('active');
        resetVolumeHideTimer();
    }

    function hideVolumeTrack() {
        volumeVisible = false;
        if (volumeTrack) volumeTrack.classList.remove('active');
        if (volumeHideTimer) {
            clearTimeout(volumeHideTimer);
            volumeHideTimer = null;
        }
    }

    function resetVolumeHideTimer() {
        if (volumeHideTimer) clearTimeout(volumeHideTimer);
        volumeHideTimer = setTimeout(function() {
            hideVolumeTrack();
        }, 3000);
    }

    if (volumeToggleBtn) {
        volumeToggleBtn.addEventListener('click', function() {
            if (volumeVisible) {
                hideVolumeTrack();
            } else {
                showVolumeTrack();
            }
        });
    }

    function setVolumeFromX(clientX) {
        if (!volumeTrack) return;
        var rect = volumeTrack.getBoundingClientRect();
        var percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        currentVolume = percent;
        discAudio.volume = currentVolume;
        if (isMuted && currentVolume > 0) {
            isMuted = false;
            discAudio.muted = false;
        }
        if (volumeBar) volumeBar.style.width = (percent * 100) + '%';
        updateVolumeIcon(currentVolume, isMuted);
        resetVolumeHideTimer();
    }

    var isDraggingVolume = false;
    if (volumeTrack) {
        volumeTrack.addEventListener('mousedown', function(e) {
            isDraggingVolume = true;
            setVolumeFromX(e.clientX);
        });
        volumeTrack.addEventListener('touchstart', function(e) {
            isDraggingVolume = true;
            if (e.touches && e.touches.length > 0) setVolumeFromX(e.touches[0].clientX);
        }, {passive: false});
    }
    window.addEventListener('mousemove', function(e) {
        if (isDraggingVolume) setVolumeFromX(e.clientX);
    });
    window.addEventListener('mouseup', function() {
        isDraggingVolume = false;
    });
    window.addEventListener('touchmove', function(e) {
        if (isDraggingVolume && e.touches && e.touches.length > 0) setVolumeFromX(e.touches[0].clientX);
    }, {passive: false});
    window.addEventListener('touchend', function() {
        isDraggingVolume = false;
    });

    function setProgressFromX(clientX) {
        if (!discAudio.duration || !progressTrack) return;
        var rect = progressTrack.getBoundingClientRect();
        var percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        discAudio.currentTime = percent * discAudio.duration;
        if (progressBar) progressBar.style.width = (percent * 100) + '%';
    }

    var isDraggingProgress = false;
    if (progressTrack) {
        progressTrack.addEventListener('mousedown', function(e) {
            isDraggingProgress = true;
            setProgressFromX(e.clientX);
        });
        progressTrack.addEventListener('touchstart', function(e) {
            isDraggingProgress = true;
            if (e.touches && e.touches.length > 0) setProgressFromX(e.touches[0].clientX);
        }, {passive: false});
    }
    window.addEventListener('mousemove', function(e) {
        if (isDraggingProgress) setProgressFromX(e.clientX);
    });
    window.addEventListener('mouseup', function() {
        isDraggingProgress = false;
    });
    window.addEventListener('touchmove', function(e) {
        if (isDraggingProgress && e.touches && e.touches.length > 0) setProgressFromX(e.touches[0].clientX);
    }, {passive: false});
    window.addEventListener('touchend', function() {
        isDraggingProgress = false;
    });
}

return {
    buildPage: buildDiscPage,
    bindAll: function() { bindDiscPlayerInteractions(); initDiscAudioEvents(); },
    loadTrack: loadDiscTrack,
    updateProgress: updateDiscProgress,
    togglePlayPause: togglePlayPause,
    syncPlayPauseUI: syncDiscPlayPauseUI,
    getNextTrackIndex: getNextTrackIndex,
    getPrevTrackIndex: getPrevTrackIndex,
    syncUIWithAudioState: syncDiscUIWithAudioState,
    cleanup: cleanup,
    setDiscData: function(data) { window.discData = data; },
    getDiscData: function() { return window.discData; },
    getDiscIsPlaying: function() { return discIsPlaying; },
    setDiscIsPlaying: function(v) { discIsPlaying = v; }
};

})();
