var DesignPage = (function() {
'use strict';

var dwZoomedCard = null;
var dwListPageSize = 6;
var dwListCurrentPage = 1;
var dieAutoRotation = null;
var dieActiveFace = 0;
var dieIsHovering = false;

// Face order: front, back, right, left, top, bottom
var FACE_CLASSES = ['front', 'back', 'right', 'left', 'top', 'bottom'];

var PIP_POSITIONS = [
    [[50,50]],                                          // 1
    [[25,25],[75,75]],                                   // 2
    [[20,20],[50,50],[80,80]],                           // 3
    [[25,25],[75,25],[25,75],[75,75]],                   // 4
    [[25,25],[75,25],[50,50],[25,75],[75,75]],           // 5
    [[20,20],[50,20],[80,20],[20,80],[50,80],[80,80]]    // 6
];

function buildDesignWorkGrid() {
    var faces = dwItems.slice(0, 6).map(function(item, i) {
        var pips = '';
        (PIP_POSITIONS[i] || []).forEach(function(pos, pi) {
            pips += '<span class="die-pip die-pip-' + (pi+1) + '" style="top:' + pos[0] + '%;left:' + pos[1] + '%"></span>';
        });
        return '<div class="die-face die-' + FACE_CLASSES[i] + '" data-face="' + i + '">' + pips + '</div>';
    }).join('');

    return '<section id="page-design-work" class="dw-page">' +
        '<div class="die-scene" id="dieScene">' +
        '<div class="die-scene-bg" id="dieSceneBg"></div>' +
        '<div class="die-cube-wrap" id="dieCubeWrap">' +
        '<div class="die-cube" id="dieCube">' + faces + '</div>' +
        '</div>' +
        '<div class="die-info" id="dieInfo">' +
        '<p class="die-info-cat" id="dieInfoCat"></p>' +
        '<h3 class="die-info-title" id="dieInfoTitle"></h3>' +
        '</div>' +
        '</div>' +
        '</section>';
}

function startDieRotation() {
    var cube = document.getElementById('dieCube');
    if (!cube) return;

    // Kill any existing rotation
    if (dieAutoRotation) dieAutoRotation.kill();

    dieAutoRotation = gsap.to(cube, {
        rotateX: -25,
        rotateY: 360 + 25,
        duration: 8,
        repeat: -1,
        ease: 'none',
        modifiers: {
            rotateY: function(val) { return parseFloat(val) % 360; }
        },
        onUpdate: function() {
            if (!dieIsHovering) updateActiveFaceFromRotation();
        }
    });
}

function updateActiveFaceFromRotation() {
    var cube = document.getElementById('dieCube');
    if (!cube) return;
    var style = cube._gsap || gsap.getProperty(cube);
    var ry = gsap.getProperty(cube, 'rotateY') % 360;
    if (ry < 0) ry += 360;
    var rx = gsap.getProperty(cube, 'rotateX') % 360;
    if (rx < 0) rx += 360;

    // Normalize to 0-360
    ry = ((ry % 360) + 360) % 360;

    // Determine which face is most facing the camera based on Y rotation
    // Each face occupies 90 degrees of Y rotation
    var faceIdx;
    if (ry < 45 || ry >= 315) faceIdx = 0;      // front
    else if (ry >= 45 && ry < 135) faceIdx = 2;  // right
    else if (ry >= 135 && ry < 225) faceIdx = 1; // back
    else faceIdx = 3;                             // left: 225-315

    showDieFaceInfo(faceIdx);
}

function updateDieFaceText(idx) {
    var item = dwItems[idx];
    if (!item) return;
    var catEl = document.getElementById('dieInfoCat');
    var titleEl = document.getElementById('dieInfoTitle');
    if (catEl) catEl.textContent = item.cat;
    if (titleEl) titleEl.textContent = item.title;
}

function showDieFaceInfo(idx) {
    if (idx === dieActiveFace) return;
    dieActiveFace = idx;
    updateDieFaceText(idx);
    // Background and text visibility are ONLY toggled on hover (see bindDieInteraction)
}

function applyDieHoverVisuals(idx) {
    var item = dwItems[idx];
    if (!item) return;
    var sceneBg = document.getElementById('dieSceneBg');
    var dieInfo = document.getElementById('dieInfo');
    if (sceneBg && item.cardHoverBg) {
        sceneBg.style.backgroundImage = 'url(' + item.cardHoverBg + ')';
        sceneBg.classList.add('active');
    }
    if (dieInfo) dieInfo.classList.add('active');
}

function bindDieInteraction() {
    var wrap = document.getElementById('dieCubeWrap');
    var cube = document.getElementById('dieCube');
    var scene = document.getElementById('dieScene');
    if (!wrap || !cube) return;

    wrap.addEventListener('mouseenter', function() {
        dieIsHovering = true;
        if (dieAutoRotation) dieAutoRotation.pause();
        applyDieHoverVisuals(dieActiveFace);
    });

    wrap.addEventListener('mouseleave', function() {
        dieIsHovering = false;
        var sceneBg = document.getElementById('dieSceneBg');
        if (sceneBg) sceneBg.classList.remove('active');
        document.getElementById('dieInfo').classList.remove('active');
        if (dieAutoRotation) dieAutoRotation.play();
    });

    wrap.addEventListener('mousemove', function(e) {
        if (!dieIsHovering) return;
        var rect = wrap.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / rect.width;
        var dy = (e.clientY - cy) / rect.height;

        // Map mouse position to rotation (subtle, keeping cube facing viewer-ish)
        var targetRY = 25 + dx * 40;
        var targetRX = -15 - dy * 30;

        gsap.to(cube, {
            rotateX: targetRX,
            rotateY: targetRY,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: 'auto'
        });

        // Update active face based on Y rotation
        var ry = ((targetRY % 360) + 360) % 360;
        var faceIdx;
        if (ry < 45 || ry >= 315) faceIdx = 0;
        else if (ry >= 45 && ry < 135) faceIdx = 2;
        else if (ry >= 135 && ry < 225) faceIdx = 1;
        else faceIdx = 3;
        if (faceIdx !== dieActiveFace) {
            showDieFaceInfo(faceIdx);
            applyDieHoverVisuals(faceIdx);
        }
    });

    wrap.addEventListener('click', function() {
        window.location.hash = '#/design-work/detail/' + dieActiveFace;
    });

    // Initial face info
    showDieFaceInfo(0);
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
    bindGrid: function() { startDieRotation(); bindDieInteraction(); },
    bindList: function() { bindDesignWorkListClicks(); bindDesignWorkListPagination(); },
    resetCards: function() { if (dieAutoRotation) dieAutoRotation.play(); },
    renderGuard: function() { return renderDesignGuard(); },
    bindGuard: function() { bindDesignGuard(); },
    isVerified: function() { return isDesignVerified(); }
};

})();
