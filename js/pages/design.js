var DesignPage = (function() {
'use strict';

var dwZoomedCard = null;
var dwListPageSize = 6;
var dwListCurrentPage = 1;

// === Nokia Phone State ===
var nokiaSelectedIndex = 0;
var nokiaInDetail = false;
var nokiaDetailId = null;

// === Nokia Phone Grid ===
function buildDesignWorkGrid() {
    return '<section id="page-design-work" class="dw-page">' +
        '<div class="nokia-phone" id="nokiaPhone">' +
        '<div class="nokia-earpiece"><span></span></div>' +
        '<div class="nokia-brand">NOKIA</div>' +
        '<div class="nokia-screen-frame">' +
        '<div class="nokia-screen" id="nokiaScreen">' +
        '<div class="nokia-screen-content" id="nokiaScreenContent"></div>' +
        '</div></div>' +
        '<div class="nokia-softkeys">' +
        '<div class="nokia-softkey nokia-softkey-left" id="nokiaSoftLeft" data-action="back">Back</div>' +
        '<div class="nokia-navpad">' +
        '<div class="nokia-nav nokia-nav-up" data-dir="up"></div>' +
        '<div class="nokia-nav nokia-nav-down" data-dir="down"></div>' +
        '<div class="nokia-nav nokia-nav-ok" data-action="ok">OK</div>' +
        '</div>' +
        '<div class="nokia-softkey nokia-softkey-right" id="nokiaSoftRight" data-action="select">Select</div>' +
        '</div>' +
        '<div class="nokia-keypad">' +
        '<div class="nokia-key-row">' +
        '<div class="nokia-key" data-num="1">1<span>o_o</span></div>' +
        '<div class="nokia-key" data-num="2">2<span>abc</span></div>' +
        '<div class="nokia-key" data-num="3">3<span>def</span></div>' +
        '</div>' +
        '<div class="nokia-key-row">' +
        '<div class="nokia-key" data-num="4">4<span>ghi</span></div>' +
        '<div class="nokia-key" data-num="5">5<span>jkl</span></div>' +
        '<div class="nokia-key" data-num="6">6<span>mno</span></div>' +
        '</div>' +
        '<div class="nokia-key-row">' +
        '<div class="nokia-key" data-num="7">7<span>pqrs</span></div>' +
        '<div class="nokia-key" data-num="8">8<span>tuv</span></div>' +
        '<div class="nokia-key" data-num="9">9<span>wxyz</span></div>' +
        '</div>' +
        '<div class="nokia-key-row">' +
        '<div class="nokia-key nokia-key-star" data-num="*">*</div>' +
        '<div class="nokia-key" data-num="0">0<span>_</span></div>' +
        '<div class="nokia-key nokia-key-hash" data-num="#">#</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</section>';
}

function renderNokiaMenu() {
    var content = document.getElementById('nokiaScreenContent');
    if (!content) return;
    nokiaInDetail = false;
    nokiaDetailId = null;

    var maxVisible = 4;
    var total = dwItems.length;
    var start = Math.max(0, Math.min(nokiaSelectedIndex, total - maxVisible));
    var visible = dwItems.slice(start, start + maxVisible);

    var html = '<div class="nokia-status-bar"><span class="nokia-signal">|||||</span><span>WORKS</span><span class="nokia-batt">||||</span></div>';
    html += '<div class="nokia-menu">';
    visible.forEach(function(item, i) {
        var realIdx = start + i;
        var isActive = realIdx === nokiaSelectedIndex;
        var arrow = isActive ? '<span class="nokia-arrow">&gt;</span>' : '<span class="nokia-arrow-space">&nbsp;</span>';
        var num = (realIdx + 1);
        html += '<div class="nokia-menu-item' + (isActive ? ' active' : '') + '" data-idx="' + realIdx + '">' +
            arrow + '<span class="nokia-menu-num">' + num + '.</span>' + '<span class="nokia-menu-text">' + truncatePixel(item.title, 12) + '</span>' +
            '</div>';
    });
    html += '</div>';
    html += '<div class="nokia-soft-hint"><span>Select</span><span>Menu</span></div>';

    content.innerHTML = html;
}

function renderNokiaDetail(id) {
    var content = document.getElementById('nokiaScreenContent');
    if (!content) return;
    var item = dwItems[id];
    if (!item) { renderNokiaMenu(); return; }
    nokiaInDetail = true;
    nokiaDetailId = id;

    var html = '<div class="nokia-status-bar"><span class="nokia-signal">|||||</span><span>DETAIL</span><span class="nokia-batt">||||</span></div>';
    html += '<div class="nokia-detail">';
    html += '<div class="nokia-detail-title">' + truncatePixel(item.title, 14) + '</div>';
    html += '<div class="nokia-detail-cat">[' + (item.cat || '') + ']</div>';
    html += '<div class="nokia-detail-line"></div>';
    html += '<div class="nokia-detail-desc">' + truncatePixel((item.desc || '').substring(0, 60), 28) + '</div>';
    html += '<div class="nokia-detail-line"></div>';
    html += '<div class="nokia-detail-meta">C:' + truncatePixel(item.client || '-', 10) + '</div>';
    html += '<div class="nokia-detail-meta">Y:' + (item.published || '-') + '</div>';
    html += '</div>';
    html += '<div class="nokia-soft-hint"><span>Back</span><span>Open</span></div>';

    content.innerHTML = html;
}

function truncatePixel(str, maxLen) {
    if (!str) return '';
    var s = str.toString();
    if (s.length <= maxLen) return s;
    return s.substring(0, maxLen - 1) + '..';
}

function nokiaSelectNext() {
    if (nokiaInDetail) return;
    nokiaSelectedIndex = (nokiaSelectedIndex + 1) % dwItems.length;
    renderNokiaMenu();
}

function nokiaSelectPrev() {
    if (nokiaInDetail) return;
    nokiaSelectedIndex = (nokiaSelectedIndex - 1 + dwItems.length) % dwItems.length;
    renderNokiaMenu();
}

function nokiaSelectNum(num) {
    if (nokiaInDetail) return;
    var idx = num - 1;
    if (idx >= 0 && idx < dwItems.length) {
        nokiaSelectedIndex = idx;
        renderNokiaMenu();
        // Auto-open after short delay
        setTimeout(function() { nokiaOpen(); }, 200);
    }
}

function nokiaOpen() {
    if (nokiaInDetail) {
        window.location.hash = '#/design-work/detail/' + nokiaDetailId;
    } else {
        renderNokiaDetail(nokiaSelectedIndex);
    }
}

function nokiaBack() {
    if (nokiaInDetail) {
        renderNokiaMenu();
    } else {
        window.history.back();
    }
}

function bindNokiaKeys() {
    var phone = document.getElementById('nokiaPhone');
    if (!phone) return;

    // Soft keys & nav
    phone.addEventListener('click', function(e) {
        var el = e.target.closest('[data-dir], [data-action], [data-num]');
        if (!el) return;
        var dir = el.getAttribute('data-dir');
        var action = el.getAttribute('data-action');
        var num = el.getAttribute('data-num');
        if (dir === 'up') nokiaSelectPrev();
        else if (dir === 'down') nokiaSelectNext();
        else if (action === 'ok') nokiaOpen();
        else if (action === 'select') nokiaOpen();
        else if (action === 'back') nokiaBack();
        else if (num && num !== '*' && num !== '#') nokiaSelectNum(parseInt(num, 10));
    });

    // Keyboard support
    document.addEventListener('keydown', function onKey(e) {
        var activeSection = document.getElementById('page-design-work');
        if (!activeSection || activeSection.offsetParent === null) return;
        if (e.key === 'ArrowUp') { e.preventDefault(); nokiaSelectPrev(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); nokiaSelectNext(); }
        else if (e.key === 'Enter') { e.preventDefault(); nokiaOpen(); }
        else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); nokiaBack(); }
        else if (e.key >= '1' && e.key <= '9') { nokiaSelectNum(parseInt(e.key, 10)); }
    });
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
    bindGrid: function() {
        renderNokiaMenu();
        bindNokiaKeys();
    },
    bindList: function() { bindDesignWorkListClicks(); bindDesignWorkListPagination(); },
    resetCards: function() {},
    renderGuard: function() { return renderDesignGuard(); },
    bindGuard: function() { bindDesignGuard(); },
    isVerified: function() { return isDesignVerified(); }
};

})();
