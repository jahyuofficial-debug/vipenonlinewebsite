var FreshPage = (function() {
'use strict';

var heroGroups = [];
var categories = [];
var items = [];
var heroCurrent = 0;
var heroInterval = null;
var heroAnimating = false;
var activeTab = 'all';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function buildFreshTabs(activeKey) {
    return categories.map(function(cat) {
        var count = cat.key === 'all' ? items.length : items.filter(function(item) { return item.cat === cat.key; }).length;
        return '<button class="fresh-tab' + (cat.key === activeKey ? ' active' : '') + '" data-fresh-tab="' + cat.key + '">' + cat.label + '<span class="fresh-tab-count">' + count + '</span></button>';
    }).join('');
}

function buildFreshArticles(activeKey) {
    var filtered = activeKey === 'all' ? items : items.filter(function(item) { return item.cat === activeKey; });
    if (filtered.length === 0) {
        return '<div class="fresh-empty"><h3 class="fresh-empty-title">No Articles</h3><p class="fresh-empty-desc">Check back soon for updates in this category.</p></div>';
    }
    return filtered.map(function(item) {
        var hasCover = item.image ? true : false;
        var coverHtml = hasCover ? '<div class="fresh-article-cover"><img src="' + item.image + '" alt="" loading="lazy" onerror="this.parentNode.style.display=\'none\'"></div>' : '';
        var metaParts = [];
        if (item.date) metaParts.push('<span class="fresh-article-date">' + item.date + '</span>');
        if (item.readTime) metaParts.push('<span class="fresh-article-readtime">' + item.readTime + '</span>');
        var metaHtml = metaParts.length > 0 ? '<div class="fresh-article-meta">' + metaParts.join('') + '</div>' : '';
        return '<div class="fresh-article' + (hasCover ? ' has-cover' : '') + '" data-fresh-id="' + item.id + '">' +
            coverHtml +
            '<div class="fresh-article-body">' +
            '<div class="fresh-article-top">' +
            '<span class="fresh-article-cat">' + item.cat.toUpperCase() + '</span>' +
            metaHtml +
            '</div>' +
            '<h3 class="fresh-article-headline">' + item.headline + '</h3>' +
            (item.summary ? '<p class="fresh-article-summary">' + item.summary + '</p>' : '') +
            '</div></div>';
    }).join('');
}

function buildFreshHeroCarousel() {
    var slides = heroGroups.map(function(group, i) {
        var h = group.headline || {};
        var s = group.spot || {};
        var hotNews = group.hotNews || [];
        var hotNewsHtml = hotNews.map(function(n, idx) {
            return '<div class="fresh-hero-news-item" data-group-idx="' + i + '" data-news-idx="' + idx + '">' +
                '<span class="fresh-hero-news-text">' + n.title + '</span>' +
                '<span class="fresh-hero-news-date">' + n.date + '</span>' +
                '</div>';
        }).join('');

        var spotStyle = s.bgColor ? ' style="background:' + s.bgColor + '"' : '';

        return '<div class="fresh-hero-slide' + (i === 0 ? ' active' : '') + '" data-fresh-hero="' + i + '">' +
            '<div class="fresh-hero-bg" data-fresh-hero-bg="' + i + '" style="background-image:url(' + h.bgImage + ')"></div>' +
            '<div class="fresh-hero-mask"></div>' +
            '<div class="fresh-hero-content">' +
            '<h2 class="fresh-hero-main-title">' + h.mainTitle + '</h2>' +
            '<p class="fresh-hero-sub-title">' + h.subTitle + '</p>' +
            '</div>' +
            '<div class="fresh-hero-panel">' +
            '<div class="fresh-hero-card" data-fresh-hero-spot="' + i + '"' + spotStyle + '>' +
            '<span class="fresh-hero-card-tag">' + (s.tag || '') + '</span>' +
            '<h3 class="fresh-hero-card-title">' + (s.title || '') + '</h3>' +
            '<p class="fresh-hero-card-desc">' + (s.summary || '') + '</p>' +
            '</div>' +
            '<div class="fresh-hero-news">' + hotNewsHtml + '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    var dots = heroGroups.map(function(item, i) {
        return '<span class="fresh-hero-dot' + (i === 0 ? ' active' : '') + '" data-fresh-hero-dot="' + i + '"></span>';
    }).join('');

    return '<div class="fresh-hero-carousel" id="freshHeroCarousel">' +
        slides +
        '<button class="fresh-carousel-arrow fresh-carousel-prev" id="freshCarouselPrev" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button class="fresh-carousel-arrow fresh-carousel-next" id="freshCarouselNext" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></button>' +
        '</div>';
}

function buildFreshPage(activeKey) {
    var hero = buildFreshHeroCarousel();
    return '<section id="page-fresh" class="fresh-page">' +
        hero +
        '</section>';
}

function buildFreshDetailHtml(item) {
    var bodyHtml = item.body || '';
    var imageHtml = item.image ? '<img class="fresh-detail-image" src="' + item.image + '" alt="">' : '';
    var likeCount = item.likeCount || 0;
    var isLiked = item.isLiked || false;
    var commentCount = item.commentCount || 0;
    var comments = item.comments || [];
    var likeClass = isLiked ? ' liked' : '';
    var likeFill = isLiked ? ' fill="#ed4956" stroke="#ed4956"' : ' fill="none" stroke="currentColor"';
    var commentsHtml = comments.map(function(c) {
        return '<div class="fresh-detail-comment-item">' +
            '<div class="fresh-detail-comment-avatar" style="background:' + (c.avatarBg || '#6366f1') + '">' + (c.initial || c.user.charAt(0)) + '</div>' +
            '<div class="fresh-detail-comment-main">' +
            '<div class="fresh-detail-comment-user">' + c.user + '</div>' +
            '<div class="fresh-detail-comment-text">' + c.text + '</div>' +
            '</div></div>';
    }).join('');
    var translateBtn = '<button class="fresh-detail-translate" id="freshDetailTranslate" title="Switch Language">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="m5 8 6 6"/>' +
        '<path d="m4 14 6-6 2-3"/>' +
        '<path d="M2 5h12"/>' +
        '<path d="M7 2h1"/>' +
        '<path d="m22 22-5-10-5 10"/>' +
        '<path d="M14 18h6"/>' +
        '</svg></button>';
    var headlineZh = item.headline || '';
    var headlineEn = item.headlineEn || '';
    var summaryZh = item.summary || '';
    var summaryEn = item.summaryEn || '';
    var bodyZh = bodyHtml || '';
    var bodyEn = item.bodyEn || '';
    var displayHeadline = currentLang === 'en' && headlineEn ? headlineEn : headlineZh;
    var displaySummary = currentLang === 'en' && summaryEn ? summaryEn : summaryZh;
    var displayBody = currentLang === 'en' && bodyEn ? bodyEn : bodyZh;
    return '<div class="fresh-detail" id="freshDetail" data-headline-zh="' + escapeHtml(headlineZh) + '" data-headline-en="' + escapeHtml(headlineEn) + '" data-summary-zh="' + escapeHtml(summaryZh) + '" data-summary-en="' + escapeHtml(summaryEn) + '" data-body-zh="' + escapeHtml(bodyZh) + '" data-body-en="' + escapeHtml(bodyEn) + '">' +
        '<button class="fresh-detail-back" id="freshDetailBack">' +
        '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
        '</button>' +
        '<div class="fresh-detail-inner">' +
        '<div class="fresh-detail-header">' +
        '<div class="fresh-detail-brand">Vipen</div>' +
        '<div class="fresh-detail-title-row">' +
        '<h1 class="fresh-detail-title" id="freshDetailTitle">' + displayHeadline + '</h1>' +
        translateBtn +
        '</div>' +
        '<p class="fresh-detail-subtitle" id="freshDetailSubtitle">' + displaySummary + '</p>' +
        '<div class="fresh-detail-meta-row">' +
        '<div class="fresh-detail-meta-avatar" style="background:' + item.authorBg + '">' + item.authorInitial + '</div>' +
        '<span class="fresh-detail-meta-name">' + item.author + '</span>' +
        '<span class="fresh-detail-meta-date">' + item.date + '</span>' +
        '</div></div>' +
        '<div class="fresh-detail-body">' +
        imageHtml +
        '<div class="fresh-detail-text" id="freshDetailBody">' + displayBody + '</div>' +
        '</div></div></div>';
}

function buildFreshDetail(id) {
    var item = items[id];
    if (!item) return '';
    return buildFreshDetailHtml({
        headline: item.headline,
        headlineEn: item.headlineEn || '',
        summary: item.summary,
        summaryEn: item.summaryEn || '',
        body: item.body || '',
        bodyEn: item.bodyEn || '',
        image: item.image || '',
        date: item.date,
        author: item.author,
        authorInitial: item.authorInitial,
        authorBg: item.authorBg,
        readTime: item.readTime
    });
}

function goToFreshSlide(index) {
    if (heroAnimating) return;
    var total = heroGroups.length;
    var newIndex = (typeof index === 'number') ? index : ((heroCurrent + index + total) % total);
    if (newIndex === heroCurrent) return;
    heroAnimating = true;

    var slides = document.querySelectorAll('.fresh-hero-slide');
    slides.forEach(function(slide, i) {
        if (i === newIndex) slide.classList.add('active');
        else slide.classList.remove('active');
    });

    heroCurrent = newIndex;

    setTimeout(function() {
        heroAnimating = false;
    }, 800);
}

function initFreshCarousel() {
    heroCurrent = 0;
    heroAnimating = false;

    // Arrow navigation
    var prevBtn = document.getElementById('freshCarouselPrev');
    var nextBtn = document.getElementById('freshCarouselNext');
    if (prevBtn) prevBtn.addEventListener('click', function() { goToFreshSlide(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goToFreshSlide(1); });

    // Hover detection — show arrow on the side being hovered
    var carousel = document.getElementById('freshHeroCarousel');
    if (carousel) {
        carousel.addEventListener('mousemove', function(e) {
            var rect = carousel.getBoundingClientRect();
            var x = e.clientX - rect.left;
            if (x < rect.width * 0.3) {
                carousel.classList.add('show-prev');
                carousel.classList.remove('show-next');
            } else if (x > rect.width * 0.7) {
                carousel.classList.add('show-next');
                carousel.classList.remove('show-prev');
            }
        });
        carousel.addEventListener('mouseleave', function() {
            carousel.classList.remove('show-prev', 'show-next');
        });
    }

    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(function() { goToFreshSlide(1); }, 5000);
}

function bindFreshTabClicks() {
    var tabs = document.querySelectorAll('.fresh-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var key = this.getAttribute('data-fresh-tab');
            activeTab = key;
            var articleList = document.getElementById('freshArticleList');
            var tabsContainer = document.getElementById('freshTabs');
            if (articleList) articleList.innerHTML = buildFreshArticles(key);
            if (tabsContainer) tabsContainer.innerHTML = buildFreshTabs(key);
            bindFreshTabClicks();
            bindFreshArticleClicks();
        });
    });
}

function bindFreshArticleClicks() {
    var articles = document.querySelectorAll('.fresh-article');
    articles.forEach(function(article) {
        article.addEventListener('click', function() {
            var id = parseInt(this.getAttribute('data-fresh-id'), 10);
            window.location.hash = '#/fresh/detail/' + id;
        });
    });
}

function bindFreshHeroClicks() {
    var bgDivs = document.querySelectorAll('[data-fresh-hero-bg]');
    bgDivs.forEach(function(bg) {
        bg.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-fresh-hero-bg'), 10);
            var group = heroGroups[idx];
            if (group && group.headline) {
                window.location.hash = '#/fresh/detail/h/' + idx;
            }
        });
    });

    var cards = document.querySelectorAll('[data-fresh-hero-spot]');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-fresh-hero-spot'), 10);
            var group = heroGroups[idx];
            if (group && group.spot) {
                window.location.hash = '#/fresh/detail/s/' + idx;
            }
        });
    });

    var newsItems = document.querySelectorAll('.fresh-hero-news-item');
    newsItems.forEach(function(news) {
        news.addEventListener('click', function() {
            var groupIdx = parseInt(this.getAttribute('data-group-idx'), 10);
            var newsIdx = parseInt(this.getAttribute('data-news-idx'), 10);
            window.location.hash = '#/fresh/detail/n/' + groupIdx + '/' + newsIdx;
        });
    });

    var contentAreas = document.querySelectorAll('.fresh-hero-content');
    contentAreas.forEach(function(content) {
        content.addEventListener('click', function() {
            var slide = content.closest('.fresh-hero-slide');
            if (!slide) return;
            var idx = parseInt(slide.getAttribute('data-fresh-hero'), 10);
            var group = heroGroups[idx];
            if (group && group.headline) {
                window.location.hash = '#/fresh/detail/h/' + idx;
            }
        });
    });
}

var currentLang = localStorage.getItem('vipen_fresh_lang') || 'zh';

function getHeroDetailData(groupIdx) {
    var group = heroGroups[groupIdx];
    if (!group || !group.headline) return null;
    var h = group.headline;
    var isEn = currentLang === 'en';
    return {
        headline: isEn && h.mainTitleEn ? h.mainTitleEn : h.mainTitle,
        headlineEn: h.mainTitleEn || '',
        summary: isEn && h.subTitleEn ? h.subTitleEn : h.subTitle,
        summaryEn: h.subTitleEn || '',
        body: isEn && h.bodyEn ? h.bodyEn : (h.body || ''),
        bodyEn: h.bodyEn || '',
        image: h.titleImage || '',
        date: 'Headline',
        author: 'Vipen',
        authorInitial: 'V',
        authorBg: '#6366f1',
        readTime: ''
    };
}

function getHotNewsDetailData(groupIdx, newsIdx) {
    var group = heroGroups[groupIdx];
    if (!group || !group.hotNews || !group.hotNews[newsIdx]) return null;
    var n = group.hotNews[newsIdx];
    var isEn = currentLang === 'en';
    return {
        headline: isEn && n.titleEn ? n.titleEn : n.title,
        headlineEn: n.titleEn || '',
        summary: isEn && n.summaryEn ? n.summaryEn : (n.summary || ''),
        summaryEn: n.summaryEn || '',
        body: isEn && n.bodyEn ? n.bodyEn : (n.body || ''),
        bodyEn: n.bodyEn || '',
        image: n.image || '',
        date: n.date || '',
        author: 'Vipen',
        authorInitial: 'V',
        authorBg: '#6366f1',
        readTime: ''
    };
}

function getSpotDetailData(groupIdx) {
    var group = heroGroups[groupIdx];
    if (!group || !group.spot) return null;
    var s = group.spot;
    var isEn = currentLang === 'en';
    return {
        headline: isEn && s.titleEn ? s.titleEn : s.title,
        headlineEn: s.titleEn || '',
        summary: isEn && s.summaryEn ? s.summaryEn : (s.summary || ''),
        summaryEn: s.summaryEn || '',
        body: isEn && s.bodyEn ? s.bodyEn : (s.body || ''),
        bodyEn: s.bodyEn || '',
        image: s.image || '',
        date: s.date || '',
        author: 'Vipen',
        authorInitial: 'V',
        authorBg: '#6366f1',
        readTime: ''
    };
}

function toggleDetailLang() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('vipen_fresh_lang', currentLang);
    var titleEl = document.getElementById('freshDetailTitle');
    var subtitleEl = document.getElementById('freshDetailSubtitle');
    var bodyEl = document.getElementById('freshDetailBody');
    var detail = document.getElementById('freshDetail');
    if (!detail) return;
    var headlineZh = detail.getAttribute('data-headline-zh');
    var headlineEn = detail.getAttribute('data-headline-en');
    var summaryZh = detail.getAttribute('data-summary-zh');
    var summaryEn = detail.getAttribute('data-summary-en');
    var bodyZh = detail.getAttribute('data-body-zh');
    var bodyEn = detail.getAttribute('data-body-en');
    if (titleEl && headlineEn) {
        titleEl.textContent = currentLang === 'en' && headlineEn ? headlineEn : headlineZh;
    }
    if (subtitleEl && summaryEn) {
        subtitleEl.textContent = currentLang === 'en' && summaryEn ? summaryEn : summaryZh;
    }
    if (bodyEl && bodyEn) {
        bodyEl.innerHTML = currentLang === 'en' && bodyEn ? bodyEn : bodyZh;
    }
}

function bindTranslateBtn() {
    var btn = document.getElementById('freshDetailTranslate');
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        toggleDetailLang();
    });
}

return {
    buildPage: function(activeKey) { return buildFreshPage(activeKey); },
    buildDetail: function(id) { return buildFreshDetail(id); },
    buildHeroDetail: function(groupIdx) {
        var data = getHeroDetailData(groupIdx);
        if (!data) return '';
        return buildFreshDetailHtml(data);
    },
    buildHotNewsDetail: function(groupIdx, newsIdx) {
        var data = getHotNewsDetailData(groupIdx, newsIdx);
        if (!data) return '';
        return buildFreshDetailHtml(data);
    },
    buildSpotDetail: function(groupIdx) {
        var data = getSpotDetailData(groupIdx);
        if (!data) return '';
        return buildFreshDetailHtml(data);
    },
    bindAll: function() {
        initFreshCarousel();
        bindFreshHeroClicks();
    },
    bindTranslate: function() { bindTranslateBtn(); },
    initCarousel: function() { initFreshCarousel(); },
    goToSlide: function(idx) { goToFreshSlide(idx); },
    getHeroCurrent: function() { return heroCurrent; },
    getCurrentLang: function() { return currentLang; },
    setData: function(data) {
        if (data.heroGroups) heroGroups = data.heroGroups;
        if (data.categories) categories = data.categories;
        if (data.items) items = data.items;
    }
};

})();