var Loading = (function() {
    'use strict';

    var loading, loadImg, progressFill, progressNum;
    var progress = 0;
    var loadInterval = null;
    var onCompleteCallback = null;
    var STORAGE_KEY = 'vipen_loading_shown';

    function createDOM() {
        var div = document.createElement('div');
        div.id = 'loading';
        div.innerHTML = '<img class="loadImg" src="images/vipen-logo.png" alt="">'
            + '<div class="loadMsg"><p>BALLINGTILLIDIE</p></div>'
            + '<div class="progressWrap">'
            + '<div class="progressBar"><div class="fill" id="progressFill"></div></div>'
            + '<div class="progressNum" id="progressNum">0%</div>'
            + '</div>';
        document.body.appendChild(div);
    }

    return {
        init: function(onComplete) {
            loading = document.getElementById('loading');
            if (!loading) {
                createDOM();
                loading = document.getElementById('loading');
            }

            var hasShown = sessionStorage.getItem(STORAGE_KEY);
            if (hasShown) {
                loading.classList.add('hidden');
                document.body.style.cursor = 'none';
                if (onComplete) onComplete();
                return;
            }

            sessionStorage.setItem(STORAGE_KEY, '1');

            loadImg = loading.querySelector('.loadImg');
            progressFill = document.getElementById('progressFill');
            progressNum = document.getElementById('progressNum');
            onCompleteCallback = onComplete;
            progress = 0;

            loadInterval = setInterval(function() {
                progress += Math.floor(Math.random() * 8) + 2;
                if (progress >= 100) { progress = 100; clearInterval(loadInterval); }
                if (progressFill) progressFill.style.width = progress + '%';
                if (progressNum) progressNum.textContent = progress + '%';
                if (progress >= 100) {
                    setTimeout(function() {
                        if (loadImg) loadImg.classList.add('zoomOut');
                        setTimeout(function() {
                            if (loading) loading.classList.add('hidden');
                            document.body.style.cursor = 'none';
                            if (onCompleteCallback) onCompleteCallback();
                        }, 900);
                    }, 400);
                }
            }, 120);
        }
    };
})();