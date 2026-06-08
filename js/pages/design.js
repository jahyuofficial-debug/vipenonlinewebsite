var DesignPage = (function() {
'use strict';

var dwZoomedCard = null;
var dwListPageSize = 6;
var dwListCurrentPage = 1;

// === XP Desktop State ===
var xpWindows = {};     // { id: { x, y, w, h, minimized, zIndex, dragging } }
var xpZIndex = 10;
var xpDragging = null;
var xpDragOX = 0;
var xpDragOY = 0;

// Emoji icons per category
var CAT_ICONS = {
    'Branding': '\u{1F3A8}',     // 🎨
    'UI/UX': '\u{1F4F1}',        // 📱
    'Motion': '\u{1F3AC}',       // 🎬
    'Web': '\u{1F310}',          // 🌐
    '3D': '\u{1F4E6}',          // 📦
    'Print': '\u{1F4F0}',       // 📰
    'Photo': '\u{1F4F7}',       // 📷
};
var FALLBACK_ICONS = ['\u{1F4BB}','\u{1F5A5}','\u{1F4BE}','\u{1F4CE}','\u{2B50}','\u{2728}','\u{1F48E}','\u{1F525}','\u{1F30D}']; // 💻🖥💾📎⭐✨💎🔥🌍

function iconForItem(item, i) {
    if (CAT_ICONS[item.cat]) return CAT_ICONS[item.cat];
    return FALLBACK_ICONS[i % FALLBACK_ICONS.length];
}

// === Build XP Desktop ===
function buildDesignWorkGrid() {
    var icons = dwItems.map(function(item, i) {
        var icon = iconForItem(item, i);
        return '<div class="xp-icon" data-xp-id="' + i + '">' +
            '<div class="xp-icon-img"><span>' + icon + '</span></div>' +
            '<div class="xp-icon-label">' + xpTruncate(item.title, 14) + '</div>' +
            '</div>';
    }).join('');

    var now = new Date();
    var timeStr = padTime(now.getHours()) + ':' + padTime(now.getMinutes());

    return '<section id="page-design-work" class="dw-page">' +
        '<div class="xp-desktop" id="xpDesktop">' +
        '<div class="xp-icons-grid">' + icons + '</div>' +
        '</div>' +
        '<div class="xp-taskbar" id="xpTaskbar">' +
        '<button class="xp-start-btn" id="xpStartBtn"><span>\u{F0FF}</span> start</button>' +
        '<div class="xp-taskbar-divider"></div>' +
        '<div class="xp-taskbar-tasks" id="xpTaskbarTasks"></div>' +
        '<div class="xp-taskbar-tray">' +
        '<span class="xp-tray-icon">\u{1F50A}</span>' +
        '<span class="xp-tray-icon">\u{1F4E1}</span>' +
        '<span class="xp-tray-time" id="xpTrayTime">' + timeStr + '</span>' +
        '</div>' +
        '</div>' +
        '</section>';
}

function padTime(n) { return n < 10 ? '0' + n : '' + n; }

function xpTruncate(str, max) {
    if (!str) return '';
    var s = str.toString();
    return s.length > max ? s.substring(0, max - 1) + '..' : s;
}

// === Windows ===
function xpOpenWindow(id) {
    var item = dwItems[id];
    if (!item) return;

    if (xpWindows[id]) {
        xpFocusWindow(id);
        if (xpWindows[id].minimized) xpRestoreWindow(id);
        return;
    }

    var baseX = 0.5 + (Object.keys(xpWindows).length * 0.25);
    var baseY = 0.3 + (Object.keys(xpWindows).length * 0.2);

    xpWindows[id] = { x: baseX, y: baseY, w: 5, minimized: false, zIndex: ++xpZIndex };
    xpRenderWindow(id);
    xpFocusWindow(id);
}

function xpRenderWindow(id) {
    var item = dwItems[id];
    if (!item) return;
    var win = xpWindows[id];
    if (!win) return;

    var desktop = document.getElementById('xpDesktop');
    if (!desktop) return;

    // Remove old window
    var oldWin = document.getElementById('xpWindow' + id);
    if (oldWin) oldWin.remove();

    var icon = iconForItem(item, id);

    var content = '<div class="xp-detail-title">' + icon + ' ' + item.title + '</div>' +
        '<div class="xp-detail-cat">' + (item.cat || '') + '</div>' +
        '<div class="xp-detail-sep"></div>';
    if (item.desc) content += '<div class="xp-detail-desc">' + item.desc.substring(0, 180) + '</div>';
    content += '<div class="xp-detail-meta">Published: ' + (item.published || '-') + '</div>';
    content += '<div class="xp-detail-meta">Client: ' + (item.client || '-') + '</div>';
    content += '<button class="xp-detail-open" data-xp-full="' + id + '">Open Full Detail</button>';

    var winHTML = '<div class="xp-window" id="xpWindow' + id + '" style="left:' + win.x + 'rem;top:' + win.y + 'rem;width:' + win.w + 'rem;z-index:' + win.zIndex + ';display:none">' +
        '<div class="xp-titlebar" data-xp-drag="' + id + '">' +
        '<span class="xp-titlebar-icon">' + icon + '</span>' +
        '<span class="xp-titlebar-text">' + item.title + '</span>' +
        '<div class="xp-titlebar-btns">' +
        '<button class="xp-tb-btn xp-tb-minimize" data-xp-min="' + id + '">_</button>' +
        '<button class="xp-tb-btn xp-tb-close" data-xp-close="' + id + '">X</button>' +
        '</div></div>' +
        '<div class="xp-window-body">' +
        '<div class="xp-window-content">' + content + '</div>' +
        '<div class="xp-window-statusbar">' +
        '<span>' + (item.tools || '') + '</span>' +
        '</div></div></div>';

    var temp = document.createElement('div');
    temp.innerHTML = winHTML;
    var winEl = temp.firstChild;
    desktop.appendChild(winEl);

    if (!win.minimized) winEl.style.display = '';

    // Drag
    var titlebar = winEl.querySelector('.xp-titlebar');
    if (titlebar) {
        titlebar.addEventListener('mousedown', function(e) {
            xpDragging = id;
            xpDragOX = e.clientX - winEl.offsetLeft;
            xpDragOY = e.clientY - winEl.offsetTop;
            e.preventDefault();
        });
    }

    // Minimize
    var minBtn = winEl.querySelector('[data-xp-min]');
    if (minBtn) {
        minBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            xpMinimizeWindow(id);
        });
    }

    // Close
    var closeBtn = winEl.querySelector('[data-xp-close]');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            xpCloseWindow(id);
        });
    }

    // Full detail button
    var fullBtn = winEl.querySelector('[data-xp-full]');
    if (fullBtn) {
        fullBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.hash = '#/design-work/detail/' + id;
        });
    }

    // Focus on click
    winEl.addEventListener('mousedown', function() {
        xpFocusWindow(id);
    });

    xpUpdateTaskButtons();
}

function xpFocusWindow(id) {
    if (!xpWindows[id]) return;
    xpWindows[id].zIndex = ++xpZIndex;
    var winEl = document.getElementById('xpWindow' + id);
    if (winEl) winEl.style.zIndex = xpWindows[id].zIndex;
    // Update taskbar active state
    document.querySelectorAll('.xp-task-btn').forEach(function(btn) {
        var btnId = parseInt(btn.getAttribute('data-xp-task'), 10);
        btn.classList.toggle('xp-task-focused', btnId === id);
    });
}

function xpMinimizeWindow(id) {
    if (!xpWindows[id]) return;
    xpWindows[id].minimized = true;
    var winEl = document.getElementById('xpWindow' + id);
    if (winEl) winEl.style.display = 'none';
    xpUpdateTaskButtons();
}

function xpRestoreWindow(id) {
    if (!xpWindows[id]) return;
    xpWindows[id].minimized = false;
    var winEl = document.getElementById('xpWindow' + id);
    if (winEl) winEl.style.display = '';
    xpFocusWindow(id);
    xpUpdateTaskButtons();
}

function xpCloseWindow(id) {
    var winEl = document.getElementById('xpWindow' + id);
    if (winEl) winEl.remove();
    delete xpWindows[id];
    xpUpdateTaskButtons();
}

function xpUpdateTaskButtons() {
    var container = document.getElementById('xpTaskbarTasks');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(xpWindows).forEach(function(k) {
        var id = parseInt(k, 10);
        var item = dwItems[id];
        var win = xpWindows[id];
        var icon = iconForItem(item, id);
        var btn = document.createElement('button');
        btn.className = 'xp-task-btn';
        if (!win.minimized) btn.classList.add('xp-task-focused');
        btn.setAttribute('data-xp-task', id);
        btn.innerHTML = '<span class="xp-task-btn-icon">' + icon + '</span><span class="xp-task-btn-text">' + (item ? item.title : '') + '</span>';
        btn.addEventListener('click', function() {
            if (xpWindows[id] && xpWindows[id].minimized) {
                xpRestoreWindow(id);
            } else if (!xpWindows[id]) {
                xpOpenWindow(id);
            } else {
                xpMinimizeWindow(id);
            }
        });
        container.appendChild(btn);
    });
}

// === Mouse events ===
function bindXpDesktop() {
    var page = document.getElementById('page-design-work');
    if (!page) return;

    // Icon clicks
    page.addEventListener('click', function(e) {
        var icon = e.target.closest('.xp-icon');
        if (!icon) return;
        var id = parseInt(icon.getAttribute('data-xp-id'), 10);
        if (!isNaN(id)) xpOpenWindow(id);
    });

    // Icon double click
    page.addEventListener('dblclick', function(e) {
        var icon = e.target.closest('.xp-icon');
        if (!icon) return;
        var id = parseInt(icon.getAttribute('data-xp-id'), 10);
        if (!isNaN(id)) xpOpenWindow(id);
    });

    // Global mousemove for drag
    document.addEventListener('mousemove', function(e) {
        if (xpDragging === null) return;
        var id = xpDragging;
        var winEl = document.getElementById('xpWindow' + id);
        if (!winEl) return;
        var newX = e.clientX - xpDragOX;
        var newY = e.clientY - xpDragOY;
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        xpWindows[id].x = newX / (window.innerWidth > 0 ? window.innerWidth : 1) * 16; // convert to rem approx
        xpWindows[id].x = newX / 16;
        xpWindows[id].y = newY / 16;
        winEl.style.left = (newX / 16) + 'rem';
        winEl.style.top = (newY / 16) + 'rem';
    });

    document.addEventListener('mouseup', function() {
        xpDragging = null;
    });

    // Desktop click deselects
    var desktop = document.getElementById('xpDesktop');
    if (desktop) {
        desktop.addEventListener('mousedown', function(e) {
            if (!e.target.closest('.xp-window')) {
                xpDragging = null;
            }
            if (!e.target.closest('.xp-icon') && !e.target.closest('.xp-window')) {
                document.querySelectorAll('.xp-icon.selected').forEach(function(ic) {
                    ic.classList.remove('selected');
                });
            }
        });
    }

    // Start button - reset all windows
    var startBtn = document.getElementById('xpStartBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            Object.keys(xpWindows).forEach(function(k) {
                var id = parseInt(k, 10);
                xpCloseWindow(id);
            });
        });
    }

    // Keyboard shortcuts
    page.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var openIds = Object.keys(xpWindows);
            if (openIds.length > 0) {
                xpCloseWindow(parseInt(openIds[openIds.length - 1], 10));
            }
        }
    });

    // Update clock
    function updateClock() {
        var now = new Date();
        var clock = document.getElementById('xpTrayTime');
        if (clock && page && page.offsetParent !== null) {
            clock.textContent = padTime(now.getHours()) + ':' + padTime(now.getMinutes());
        }
    }
    setInterval(updateClock, 30000);
    updateClock();
}

// === Detail Page (unchanged) ===
function buildDesignWorkDetail(id) {
    var item = dwItems[id];
    if (!item) return '';
    var heroBg = item.headerBg ? 'url(' + item.headerBg + ') center/cover' : '#0a0a0a';
    var toolsStr = item.tools || '';
    var clientStr = item.client || '';
    var publishedStr = item.published || '';

    var tagsHtml = '';
    var tagsArr = item.tags || [];
    if (tagsArr.length > 0) {
        tagsHtml = '<div class="dw-detail-tags">';
        for (var ti = 0; ti < tagsArr.length; ti++) {
            tagsHtml += '<span class="dw-detail-tag">' + tagsArr[ti] + '</span>';
        }
        tagsHtml += '</div>';
    }

    var likeCount = item.likeCount || 0;
    var likeHtml = '<div class="dw-detail-like-wrap">' +
        '<button class="dw-detail-like-btn" id="dwDetailLikeBtn" data-dw-like-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<span class="dw-detail-like-count">' + likeCount + '</span>' +
        '</button></div>';

    var descHtml = item.desc ? '<div class="dw-detail-desc"><p>' + item.desc + '</p></div>' : '';

    var mediaHtml = '';
    var contentImages = item.contentImages || [];
    if (contentImages.length > 0) {
        mediaHtml = '<div class="dw-detail-media">';
        for (var mi = 0; mi < contentImages.length; mi++) {
            var src = contentImages[mi];
            if (src.indexOf('data:video') === 0 || src.match(/\.(mp4|webm|ogg)($|\?)/i)) {
                mediaHtml += '<div class="dw-detail-media-item"><video src="' + src + '" controls></video></div>';
            } else {
                mediaHtml += '<div class="dw-detail-media-item"><img src="' + src + '" alt=""></div>';
            }
        }
        mediaHtml += '</div>';
    }

    return '<div class="dw-detail" id="dwDetail">' +
        '<button class="dw-detail-back" id="dwDetailBack">' +
        '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
        '</button>' +
        '<div class="dw-detail-hero">' +
        '<div class="dw-detail-hero-bg" style="background:' + heroBg + '"></div>' +
        '<div class="dw-detail-hero-mask"></div>' +
        '<div class="dw-detail-hero-content">' +
        '<h2 class="dw-detail-hero-title">' + item.title + '</h2>' +
        '<p class="dw-detail-hero-cat">' + item.cat + '</p>' +
        '</div></div>' +
        '<div class="dw-detail-body">' +
        descHtml + mediaHtml + tagsHtml + likeHtml +
        '<div class="dw-detail-meta">' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Client</p><p class="dw-detail-meta-value">' + clientStr + '</p></div>' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Published</p><p class="dw-detail-meta-value">' + publishedStr + '</p></div>' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Tools</p><p class="dw-detail-meta-value">' + toolsStr + '</p></div>' +
        '</div></div></div>';
}

// === List Page (unchanged) ===
function buildDesignWorkListCards(page) {
    var start = (page - 1) * dwListPageSize;
    var end = Math.min(start + dwListPageSize, dwItems.length);
    var pageItems = dwItems.slice(start, end);
    return pageItems.map(function(item, i) {
        var realIndex = start + i;
        var thumbBg = item.cardBg ? 'url(' + item.cardBg + ') center/cover, linear-gradient(145deg,#f8f4eb,#ebe3d5)' : 'linear-gradient(145deg,#f8f4eb,#ebe3d5)';
        return '<div class="dw-list-card" data-dw-id="' + realIndex + '">' +
            '<div class="dw-list-card-thumb" style="background:' + thumbBg + '"></div>' +
            '<div class="dw-list-card-body">' +
            '<p class="dw-list-card-cat">' + item.cat + '</p>' +
            '<h3 class="dw-list-card-title">' + item.title + '</h3>' +
            '<p class="dw-list-card-meta">' + (item.published || '') + '  ' + (item.client || '') + '</p>' +
            '<p class="dw-list-card-desc">' + (item.desc || '').substring(0, 120) + '</p>' +
            '</div></div>';
    }).join('');
}

function buildDesignWorkListPagination(totalPages, currentPage) {
    if (totalPages <= 1) return '';
    var html = '<div class="dw-list-pagination">';
    html += '<button class="dw-list-page-btn prev" data-page="prev">&lt;</button>';
    for (var i = 1; i <= totalPages; i++) {
        html += '<button class="dw-list-page-btn ' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button class="dw-list-page-btn next" data-page="next">&gt;</button>';
    html += '</div>';
    return html;
}

function buildDesignWorkList() {
    var totalPages = Math.ceil(dwItems.length / dwListPageSize);
    var cards = buildDesignWorkListCards(dwListCurrentPage);
    var pagination = buildDesignWorkListPagination(totalPages, dwListCurrentPage);
    return '<section id="page-design-work-list" class="dw-list-page">' +
        '<div class="dw-list-inner"><div class="dw-list-grid" id="dwListGrid">' + cards + '</div>' + pagination + '</div>' +
        '<div class="dw-back2card-btn" id="dwBack2CardBtn">' +
        '<div class="dw-more-dots"><span></span><span></span><span></span></div>' +
        '<span class="dw-more-text">Card</span>' +
        '</div>' +
        '</section>';
}

function bindDesignWorkListClicks() {
    var cards = document.querySelectorAll('.dw-list-card');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            var id = this.getAttribute('data-dw-id');
            window.location.hash = '#/design-work/detail/' + id;
        });
    });
}

function bindDesignWorkListPagination() {
    var btns = document.querySelectorAll('.dw-list-page-btn');
    var totalPages = Math.ceil(dwItems.length / dwListPageSize);
    btns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var page = this.getAttribute('data-page');
            if (page === 'prev') {
                if (dwListCurrentPage > 1) dwListCurrentPage--;
            } else if (page === 'next') {
                if (dwListCurrentPage < totalPages) dwListCurrentPage++;
            } else {
                dwListCurrentPage = parseInt(page, 10);
            }
            var grid = document.getElementById('dwListGrid');
            if (grid) {
                grid.innerHTML = buildDesignWorkListCards(dwListCurrentPage);
                bindDesignWorkListClicks();
            }
            var paginationEl = document.querySelector('.dw-list-pagination');
            if (paginationEl) {
                var newPagination = buildDesignWorkListPagination(totalPages, dwListCurrentPage);
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = newPagination;
                var newBtns = tempDiv.querySelectorAll('.dw-list-page-btn');
                var oldBtns = paginationEl.querySelectorAll('.dw-list-page-btn');
                oldBtns.forEach(function(oldBtn, index) {
                    if (newBtns[index]) oldBtn.className = newBtns[index].className;
                });
            }
        });
    });
}

// === Guard (unchanged) ===
var designGuardStep = 1;
var designGuardLevels = [];

function loadDesignGuard() {
    var raw = localStorage.getItem('vipen_design_guard');
    if (raw) { try { designGuardLevels = JSON.parse(raw); } catch(e) { designGuardLevels = []; } }
    if (!designGuardLevels || !designGuardLevels.level1) {
        designGuardLevels = { level1: { type: 'pin', answer: '', hint: '' }, level2: { type: 'text', answer: '', hint: '' }, level3: { type: 'none', answer: '', hint: '' } };
    }
}

function getCurrentLevelConfig() { return designGuardLevels['level' + designGuardStep] || { type: 'none', answer: '', hint: '' }; }

function buildGuardStepDots() {
    var html = '';
    for (var i = 1; i <= 3; i++) {
        var cfg = designGuardLevels['level' + i] || { type: 'none', answer: '' };
        html += '<span class="dw-guard-step-dot' + (cfg.type === 'none' && !cfg.answer ? ' skip' : '') + '">' + i + '</span>';
    }
    return html;
}

function renderDesignGuard() {
    loadDesignGuard();
    var cfg = getCurrentLevelConfig();
    var isPin = cfg.type === 'pin';
    var hint = cfg.hint || (isPin ? 'Enter PIN' : cfg.type === 'text' ? 'Enter answer' : 'Press Enter');
    return '<div class="dw-guard-overlay" id="dwGuardOverlay" style="background:url(\'images/PIN验证.png\') center/cover no-repeat">' +
        '<button class="dw-guard-back" id="dwGuardBack"><svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back</button>' +
        '<div class="dw-guard-step-indicator">' + buildGuardStepDots() + '</div>' +
        '<div class="dw-guard-input-wrap">' +
        '<input type="' + (isPin ? 'password' : 'text') + '" class="dw-guard-input" id="dwGuardInput" placeholder="' + hint + '" maxlength="' + (isPin ? 6 : 50) + '"' + (isPin ? ' inputmode="numeric"' : '') + ' autocomplete="off">' +
        '</div></div>';
}

function shakeInput(el) { el.classList.add('dw-guard-shake','dw-guard-error-border'); setTimeout(function(){ el.classList.remove('dw-guard-shake'); }, 500); setTimeout(function(){ el.classList.remove('dw-guard-error-border'); }, 2000); }

function bindDesignGuard() {
    designGuardStep = 1; loadDesignGuard();
    var backBtn = document.getElementById('dwGuardBack');
    if (backBtn) backBtn.addEventListener('click', function() { window.history.back(); });
    var input = document.getElementById('dwGuardInput');
    if (!input) return;
    function updateUI() {
        var cfg = getCurrentLevelConfig(), isPin = cfg.type === 'pin', isNone = cfg.type === 'none';
        input.placeholder = cfg.hint || (isNone ? 'Press Enter' : isPin ? 'Enter PIN' : 'Enter answer');
        input.type = isPin ? 'password' : 'text';
        input.maxLength = isPin ? 6 : 50;
        if (isPin) input.setAttribute('inputmode', 'numeric'); else input.removeAttribute('inputmode');
        input.value = '';
        document.querySelectorAll('.dw-guard-step-dot').forEach(function(d, i) { d.classList.remove('active','done'); if (i+1===designGuardStep) d.classList.add('active'); if (i+1<designGuardStep) d.classList.add('done'); });
    }
    updateUI();
    input.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return; e.preventDefault();
        var cfg = getCurrentLevelConfig(), val = input.value.trim();
        if (cfg.type !== 'none') { if ((cfg.type==='pin'&&! /^\d{6}$/.test(val))||(!val)) { shakeInput(input); return; } if (cfg.answer && val !== cfg.answer) { shakeInput(input); return; } }
        if (++designGuardStep > 3) { sessionStorage.setItem('design_verified','true'); var ov = document.getElementById('dwGuardOverlay'); if (ov&&ov.parentNode) ov.parentNode.remove(); var h = window.location.hash; if (h) { window.location.hash=''; setTimeout(function(){ window.location.hash=h; }, 0); } }
        else updateUI();
    });
}

function isDesignVerified() { return true; }

return {
    buildGrid: function() { return buildDesignWorkGrid(); },
    buildDetail: function(id) { return buildDesignWorkDetail(id); },
    buildList: function() { return buildDesignWorkList(); },
    bindGrid: function() { bindXpDesktop(); },
    bindList: function() { bindDesignWorkListClicks(); bindDesignWorkListPagination(); },
    resetCards: function() {},
    renderGuard: function() { return renderDesignGuard(); },
    bindGuard: function() { bindDesignGuard(); },
    isVerified: function() { return isDesignVerified(); }
};

})();
