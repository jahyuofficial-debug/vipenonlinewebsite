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
    homeTextSlideIndices: [0, 0, 0, 0]
};

var bgVideo = null;
var isAnimating = false;

function filterVisibleGroups(groups) {
    if (!groups || !groups.length) return groups;
    return groups.filter(function(g) { return !g.hidden; });
}

function loadHomeBanner(callback) {
    // Check if ManagerGo cached data exists in localStorage
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

    // main.js handles R2 meta loading and triggers changeSlide when ready
    // Just return success to not block the caller
    if (callback) callback(true);
}

function getTotalSlides() {
    if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
        return bannerData.homeGroups.length;
    }
    return bannerData.bgType.length;
}

function changeSlide(index){
    if(isAnimating) return;
    var bgTotal = getTotalSlides();
    var newIndex = (typeof index === 'number') ? index : ((bannerData.current + index + bgTotal) % bgTotal);
    if(newIndex === bannerData.current) return;
    isAnimating = true;

    SlideDots.stopProgress();
    bannerData.current = newIndex;
    SlideDots.updateDots(newIndex);
    SlideDots.startProgress();

    SlideDots.resetAutoSlideInterval();

    var msgEl = document.querySelector('#banner .msg');
    var topicLine = document.getElementById('topicLine');
    var noteLine = document.getElementById('noteLine');
    var h2 = topicLine ? topicLine.querySelector('h2') : null;
    var h3 = noteLine ? noteLine.querySelector('h3') : null;
    var bgVideoEl = document.getElementById('bgVideo');
    var bannerImgBg = document.getElementById('bannerImgBg');

    if (msgEl) msgEl.style.opacity = '0';

    SlideDots.setSlideChangeTimeout(setTimeout(function(){
        if (bannerData.homeGroups && bannerData.homeGroups.length > 0) {
            var group = bannerData.homeGroups[bannerData.current];
            var texts = group.carouselTexts || [];
            if (texts.length > 0) {
                bannerData.homeTextSlideIndices[bannerData.current] = (bannerData.homeTextSlideIndices[bannerData.current] + 1) % texts.length;
                var ti = bannerData.homeTextSlideIndices[bannerData.current];
                if (h2) { h2.textContent = texts[ti].topic || ''; h2.setAttribute('style', texts[ti].topicStyle || ''); }
                if (h3) { h3.textContent = texts[ti].note || ''; h3.setAttribute('style', texts[ti].noteStyle || ''); }
                if (msgEl) msgEl.style.display = '';
            } else {
                if (msgEl) msgEl.style.display = 'none';
            }

            var bgType = group.bgType || 'image';
            if (bgType === 'video' && group.bgVideo) {
                if (bgVideoEl) {
                    var newSrc = group.bgVideo;
                    if (bgVideoEl.src.indexOf(newSrc) === -1 && bgVideoEl.currentSrc.indexOf(newSrc) === -1) {
                        bgVideoEl.src = newSrc;
                        bgVideoEl.load();
                    }
                    bgVideoEl.style.display = '';
                    var playPromise = bgVideoEl.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(function() {});
                    }
                }
                if (bannerImgBg) bannerImgBg.style.display = 'none';
            } else if (bgType === 'image' && group.bgImage) {
                if (bgVideoEl) {
                    bgVideoEl.pause();
                    bgVideoEl.style.display = 'none';
                }
                if (bannerImgBg) {
                    bannerImgBg.style.backgroundImage = group.bgImage ? 'url(' + group.bgImage + ')' : 'none';
                    bannerImgBg.style.display = group.bgImage ? '' : 'none';
                }
            } else {
                if (bgVideoEl) {
                    bgVideoEl.pause();
                    bgVideoEl.style.display = 'none';
                }
                if (bannerImgBg) bannerImgBg.style.display = 'none';
            }

            if (msgEl) msgEl.style.opacity = '1';
        } else {
            if(bannerData.current === 0){
                bannerData.textSlideIndex = (bannerData.textSlideIndex + 1) % bannerData.topics.length;
                if (h2) h2.textContent = bannerData.topics[bannerData.textSlideIndex];
                if (h3) h3.textContent = bannerData.notes[bannerData.textSlideIndex];
                if (msgEl) msgEl.style.display = '';
            } else {
                if (msgEl) msgEl.style.display = 'none';
            }

            var type = bannerData.bgType[bannerData.current];
            if(type === 'video'){
                if(bgVideoEl){
                    var newSrc = bannerData.bgVideoSrc[bannerData.current];
                    if(bgVideoEl.src.indexOf(newSrc) === -1 && bgVideoEl.currentSrc.indexOf(newSrc) === -1){
                        bgVideoEl.src = newSrc;
                        bgVideoEl.load();
                    }
                    bgVideoEl.style.display = '';
                    var playPromise = bgVideoEl.play();
                    if(playPromise !== undefined){
                        playPromise.catch(function(){});
                    }
                }
                if(bannerImgBg) bannerImgBg.style.display = 'none';
            } else if(type === 'image'){
                if(bgVideoEl){
                    bgVideoEl.pause();
                    bgVideoEl.style.display = 'none';
                }
                if(bannerImgBg){
                    bannerImgBg.style.backgroundImage = 'url(' + bannerData.bgImage[bannerData.current] + ')';
                    bannerImgBg.style.display = '';
                }
            } else {
                if(bgVideoEl){
                    bgVideoEl.pause();
                    bgVideoEl.style.display = 'none';
                }
                if(bannerImgBg) bannerImgBg.style.display = 'none';
            }

            if(bannerData.current === 0){
                if (msgEl) msgEl.style.opacity = '1';
            }
        }

        SlideDots.setSlideChangeTimeout(setTimeout(function(){
            isAnimating = false;
            SlideDots.setSlideChangeTimeout(null);
        }, 50));
    }, 200));
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
                    if(bgVideo.paused && isCurrentSlideVideo()) bgVideo.play().catch(function(){});
                }
            });
        }, {threshold:0.1});
        banObs.observe(document.getElementById('banner'));
    }
}

function startBannerAnimations(){
    SlideDots.startAutoSlide();
    if (bgVideo && bgVideo.paused && isCurrentSlideVideo()) bgVideo.play();
}

function stopBannerAnimations(){
    SlideDots.stopAutoSlide();
}

return {
    changeSlide: changeSlide,
    initBgVideo: initBgVideo,
    startAnimations: startBannerAnimations,
    stopAnimations: stopBannerAnimations,
    loadHomeBanner: loadHomeBanner,
    filterVisibleGroups: filterVisibleGroups,
    bannerData: bannerData
};

})();