var Loading = (function() {
    'use strict';

    var loading, loadImg, progressFill, progressNum, progressStatus;
    var tasks = {};         // { name: { weight, pct, done, label } }
    var displayPct = 0;     // smoothed display percentage
    var targetPct = 0;
    var smoothTimer = null;
    var onCompleteCallback = null;
    var completed = false;
    var STORAGE_KEY = 'vipen_loading_shown';

    // Labels for each task (shown in status text)
    var taskLabels = {
        data: 'Connecting to server...',
        video: 'Buffering video...',
        disc:  'Loading disc library...'
    };

    function createDOM() {
        var div = document.createElement('div');
        div.id = 'loading';
        div.innerHTML = '<img class="loadImg" src="images/vipen-logo.png" alt="">'
            + '<div class="loadMsg"><p>BALLINGTILLIDIE</p></div>'
            + '<div class="progressWrap">'
            + '<div class="progressBar"><div class="fill" id="progressFill"></div></div>'
            + '<div class="progressNum" id="progressNum">0%</div>'
            + '<div class="progressStatus" id="progressStatus">Initializing...</div>'
            + '</div>';
        document.body.appendChild(div);
    }

    // Build status text: show active task name + count
    function buildStatusText() {
        var parts = [];
        for (var k in tasks) {
            if (tasks.hasOwnProperty(k) && !tasks[k].done) {
                var t = tasks[k];
                var label = t.label || taskLabels[k] || k;
                if (k === 'disc' && t.totalTracks) {
                    label += ' ' + t.loadedTracks + '/' + t.totalTracks;
                }
                parts.push(label);
            }
        }
        if (parts.length === 0) return 'Almost ready...';
        return parts.join('  |  ');
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
        return w > 0 ? Math.min(100, Math.round(p / w * 100)) : 0;
    }

    // Smoothly animate progress (increments of 1-2, every 80ms)
    function smoothToTarget() {
        if (completed) return;
        if (displayPct < targetPct) {
            var step = Math.max(1, Math.ceil((targetPct - displayPct) / 8));
            displayPct = Math.min(targetPct, displayPct + step);
        } else {
            displayPct = targetPct;
        }
        if (progressFill) progressFill.style.width = displayPct + '%';
        if (progressNum) progressNum.textContent = displayPct + '%';
        if (progressStatus) progressStatus.textContent = buildStatusText();

        if (displayPct < targetPct) {
            smoothTimer = setTimeout(smoothToTarget, 80);
        } else if (targetPct >= 100) {
            checkComplete();
        }
    }

    function updateUI() {
        targetPct = calcOverall();
        if (!smoothTimer) smoothToTarget();
    }

    function checkComplete() {
        if (completed) return;
        if (displayPct < 100) return; // wait for display to catch up
        var allDone = true;
        for (var k in tasks) {
            if (tasks.hasOwnProperty(k) && !tasks[k].done) { allDone = false; break; }
        }
        if (allDone) {
            completed = true;
            if (smoothTimer) { clearTimeout(smoothTimer); smoothTimer = null; }
            if (progressStatus) progressStatus.textContent = 'Ready. Enjoy!';
            if (loadImg) loadImg.classList.add('zoomOut');
            setTimeout(function() {
                if (loading) loading.classList.add('hidden');
                if (onCompleteCallback) onCompleteCallback();
            }, 900);
        }
    }

    return {
        addTask: function(name, weight) {
            tasks[name] = { weight: weight || 1, pct: 0, done: false, label: taskLabels[name] || name, loadedTracks: 0, totalTracks: 0 };
        },
        updateTask: function(name, pct) {
            if (!tasks[name]) return;
            tasks[name].pct = Math.min(100, Math.max(0, pct));
            if (pct >= 100) tasks[name].done = true;
            if (!completed) updateUI();
        },
        markDone: function(name) {
            if (!tasks[name]) return;
            tasks[name].pct = 100;
            tasks[name].done = true;
            if (!completed) updateUI();
        },
        // Called by disc bridge to show track counts
        setDiscProgress: function(loaded, total) {
            if (!tasks['disc']) return;
            tasks['disc'].loadedTracks = loaded;
            tasks['disc'].totalTracks = total;
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
            progressStatus = document.getElementById('progressStatus');
            onCompleteCallback = onComplete;
            completed = false;
            displayPct = 0;
            targetPct = 0;
            if (smoothTimer) { clearTimeout(smoothTimer); smoothTimer = null; }
        },
        start: function() {
            updateUI();
        }
    };
})();
