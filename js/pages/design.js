var DesignPage = (function() {
'use strict';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
    if (!url) return null;
    var m;
    // youtube.com/watch?v=VIDEO_ID
    m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    // youtu.be/VIDEO_ID
    m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    return null;
}

var dwZoomedCard = null;
var dwListPageSize = 6;
var dwListCurrentPage = 1;

// === Fan Layout Engine ===
// Calculate fan positions for N cards spread in an arc
function calcFanPositions(count) {
    var positions = [];
    var centerIndex = (count - 1) / 2;
    var angleStep = count <= 1 ? 0 : Math.min(14, 60 / (count + 1)); // degrees per card

    for (var i = 0; i < count; i++) {
        var offset = i - centerIndex; // negative = left, 0 = center, positive = right
        var rotation = offset * angleStep;
        // Arc: cards form a gentle U-shaped curve
        var absOffset = Math.abs(offset);
        var y = absOffset * absOffset * 0.025; // y drops down quadratically from center
        var x = offset * 0.65; // horizontal spread
        var zIndex = count - absOffset; // center card on top
        positions.push({ rotation: rotation, x: x, y: y, zIndex: zIndex, offset: offset });
    }
    return positions;
}

// === Build Fan Layout ===
function buildDesignWorkGrid() {
    var count = dwItems.length;
    if (count === 0) {
        return '<section id="page-design-work" class="dw-fan-page"><div class="dw-fan-empty">No design works yet.</div></section>';
    }
    var positions = calcFanPositions(count);

    var cardsHTML = dwItems.map(function(item, i) {
        var img = item.cardBg || '';
        var fallback = item.cardHoverBg || item.headerBg || '';
        var pos = positions[i];
        var numStr = String(i + 1).padStart(2, '0');
        // Inline target transform as data attributes for GSAP to read
        // Also set as inline transform fallback (no-GSAP graceful degradation)
        var inlineTransform = 'translate(' + pos.x.toFixed(2) + 'rem, ' + pos.y.toFixed(2) + 'rem) rotate(' + pos.rotation.toFixed(2) + 'deg)';
        // Build image with onerror fallback chain: cardBg → cardHoverBg → headerBg → hidden
        var imgTag = img
            ? '<img class="dw-fan-card-bg-img" src="' + img + '"' + (fallback ? ' onerror="var t=this;if(t.src!==\'' + fallback + '\'){t.src=\'' + fallback + '\'}else{t.style.display=\'none\'}"' : ' onerror="this.style.display=\'none\'"') + '>'
            : (fallback ? '<img class="dw-fan-card-bg-img" src="' + fallback + '" onerror="this.style.display=\'none\'">' : '');
        return '<div class="dw-fan-card" ' +
            'data-design-id="' + i + '" ' +
            'data-fan-rotation="' + pos.rotation.toFixed(2) + '" ' +
            'data-fan-x="' + pos.x.toFixed(2) + '" ' +
            'data-fan-y="' + pos.y.toFixed(2) + '" ' +
            'data-fan-z="' + pos.zIndex + '" ' +
            'style="z-index:' + pos.zIndex + ';transform:' + inlineTransform + '">' +
            imgTag +
            '<div class="dw-fan-card-overlay"></div>' +
            '<div class="dw-fan-card-accent"></div>' +
            '<div class="dw-fan-card-info">' +
            '<p class="dw-fan-card-number">' + numStr + ' / ' + (count < 10 ? '0' + count : count) + '</p>' +
            '<p class="dw-fan-card-title">' + (item.title || 'Untitled') + '</p>' +
            (item.client ? '<p class="dw-fan-card-client">' + item.client + '</p>' : '') +
            '</div>' +
            '</div>';
    }).join('');

    return '<section id="page-design-work" class="dw-fan-page">' +
        '<div class="dw-fan-stage" id="designFanStage">' + cardsHTML + '</div>' +
        '</section>';
}

// === GSAP Fan Entrance Animation ===
function animateFanEntrance() {
    var cards = document.querySelectorAll('.dw-fan-card');
    if (!cards.length) return;
    if (typeof gsap === 'undefined') return;

    // 1. Set initial state: all cards stacked at center
    gsap.set(cards, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 0.7,
        opacity: 0
    });

    // 2. Animate to fan positions with stagger
    gsap.to(cards, {
        x: function(i, el) { return parseFloat(el.getAttribute('data-fan-x')) + 'rem'; },
        y: function(i, el) { return parseFloat(el.getAttribute('data-fan-y')) + 'rem'; },
        rotation: function(i, el) { return parseFloat(el.getAttribute('data-fan-rotation')); },
        scale: 1,
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.2
    });
}

// === Fan Hover Interactions ===
function bindFanHover() {
    var cards = document.querySelectorAll('.dw-fan-card');
    if (!cards.length) return;
    if (typeof gsap === 'undefined') return;

    cards.forEach(function(card) {
        var z = parseInt(card.getAttribute('data-fan-z'), 10) || 0;
        var baseRotation = parseFloat(card.getAttribute('data-fan-rotation')) || 0;
        var baseX = card.getAttribute('data-fan-x') || '0';
        var baseY = card.getAttribute('data-fan-y') || '0';

        card.addEventListener('mouseenter', function() {
            // Lift, straighten, bring to front
            gsap.to(card, {
                rotation: 0,
                y: '-=0.12rem',
                scale: 1.04,
                zIndex: 200,
                duration: 0.45,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            // Hide other cards
            cards.forEach(function(other) {
                if (other !== card) {
                    gsap.to(other, { opacity: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
                }
            });
        });

        card.addEventListener('mouseleave', function() {
            // Return to fan position
            gsap.to(card, {
                rotation: baseRotation,
                y: baseY + 'rem',
                x: baseX + 'rem',
                scale: 1,
                zIndex: z,
                duration: 0.55,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            // Restore other cards
            cards.forEach(function(other) {
                if (other !== card) {
                    gsap.to(other, { opacity: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
                }
            });
        });
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
    var subtitleStr = item.subtitle || '';

    var subtitleHtml = subtitleStr ? '<p class="dw-detail-hero-sub">' + subtitleStr + '</p>' : '';

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
    var spacingMap = { small: '.08rem', medium: '.16rem', large: '.32rem' };
    var mediaGap = spacingMap[item.spacing] || '.16rem';
    if (contentImages.length > 0) {
        mediaHtml = '<div class="dw-detail-media" style="--dw-media-gap:' + mediaGap + '">';
        for (var mi = 0; mi < contentImages.length; mi++) {
            var src = contentImages[mi];
            var ytId = extractYouTubeId(src);
            if (ytId) {
                mediaHtml += '<div class="dw-detail-media-item dw-detail-media-youtube"><div class="yt-embed"><iframe src="https://www.youtube.com/embed/' + ytId + '?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>';
            } else if (src.indexOf('data:video') === 0 || src.match(/\.(mp4|webm|ogg|mov|avi|mkv)($|\?)/i)) {
                mediaHtml += '<div class="dw-detail-media-item"><video src="' + src + '" controls></video></div>';
            } else {
                mediaHtml += '<div class="dw-detail-media-item"><img src="' + src + '" alt=""></div>';
            }
        }
        mediaHtml += '</div>';
    }

    // Build body content based on descPosition
    var bodyTop = '', bodyBottom = '';
    if (item.descPosition === 'bottom') {
        bodyTop = mediaHtml + tagsHtml + likeHtml;
        bodyBottom = descHtml;
    } else {
        bodyTop = descHtml + mediaHtml;
        bodyBottom = tagsHtml + likeHtml;
    }

    return '<div class="dw-detail" id="dwDetail">' +
        '<button class="dw-detail-back" id="dwDetailBack">' +
        '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
        '</button>' +
        '<div class="dw-detail-hero">' +
        '<div class="dw-detail-hero-bg" style="background:' + heroBg + '"></div>' +
        '<div class="dw-detail-hero-mask"></div>' +
        '</div>' +
        '<div class="dw-detail-head">' +
        '<h2 class="dw-detail-hero-title">' + item.title + '</h2>' +
        subtitleHtml +
        '</div>' +
        '<div class="dw-detail-body">' +
        bodyTop + bodyBottom +
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
        // Bind fan card clicks
        document.querySelectorAll('.dw-fan-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var id = this.getAttribute('data-design-id');
                window.location.hash = '#/design-work/detail/' + id;
            });
        });
        // Legacy flat card clicks
        document.querySelectorAll('.dw-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var id = this.getAttribute('data-design-id');
                window.location.hash = '#/design-work/detail/' + id;
            });
        });
        // Trigger GSAP fan entrance + hover
        if (document.querySelector('.dw-fan-stage')) {
            animateFanEntrance();
            bindFanHover();
        }
    },
    bindList: function() { bindDesignWorkListClicks(); bindDesignWorkListPagination(); },
    resetCards: function() {},
    renderGuard: function() { return renderDesignGuard(); },
    bindGuard: function() { bindDesignGuard(); },
    isVerified: function() { return isDesignVerified(); }
};

})();
