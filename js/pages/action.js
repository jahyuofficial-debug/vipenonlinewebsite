var ActionPage = (function() {

var actionLightboxCurrentPost = null;
var actionLightboxCurrentIndex = 0;
var actionKeydownBound = false;

function getMergedActionFeed() {
    var feed = (window.actionFeed || []).slice();
    var globalActions = (typeof Utils !== 'undefined' && Utils.getGlobalData) ? (Utils.getGlobalData('actions') || []) : [];
    globalActions.forEach(function(ga) {
        if (ga.hidden) return;
        var exists = feed.find(function(f) { return f.id === ga.id; });
        if (!exists) {
            feed.unshift({
                id: ga.id,
                username: ga.author || 'User',
                avatar: ga.avatar || '',
                images: ga.images || [],
                caption: ga.content || '',
                likes: 0,
                comments: 0,
                timeAgo: (typeof Utils !== 'undefined' && Utils.getRelativeTime) ? Utils.getRelativeTime(ga.publishedAt) : 'recently',
                isLiked: false,
                commentList: [],
                userId: ga.userId,
                isUserAction: true
            });
        }
    });
    // Sort by publish time, newest first (最近 → 最远)
    feed.sort(function(a, b) {
        var ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        var tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        // Fallback: if no publishedAt, try parsing timeAgo string (e.g. "2026/07/05")
        if (!ta && a.timeAgo) { var da = new Date(String(a.timeAgo).replace(/\//g, '-')); if (!isNaN(da)) ta = da.getTime(); }
        if (!tb && b.timeAgo) { var db = new Date(String(b.timeAgo).replace(/\//g, '-')); if (!isNaN(db)) tb = db.getTime(); }
        if (isNaN(ta)) ta = 0;
        if (isNaN(tb)) tb = 0;
        return tb - ta;
    });
    return feed;
}

function isOwner(post) {
    var userId = (typeof Utils !== 'undefined' && Utils.getUserId) ? Utils.getUserId() : null;
    return post.isUserAction && userId && post.userId === userId;
}

function buildActionPostImages(post) {
    if (!post.images || post.images.length === 0) return '';
    var imgClass = post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : post.images.length === 4 ? 'four' : 'multi';
    var imgsHtml = post.images.map(function(img, idx) {
        var countBadge = (idx === post.images.length - 1 && post.images.length > 1) ? '<span class="action-post-img-count">+' + post.images.length + '</span>' : '';
        return '<div class="action-post-img-wrap" data-img-index="' + idx + '" data-post-id="' + post.id + '"><img src="' + img + '" alt="" loading="lazy">' + countBadge + '</div>';
    }).join('');
    return '<div class="action-post-images ' + imgClass + '">' + imgsHtml + '</div>';
}

function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Action post publisher's region (for new comments). Cached via Cloud.region().
var actionUserRegion = '';

// Format a post's publish time as Beijing time (Asia/Shanghai). Falls back to the
// legacy frozen `timeAgo` string when no real timestamp exists.
function formatActionTime(post) {
    if (!post || !post.publishedAt) return (post && post.timeAgo) || '';
    try {
        var d = new Date(post.publishedAt);
        var f = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        var p = {};
        f.formatToParts(d).forEach(function (o) { p[o.type] = o.value; });
        return p.month + '月' + p.day + '日 ' + p.hour + ':' + p.minute;
    } catch (e) {
        return post.timeAgo || '';
    }
}

function buildActionPostComments(post) {
    // seed (from index.json, trusted) + cloud comments (D1, untrusted -> escaped)
    var all = (post.commentList || []).concat(post.cloudComments || []);
    if (all.length === 0) return '';
    return all.map(function(c) {
        var region = c.region || '';
        var regionHtml = region ? '<span class="action-post-comment-region">' + esc(region) + '</span>' : '';
        return '<div class="action-post-comment-item">' +
            '<span class="action-post-comment-text">' + esc(c.text || c.content) + '</span>' +
            regionHtml +
            '</div>';
    }).join('');
}

function buildActionPostItem(post) {
    var likeClass = post.isLiked ? ' liked' : '';
    var heartFill = post.isLiked ? ' fill="#ed4956" stroke="#ed4956"' : ' fill="none" stroke="currentColor"';
    var imagesHtml = buildActionPostImages(post);
    var commentsHtml = (post.commentList && post.commentList.length) ? '<div class="action-post-comments">' + buildActionPostComments(post) + '</div>' : '';
    var ownerControls = '';
    if (isOwner(post)) {
        ownerControls = '<div class="action-post-owner-controls">' +
            '<button class="action-post-owner-btn hide-btn" data-post-id="' + post.id + '" title="Hide">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
            '</button>' +
            '<button class="action-post-owner-btn delete-btn" data-post-id="' + post.id + '" title="Delete">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '</div>';
    }
    // Like count sits next to the like button; comments collapsed by default (toggle via comment-btn)
    return '<div class="action-post" data-post-id="' + post.id + '">' +
        '<div class="action-post-body">' +
        '  <div class="action-post-avatar-col">' +
        '    <img class="action-post-avatar" src="' + post.avatar + '" alt="' + post.username + '">' +
        '  </div>' +
        '  <div class="action-post-right">' +
        '    <div class="action-post-username">' + post.username + '</div>' +
        '    <div class="action-post-time">' + formatActionTime(post) + '</div>' +
        '    <div class="action-post-content">' + post.caption + '</div>' +
        imagesHtml +
        '    <div class="action-post-actions-row">' +
        '      <div class="action-post-actions">' +
        '        <button class="action-post-action-btn like-btn' + likeClass + '" data-post-id="' + post.id + '">' +
        '        <svg viewBox="0 0 24 24" ' + heartFill + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '        <span class="action-post-like-count">' + (post.likes > 0 ? post.likes : '') + '</span>' +
        '        </button>' +
        '        <button class="action-post-action-btn comment-btn" data-post-id="' + post.id + '">' +
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '        <span class="action-post-comment-count">' + (post.comments > 0 ? post.comments : '') + '</span>' +
        '        </button>' +
        '      </div>' +
        ownerControls +
        '    </div>' +
        commentsHtml +
        '    <div class="action-post-comment-input-area">' +
        '      <input type="text" class="action-post-comment-input" data-post-id="' + post.id + '" placeholder="Add a comment...">' +
        '      <button class="action-post-comment-submit" data-post-id="' + post.id + '">Post</button>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '</div>';
}

function buildActionPage() {
    var mergedFeed = getMergedActionFeed();
    var postsHtml = mergedFeed.map(function(post) {
        return buildActionPostItem(post);
    }).join('');
    return '<section id="page-action" class="action-page">' +
        '<div class="action-feed-container">' +
        '<div class="action-feed-list" id="actionFeedList">' + postsHtml + '</div>' +
        '</div>' +
        '<div class="action-image-lightbox" id="actionImageLightbox">' +
        '<button class="action-image-lightbox-close" id="actionLightboxClose">' +
        '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<button class="action-image-lightbox-nav action-image-lightbox-prev" id="actionLightboxPrev">' +
        '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>' +
        '</button>' +
        '<img src="" alt="" id="actionLightboxImg">' +
        '<button class="action-image-lightbox-nav action-image-lightbox-next" id="actionLightboxNext">' +
        '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>' +
        '</button>' +
        '<div class="action-image-lightbox-counter" id="actionLightboxCounter"></div>' +
        '</div>' +
        '</section>';
}

function openActionLightbox(postId, imgIndex) {
    // 优先从 DOM 直接读取图片 URL（最可靠，不依赖 feed 数据）
    var images = [];
    var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
    if (postEl) {
        var imgs = postEl.querySelectorAll('.action-post-img-wrap img');
        imgs.forEach(function(im) { if (im.src) images.push(im.src); });
    }
    // DOM 读取失败时 fallback 到 feed 数据
    if (images.length === 0) {
        var mergedFeed = getMergedActionFeed();
        var post = mergedFeed.find(function(p) { return p.id === postId; });
        if (!post || !post.images || post.images.length === 0) return;
        images = post.images;
    }
    actionLightboxCurrentPost = { id: postId, images: images };
    actionLightboxCurrentIndex = imgIndex || 0;
    var lightbox = document.getElementById('actionImageLightbox');
    var img = document.getElementById('actionLightboxImg');
    var counter = document.getElementById('actionLightboxCounter');
    if (lightbox && img) {
        img.src = images[actionLightboxCurrentIndex];
        if (counter) counter.textContent = (actionLightboxCurrentIndex + 1) + ' / ' + images.length;
        lightbox.classList.add('active');
    }
}

function closeActionLightbox() {
    var lightbox = document.getElementById('actionImageLightbox');
    if (lightbox) lightbox.classList.remove('active');
    var img = document.getElementById('actionLightboxImg');
    if (img) img.src = '';
    actionLightboxCurrentPost = null;
}

function navigateLightbox(dir) {
    if (!actionLightboxCurrentPost || !actionLightboxCurrentPost.images) return;
    var total = actionLightboxCurrentPost.images.length;
    actionLightboxCurrentIndex = (actionLightboxCurrentIndex + dir + total) % total;
    var img = document.getElementById('actionLightboxImg');
    var counter = document.getElementById('actionLightboxCounter');
    if (img) img.src = actionLightboxCurrentPost.images[actionLightboxCurrentIndex];
    if (counter) counter.textContent = (actionLightboxCurrentIndex + 1) + ' / ' + total;
}

// Pull cloud like counts and comments, then patch the DOM.
// NOTE: isLiked is NOT restored from cloud — only current-session clicks show liked state.
function enrichActionFromCloud(feed) {
    if (typeof Cloud === 'undefined') return;
    var ids = feed.map(function(p) { return p.id; }).filter(Boolean);
    if (!ids.length) return;

    Cloud.likes.get('action', ids).then(function(res) {
        if (!res) return;
        feed.forEach(function(p) {
            if (typeof res.counts[p.id] === 'number') p.likes = res.counts[p.id];
            // 不恢复 isLiked — 只有当前会话点击才显示红心
            var postEl = document.querySelector('.action-post[data-post-id="' + p.id + '"]');
            if (!postEl) return;
            var btn = postEl.querySelector('.like-btn');
            if (btn) {
                var countEl = btn.querySelector('.action-post-like-count');
                if (countEl) countEl.textContent = p.likes > 0 ? p.likes : '';
            }
        });
    });

    Cloud.comments.list(ids).then(function(map) {
        if (!map) return;
        feed.forEach(function(p) {
            var arr = map[p.id] || map[String(p.id)] || [];
            var totalComments = (p.commentList || []).length + (arr || []).length;
            p.cloudComments = arr;
            p.comments = totalComments;
            var postEl = document.querySelector('.action-post[data-post-id="' + p.id + '"]');
            if (!postEl) return;
            // Update comment count badge next to the comment button
            var commentCountEl = postEl.querySelector('.action-post-comment-count');
            if (commentCountEl) commentCountEl.textContent = totalComments > 0 ? totalComments : '';
            // Build/update the comments list (CSS keeps it collapsed by default)
            var c = postEl.querySelector('.action-post-comments');
            if (!c) {
                c = document.createElement('div');
                c.className = 'action-post-comments';
                var actionsRow = postEl.querySelector('.action-post-actions-row');
                if (actionsRow) actionsRow.insertAdjacentElement('afterend', c);
            }
            c.innerHTML = buildActionPostComments(p);
        });
    });
}

function bindActionInteractions() {
    var mergedFeed = getMergedActionFeed();
    enrichActionFromCloud(mergedFeed);
    if (typeof Cloud !== 'undefined') Cloud.region().then(function(r) { actionUserRegion = r; });

    var likeBtns = document.querySelectorAll('.action-post-action-btn.like-btn');
    likeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var post = mergedFeed.find(function(p) { return p.id === postId; });
            if (!post) return;
            // Toggle liked state in-session only (not persisted — refresh resets to unliked)
            post.isLiked = !post.isLiked;
            this.classList.toggle('liked', post.isLiked);
            var svg = this.querySelector('svg');
            if (svg) {
                if (post.isLiked) { svg.setAttribute('fill', '#ed4956'); svg.setAttribute('stroke', '#ed4956'); }
                else { svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); }
            }
            // Optimistic count update
            post.likes += post.isLiked ? 1 : -1;
            if (post.likes < 0) post.likes = 0;
            var countEl = this.querySelector('.action-post-like-count');
            if (countEl) countEl.textContent = post.likes > 0 ? post.likes : '';
            // Cloud like/unlike (idempotent), then reconcile count only
            if (typeof Cloud !== 'undefined') {
                var api = post.isLiked ? Cloud.likes.like : Cloud.likes.unlike;
                api('action', postId).then(function(res) {
                    if (!res) return;
                    post.likes = res.count || 0;
                    var pel = document.querySelector('.action-post[data-post-id="' + postId + '"]');
                    if (!pel) return;
                    var lb = pel.querySelector('.like-btn');
                    if (lb) {
                        var ce = lb.querySelector('.action-post-like-count');
                        if (ce) ce.textContent = post.likes > 0 ? post.likes : '';
                    }
                });
            }
        });
    });

    // Global document-level delegation for image-wrap clicks (bound once, survives
    // any feed re-render or page re-entry — no dependency on #page-action existing)
    if (!window.__actionLbDelegated) {
        window.__actionLbDelegated = true;
        document.addEventListener('click', function(e) {
            var wrap = e.target.closest ? e.target.closest('.action-post-img-wrap') : null;
            if (!wrap) return;
            if (!wrap.closest('#page-action')) return; // only act inside action page
            var postId = parseInt(wrap.getAttribute('data-post-id'), 10);
            var imgIndex = parseInt(wrap.getAttribute('data-img-index'), 10);
            openActionLightbox(postId, imgIndex);
        });
    }

    var lightboxClose = document.getElementById('actionLightboxClose');
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeActionLightbox);
    }

    var lightboxPrev = document.getElementById('actionLightboxPrev');
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function(e) { e.stopPropagation(); navigateLightbox(-1); });
    }

    var lightboxNext = document.getElementById('actionLightboxNext');
    if (lightboxNext) {
        lightboxNext.addEventListener('click', function(e) { e.stopPropagation(); navigateLightbox(1); });
    }

    var lightbox = document.getElementById('actionImageLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox || e.target.id === 'actionLightboxImg') {
                closeActionLightbox();
                e.stopPropagation();
            }
        });
    }

    if (!actionKeydownBound) {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeActionLightbox();
            if (e.key === 'ArrowLeft' && actionLightboxCurrentPost) navigateLightbox(-1);
            if (e.key === 'ArrowRight' && actionLightboxCurrentPost) navigateLightbox(1);
        });
        actionKeydownBound = true;
    }

    var commentBtns = document.querySelectorAll('.action-post-action-btn.comment-btn');
    commentBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            if (postEl) {
                postEl.classList.toggle('comments-expanded');
                if (postEl.classList.contains('comments-expanded')) {
                    var input = postEl.querySelector('.action-post-comment-input');
                    if (input) input.focus();
                }
            }
        });
    });

    var commentSubmits = document.querySelectorAll('.action-post-comment-submit');
    commentSubmits.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            var input = postEl ? postEl.querySelector('.action-post-comment-input') : null;
            if (input && input.value.trim()) {
                var post = mergedFeed.find(function(p) { return p.id === postId; });
                if (post) {
                    if (!post.cloudComments) post.cloudComments = [];
                    var ctext = input.value.trim();
                    post.cloudComments.push({ author: 'Guest', content: ctext, region: actionUserRegion });
                    var commentsContainer = postEl.querySelector('.action-post-comments');
                    if (!commentsContainer) {
                        // First comment: create the comments container under the actions row
                        commentsContainer = document.createElement('div');
                        commentsContainer.className = 'action-post-comments';
                        var actionsRow = postEl.querySelector('.action-post-actions-row');
                        if (actionsRow) actionsRow.insertAdjacentElement('afterend', commentsContainer);
                    }
                    commentsContainer.innerHTML = buildActionPostComments(post);
                    input.value = '';
                    // Update comment count badge
                    var totalComments = (post.commentList || []).length + (post.cloudComments || []).length;
                    post.comments = totalComments;
                    var commentCountEl = postEl.querySelector('.action-post-comment-count');
                    if (commentCountEl) commentCountEl.textContent = totalComments > 0 ? totalComments : '';
                    // Ensure expanded state
                    postEl.classList.add('comments-expanded');
                    if (typeof Cloud !== 'undefined') Cloud.comments.add(postId, ctext, actionUserRegion);
                }
            }
        });
    });

    var commentInputs = document.querySelectorAll('.action-post-comment-input');
    commentInputs.forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                var postId = parseInt(this.getAttribute('data-post-id'), 10);
                var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
                var btn = postEl ? postEl.querySelector('.action-post-comment-submit') : null;
                if (btn) btn.click();
            }
        });
    });

    var hideBtns = document.querySelectorAll('.action-post-owner-btn.hide-btn');
    hideBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var globalActions = (typeof Utils !== 'undefined' && Utils.getGlobalData) ? (Utils.getGlobalData('actions') || []) : [];
            var gIdx = globalActions.findIndex(function(p) { return p.id === postId; });
            if (gIdx > -1) {
                globalActions[gIdx].hidden = true;
                if (typeof Utils !== 'undefined' && Utils.setGlobalData) Utils.setGlobalData('actions', globalActions);
            }
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            if (postEl) postEl.remove();
            if (typeof window.actionFeed !== 'undefined') {
                var afIdx = window.actionFeed.findIndex(function(p) { return p.id === postId; });
                if (afIdx > -1) window.actionFeed.splice(afIdx, 1);
            }
        });
    });

    var deleteBtns = document.querySelectorAll('.action-post-owner-btn.delete-btn');
    deleteBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var globalActions = (typeof Utils !== 'undefined' && Utils.getGlobalData) ? (Utils.getGlobalData('actions') || []) : [];
            var gIdx = globalActions.findIndex(function(p) { return p.id === postId; });
            if (gIdx > -1) {
                globalActions.splice(gIdx, 1);
                if (typeof Utils !== 'undefined' && Utils.setGlobalData) Utils.setGlobalData('actions', globalActions);
            }
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            if (postEl) postEl.remove();
            if (typeof window.actionFeed !== 'undefined') {
                var afIdx = window.actionFeed.findIndex(function(p) { return p.id === postId; });
                if (afIdx > -1) window.actionFeed.splice(afIdx, 1);
            }
        });
    });
}

return {
    buildPage: buildActionPage,
    bindAll: bindActionInteractions,
    getLightboxPost: function() { return actionLightboxCurrentPost; },
    closeLightbox: closeActionLightbox
};

})();