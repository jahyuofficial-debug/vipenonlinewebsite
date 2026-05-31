var FreshPage = (function() {
'use strict';

var heroItems = [];
var categories = [];
var items = [];
var heroCurrent = 0;
var heroInterval = null;
var heroAnimating = false;
var activeTab = 'all';

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
        return '<div class="fresh-article" data-fresh-id="' + item.id + '">' +
            '<div class="fresh-article-inner">' +
            '<span class="fresh-article-cat">' + item.cat.toUpperCase() + '</span>' +
            '<div class="fresh-article-body">' +
            '<h3 class="fresh-article-headline">' + item.headline + '</h3>' +
            '</div>' +
            '</div></div>';
    }).join('');
}

function buildFreshHeroCarousel() {
    var slides = heroItems.map(function(item) {
        return '<div class="fresh-hero-slide' + (item.id === 0 ? ' active' : '') + '" data-fresh-hero="' + item.id + '">' +
            '<div class="fresh-hero-bg" data-fresh-hero-bg="' + item.id + '" style="background-image:url(' + item.bgImage + ')"></div>' +
            '<div class="fresh-hero-mask"></div>' +
            '<div class="fresh-hero-content" data-fresh-hero-main="' + item.id + '">' +
            '<h2 class="fresh-hero-main-title">' + item.mainTitle + '</h2>' +
            '<p class="fresh-hero-sub-title">' + item.subTitle + '</p>' +
            '</div>' +
            '<div class="fresh-hero-panel">' +
            '<div class="fresh-hero-card" data-fresh-hero-card="' + item.id + '">' +
            '<span class="fresh-hero-card-tag">' + item.cardTag + '</span>' +
            '<h3 class="fresh-hero-card-title">' + item.cardTitle + '</h3>' +
            '<p class="fresh-hero-card-desc">' + item.cardDesc + '</p>' +
            '</div>' +
            '<div class="fresh-hero-news">' +
            item.newsItems.map(function(n, idx) {
                return '<div class="fresh-hero-news-item" data-fresh-hero-news="' + item.id + '" data-news-idx="' + idx + '"><span class="fresh-hero-news-text">' + n.text + '</span><span class="fresh-hero-news-date">' + n.date + '</span></div>';
            }).join('') +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    var dots = heroItems.map(function(item, i) {
        return '<span class="fresh-hero-dot' + (i === 0 ? ' active' : '') + '" data-fresh-hero-dot="' + i + '"></span>';
    }).join('');

    return '<div class="fresh-hero-carousel" id="freshHeroCarousel">' +
        slides +
        '<div class="fresh-hero-dots" id="freshHeroDots">' + dots + '</div>' +
        '</div>';
}

function buildFreshPage(activeKey) {
    var hero = buildFreshHeroCarousel();
    var tabs = buildFreshTabs(activeKey);
    var articles = buildFreshArticles(activeKey);
    return '<section id="page-fresh" class="fresh-page">' +
        hero +
        '<div class="fresh-section">' +
        '<h2 class="fresh-section-title">Latest Articles</h2>' +
        '<div class="fresh-tabs" id="freshTabs">' + tabs + '</div>' +
        '<div class="fresh-article-list" id="freshArticleList">' + articles + '</div>' +
        '</div>' +
        '</section>';
}

function buildFreshDetail(id) {
    var item = items[id];
    var likeCount = item.likeCount || 0;
    var isLiked = item.isLiked || false;
    var commentCount = item.commentCount || 0;
    var comments = item.comments || [];
    var bodyText = item.body.replace(/<\/?p>/g, '').split(' ').filter(function(s) { return s.trim(); }).map(function(s) {
        return '<p>' + s.trim() + '';
    }).join('');
    if (!bodyText) bodyText = item.body;
    var imageHtml = item.image ? '<img class="fresh-detail-image" src="' + item.image + '" alt="">' : '';
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
    return '<div class="fresh-detail" id="freshDetail">' +
        '<button class="fresh-detail-back" id="freshDetailBack">' +
        '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
        '</button>' +
        '<button class="fresh-detail-share" id="freshDetailShare" data-fresh-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
        '</button>' +
        '<div class="fresh-detail-inner">' +
        '<div class="fresh-detail-header">' +
        '<div class="fresh-detail-brand">Vipen</div>' +
        '<h1 class="fresh-detail-title">' + item.headline + '</h1>' +
        '<p class="fresh-detail-subtitle">' + item.summary + '</p>' +
        '<div class="fresh-detail-meta-row">' +
        '<div class="fresh-detail-meta-avatar" style="background:' + item.authorBg + '">' + item.authorInitial + '</div>' +
        '<span class="fresh-detail-meta-name">' + item.author + '</span>' +
        '' +
        '<span class="fresh-detail-meta-date">' + item.date + '</span>' +
        '' +
        '<span class="fresh-detail-meta-readtime">' + item.readTime + ' read</span>' +
        '</div></div>' +
        '<div class="fresh-detail-body">' +
        imageHtml +
        '<div class="fresh-detail-text">' + bodyText + '</div>' +
        '<div class="fresh-detail-like-area">' +
        '<button class="fresh-detail-like-btn' + likeClass + '" id="freshDetailLikeBtn" data-fresh-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" ' + likeFill + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '<span class="fresh-detail-like-count" id="freshDetailLikeCount">' + likeCount + '</span>' +
        '</button>' +
        '<button class="fresh-detail-comment-btn" id="freshDetailCommentBtn" data-fresh-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '<span class="fresh-detail-comment-count" id="freshDetailCommentCount">' + commentCount + '</span>' +
        '</button></div>' +
        '<div class="fresh-detail-comments" id="freshDetailComments" style="display:none;">' +
        '<div class="fresh-detail-comment-list" id="freshDetailCommentList">' + commentsHtml + '</div>' +
        '<div class="fresh-detail-comment-input-area">' +
        '<input type="text" class="fresh-detail-comment-input" id="freshDetailCommentInput" placeholder="Write a comment...">' +
        '<button class="fresh-detail-comment-submit" id="freshDetailCommentSubmit">Post</button>' +
        '</div></div>' +
        '</div></div></div>';
}

function goToFreshSlide(index) {
    if (heroAnimating) return;
    var total = heroItems.length;
    var newIndex = (typeof index === 'number') ? index : ((heroCurrent + index + total) % total);
    if (newIndex === heroCurrent) return;
    heroAnimating = true;

    var slides = document.querySelectorAll('.fresh-hero-slide');
    var dots = document.querySelectorAll('.fresh-hero-dot');

    slides.forEach(function(slide, i) {
        if (i === newIndex) slide.classList.add('active');
        else slide.classList.remove('active');
    });

    dots.forEach(function(dot, i) {
        if (i === newIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    heroCurrent = newIndex;

    setTimeout(function() {
        heroAnimating = false;
    }, 800);
}

function initFreshCarousel() {
    heroCurrent = 0;
    heroAnimating = false;

    var dots = document.querySelectorAll('.fresh-hero-dot');
    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-fresh-hero-dot'), 10);
            goToFreshSlide(idx);
        });
        dot.addEventListener('mouseenter', function() {
            var idx = parseInt(this.getAttribute('data-fresh-hero-dot'), 10);
            goToFreshSlide(idx);
        });
    });

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
            var heroId = parseInt(this.getAttribute('data-fresh-hero-bg'), 10);
            var heroItem = heroItems[heroId];
            if (heroItem && heroItem.id !== undefined) {
                window.location.hash = '#/fresh/detail/' + heroItem.id;
            }
        });
    });

    var mainContents = document.querySelectorAll('[data-fresh-hero-main]');
    mainContents.forEach(function(el) {
        el.addEventListener('click', function() {
            var heroId = parseInt(this.getAttribute('data-fresh-hero-main'), 10);
            var heroItem = heroItems[heroId];
            if (heroItem && heroItem.id !== undefined) {
                window.location.hash = '#/fresh/detail/' + heroItem.id;
            }
        });
    });

    var cards = document.querySelectorAll('[data-fresh-hero-card]');
    cards.forEach(function(card) {
        card.addEventListener('click', function() {
            var heroId = parseInt(this.getAttribute('data-fresh-hero-card'), 10);
            var heroItem = heroItems[heroId];
            if (heroItem && heroItem.id !== undefined) {
                window.location.hash = '#/fresh/detail/' + heroItem.id;
            }
        });
    });

    var newsItems = document.querySelectorAll('[data-fresh-hero-news]');
    newsItems.forEach(function(news) {
        news.addEventListener('click', function() {
            var heroId = parseInt(this.getAttribute('data-fresh-hero-news'), 10);
            var newsIdx = parseInt(this.getAttribute('data-news-idx'), 10);
            var heroItem = heroItems[heroId];
            if (heroItem && heroItem.id !== undefined) {
                var targetId = (heroItem.id + newsIdx + 1) % items.length;
                window.location.hash = '#/fresh/detail/' + targetId;
            }
        });
    });
}

return {
    buildPage: function(activeKey) { return buildFreshPage(activeKey); },
    buildDetail: function(id) { return buildFreshDetail(id); },
    bindAll: function() {
        initFreshCarousel();
        bindFreshTabClicks();
        bindFreshArticleClicks();
        bindFreshHeroClicks();
    },
    initCarousel: function() { initFreshCarousel(); },
    goToSlide: function(idx) { goToFreshSlide(idx); },
    getHeroCurrent: function() { return heroCurrent; },
    setData: function(data) {
        if (data.heroItems) heroItems = data.heroItems;
        if (data.categories) categories = data.categories;
        if (data.items) items = data.items;
    }
};

})();