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
    textSlideIndex: 0
};

var bgVideo = null;
var isAnimating = false;

function changeSlide(index){
    if(isAnimating) return;
    var bgTotal = bannerData.bgType.length;
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
    var h2 = topicLine.querySelector('h2');
    var h3 = noteLine.querySelector('h3');
    var bgVideo = document.getElementById('bgVideo');
    var bannerImgBg = document.getElementById('bannerImgBg');

    msgEl.style.opacity = '0';

    SlideDots.setSlideChangeTimeout(setTimeout(function(){
        if(bannerData.current === 0){
            bannerData.textSlideIndex = (bannerData.textSlideIndex + 1) % bannerData.topics.length;
            h2.textContent = bannerData.topics[bannerData.textSlideIndex];
            h3.textContent = bannerData.notes[bannerData.textSlideIndex];
            msgEl.style.display = '';
        } else {
            msgEl.style.display = 'none';
        }

        var type = bannerData.bgType[bannerData.current];
        if(type === 'video'){
            if(bgVideo){
                var newSrc = bannerData.bgVideoSrc[bannerData.current];
                if(bgVideo.src.indexOf(newSrc) === -1 && bgVideo.currentSrc.indexOf(newSrc) === -1){
                    bgVideo.src = newSrc;
                    bgVideo.load();
                }
                bgVideo.style.display = '';
                var playPromise = bgVideo.play();
                if(playPromise !== undefined){
                    playPromise.catch(function(){});
                }
            }
            if(bannerImgBg) bannerImgBg.style.display = 'none';
        } else if(type === 'image'){
            if(bgVideo){
                bgVideo.pause();
                bgVideo.style.display = 'none';
            }
            if(bannerImgBg){
                bannerImgBg.style.backgroundImage = 'url(' + bannerData.bgImage[bannerData.current] + ')';
                bannerImgBg.style.display = '';
            }
        } else {
            if(bgVideo){
                bgVideo.pause();
                bgVideo.style.display = 'none';
            }
            if(bannerImgBg) bannerImgBg.style.display = 'none';
        }

        if(bannerData.current === 0){
            msgEl.style.opacity = '1';
        }

        SlideDots.setSlideChangeTimeout(setTimeout(function(){
            isAnimating = false;
            SlideDots.setSlideChangeTimeout(null);
        }, 50));
    }, 200));
}

function initBgVideo(){
    bgVideo = document.getElementById('bgVideo');
    if(bgVideo){
        bgVideo.addEventListener('ended', function(){
            bgVideo.currentTime = 0;
            bgVideo.play();
        }, false);
        bgVideo.addEventListener('waiting', function(){
            bgVideo.play();
        }, false);
        var banObs = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
                if(entry.isIntersecting){
                    if(bgVideo.paused && bannerData.bgType[bannerData.current] === 'video') bgVideo.play();
                }
            });
        }, {threshold:0.1});
        banObs.observe(document.getElementById('banner'));
    }
}

function startBannerAnimations(){
    SlideDots.startAutoSlide();
    if (bgVideo && bgVideo.paused && bannerData.bgType[bannerData.current] === 'video') bgVideo.play();
}

function stopBannerAnimations(){
    SlideDots.stopAutoSlide();
}

return {
    changeSlide: changeSlide,
    initBgVideo: initBgVideo,
    startAnimations: startBannerAnimations,
    stopAnimations: stopBannerAnimations,
    bannerData: bannerData
};

})();