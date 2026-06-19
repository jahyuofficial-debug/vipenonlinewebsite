var BannerPage = (function(){
'use strict';

var bannerData = {
    current: 0,
    bgType: ['video', 'pic', 'pic', 'pic'],
    noteIndex: 0,
    topicIndex: 0,
    topics: [],
    notes: [],
    bgImage: [],
    bgVideoSrc: [],
    textSlideIndex: 0,
    homeGroups: null,
    homeTextSlideIndices: [0, 0, 0, 0],
    typewriterTimer: null,
    typewriterState: null
};

var bgVideo = null;
var videoLoadedSrc = '';

function filterVisibleGroups(groups) {
    if (!groups || !groups.length) return groups;
    return groups.filter(function(g) { return !g.hidden; });
}

function loadHomeBanner(callback) {
    try {
        var cached = localStorage.getItem('vipen_mgr_home_banner');
        if (cached) {
            var parsed = JSON.parse(cached);
            if (parsed && parsed.groups && parsed.groups.length > 0) {
                bannerData.homeGroups = filterVisibleGroups(parsed.groups);
                bannerData.homeTextSlideIndices = [0, 0, 0, 0];
                if (callback) callback(true);
                return;
            }
        }
    } catch (e) {}
    if (callback) callback(true);
}

// Collect all text pairs from homeGroups
function collectAllTexts() {
    var all = [];
    if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
        bannerData.homeGroups.forEach(function(group) {
            var texts = group.carouselTexts || [];
            texts.forEach(function(t) {
                all.push({ topic: t.topic || '', note: t.note || '' });
            });
        });
    }
    return all;
}

// Typewriter animation state machine
function startTypewriter() {
    stopTypewriter();

    var allTexts = collectAllTexts();
    if (allTexts.length === 0) return;

    var h2 = document.querySelector('#topicLine h2');
    var h3 = document.querySelector('#noteLine h3');
    if (!h2 || !h3) return;

    var textIndex = 0;
    var phase = 'type'; // 'type' | 'pause' | 'delete' | 'nextPause'
    var charIndex = 0;
    var currentPair = allTexts[0];
    var typeSpeed = 80;   // ms per character while typing
    var deleteSpeed = 40; // ms per character while deleting
    var pauseAfterType = 1800; // ms pause after full text shown
    var pauseAfterDelete = 400; // ms pause before next text

    // Create cursor span (shared across cycles)
    var cursorSpan = document.createElement('span');
    cursorSpan.className = 'cursor-blink';

    // Start with current text visible, cursor at end
    function startCycle() {
        // Clear previous content, add cursor
        h2.textContent = '';
        h3.textContent = '';
        h2.appendChild(cursorSpan);
        charIndex = 0;
        phase = 'type';
        currentPair = allTexts[textIndex];
        tick();
    }

    function tick() {
        if (phase === 'type') {
            if (charIndex < currentPair.topic.length) {
                // Still typing topic
                h2.textContent = currentPair.topic.substring(0, charIndex + 1);
                h2.appendChild(cursorSpan);
                charIndex++;
                bannerData.typewriterTimer = setTimeout(tick, typeSpeed);
            } else if (charIndex < currentPair.topic.length + currentPair.note.length) {
                // Typing note
                var noteIdx = charIndex - currentPair.topic.length;
                h3.textContent = currentPair.note.substring(0, noteIdx + 1);
                charIndex++;
                bannerData.typewriterTimer = setTimeout(tick, typeSpeed);
            } else {
                // All done typing, keep cursor
                h2.appendChild(cursorSpan);
                phase = 'pause';
                bannerData.typewriterTimer = setTimeout(tick, pauseAfterType);
            }
        } else if (phase === 'pause') {
            // Start deleting
            phase = 'delete';
            charIndex = currentPair.topic.length + currentPair.note.length;
            bannerData.typewriterTimer = setTimeout(tick, deleteSpeed);
        } else if (phase === 'delete') {
            if (charIndex > currentPair.topic.length) {
                // Deleting note
                var noteKeep = charIndex - currentPair.topic.length - 1;
                if (noteKeep > 0) {
                    h3.textContent = currentPair.note.substring(0, noteKeep);
                } else {
                    h3.textContent = '';
                }
                charIndex--;
                h2.appendChild(cursorSpan);
                bannerData.typewriterTimer = setTimeout(tick, deleteSpeed);
            } else if (charIndex > 0) {
                // Deleting topic
                h2.textContent = currentPair.topic.substring(0, charIndex - 1);
                h2.appendChild(cursorSpan);
                charIndex--;
                bannerData.typewriterTimer = setTimeout(tick, deleteSpeed);
            } else {
                // All deleted, move to next text
                h2.textContent = '';
                h2.appendChild(cursorSpan);
                textIndex = (textIndex + 1) % allTexts.length;
                charIndex = 0;
                phase = 'nextPause';
                bannerData.typewriterTimer = setTimeout(tick, pauseAfterDelete);
            }
        } else if (phase === 'nextPause') {
            // Start typing next text
            phase = 'type';
            bannerData.typewriterTimer = setTimeout(tick, typeSpeed);
        }
    }

    startCycle();
}

function stopTypewriter() {
    if (bannerData.typewriterTimer) {
        clearTimeout(bannerData.typewriterTimer);
        bannerData.typewriterTimer = null;
    }
    bannerData.typewriterState = null;
}

function changeSlide(index){
    // Ignored - no background switching
}

function isCurrentSlideVideo() {
    if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
        var group = bannerData.homeGroups[bannerData.current];
        return group && group.bgType === 'video' && group.bgVideo;
    }
    return bannerData.bgType[bannerData.current] === 'video';
}

function initBgVideo(){
    bgVideo = document.getElementById('bgVideo');
    if(bgVideo){
        var banObs = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if(entry.isIntersecting){
                    if(bgVideo.paused) bgVideo.play().catch(function(){});
                }
            });
        }, {threshold:0.1});
        banObs.observe(document.getElementById('banner'));
    }
}

function startBannerAnimations(){
    startTypewriter();
    if (bgVideo && bgVideo.paused) bgVideo.play();
}

function stopBannerAnimations(){
    stopTypewriter();
}

function applyInitialText(texts) {
    if (!texts || texts.length === 0) return;
    var t = texts[0];
    var h2 = document.querySelector('#topicLine h2');
    var h3 = document.querySelector('#noteLine h3');
    if (h2) h2.textContent = t.topic || '';
    if (h3) h3.textContent = t.note || '';
}

return {
    changeSlide: changeSlide,
    initBgVideo: initBgVideo,
    startAnimations: startBannerAnimations,
    stopAnimations: stopBannerAnimations,
    loadHomeBanner: loadHomeBanner,
    filterVisibleGroups: filterVisibleGroups,
    bannerData: bannerData,
    applyInitialText: applyInitialText
};

})();