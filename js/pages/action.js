var ActionPage = (function() {

var actionLightboxCurrentPost = null;
var actionLightboxCurrentIndex = 0;

function getMergedActionFeed() {
    var feed = (window.actionFeed || []).slice();
    var globalActions = (typeof Utils !== 'undefined' && Utils.getGlobalData) ? (Utils.getGlobalData('actions') || []) : [];
    var userId = (typeof Utils !== 'undefined' && Utils.getUserId) ? Utils.getUserId() : null;
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
    if (userId) {
        var likes = (typeof Utils !== 'undefined' && Utils.getUserData) ? (Utils.getUserData('likes') || {}) : {};
        var likedActions = likes.likedActions || [];
        feed.forEach(function(post) {
            var found = likedActions.find(function(la) { return la.id === post.id; });
            if (found) post.isLiked = true;
        });
    }
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

function buildActionPostComments(post) {
    if (!post.commentList || post.commentList.length === 0) return '';
    var visibleComments = post.commentList.slice(0, 2);
    var commentsHtml = visibleComments.map(function(c) {
        return '<div class="action-post-comment-item"><span class="action-post-comment-user">' + c.user + '</span><span class="action-post-comment-text">' + c.text + '</span></div>';
    }).join('');
    var moreHtml = post.commentList.length > 2 ? '<div class="action-post-comment-more" data-post-id="' + post.id + '">View all ' + post.commentList.length + ' comments</div>' : '';
    return '<div class="action-post-comments">' + commentsHtml + moreHtml + '</div>';
}

function buildActionPostItem(post) {
    var likeClass = post.isLiked ? ' liked' : '';
    var heartFill = post.isLiked ? ' fill="#ed4956" stroke="#ed4956"' : ' fill="none" stroke="currentColor"';
    var likeCountText = post.likes > 0 ? post.likes.toLocaleString() + ' likes' : 'Be the first to like';
    var likesInfoClass = post.isLiked || post.likes > 0 ? ' has-likes' : '';
    var imagesHtml = buildActionPostImages(post);
    var commentsHtml = buildActionPostComments(post);
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
    // WeChat Moments-style: avatar on left, content on right, like/comment bubble below
    var likeBubble = post.likes > 0 || post.isLiked ? '<div class="action-post-likes-row' + likesInfoClass + '"><span class="heart-inline">❤</span>' + likeCountText + '</div>' : '';
    var socialBubble = '';
    if (likeBubble || commentsHtml) {
        socialBubble = '<div class="action-post-social-bubble">' + likeBubble + commentsHtml + '</div>';
    }
    return '<div class="action-post" data-post-id="' + post.id + '">' +
        '<div class="action-post-body">' +
        '  <div class="action-post-avatar-col">' +
        '    <img class="action-post-avatar" src="' + post.avatar + '" alt="' + post.username + '">' +
        '  </div>' +
        '  <div class="action-post-right">' +
        '    <div class="action-post-username">' + post.username + '</div>' +
        '    <div class="action-post-time">' + post.timeAgo + '</div>' +
        '    <div class="action-post-content">' + post.caption + '</div>' +
        imagesHtml +
        '    <div class="action-post-actions-row">' +
        '      <div class="action-post-actions">' +
        '        <button class="action-post-action-btn like-btn' + likeClass + '" data-post-id="' + post.id + '">' +
        '        <svg viewBox="0 0 24 24" ' + heartFill + ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '        </button>' +
        '        <button class="action-post-action-btn comment-btn" data-post-id="' + post.id + '">' +
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '        </button>' +
        '      </div>' +
        ownerControls +
        '      <button class="action-post-more-btn share-btn" data-post-id="' + post.id + '">' +
        '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
        '      </button>' +
        '    </div>' +
        socialBubble +
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
    var mergedFeed = getMergedActionFeed();
    var post = mergedFeed.find(function(p) { return p.id === postId; });
    if (!post || !post.images || post.images.length === 0) return;
    actionLightboxCurrentPost = post;
    actionLightboxCurrentIndex = imgIndex;
    var lightbox = document.getElementById('actionImageLightbox');
    var img = document.getElementById('actionLightboxImg');
    var counter = document.getElementById('actionLightboxCounter');
    if (lightbox && img) {
        img.src = post.images[imgIndex];
        if (counter) counter.textContent = (imgIndex + 1) + ' / ' + post.images.length;
        lightbox.classList.add('active');
    }
}

function closeActionLightbox() {
    var lightbox = document.getElementById('actionImageLightbox');
    if (lightbox) lightbox.classList.remove('active');
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

function bindCommentMoreClicks() {
    var moreBtns = document.querySelectorAll('.action-post-comment-more');
    moreBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var post = actionFeed.find(function(p) { return p.id === postId; });
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            if (post && postEl) {
                var commentsContainer = postEl.querySelector('.action-post-comments');
                if (commentsContainer) {
                    var allComments = post.commentList.map(function(c) {
                        return '<div class="action-post-comment-item"><span class="action-post-comment-user">' + c.user + '</span><span class="action-post-comment-text">' + c.text + '</span></div>';
                    }).join('');
                    commentsContainer.innerHTML = allComments;
                }
            }
        });
    });
}

function showCopiedToast() {
    var toast = document.getElementById('copyToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'copyToast';
        toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.9);background:rgba(0,0,0,.75);color:#fff;font-size:.16rem;padding:.14rem .28rem;border-radius:.1rem;opacity:0;pointer-events:none;transition:all .25s ease;z-index:1000;font-weight:700;letter-spacing:.01rem;backdrop-filter:blur(8px);';
        document.body.appendChild(toast);
    }
    toast.textContent = 'Copied';
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%,-50%) scale(0.9)';
    requestAnimationFrame(function() {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%,-50%) scale(1)';
    });
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%,-50%) scale(0.9)';
    }, 1000);
}

function fallbackCopyAndToast(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showCopiedToast();
    } catch (err) {
        showCopiedToast();
    }
    document.body.removeChild(textarea);
}

function bindActionInteractions() {
    var mergedFeed = getMergedActionFeed();

    function persistLike(postId, isLiked) {
        if (typeof Utils === 'undefined' || !Utils.getUserData) return;
        var likes = Utils.getUserData('likes') || {};
        if (!likes.likedActions) likes.likedActions = [];
        var post = mergedFeed.find(function(p) { return p.id === postId; });
        if (!post) return;
        if (isLiked) {
            var exists = likes.likedActions.find(function(la) { return la.id === postId; });
            if (!exists) {
                likes.likedActions.unshift({
                    id: postId,
                    type: 'action',
                    content: post.caption || '',
                    title: post.caption || '',
                    author: post.username || 'Unknown',
                    date: new Date().toISOString().split('T')[0]
                });
            }
        } else {
            likes.likedActions = likes.likedActions.filter(function(la) { return la.id !== postId; });
        }
        Utils.setUserData('likes', likes);
    }

    var likeBtns = document.querySelectorAll('.action-post-action-btn.like-btn');
    likeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var post = mergedFeed.find(function(p) { return p.id === postId; });
            if (post) {
                post.isLiked = !post.isLiked;
                post.likes += post.isLiked ? 1 : -1;
                this.classList.toggle('liked');
                var svg = this.querySelector('svg');
                var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
                var likesInfo = postEl ? postEl.querySelector('.action-post-likes-info') : null;
                if (post.isLiked) {
                    svg.setAttribute('fill', '#ed4956');
                    svg.setAttribute('stroke', '#ed4956');
                } else {
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                }
                if (likesInfo) {
                    likesInfo.textContent = post.likes > 0 ? post.likes.toLocaleString() + ' likes' : 'Be the first to like';
                    if (post.isLiked) {
                        likesInfo.classList.remove('hidden');
                    } else {
                        likesInfo.classList.add('hidden');
                    }
                }
                persistLike(postId, post.isLiked);
            }
        });
    });

    var imgWraps = document.querySelectorAll('.action-post-img-wrap');
    imgWraps.forEach(function(wrap) {
        wrap.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var imgIndex = parseInt(this.getAttribute('data-img-index'), 10);
            openActionLightbox(postId, imgIndex);
        });
    });

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
            if (e.target === lightbox) closeActionLightbox();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeActionLightbox();
        if (e.key === 'ArrowLeft' && actionLightboxCurrentPost) navigateLightbox(-1);
        if (e.key === 'ArrowRight' && actionLightboxCurrentPost) navigateLightbox(1);
    });

    var commentBtns = document.querySelectorAll('.action-post-action-btn.comment-btn');
    commentBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var postEl = document.querySelector('.action-post[data-post-id="' + postId + '"]');
            if (postEl) {
                var inputArea = postEl.querySelector('.action-post-comment-input-area');
                if (inputArea) {
                    inputArea.classList.toggle('active');
                    if (inputArea.classList.contains('active')) {
                        var input = postEl.querySelector('.action-post-comment-input');
                        if (input) input.focus();
                    }
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
                var post = actionFeed.find(function(p) { return p.id === postId; });
                if (post) {
                    if (!post.commentList) post.commentList = [];
                    post.commentList.push({ user: 'Me', text: input.value.trim() });
                    post.comments = post.commentList.length;
                    var commentsContainer = postEl.querySelector('.action-post-comments');
                    if (commentsContainer) {
                        commentsContainer.innerHTML = buildActionPostComments(post);
                        bindCommentMoreClicks();
                    }
                    input.value = '';
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

    bindCommentMoreClicks();

    var shareBtns = document.querySelectorAll('.action-post-more-btn.share-btn');
    shareBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var postId = parseInt(this.getAttribute('data-post-id'), 10);
            var link = window.location.origin + window.location.pathname + '#/action/post/' + postId;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(link).then(function() {
                    showCopiedToast();
                }).catch(function() {
                    fallbackCopyAndToast(link);
                });
            } else {
                fallbackCopyAndToast(link);
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