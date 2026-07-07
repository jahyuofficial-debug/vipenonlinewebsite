var dwItems = [];
var discAudio;

(function(){
'use strict';

Cursor.init('cursor');

// ── Scrollbar auto-hide: show on scroll, fade out after 0.5s inactivity ──
(function(){
    var scrollTimer;
    window.addEventListener('scroll', function() {
        document.documentElement.classList.add('is-scrolling');
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            document.documentElement.classList.remove('is-scrolling');
        }, 500);
    }, { passive: true });
})();

// ── Real loading: track video buffer + JSON fetch (disc covers lazy-load on demand) ─────
Loading.addTask('data', 15);   // JSON fetches
Loading.addTask('video', 40);  // banner video buffer (reveals on first frame, non-blocking)
// Disc covers are lazy-loaded when the Disc page opens — no longer gate the initial load

Loading.init(function() {
    // Banner text rotation will start after data loads
});

// ── Video preload (non-blocking): reveal on first frame, stream buffers in background ─────
(function preloadVideo() {
    var v = document.getElementById('bgVideo');
    if (!v) return Loading.markDone('video');
    // Only fetch metadata up front; the rest streams via HTTP Range requests while the page is shown
    v.preload = 'metadata';
    // Reveal as soon as the first frame is buffered — do NOT wait for canplaythrough (which forces a near-full download)
    v.addEventListener('loadeddata', function() { Loading.markDone('video'); }, { once: true });
    v.addEventListener('canplay', function() { Loading.markDone('video'); }, { once: true });
    v.addEventListener('error', function() { Loading.markDone('video'); }, { once: true });
    // Safety net: never let video block the loading screen beyond 1.5s
    setTimeout(function() { Loading.markDone('video'); }, 1500);
    v.load();
})();

BannerPage.initBgVideo();

(function loadData(){
    // Safety fallback: don't let data loading stall forever
    setTimeout(function() { Loading.markDone('data'); }, 6000);
    var loadJSON = function(url) {
        return fetch(url).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).catch(function(err) {
            console.warn('Failed to load ' + url + ': ' + err.message);
            return null;
        });
    };

    function loadJSONWithTimeout(url, timeoutMs) {
        return new Promise(function(resolve) {
            var timer = setTimeout(function() {
                resolve(null);
            }, timeoutMs);
            fetch(url).then(function(r) {
                clearTimeout(timer);
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }).then(function(d) {
                resolve(d);
            }).catch(function() {
                resolve(null);
            });
        });
    }

    // Append a cache-buster so a refresh always re-pulls fresh data from R2
    var cacheBust = function(url) {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now();
    };

    function resolveDiscTapes() {
        var tapes = window.discData.tapes || [];
        var idx = window.discData.currentTapeIndex || 0;
        if (tapes[idx] && tapes[idx].audio) {
            discAudio.src = tapes[idx].audio;
            discAudio.load();
        }
    }

    var loadSettings = loadJSON('data/manager/settings.json');
    var loadFresh = loadJSON('data/fresh.json');
    var loadDesign = loadJSON(cacheBust('https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/design/index.json'));
    // Action feed: load from R2 (managed via design-upload-v2 → /api/action/save).
    // Falls back to data/action.json if R2 is unreachable or index.json not yet created.
    var loadAction = loadJSON(cacheBust('https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/action/index.json')).then(function(d){
        return (d && Array.isArray(d)) ? d : loadJSON('data/action.json');
    });
    var loadBanner = loadJSON('home/index.json');
    var loadDisc = loadJSONWithTimeout(cacheBust('https://pub-162f7a76795447d39c6186670b92ffa0.r2.dev/disc/index.json'), 5000);

    Promise.all([loadSettings, loadFresh, loadDesign, loadAction, loadBanner, loadDisc]).then(function(results) {
        var settings = results[0];
        var freshData = results[1];
        var designData = results[2];
        var actionData = results[3];
        var bannerData = results[4];
        var discData = results[5];

        // Disc: map from disc/index.json format
        if (discData && Array.isArray(discData)) {
            var r2Base = 'https://pub-162f7a76795447d39c6186670b92ffa0.r2.dev';
            window.discData = {
                tapes: discData.map(function(item, i) {
                    var title = item.folder.replace(/^\d+-/, '');
                    return {
                        id: i + 1,
                        title: title,
                        folder: item.folder || '',
                        time: '0:00',
                        cover: item.coverUrl || '',
                        audio: item.audio
                    };
                }),
                playMode: 'sequence',
                currentTapeIndex: 0
            };
            // Disc covers are lazy-loaded when the Disc page opens (no preload at site load)


        }

        applySiteSettings(settings);

        // Design: map from design/index.json format (R2 images)
        if (designData && Array.isArray(designData)) {
            dwItems = designData.map(function(item) {
                return {
                    folder: item.folder || item.title || '',
                    title: item.title || item.folder.replace(/^\d+-/, ''),
                    subtitle: item.subtitle || '',
                    cat: item.cat || '',
                    desc: item.description || item.desc || '',
                    client: item.client || '',
                    published: item.published || item.year || '',
                    tools: item.tools || '',
                    cardBg: item.cardBg || '',
                    cardHoverBg: item.cardHoverBg || '',
                    headerBg: item.headerBg || '',
                    contentImages: item.contentImages || [],
                    tags: item.tags || [],
                    spacing: item.spacing || 'medium',
                    descPosition: item.descPosition || 'top',
                    likeCount: item.likeCount || 0
                };
            });
        }

        freshHeroItems = freshData.heroGroups || freshData.heroItems || [];
        freshCategories = freshData.categories;
        freshItems = freshData.items;

        // Fresh: localStorage > static file
        var mgrFresh = localStorage.getItem('vipen_mgr_fresh_heroItems');
        if (mgrFresh) { try { freshHeroItems = JSON.parse(mgrFresh); } catch (e) {} }

        if (typeof FreshPage !== 'undefined') FreshPage.setData({ heroGroups: freshHeroItems, categories: freshCategories, items: freshItems });

        // Fresh heroGroups: async load from R2 (overrides fresh.json heroGroups if present)
        fetch('https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/articles/hero-groups.json?' + Date.now())
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(groups) {
                if (groups && Array.isArray(groups) && groups.length) {
                    freshHeroItems = groups;
                    if (typeof FreshPage !== 'undefined') {
                        FreshPage.setData({ heroGroups: freshHeroItems });
                        if (currentPage === 'fresh' && subPageContainer) {
                            subPageContainer.innerHTML = FreshPage.buildPage(freshActiveTab);
                            FreshPage.bindAll();
                        }
                    }
                }
            })
            .catch(function() { /* silent fallback to fresh.json heroGroups */ });

        // Banner: load home/index.json, then fetch meta from R2
        if (bannerData && Array.isArray(bannerData)) {
            var metaFetches = bannerData.map(function(g) {
                return g.meta ? fetch(g.meta).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }) : Promise.resolve(null);
            });
            Promise.all(metaFetches).then(function(metas) {
                var homeGroups = bannerData.map(function(g, i) {
                    var meta = metas[i] || {};
                    var topic = meta.topic || '';
                    var note = meta.note || '';
                    var isVideo = g.bgType === 'video';
                    var isImage = g.bgType === 'image';
                    // Apply text styles
                    var topicStyle = '';
                    if (meta.topicBold) topicStyle += 'font-weight:bold;';
                    if (meta.topicItalic) topicStyle += 'font-style:italic;';
                    var noteStyle = '';
                    if (meta.noteBold) noteStyle += 'font-weight:bold;';
                    if (meta.noteItalic) noteStyle += 'font-style:italic;';
                    return {
                        bgType: g.bgType || 'video',
                        bgVideo: isVideo ? (g.banner || '') : '',
                        bgImage: isImage ? (g.banner || '') : '',
                        carouselTexts: [{ topic: topic, note: note, topicStyle: topicStyle, noteStyle: noteStyle }]
                    };
                });
                BannerPage.bannerData.homeGroups = homeGroups.filter(function(g) { return !g.hidden; });
                BannerPage.bannerData.homeTextSlideIndices = [0, 0, 0, 0];
                BannerPage.bannerData.topics = metas.map(function(m) { return m && m.topic ? m.topic : ''; });
                BannerPage.bannerData.notes = metas.map(function(m) { return m && m.note ? m.note : ''; });
                BannerPage.bannerData.bgType = bannerData.map(function(g) { return g.bgType; });
                BannerPage.bannerData.bgVideoSrc = bannerData.map(function(g) { return g.bgType === 'video' ? (g.banner || '') : ''; });
                BannerPage.bannerData.bgImage = bannerData.map(function(g) { return g.bgType === 'image' ? (g.banner || '') : ''; });
                console.log('Banner metas loaded from R2');
                var meta0 = metas[0] || {};

                // Apply initial text once, then let typewriter take over
                (function applyOnce() {
                    var h2 = document.querySelector('#topicLine h2');
                    var h3 = document.querySelector('#noteLine h3');
                    var topic = meta0.topic || '';
                    var note = meta0.note || '';
                    if (h2 && (h2.textContent || '').trim() !== topic) h2.textContent = topic;
                    if (h3 && (h3.textContent || '').trim() !== note) h3.textContent = note;
                })();

                // Start typewriter after data is loaded
                BannerPage.startAnimations();
            }).catch(function(e) {
                console.warn('Failed to load banner metas from R2', e);
            });
        }
        window.actionFeed = actionData;

        resolveDiscTapes();

        console.log('Data loaded from ManagerGo data files');

        // Mark JSON data loading as complete
        Loading.markDone('data');
    }).catch(function(err) {
        console.warn('Primary load failed: ' + err + ', trying index.json files individually');
        // Try loading each index.json individually as fallback
        var tryLoad = function(path, mapFn) {
            return fetch(path).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; });
        };
        Promise.all([
            tryLoad(cacheBust('https://pub-162f7a76795447d39c6186670b92ffa0.r2.dev/disc/index.json')),
            tryLoad(cacheBust('https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/design/index.json')),
            tryLoad('home/index.json'),
            loadJSON('data/fresh.json'),
            loadJSON('data/action.json')
        ]).then(function(r) {
            var discData = r[0], designData = r[1], bannerData = r[2];
            var freshData = r[3], actionData = r[4];

            if (discData && Array.isArray(discData)) {
                window.discData = {
                    tapes: discData.map(function(item, i) {
                        var title = item.folder.replace(/^\d+-/, '');
                        return { id: i+1, title: title, folder: item.folder || '', time: '0:00', cover: item.coverUrl || '', audio: item.audio };
                    }),
                    playMode: 'sequence', currentTapeIndex: 0
                };
                // Disc covers are lazy-loaded when the Disc page opens (no preload at site load)


            }
            if (designData && Array.isArray(designData)) {
                dwItems = designData.map(function(item) {
                    return { title: item.title || item.folder.replace(/^\d+-/, ''), folder: item.folder||item.title||'', cat: item.cat||'', desc: item.description||item.desc||'', client: item.client||'', published: item.published||item.year||'', tools: item.tools||'', cardBg: item.cardBg||'', cardHoverBg: item.cardHoverBg||'', headerBg: item.headerBg||'', contentImages: item.contentImages||[], tags: item.tags||[], likeCount: item.likeCount||0 };
                });
            }
            if (bannerData && Array.isArray(bannerData)) {
                var hg = bannerData.map(function(g) {
                    var u = g.banner;
                    if (u && !/^https?:\/\//.test(u)) u = 'home/' + g.folder + '/' + u;
                    return { bgType: g.bgType, bgVideo: g.bgType==='video'?u:'', bgImage: g.bgType!=='video'?u:'', carouselTexts: [{ topic: g.topic||'', note: g.note||'' }] };
                });
                BannerPage.bannerData.homeGroups = hg;
            }
            if (freshData) { freshHeroItems = freshData.heroGroups||freshData.heroItems||[]; freshCategories = freshData.categories; freshItems = freshData.items; }
            window.actionFeed = actionData;
            resolveDiscTapes();
            console.log('Data loaded from individual index.json files');
            Loading.markDone('data');
        }).catch(function() {
            console.log('All loading failed, using embedded defaults');
            Loading.markDone('data');
        });
    });

    function applySiteSettings(settings) {
        if (!settings) return;
        if (settings.siteName) {
            var titleEl = document.querySelector('title');
            if (titleEl) titleEl.textContent = settings.siteName;
            var metaOgTitle = document.querySelector('meta[property="og:title"]');
            if (metaOgTitle) metaOgTitle.setAttribute('content', settings.siteName);
            var metaTwitterTitle = document.querySelector('meta[name="twitter:title"]');
            if (metaTwitterTitle) metaTwitterTitle.setAttribute('content', settings.siteName);
        }
        if (settings.contactInfo) {
            var metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', settings.contactInfo);
            var metaOgDesc = document.querySelector('meta[property="og:description"]');
            if (metaOgDesc) metaOgDesc.setAttribute('content', settings.contactInfo);
            var metaTwitterDesc = document.querySelector('meta[name="twitter:description"]');
            if (metaTwitterDesc) metaTwitterDesc.setAttribute('content', settings.contactInfo);
        }
        if (settings.siteLogo) {
            var logoImg = document.querySelector('header .logo img');
            if (logoImg) logoImg.src = settings.siteLogo;
        }
    }

})();

var freshHeroItems = [];



var freshCategories = [];

var freshItems = [];

var header = document.querySelector('header');
var headerTicking = false;
var navToggle = document.getElementById('navToggle');
var mainHeader = document.getElementById('mainHeader');
var navExpanded = false;

function updateNavCollapseState(){
    if(currentPage === 'home' && !navExpanded){
        mainHeader.classList.add('nav-collapsed');
    } else {
        mainHeader.classList.remove('nav-collapsed');
    }
}

if(navToggle){
    navToggle.addEventListener('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        navExpanded = true;
        updateNavCollapseState();
    });
}

window.addEventListener('scroll', function(){
    if(!headerTicking){
        requestAnimationFrame(function(){
            if(window.scrollY > 50){
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            headerTicking = false;
        });
        headerTicking = true;
    }
});


var signinBtn = document.getElementById('signinBtn');
    var signupBtn = document.getElementById('signupBtn');
    var profileLink = document.getElementById('profileLink');
    var managerGoLink = document.getElementById('managerGoLink');
    var mobileManagerGoLink = document.getElementById('mobileManagerGoLink');

    function goToSignin(e) {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        window.location.hash = '#/signin';
    }
    function goToSignup(e) {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        window.location.hash = '#/signup';
    }

function updateAuthUI() {
    if (CONFIG.LOGIN_DISABLED) {
        if (signinBtn) signinBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (managerGoLink) managerGoLink.style.display = 'none';
        if (mobileManagerGoLink) mobileManagerGoLink.style.display = 'none';
        NotificationCenter.hide();
        return;
    }
    var isLoggedIn = Utils.isLoggedIn();
    if (isLoggedIn) {
        Utils.migrateUserData();
        if (signinBtn) signinBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = '';
        var userData = Utils.getUserData('user');
        var auth = Utils.getAuth();
        var role = (userData && userData.role) || (auth && auth.role) || '';
        if ((auth && auth.email === 'riverjia9527@gmail.com') || (userData && userData.email === 'riverjia9527@gmail.com')) {
            role = 'ManagerGo';
        }
        if (managerGoLink) managerGoLink.style.display = (role === 'ManagerGo') ? '' : 'none';
        if (mobileManagerGoLink) mobileManagerGoLink.style.display = (role === 'ManagerGo') ? '' : 'none';
        NotificationCenter.show();
    } else {
        if (signinBtn) signinBtn.style.display = '';
        if (signupBtn) signupBtn.style.display = '';
        if (profileLink) profileLink.style.display = 'none';
        if (managerGoLink) managerGoLink.style.display = 'none';
        if (mobileManagerGoLink) mobileManagerGoLink.style.display = 'none';
        NotificationCenter.hide();
    }
}

updateAuthUI();

NotificationCenter.init();

CookieConsent.init();

if (window.Weather) { Weather.init(); }

if(signinBtn){
    signinBtn.addEventListener('click', goToSignin);
}

if(signupBtn){
    signupBtn.addEventListener('click', goToSignup);
}

function updateNavActiveState(pageName){
    var navMap = {
        'home': '',
        'fresh': 'fresh',
        'design-work': 'design-work',
        'design-work-list': 'design-work',
        'disc-library': 'disc-library',
        'action': 'action',
        'msg': 'msg',
        'fresh-detail': 'fresh',
        'design-work-detail': 'design-work'
    };
    var activeKey = navMap[pageName] || '';
    var pcNavLinks = document.querySelectorAll('.pc-nav .navLink');
    var mobileNavLinks = document.querySelectorAll('#menuOverlay .items a');
    pcNavLinks.forEach(function(link){
        if(link.getAttribute('data-nav') === activeKey){
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    mobileNavLinks.forEach(function(link){
        if(link.getAttribute('data-nav') === activeKey){
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

var app = document.getElementById('app');
window.actionFeed = [];  // Preset placeholders removed — action feed now comes exclusively from R2 (design-upload-v2 → /api/action/save) and user-published posts (Utils.getGlobalData).

window.discData = { tapes: [], playMode: 'sequence', currentTapeIndex: 0 };

var pageTemplates = {};

var msgBoardData = [];

var msgCurrentUser = { username: 'Guest', avatar: '' };
var msgEmojiList = ['\u{1F600}','\u{1F60D}','\u{1F601}','\u{1F389}','\u{1F92F}','\u{1F44D}','\u{1F496}','\u{1F480}','\u{1F4AF}','\u{1F4A1}','\u{1F525}','\u{1F308}','\u{1F31F}','\u{1F3B6}','\u{1F60E}','\u{1F618}','\u{1F92A}','\u{1F44F}','\u{1F4A5}','\u{1F6A8}','\u{2615}','\u{1F37F}','\u{1F3C6}','\u{1F451}','\u{1F98B}','\u{1F31A}','\u{270C}','\u{1F64C}','\u{1F33A}','\u{1F30D}','\u{1F3A8}','\u{1F48E}','\u{1F514}','\u{1F380}','\u{1F31E}','\u{1F4F8}','\u{1F393}','\u{1F91D}','\u{1F680}','\u{1F49D}'];
var msgNextId = 1;
var msgTempImages = [];
var msgUserPosts = [];
var msgUserRegion = '';
var msgRegionLoaded = false;

function loadMsgUserRegion() {
    if (msgRegionLoaded) return;
    msgRegionLoaded = true;
    fetch('/api/msg/region')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data && data.region) {
                msgUserRegion = data.region;
            }
        })
        .catch(function(e) {
            // Fallback: try external API
            return fetch('https://ipapi.co/json/')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data && !data.error) {
                        msgUserRegion = data.region || data.city || '';
                    }
                })
                .catch(function(e2) {});
        });
}

try {
    var _savedMsgs = JSON.parse(localStorage.getItem('vipen_msg_board') || '[]');
    if (Array.isArray(_savedMsgs) && _savedMsgs.length) {
        msgUserPosts = _savedMsgs;
        var maxId = 0;
        msgUserPosts.forEach(function(m){ if (m.id > maxId) maxId = m.id; });
        msgNextId = maxId + 1;
    }
} catch(e) {}

function saveMsgUserPosts() {
    try { localStorage.setItem('vipen_msg_board', JSON.stringify(msgUserPosts)); } catch(e) {}
}

window.currentPage = null;
var banner = document.getElementById('banner');
var homeWrapper = document.getElementById('homeWrapper');
var subPageContainer = null;
var freshActiveTab = 'all';











function escapeMsgText(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function buildMsgItem(item) {
    var region = item.region ? escapeMsgText(item.region) : '';
    var regionHtml = region ? '<span class="msg-barrage-region">' + region + '</span>' : '';
    return '<span class="msg-barrage-item">' +
        '<span class="msg-barrage-text">' + escapeMsgText(item.content) + '</span>' +
        regionHtml +
        '</span>';
}

var MSG_BARRAGE_LANES = 8;

function buildMsgBarrage() {
    var allMsgs = msgUserPosts.concat(msgBoardData);
    if (allMsgs.length === 0) {
        return '<div class="msg-barrage-empty">No messages yet</div>';
    }
    var html = '';
    for (var lane = 0; lane < MSG_BARRAGE_LANES; lane++) {
        var laneItems = [];
        for (var i = lane; i < allMsgs.length; i += MSG_BARRAGE_LANES) {
            laneItems.push(allMsgs[i]);
        }
        if (laneItems.length === 0) continue;
        var itemsHtml = laneItems.map(buildMsgItem).join('');
        var duration = 16 + Math.random() * 20 + (lane % 2) * 8;
        var delay = -(Math.random() * duration);
        html += '<div class="msg-barrage-lane">' +
            '<div class="msg-barrage-scroll" style="animation-duration:' + duration + 's;animation-delay:' + delay + 's;">' +
            itemsHtml +
            '</div></div>';
    }
    return html;
}

function buildMsgPage() {
    var emojiPanelHtml = '<div class="msg-emoji-panel" id="msgEmojiPanel" style="display:none;">' +
        msgEmojiList.map(function(e) {
            return '<button class="emoji-btn" type="button" data-emoji="' + e + '">' + e + '</button>';
        }).join('') +
        '</div>';
    return '<section id="page-msg" class="msg-page">' +
        '<div class="msg-spacer-top"></div>' +
        '<div class="msg-center-wrap">' +
        '<div class="msg-input-center">' +
        '<div class="msg-input-wrapper">' +
        '<div class="msg-input-area">' +
        '<textarea class="msg-textarea" id="msgTextarea" rows="1"></textarea>' +
        '<span class="msg-placeholder" id="msgPlaceholder">what\' up</span>' +
        '<div class="msg-input-actions">' +
        '<div class="msg-input-tools">' +
        '<button class="msg-tool-btn" id="msgEmojiBtn" type="button" title="Emoji">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>' +
        '</button>' +
        '</div>' +
        '<button class="msg-submit-btn" id="msgSubmitBtn">Send</button>' +
        '</div>' +
        '</div>' +
        emojiPanelHtml +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="msg-barrage-track" id="msgBarrageTrack">' + buildMsgBarrage() + '</div>' +
        '</section>';
}

function bindMsgInteractions() {
    var submitBtn = document.getElementById('msgSubmitBtn');
    var textarea = document.getElementById('msgTextarea');
    var emojiBtn = document.getElementById('msgEmojiBtn');
    var emojiPanel = document.getElementById('msgEmojiPanel');

    // Load user region on page visit
    loadMsgUserRegion();

    // Pull cloud-shared messages (D1) and merge into the board
    if (typeof Cloud !== 'undefined') {
        Cloud.msg.list(200).then(function(msgs) {
            if (msgs && msgs.length) {
                msgBoardData = msgs;
                var track = document.getElementById('msgBarrageTrack');
                if (track) track.innerHTML = buildMsgBarrage();
            }
        });
    }

    var msgArea = textarea ? textarea.closest('.msg-input-area') : null;
    function toggleMsgPlaceholder() {
        if (!msgArea) return;
        if (textarea.value.trim()) msgArea.classList.add('has-value');
        else msgArea.classList.remove('has-value');
    }
    if (textarea) {
        textarea.addEventListener('input', function() {
            textarea.style.height = 'auto';
            var newHeight = textarea.scrollHeight;
            var maxHeight = parseFloat(getComputedStyle(textarea).maxHeight);
            if (newHeight > maxHeight) {
                textarea.style.height = maxHeight + 'px';
            } else {
                textarea.style.height = newHeight + 'px';
            }
            toggleMsgPlaceholder();
        });
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (submitBtn) submitBtn.click();
            }
        });
    }

    if (emojiBtn && emojiPanel) {
        emojiBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isVisible = emojiPanel.style.display === 'grid';
            emojiPanel.style.display = isVisible ? 'none' : 'grid';
        });

        emojiPanel.addEventListener('click', function(e) {
            var btn = e.target.closest('.emoji-btn');
            if (!btn) return;
            var emoji = btn.getAttribute('data-emoji');
            if (emoji && textarea) {
                var start = textarea.selectionStart;
                var end = textarea.selectionEnd;
                var before = textarea.value.substring(0, start);
                var after = textarea.value.substring(end);
                textarea.value = before + emoji + after;
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
            }
        });

        document.addEventListener('click', function(e) {
            if (emojiPanel.style.display === 'grid') {
                if (!emojiBtn.contains(e.target) && !emojiPanel.contains(e.target)) {
                    emojiPanel.style.display = 'none';
                }
            }
        });
    }

    if (submitBtn && textarea) {
        submitBtn.addEventListener('click', function() {
            var content = textarea.value.trim();
            if (!content) return;
            // Optimistic: show immediately in the shared board
            msgBoardData.unshift({ id: 'pending-' + Date.now(), content: content, region: msgUserRegion || '', time: Date.now() });
            textarea.value = '';
            textarea.style.height = 'auto';
            toggleMsgPlaceholder();
            // Rebuild barrage animation with new message
            var track = document.getElementById('msgBarrageTrack');
            if (track) {
                track.innerHTML = buildMsgBarrage();
            }
            // Persist to cloud (D1). On failure the message still shows for this session.
            if (typeof Cloud !== 'undefined') {
                Cloud.msg.save(content, msgUserRegion);
            }
        });
    }
}

function navigateTo(pageName) {
    if (subPageContainer) {
        subPageContainer.remove();
        subPageContainer = null;
    }

    BannerPage.stopAnimations();

    var herosTopBg = document.getElementById('herosTopBg');

    if (CONFIG.LOGIN_DISABLED) {
        if (pageName === 'signin' || pageName === 'signup' || pageName === 'profile') {
            window.location.hash = '#/';
            return;
        }
    } else {
        if (pageName === 'design-work' || pageName === 'design-work-list') {
            if (!Utils.isLoggedIn()) {
                window.location.hash = '#/signup';
                return;
            }
        }
        if (pageName === 'msg' || pageName === 'action' || pageName === 'profile') {
            if (!Utils.isLoggedIn()) {
                window.location.hash = '#/signin';
                return;
            }
        }
    }

    if ((pageName === 'design-work' || pageName === 'design-work-list') && typeof DesignPage !== 'undefined' && !DesignPage.isVerified()) {
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = DesignPage.renderGuard();
        app.appendChild(subPageContainer);
        DesignPage.bindGuard();
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        currentPage = 'design-work';
        return;
    }

    if (pageName === '' || pageName === 'home') {
        banner.style.display = 'block';
        homeWrapper.style.display = 'block';
        BannerPage.startAnimations();
        header.classList.add('dimmed');
        if (herosTopBg) herosTopBg.classList.add('hidden');
        currentPage = 'home';
        navExpanded = false;
    } else if (pageName === 'fresh') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        var mergedItems = freshItems.slice();
        var globalPosts = Utils.getGlobalData('posts') || [];
        globalPosts.forEach(function(gp) {
            if (gp.type === 'fresh') {
                var exists = mergedItems.find(function(mi) { return mi.id === ('user_' + gp.publishedAt); });
                if (!exists) {
                    mergedItems.unshift({
                        id: 'user_' + gp.publishedAt,
                        headline: gp.title || 'Untitled',
                        summary: (gp.content || '').replace(/<[^>]*>/g, '').substring(0, 150),
                        body: gp.content || '',
                        image: gp.images && gp.images.length > 0 ? gp.images[0] : '',
                        date: gp.publishedAt ? gp.publishedAt.split('T')[0] : '',
                        author: gp.author || 'User',
                        authorInitial: (gp.author || 'U').charAt(0),
                        authorBg: '#6366f1',
                        cat: 'all',
                        userId: gp.userId
                    });
                }
            }
        });
        FreshPage.setData({ heroGroups: freshHeroItems, categories: freshCategories, items: mergedItems });
        subPageContainer.innerHTML = FreshPage.buildPage(freshActiveTab);
        app.appendChild(subPageContainer);
        FreshPage.bindAll();
        currentPage = 'fresh';
    } else if (pageName === 'design-work') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = DesignPage.buildGrid();
        app.appendChild(subPageContainer);
        setTimeout(function() {
            DesignPage.bindGrid();
        }, 50);
        currentPage = 'design-work';
    } else if (pageName === 'design-work-list') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = DesignPage.buildList();
        app.appendChild(subPageContainer);
        DesignPage.bindList();
        var back2CardBtn = document.getElementById('dwBack2CardBtn');
        if (back2CardBtn) {
            back2CardBtn.addEventListener('click', function() {
                window.location.hash = '#/design-work';
            });
        }
        currentPage = 'design-work-list';
    } else if (pageName === 'disc-library') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = DiscPage.buildPage();
        app.appendChild(subPageContainer);
        setTimeout(function() {
            DiscPage.bindAll();
            DiscPage.syncUIWithAudioState();
            if (!discAutoPlayed) {
                discAutoPlayed = true;
                discAudio.play().catch(function(){});
            }
            if (discAudio && !discAudio.paused && !DiscPage.getDiscIsPlaying()) {
                DiscPage.setDiscIsPlaying(true);
                DiscPage.syncPlayPauseUI();
            }
            MiniPlayer.updateState(currentPage, DiscPage.getDiscIsPlaying(), discVisited);
        }, 100);
        discVisited = true;
        currentPage = 'disc-library';
    } else if (pageName === 'action') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        var globalActions = Utils.getGlobalData('actions') || [];
        globalActions.forEach(function(ga) {
            if (ga.hidden) return;
            var exists = window.actionFeed.find(function(af) { return af.id === ga.id; });
            if (!exists) {
                window.actionFeed.unshift({
                    id: ga.id,
                    username: ga.author || 'User',
                    avatar: ga.avatar || '',
                    images: ga.images || [],
                    caption: ga.content || '',
                    likes: 0,
                    comments: 0,
                    timeAgo: Utils.getRelativeTime(ga.publishedAt),
                    isLiked: false,
                    commentList: [],
                    userId: ga.userId,
                    isUserAction: true
                });
            }
        });
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = ActionPage.buildPage();
        app.appendChild(subPageContainer);
        ActionPage.bindAll();
        currentPage = 'action';
    } else if (pageName === 'msg') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = buildMsgPage();
        app.appendChild(subPageContainer);
        bindMsgInteractions();
        currentPage = 'msg';
    } else if (pageTemplates[pageName]) {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = pageTemplates[pageName];
        app.appendChild(subPageContainer);
        currentPage = pageName;
    } else if (pageName === 'signin') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = SigninPage.buildPage();
        app.appendChild(subPageContainer);
        SigninPage.bindAll();
        currentPage = 'signin';
    } else if (pageName === 'signup') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = SignupPage.buildPage();
        app.appendChild(subPageContainer);
        SignupPage.bindAll();
        currentPage = 'signup';
    } else if (pageName === 'profile') {
        if (herosTopBg) herosTopBg.classList.remove('hidden');
        banner.style.display = 'none';
    homeWrapper.style.display = 'none';
        homeWrapper.style.display = 'none';
        header.classList.remove('dimmed');
        subPageContainer = document.createElement('div');
        subPageContainer.innerHTML = ProfilePage.buildPage();
        app.appendChild(subPageContainer);
        ProfilePage.bindAll();
        currentPage = 'profile';
    }
    updateNavCollapseState();
    updateNavActiveState(currentPage);
    MiniPlayer.updateState(currentPage, DiscPage.getDiscIsPlaying(), discVisited);
}

function updateFreshMetaTags(id) {
    var item = freshItems[id];
    if (!item) return;
    var baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    var pageUrl = baseUrl + '/#/fresh/detail/' + id;
    var ogImage = item.image ? baseUrl + '/' + item.image : baseUrl + '/api/og?title=' + encodeURIComponent(item.headline) + '&author=' + encodeURIComponent(item.author);
    var metaMap = {
        'og:title': item.headline,
        'og:description': item.summary,
        'og:image': ogImage,
        'og:url': pageUrl,
        'og:type': 'article',
        'twitter:card': 'summary_large_image',
        'twitter:title': item.headline,
        'twitter:description': item.summary,
        'twitter:image': ogImage
    };
    Object.keys(metaMap).forEach(function(key) {
        var selector = 'meta[property="' + key + '"],meta[name="' + key + '"]',
            existing = document.querySelector(selector);
        if (existing) {
            existing.setAttribute(key.indexOf('og:') === 0 ? 'property' : 'name', key);
            existing.setAttribute('content', metaMap[key]);
        } else {
            var meta = document.createElement('meta');
            if (key.indexOf('og:') === 0) {
                meta.setAttribute('property', key);
            } else {
                meta.setAttribute('name', key);
            }
            meta.setAttribute('content', metaMap[key]);
            document.head.appendChild(meta);
        }
    });
    var titleEl = document.querySelector('title');
    if (titleEl) titleEl.textContent = item.headline + ' | Vipen';
}

function showFreshSharePopup(item) {
    var existing = document.getElementById('freshDetailSharePopup');
    if (existing) existing.remove();

    var shareUrl = window.location.href;
    var encodedUrl = encodeURIComponent(shareUrl);
    var encodedTitle = encodeURIComponent(item.headline);
    var encodedSummary = encodeURIComponent(item.summary);

    var popup = document.createElement('div');
    popup.className = 'fresh-detail-share-popup';
    popup.id = 'freshDetailSharePopup';
    popup.innerHTML =
        '<div class="fresh-detail-share-box">' +
        '<h3 class="fresh-detail-share-heading">Share this article</h3>' +
        '<div class="fresh-detail-share-grid">' +
        '<button class="fresh-detail-share-option" data-share="copy">' +
        '<div class="fresh-detail-share-icon" style="background:#3b82f6;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        '</div><span>Copy Link</span></button>' +
        '<button class="fresh-detail-share-option" data-share="twitter">' +
        '<div class="fresh-detail-share-icon" style="background:#1da1f2;">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
        '</div><span>Twitter / X</span></button>' +
        '<button class="fresh-detail-share-option" data-share="facebook">' +
        '<div class="fresh-detail-share-icon" style="background:#1877f2;">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
        '</div><span>Facebook</span></button>' +
        '<button class="fresh-detail-share-option" data-share="native">' +
        '<div class="fresh-detail-share-icon" style="background:#6366f1;">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
        '</div><span>More...</span></button>' +
        '</div>' +
        '<button class="fresh-detail-share-cancel">Cancel</button>' +
        '</div>';

    document.body.appendChild(popup);

    popup.addEventListener('click', function(e) {
        if (e.target === popup) popup.remove();
    });

    var cancelBtn = popup.querySelector('.fresh-detail-share-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() { popup.remove(); });
    }

    var options = popup.querySelectorAll('.fresh-detail-share-option');
    options.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var action = this.getAttribute('data-share');
            if (action === 'copy') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl).then(function() {
                        showFreshShareToast('Link copied!');
                    }).catch(function() {
                        fallbackCopy(shareUrl);
                    });
                } else {
                    fallbackCopy(shareUrl);
                }
                popup.remove();
            } else if (action === 'twitter') {
                window.open('https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle, '_blank', 'width=600,height=400');
                popup.remove();
            } else if (action === 'facebook') {
                window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '&quote=' + encodedSummary, '_blank', 'width=600,height=400');
                popup.remove();
            } else if (action === 'native') {
                if (navigator.share) {
                    navigator.share({ title: item.headline, text: item.summary, url: shareUrl }).catch(function() {});
                } else {
                    fallbackCopy(shareUrl);
                }
                popup.remove();
            }
        });
    });
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showFreshShareToast('Link copied!'); } catch (e) {}
    document.body.removeChild(ta);
}

function showFreshShareToast(msg) {
    var existing = document.getElementById('freshDetailShareToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'fresh-detail-share-toast';
    toast.id = 'freshDetailShareToast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 400);
    }, 2000);
}

function showFreshAuthPopup() {
    var existing = document.getElementById('freshDetailAuthPopup');
    if (existing) existing.remove();
    var popup = document.createElement('div');
    popup.className = 'fresh-detail-auth-popup';
    popup.id = 'freshDetailAuthPopup';
    popup.innerHTML = '<div class="fresh-detail-auth-box">' +
        '<p>This feature is only available to members.<br>Would you like to sign in?</p>' +
        '<div class="fresh-detail-auth-btns">' +
        '<button class="btn-signin" id="freshDetailAuthSignin">Sign In</button>' +
        '<button class="btn-notnow" id="freshDetailAuthNotnow">Not now</button>' +
        '</div></div>';
    document.body.appendChild(popup);
    document.getElementById('freshDetailAuthSignin').addEventListener('click', function() {
        popup.remove();
        window.location.href = 'signin.html';
    });
    document.getElementById('freshDetailAuthNotnow').addEventListener('click', function() {
        popup.remove();
    });
    popup.addEventListener('click', function(e) {
        if (e.target === popup) popup.remove();
    });
}

function navigateToFreshHeroDetail(groupIdx) {
    if (subPageContainer) {
        subPageContainer.remove();
        subPageContainer = null;
    }
    banner.style.display = 'none';
    homeWrapper.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    subPageContainer.innerHTML = FreshPage.buildHeroDetail(groupIdx);
    app.appendChild(subPageContainer);
    currentPage = 'fresh-detail';
    updateNavActiveState(currentPage);

    var backBtn = document.getElementById('freshDetailBack');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.hash = '#/fresh';
        });
    }
    FreshPage.bindTranslate();
}

function navigateToFreshHotDetail(groupIdx, newsIdx) {
    if (subPageContainer) {
        subPageContainer.remove();
        subPageContainer = null;
    }
    banner.style.display = 'none';
    homeWrapper.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    subPageContainer.innerHTML = FreshPage.buildHotNewsDetail(groupIdx, newsIdx);
    app.appendChild(subPageContainer);
    currentPage = 'fresh-detail';
    updateNavActiveState(currentPage);

    var backBtn = document.getElementById('freshDetailBack');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.hash = '#/fresh';
        });
    }
    FreshPage.bindTranslate();
}

function navigateToFreshDetail(id) {
    if (subPageContainer) {
        subPageContainer.remove();
        subPageContainer = null;
    }
    banner.style.display = 'none';
    homeWrapper.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    subPageContainer.innerHTML = FreshPage.buildDetail(id);
    app.appendChild(subPageContainer);
    currentPage = 'fresh-detail';
    updateNavActiveState(currentPage);

    var backBtn = document.getElementById('freshDetailBack');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.hash = '#/fresh';
        });
    }

    var shareBtn = document.getElementById('freshDetailShare');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            var item = freshItems[id];
            if (!item) return;
            showFreshSharePopup(item);
        });
    }

    updateFreshMetaTags(id);

    FreshPage.bindTranslate();

    var likeBtn = document.getElementById('freshDetailLikeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            var item = freshItems[id];
            if (!item) return;
            item.isLiked = !item.isLiked;
            item.likeCount = (item.likeCount || 0) + (item.isLiked ? 1 : -1);
            this.classList.toggle('liked');
            var svg = this.querySelector('svg');
            var countEl = document.getElementById('freshDetailLikeCount');
            if (item.isLiked) {
                svg.setAttribute('fill', '#ed4956');
                svg.setAttribute('stroke', '#ed4956');
            } else {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
            }
            if (countEl) countEl.textContent = item.likeCount;
        });
    }

    var commentBtn = document.getElementById('freshDetailCommentBtn');
    if (commentBtn) {
        commentBtn.addEventListener('click', function() {
            var commentsArea = document.getElementById('freshDetailComments');
            if (commentsArea) {
                commentsArea.style.display = commentsArea.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    var commentSubmit = document.getElementById('freshDetailCommentSubmit');
    var commentInput = document.getElementById('freshDetailCommentInput');
    if (commentSubmit && commentInput) {
        commentSubmit.addEventListener('click', function() {
            var text = commentInput.value.trim();
            if (!text) return;
            var item = freshItems[id];
            if (!item) return;
            if (!item.comments) item.comments = [];
            var auth = Utils.getAuth();
            var username = auth && auth.username ? auth.username : 'Guest';
            item.comments.push({ user: username, text: text });
            item.commentCount = (item.commentCount || 0) + 1;
            var countEl = document.getElementById('freshDetailCommentCount');
            if (countEl) countEl.textContent = item.commentCount;
            var listEl = document.getElementById('freshDetailCommentList');
            if (listEl) {
                var newItem = document.createElement('div');
                newItem.className = 'fresh-detail-comment-item';
                newItem.innerHTML = '<div class="fresh-detail-comment-avatar" style="background:#6366f1">' + username.charAt(0) + '</div>' +
                    '<div class="fresh-detail-comment-main">' +
                    '<div class="fresh-detail-comment-user">' + username + '</div>' +
                    '<div class="fresh-detail-comment-text">' + text + '</div>' +
                    '</div>';
                listEl.appendChild(newItem);
            }
            commentInput.value = '';
        });
        commentInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                commentSubmit.click();
            }
        });
    }
}

function navigateToDesignWorkDetail(id) {
    if (!CONFIG.LOGIN_DISABLED && !Utils.isLoggedIn()) {
        window.location.hash = '#/signup';
        return;
    }
    if (subPageContainer) {
        subPageContainer.remove();
        subPageContainer = null;
    }
    banner.style.display = 'none';
    homeWrapper.style.display = 'none';
    header.classList.remove('dimmed');
    subPageContainer = document.createElement('div');
    subPageContainer.innerHTML = DesignPage.buildDetail(id);
    app.appendChild(subPageContainer);
    currentPage = 'design-work-detail';

    // Cloud like (D1) for this design work — patch the button with the real count + liked state
    (function() {
        var item = dwItems[id];
        if (!item || typeof Cloud === 'undefined') return;
        var folder = item.folder || item.title || '';
        if (!folder) return;
        Cloud.likes.get('design', [folder]).then(function(res) {
            if (!res) return;
            var count = res.counts[folder] || 0;
            var liked = !!res.liked[folder];
            item.isLiked = liked;
            item.likeCount = count;
            var btn = document.getElementById('dwDetailLikeBtn');
            if (!btn) return;
            btn.classList.toggle('liked', liked);
            var svg = btn.querySelector('svg');
            if (svg) {
                if (liked) { svg.setAttribute('fill', '#ed4956'); svg.setAttribute('stroke', '#ed4956'); }
                else { svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); }
            }
            var ce = btn.querySelector('.dw-detail-like-count');
            if (ce) ce.textContent = count > 0 ? count : '';
        });
    })();
    updateNavActiveState(currentPage);

    var backBtn = document.getElementById('dwDetailBack');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.hash = '#/design-work';
        });
    }

    var mediaImages = subPageContainer.querySelectorAll('.dw-detail-media-image');
    mediaImages.forEach(function(imgWrapper) {
        imgWrapper.addEventListener('click', function() {
            var img = imgWrapper.querySelector('img');
            if (!img) return;
            var lightbox = document.createElement('div');
            lightbox.className = 'dw-media-lightbox';
            lightbox.innerHTML = '<button class="dw-media-lightbox-close">&times;</button>' +
                '<img src="' + img.src + '" alt="" oncontextmenu="return false" draggable="false">';
            document.body.appendChild(lightbox);

            var closeBtn = lightbox.querySelector('.dw-media-lightbox-close');
            function closeLightbox() {
                lightbox.remove();
            }
            closeBtn.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) closeLightbox();
            });
        });
    });

    var likeBtn = document.getElementById('dwDetailLikeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            var item = dwItems[id];
            if (!item) return;
            var folder = item.folder || item.title || '';
            // Optimistic toggle
            item.isLiked = !item.isLiked;
            item.likeCount = Math.max(0, (item.likeCount || 0) + (item.isLiked ? 1 : -1));
            this.classList.toggle('liked', item.isLiked);
            var svg = this.querySelector('svg');
            if (svg) {
                if (item.isLiked) {
                    svg.setAttribute('fill', '#ed4956');
                    svg.setAttribute('stroke', '#ed4956');
                } else {
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                }
            }
            var countEl = this.querySelector('.dw-detail-like-count');
            if (countEl) countEl.textContent = item.likeCount > 0 ? item.likeCount : '';
            // Cloud toggle, then reconcile with the authoritative count
            if (typeof Cloud !== 'undefined' && folder) {
                Cloud.likes.toggle('design', folder).then(function(res) {
                    if (!res) return;
                    item.isLiked = !!res.liked;
                    item.likeCount = res.count || 0;
                    var btn = document.getElementById('dwDetailLikeBtn');
                    if (!btn) return;
                    btn.classList.toggle('liked', item.isLiked);
                    var s = btn.querySelector('svg');
                    if (s) {
                        if (item.isLiked) { s.setAttribute('fill', '#ed4956'); s.setAttribute('stroke', '#ed4956'); }
                        else { s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); }
                    }
                    var ce = btn.querySelector('.dw-detail-like-count');
                    if (ce) ce.textContent = item.likeCount > 0 ? item.likeCount : '';
                });
            }
        });
    }
}



discAudio = new Audio();
if (window.discData && window.discData.tapes) {
var initDiscTapes = window.discData.tapes || [];
var initDiscIdx = window.discData.currentTapeIndex || 0;
if (initDiscTapes[initDiscIdx] && initDiscTapes[initDiscIdx].audio) {
    discAudio.src = initDiscTapes[initDiscIdx].audio;
    discAudio.load();
}
} // end if(window.discData)









document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var lightbox = document.querySelector('.dw-media-lightbox');
        if (lightbox) {
            lightbox.remove();
            return;
        }
        if (currentPage === 'design-work-detail') {
            window.location.hash = '#/design-work';
        }
    }
});

function handleRoute() {
    var hash = window.location.hash.replace('#/', '');
    if (!hash) {
        navigateTo('home');
        return;
    }
    // Skip transition on initial load (loading screen covers it)
    var skipTrans = !currentPage;
    // Only play transition for Fresh/Design detail pages
    var isDetail = hash.indexOf('fresh/detail/') === 0 || hash.indexOf('design-work/detail/') === 0;
    function proceed() { handleRouteInner(hash); }
    if (!skipTrans && isDetail && typeof PageTransition !== 'undefined') {
        PageTransition.play(proceed);
    } else {
        proceed();
    }
}

function handleRouteInner(hash) {
    if (!hash) {
        navigateTo('home');
    } else if (hash.indexOf('fresh/detail/n/') === 0) {
        var parts = hash.replace('fresh/detail/n/', '').split('/');
        var gIdx = parseInt(parts[0], 10);
        var nIdx = parseInt(parts[1], 10);
        if (!isNaN(gIdx) && !isNaN(nIdx)) {
            navigateToFreshHotDetail(gIdx, nIdx);
        } else {
            navigateTo('fresh');
        }
    } else if (hash.indexOf('fresh/detail/h/') === 0) {
        var gIdx = parseInt(hash.replace('fresh/detail/h/', ''), 10);
        if (!isNaN(gIdx)) {
            navigateToFreshHeroDetail(gIdx);
        } else {
            navigateTo('fresh');
        }
    } else if (hash.indexOf('fresh/detail/') === 0) {
        var id = parseInt(hash.replace('fresh/detail/', ''), 10);
        if (!isNaN(id) && freshItems[id]) {
            navigateToFreshDetail(id);
        } else if (!isNaN(id) && freshItems.length === 0) {
            var checkData = setInterval(function() {
                if (freshItems.length > 0 && freshItems[id]) {
                    clearInterval(checkData);
                    navigateToFreshDetail(id);
                } else if (freshItems.length > 0) {
                    clearInterval(checkData);
                    navigateTo('fresh');
                }
            }, 100);
            setTimeout(function() { clearInterval(checkData); }, 5000);
        } else {
            navigateTo('fresh');
        }
    } else if (hash.indexOf('design-work/detail/') === 0) {
        var id = parseInt(hash.replace('design-work/detail/', ''), 10);
        if (!isNaN(id) && dwItems[id]) {
            navigateToDesignWorkDetail(id);
        } else {
            navigateTo('design-work');
        }
    } else if (hash === 'design-work-list') {
        navigateTo('design-work-list');
    } else if (hash === 'disc-library') {
        navigateTo('disc-library');
    } else if (hash === 'signin' || hash === 'signup') {
        navigateTo(hash);
    } else {
        navigateTo(hash);
    }
}

window.discVisited = false;
var discAutoPlayed = false;
window.miniPlayerWasPlaying = false;

MiniPlayer.init({
    callbacks: {
        prevTrack: function() {
            var idx = DiscPage.getPrevTrackIndex();
            DiscPage.loadTrack(idx, function() {
                MiniPlayer.syncWithDisc();
                discAudio.play().catch(function(){});
            });
        },
        nextTrack: function() {
            var idx = DiscPage.getNextTrackIndex();
            DiscPage.loadTrack(idx, function() {
                MiniPlayer.syncWithDisc();
                discAudio.play().catch(function(){});
            });
        },
        goToDiscPage: function() {
            window.location.hash = '#/disc-library';
        },
        onProgressChange: function() {
            if (typeof DiscPage.updateProgress === 'function') DiscPage.updateProgress();
        },
        getCurrentPage: function() {
            return currentPage;
        }
    }
});

window.addEventListener('mousemove', function(e) {
    MiniPlayer.handleMouseMove(e);
});

window.addEventListener('touchmove', function(e) {
    MiniPlayer.handleTouchMove(e);
}, { passive: false });

window.addEventListener('mouseup', function() {
    MiniPlayer.handleMouseUp();
});

window.addEventListener('touchend', function() {
    MiniPlayer.handleMouseUp();
});

var originalNavigateTo = navigateTo;
navigateTo = function(pageName) {
    var wasDiscPage = currentPage === 'disc-library';
    if (wasDiscPage) {
        DiscPage.cleanup();
    }
    NotificationCenter.hide();
    // If user navigates elsewhere after disc was blocked, cancel auto-redirect
    if (pageName !== 'disc-library') {}
    originalNavigateTo(pageName);
    updateAuthUI();
    if (pageName !== 'disc-library' && discAudio && discAudio.src) {
        MiniPlayer.show();
    }
    setTimeout(function() {
        MiniPlayer.updateState(currentPage, DiscPage.getDiscIsPlaying(), discVisited);
    }, 50);
};

window.addEventListener('hashchange', handleRoute);
handleRoute();

// Clicking the nav link for the page you're already on = active refresh (true reload)
document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#/"]') : null;
    if (!a) return;
    var target = a.getAttribute('href');
    if (target && target === window.location.hash) {
        e.preventDefault();
        window.location.reload();
    }
});

window.addEventListener('storage', function(e) {
    if (!e.key) return;
    if (e.key === 'vipen_mgr_design_dwItems' && e.newValue) {
        try { dwItems = JSON.parse(e.newValue); } catch (ex) {}
        if (typeof currentPage === 'string' && currentPage.indexOf('design') === 0 && typeof DesignPage !== 'undefined' && DesignPage.renderDesignWorks) {
            DesignPage.renderDesignWorks();
        }
    }
    if (e.key === 'vipen_mgr_fresh_heroItems' && e.newValue) {
        try { freshHeroItems = JSON.parse(e.newValue); } catch (ex) {}
        if (currentPage === 'fresh' && typeof FreshPage !== 'undefined') {
            FreshPage.setData({ heroGroups: freshHeroItems, categories: freshCategories, items: freshItems });
        }
    }
    if (e.key === 'vipen_mgr_disc_tapes' && e.newValue) {
        try { window.discData.tapes = JSON.parse(e.newValue); } catch (ex) {}
        if (currentPage === 'disc-library' && typeof DiscPage !== 'undefined') {
            DiscPage.setDiscData(window.discData);
            DiscPage.syncCarousel();
        }
    }
    if (e.key === 'vipen_mgr_home_banner' && e.newValue) {
        try {
            var parsed = JSON.parse(e.newValue);
            if (parsed && parsed.groups) {
                BannerPage.bannerData.homeGroups = BannerPage.filterVisibleGroups(parsed.groups);
                if (currentPage === 'home') {
                    BannerPage.changeSlide(0);
                }
            }
        } catch (ex) {}
    }
});

})();

// Cover image fallback: tries cover.jpg → cover.png → cover.jpeg from R2
window.tryCoverFallback = function(img) {
    var discId = parseInt(img.getAttribute('data-disc-id'));
    if (!discId) { img.style.display = 'none'; return; }
    var tapes = window.discData && window.discData.tapes;
    if (!tapes) { img.style.display = 'none'; return; }
    var tape = tapes.find(function(t) { return t.id === discId; });
    if (!tape) { img.style.display = 'none'; return; }
    var idx = parseInt(img.getAttribute('data-cover-fb-idx') || '0');
    var fbs = tape.coverFallback || [];
    if (idx < fbs.length) {
        img.src = fbs[idx];
        img.setAttribute('data-cover-fb-idx', String(idx + 1));
    } else {
        img.onerror = null;
        img.style.display = 'none';
        if (img.parentNode) img.parentNode.style.background = 'linear-gradient(135deg,#1a1a2e,#16213e)';
    }
};