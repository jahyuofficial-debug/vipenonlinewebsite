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
    textInterval: null
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

function getTotalSlides() {
    if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
        return bannerData.homeGroups.length;
    }
    return bannerData.bgType.length;
}

// Only rotate text - no background switching
function rotateTextOnly() {
    var topicLine = document.getElementById('topicLine');
    var noteLine = document.getElementById('noteLine');
    var h2 = topicLine ? topicLine.querySelector('h2') : null;
    var h3 = noteLine ? noteLine.querySelector('h3') : null;
    var msgEl = document.querySelector('#banner .msg');

    if (!h2 || !h3) return;

    // Collect all texts from homeGroups
    var allTexts = [];
    if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
        bannerData.homeGroups.forEach(function(group, gi) {
            var texts = group.carouselTexts || [];
            texts.forEach(function(t) {
                allTexts.push({ topic: t.topic || '', note: t.note || '', topicStyle: t.topicStyle || '', noteStyle: t.noteStyle || '' });
            });
        });
    }

    if (allTexts.length === 0) {
        // Fallback to legacy text arrays
        if (bannerData.topics.length > 0) {
            bannerData.textSlideIndex = (bannerData.textSlideIndex + 1) % bannerData.topics.length;
            h2.textContent = bannerData.topics[bannerData.textSlideIndex];
            h3.textContent = bannerData.notes[bannerData.textSlideIndex] || '';
        }
        return;
    }

    // Fade out
    if (msgEl) msgEl.style.opacity = '0';
    h2.style.opacity = '0';
    h3.style.opacity = '0';

    setTimeout(function() {
        bannerData.textSlideIndex = (bannerData.textSlideIndex + 1) % allTexts.length;
        var t = allTexts[bannerData.textSlideIndex];
        h2.textContent = t.topic;
        h3.textContent = t.note;
        if (t.topicStyle) h2.setAttribute('style', t.topicStyle);
        else h2.removeAttribute('style');
        if (t.noteStyle) h3.setAttribute('style', t.noteStyle);
        else h3.removeAttribute('style');

        // Fade in
        if (msgEl) msgEl.style.opacity = '1';
        h2.style.opacity = '1';
        h3.style.opacity = '1';
    }, 400);
}

function startTextRotation() {
    stopTextRotation();
    bannerData.textInterval = setInterval(rotateTextOnly, 4000);
}

function stopTextRotation() {
    if (bannerData.textInterval) {
        clearInterval(bannerData.textInterval);
        bannerData.textInterval = null;
    }
}

// Keep changeSlide for compatibility but simplified - only rotates text now
function changeSlide(index){
    rotateTextOnly();
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
    startTextRotation();
    if (bgVideo && bgVideo.paused) bgVideo.play();
}

function stopBannerAnimations(){
    stopTextRotation();
}

// Apply the first text when data loads
function applyInitialText(texts) {
    if (!texts || texts.length === 0) return;
    var t = texts[0];
    var h2 = document.querySelector('#topicLine h2');
    var h3 = document.querySelector('#noteLine h3');
    if (h2) { h2.textContent = t.topic || ''; if (t.topicStyle) h2.setAttribute('style', t.topicStyle); }
    if (h3) { h3.textContent = t.note || ''; if (t.noteStyle) h3.setAttribute('style', t.noteStyle); }
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