var Loading = (function() {
    'use strict';

    var loading, loadImg, progressFill, progressNum;
    var tasks = {};         // { name: { weight, pct, done } }
    var totalWeight = 0;
    var onCompleteCallback = null;
    var completed = false;
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

    function calcOverall() {
        var w = 0, p = 0;
        for (var k in tasks) {
            if (tasks.hasOwnProperty(k)) {
                var t = tasks[k];
                w += t.weight;
                p += t.weight * (t.pct / 100);
            }
        }
        totalWeight = w;
        return w > 0 ? Math.min(100, Math.round(p / w * 100)) : 0;
    }

    function updateUI(pct) {
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressNum) progressNum.textContent = pct + '%';
    }

    function checkComplete() {
        if (completed) return;
        var overall = calcOverall();
        updateUI(overall);
        var allDone = true;
        for (var k in tasks) {
            if (tasks.hasOwnProperty(k) && !tasks[k].done) { allDone = false; break; }
        }
        if (allDone && overall >= 100) {
            completed = true;
            if (loadImg) loadImg.classList.add('zoomOut');
            setTimeout(function() {
                if (loading) loading.classList.add('hidden');
                if (onCompleteCallback) onCompleteCallback();
            }, 900);
        }
    }

    return {
        // Register a task before starting
        addTask: function(name, weight) {
            tasks[name] = { weight: weight || 1, pct: 0, done: false };
        },
        // Update a task's progress (0-100) — call whenever progress changes
        updateTask: function(name, pct) {
            if (!tasks[name]) return;
            tasks[name].pct = Math.min(100, Math.max(0, pct));
            if (pct >= 100) tasks[name].done = true;
            if (!completed) {
                updateUI(calcOverall());
            }
        },
        // Mark a task as done without tracking percent
        markDone: function(name) {
            if (!tasks[name]) return;
            tasks[name].pct = 100;
            tasks[name].done = true;
            if (!completed) {
                updateUI(calcOverall());
                checkComplete();
            }
        },
        init: function(onComplete) {
            loading = document.getElementById('loading');
            if (!loading) {
                createDOM();
                loading = document.getElementById('loading');
            }

            var hasShown = sessionStorage.getItem(STORAGE_KEY);
            if (hasShown) {
                loading.classList.add('hidden');
                if (onComplete) onComplete();
                return;
            }
            sessionStorage.setItem(STORAGE_KEY, '1');

            loadImg = loading.querySelector('.loadImg');
            progressFill = document.getElementById('progressFill');
            progressNum = document.getElementById('progressNum');
            onCompleteCallback = onComplete;
            completed = false;
        },
        // Call this once after all tasks are registered to start monitoring
        start: function() {
            checkComplete();
        }
    };
})();
