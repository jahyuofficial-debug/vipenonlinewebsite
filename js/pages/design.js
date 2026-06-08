var DesignPage = (function() {
'use strict';

var dwZoomedCard = null;
var dwZoomedCardOriginalTransform = '';
var dwListPageSize = 6;
var dwListCurrentPage = 1;

function buildDesignWorkGrid() {
    var cards = dwItems.map(function(item, i) {
        var suit = dwSuits[i];
        var rank = dwRanks[i];
        var cardBg = item.cardBg ? 'url(' + item.cardBg + ') center/cover' : '#1a1a2e';
        return '<div class="dw-card" data-dw-id="' + i + '" id="dwCard' + i + '">' +
            '<div class="dw-card-img" style="background:' + cardBg + '"></div>' +
            '<div class="dw-card-mask"></div>' +
            '<span class="dw-card-corner">' + rank + suit + '</span>' +
            '<span class="dw-card-corner-bottom">' + rank + suit + '</span>' +
            '<span class="dw-card-suit">' + suit + '</span>' +
            '<div class="dw-card-content">' +
            '<p class="dw-card-cat">' + item.cat + '</p>' +
            '<h3 class="dw-card-title">' + item.title + '</h3>' +
            '<p class="dw-card-meta">' + item.year + ' &#183; ' + item.client + '</p>' +
            '</div></div>';
    }).join('');
    return '<section id="page-design-work" class="dw-page">' +
        '<div class="dw-card-preview" id="dwCardPreview">' +
        '<div class="dw-card-preview-bg" id="dwCardPreviewBg"></div>' +
        '</div>' +
        '<div class="dw-card-info" id="dwCardInfo">' +
        '<p class="dw-card-info-cat" id="dwCardInfoCat"></p>' +
        '<h3 class="dw-card-info-title" id="dwCardInfoTitle"></h3>' +
        '<p class="dw-card-info-meta" id="dwCardInfoMeta"></p>' +
        '</div>' +
        '<div class="dw-more-btn" id="dwMoreBtn">' +
        '<span class="dw-more-text">More</span>' +
        '<div class="dw-more-dots"><span></span><span></span><span></span></div>' +
        '</div>' +
        '<div class="dw-fan-container" id="dwFanContainer">' +
        '<div class="dw-fan" id="dwFan">' + cards + '</div>' +
        '</div>' +
        '<div class="dw-fan-overlay" id="dwFanOverlay"></div>' +
        '</section>';
}

function buildDesignWorkDetail(id) {
    var item = dwItems[id];
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
        descHtml +
        mediaHtml +
        tagsHtml +
        likeHtml +
        '<div class="dw-detail-meta">' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Client</p><p class="dw-detail-meta-value">' + clientStr + '</p></div>' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Published</p><p class="dw-detail-meta-value">' + publishedStr + '</p></div>' +
        '<div class="dw-detail-meta-item"><p class="dw-detail-meta-label">Tools</p><p class="dw-detail-meta-value">' + toolsStr + '</p></div>' +
        '</div></div></div>';
}

function buildDesignWorkListCards(page) {
    var start = (page - 1) * dwListPageSize;
    var end = start + dwListPageSize;
    var pageItems = dwItems.slice(start, end);
    return pageItems.map(function(item, i) {
        var realIndex = start + i;
        var thumbBg = item.cardBg ? 'url(' + item.cardBg + ') center/cover' : '#1a1a2e';
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
                    if (newBtns[index]) {
                        oldBtn.className = newBtns[index].className;
                    }
                });
            }
        });
    });
}

function positionFanCards() {
    var cards = document.querySelectorAll('.dw-card');
    var total = cards.length;
    var fanAngle = 60;
    var startAngle = -fanAngle / 2;
    var step = fanAngle / (total - 1);
    var radius = 3.2;

    cards.forEach(function(card, i) {
        var angle = startAngle + step * i;
        var rad = angle * Math.PI / 180;
        var x = Math.sin(rad) * radius;
        var y = (1 - Math.cos(rad)) * radius * 0.3;
        var transform = 'translate(' + x.toFixed(3) + 'rem, ' + y.toFixed(3) + 'rem) rotate(' + angle.toFixed(1) + 'deg)';
        card.style.transform = transform;
        card.setAttribute('data-fan-transform', transform);
    });
}

function bindDesignWorkCardClicks() {
    var cards = document.querySelectorAll('.dw-card');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            if (dwZoomedCard) return;
            var id = this.getAttribute('data-dw-id');
            zoomToCard(this, id);
        });
        card.addEventListener('mouseenter', function() {
            if (dwZoomedCard) return;
            var id = parseInt(this.getAttribute('data-dw-id'), 10);
            showCardPreview(id);
            liftCard(this);
        });
        card.addEventListener('mouseleave', function() {
            if (dwZoomedCard) return;
            hideCardPreview();
            unliftCard(this);
        });
    });

    var moreBtn = document.getElementById('dwMoreBtn');
    if (moreBtn) {
        moreBtn.addEventListener('click', function() {
            window.location.hash = '#/design-work-list';
        });
    }
}

function liftCard(card) {
    var fanTransform = card.getAttribute('data-fan-transform') || '';
    card.setAttribute('data-lift-transform', fanTransform);
    var lifted = fanTransform.replace(/rotate\(([^)]+)\)/, 'rotate($1) translateY(-.6rem) scale(1.08)');
    card.style.transform = lifted;
    card.style.zIndex = '100';
}

function unliftCard(card) {
    var fanTransform = card.getAttribute('data-fan-transform');
    if (fanTransform) {
        card.style.transform = fanTransform;
    }
    card.style.zIndex = '';
}

function showCardPreview(id) {
    var item = dwItems[id];
    if (!item) return;
    var preview = document.getElementById('dwCardPreview');
    var bg = document.getElementById('dwCardPreviewBg');
    var info = document.getElementById('dwCardInfo');
    var infoTitle = document.getElementById('dwCardInfoTitle');
    var infoCat = document.getElementById('dwCardInfoCat');
    var infoMeta = document.getElementById('dwCardInfoMeta');
    var moreBtn = document.getElementById('dwMoreBtn');
    if (!preview || !bg || !info || !infoTitle || !infoCat || !infoMeta) return;

    // Fullscreen hover background with 60% opacity + blur
    if (item.cardHoverBg) {
        bg.style.background = 'url(' + item.cardHoverBg + ') center/cover';
        bg.style.opacity = '0.6';
        bg.style.filter = 'blur(12px)';
    } else {
        bg.style.background = '#000';
        bg.style.opacity = '1';
        bg.style.filter = 'none';
    }
    infoTitle.textContent = item.title;
    infoCat.textContent = item.cat;
    infoMeta.textContent = (item.published || '') + '  ' + (item.client || '');
    preview.classList.add('active');
    info.classList.add('active');
    if (moreBtn) moreBtn.classList.add('hidden');
}

function hideCardPreview() {
    var preview = document.getElementById('dwCardPreview');
    var info = document.getElementById('dwCardInfo');
    var moreBtn = document.getElementById('dwMoreBtn');
    var bg = document.getElementById('dwCardPreviewBg');
    if (preview) preview.classList.remove('active');
    if (info) info.classList.remove('active');
    if (moreBtn) moreBtn.classList.remove('hidden');
    if (bg) { bg.style.opacity = '1'; bg.style.filter = 'none'; }
}

function zoomToCard(card, id) {
    dwZoomedCard = card;
    var overlay = document.getElementById('dwFanOverlay');
    if (overlay) overlay.classList.add('active');

    var rect = card.getBoundingClientRect();
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    var cardCenterX = rect.left + rect.width / 2;
    var cardCenterY = rect.top + rect.height / 2;

    var scaleX = window.innerWidth / rect.width * 0.85;
    var scaleY = window.innerHeight / rect.height * 0.85;
    var scale = Math.min(scaleX, scaleY);

    var translateX = centerX - cardCenterX;
    var translateY = centerY - cardCenterY;

    dwZoomedCardOriginalTransform = card.getAttribute('data-fan-transform') || card.style.transform;

    card.classList.add('zoomed');
    card.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ') rotate(0deg)';
    card.style.left = rect.left + 'px';
    card.style.top = rect.top + 'px';

    setTimeout(function() {
        window.location.hash = '#/design-work/detail/' + id;
        dwZoomedCard = null;
    }, 700);
}

function resetFanCards() {
    var cards = document.querySelectorAll('.dw-card');
    cards.forEach(function(card) {
        card.classList.remove('zoomed');
        card.style.left = '';
        card.style.top = '';
        var fanTransform = card.getAttribute('data-fan-transform');
        if (fanTransform) {
            card.style.transform = fanTransform;
        }
    });
    var overlay = document.getElementById('dwFanOverlay');
    if (overlay) overlay.classList.remove('active');
}

var designGuardStep = 1;
var designGuardLevels = [];

function loadDesignGuard() {
    var raw = localStorage.getItem('vipen_design_guard');
    if (raw) {
        try { designGuardLevels = JSON.parse(raw); } catch(e) { designGuardLevels = []; }
    }
    if (!designGuardLevels || !designGuardLevels.level1) {
        designGuardLevels = {
            level1: { type: 'pin', answer: '', hint: '' },
            level2: { type: 'text', answer: '', hint: '' },
            level3: { type: 'none', answer: '', hint: '' }
        };
    }
}

function getCurrentLevelConfig() {
    return designGuardLevels['level' + designGuardStep] || { type: 'none', answer: '', hint: '' };
}

function shakeInput(el) {
    el.classList.add('dw-guard-shake');
    el.classList.add('dw-guard-error-border');
    setTimeout(function() {
        el.classList.remove('dw-guard-shake');
    }, 500);
    setTimeout(function() {
        el.classList.remove('dw-guard-error-border');
    }, 2000);
}

function renderDesignGuard() {
    loadDesignGuard();
    var cfg = getCurrentLevelConfig();
    var isPin = cfg.type === 'pin';
    var hint = cfg.hint || '';
    var placeholder = hint || 'Enter answer';
    if (!hint) {
        if (isPin) placeholder = 'Enter PIN';
        else if (cfg.type === 'text') placeholder = 'Enter answer';
        else placeholder = 'Press Enter to continue';
    }

    var html = '<div class="dw-guard-overlay" id="dwGuardOverlay" style="background:url(\'images/PIN验证.png\') center/cover no-repeat">' +
        '<button class="dw-guard-back" id="dwGuardBack">' +
        '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
        '</button>' +
        '<div class="dw-guard-step-indicator" id="dwGuardSteps">' +
        buildGuardStepDots() +
        '</div>' +
        '<div class="dw-guard-input-wrap">' +
        '<input type="' + (isPin ? 'password' : 'text') + '" class="dw-guard-input" id="dwGuardInput" placeholder="' + placeholder + '" maxlength="' + (isPin ? '6' : '50') + '"' + (isPin ? ' inputmode="numeric"' : '') + ' autocomplete="off">' +
        '</div></div>';
    return html;
}

function buildGuardStepDots() {
    var html = '';
    for (var i = 1; i <= 3; i++) {
        var cfg = designGuardLevels['level' + i] || { type: 'none', answer: '' };
        if (cfg.type === 'none' && (!cfg.answer)) {
            html += '<span class="dw-guard-step-dot skip" title="No answer required">' + i + '</span>';
        } else {
            html += '<span class="dw-guard-step-dot">' + i + '</span>';
        }
    }
    return html;
}

function bindDesignGuard() {
    designGuardStep = 1;
    loadDesignGuard();

    var backBtn = document.getElementById('dwGuardBack');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.history.back();
        });
    }

    var input = document.getElementById('dwGuardInput');
    if (!input) return;

    function updateStepUI() {
        var cfg = getCurrentLevelConfig();
        var isPin = cfg.type === 'pin';
        var isNone = cfg.type === 'none';
        var hint = cfg.hint || '';
        if (isNone) {
            input.placeholder = hint || 'Press Enter to continue';
            input.type = 'text';
            input.maxLength = 50;
            input.removeAttribute('inputmode');
        } else if (isPin) {
            input.placeholder = hint || 'Enter PIN';
            input.type = 'password';
            input.maxLength = 6;
            input.setAttribute('inputmode', 'numeric');
        } else {
            input.placeholder = hint || 'Enter answer';
            input.type = 'text';
            input.maxLength = 50;
            input.removeAttribute('inputmode');
        }
        input.value = '';

        var dots = document.querySelectorAll('.dw-guard-step-dot');
        dots.forEach(function(dot, i) {
            dot.classList.remove('active', 'done');
            if (i + 1 === designGuardStep) dot.classList.add('active');
            if (i + 1 < designGuardStep) dot.classList.add('done');
        });
    }

    updateStepUI();

    function checkStep() {
        var cfg = getCurrentLevelConfig();
        var val = input.value.trim();

        if (cfg.type === 'none') {
            designGuardStep++;
            if (designGuardStep > 3) {
                finishGuard();
            } else {
                updateStepUI();
            }
            return;
        }

        if (cfg.type === 'pin') {
            if (val.length !== 6 || !/^\d{6}$/.test(val)) {
                shakeInput(input);
                return;
            }
        } else {
            if (!val) {
                shakeInput(input);
                return;
            }
        }

        if (cfg.answer && val !== cfg.answer) {
            shakeInput(input);
            return;
        }

        designGuardStep++;
        if (designGuardStep > 3) {
            finishGuard();
        } else {
            updateStepUI();
        }
    }

    function finishGuard() {
        sessionStorage.setItem('design_verified', 'true');
        var overlay = document.getElementById('dwGuardOverlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.remove();
        }
        var currentHash = window.location.hash;
        if (currentHash) {
            window.location.hash = '';
            setTimeout(function() {
                window.location.hash = currentHash;
            }, 0);
        }
    }

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkStep();
        }
    });
}

function isDesignVerified() {
    // Cloudflare Pages static site: Design works are publicly viewable
    return true;
    // Auth-based management only on local server (node server.js)
    // var auth = Utils.getAuth();
    // if (auth && auth.role === 'ManagerGo') return true;
    // var userData = Utils.getUserData('user');
    // if (userData && userData.role === 'ManagerGo') return true;
    // if (auth && auth.email === 'riverjia9527@gmail.com') return true;
    // return sessionStorage.getItem('design_verified') === 'true';
}

return {
    buildGrid: function() { return buildDesignWorkGrid(); },
    buildDetail: function(id) { return buildDesignWorkDetail(id); },
    buildList: function() { return buildDesignWorkList(); },
    bindGrid: function() {
        positionFanCards();
        bindDesignWorkCardClicks();
    },
    bindList: function() {
        bindDesignWorkListClicks();
        bindDesignWorkListPagination();
    },
    resetCards: function() { resetFanCards(); },
    renderGuard: function() { return renderDesignGuard(); },
    bindGuard: function() { bindDesignGuard(); },
    isVerified: function() { return isDesignVerified(); }
};

})();