var ManagerGo = (function() {
    'use strict';

    var sessionToken = null;
    var adminUser = null;
    var currentPage = 'dashboard';

    var navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
        { id: 'home', label: 'HOME', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
        { id: 'fresh', label: 'Fresh', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
        { id: 'drafts', label: 'Drafts', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
        { id: 'design', label: 'Design', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
        { id: 'disc', label: 'Disc', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' },
        { id: 'users', label: 'Users', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { id: 'trash', label: 'Trash', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' },
        { id: 'settings', label: 'Settings', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>' }
    ];

    var freshData = { heroGroups: [], articles: [], categories: [] };
    var designData = { works: [] };
    var discData = { tapes: [] };
    var usersData = [];

    var STORAGE_KEYS = {
        freshHeroItems: 'vipen_mgr_fresh_heroItems',
        designDwItems: 'vipen_mgr_design_dwItems',
        discTapes: 'vipen_mgr_disc_tapes',
        users: 'vipen_mgr_users',
        trash: 'vipen_mgr_trash',
        drafts: 'vipen_mgr_drafts',
        published: 'vipen_mgr_published'
    };

    function saveToLocalStorage(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    }

    function loadFromLocalStorage(key) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function apiCall(endpoint, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/manager/' + endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            try { callback(JSON.parse(xhr.responseText)); } catch (e) { callback({ success: false, error: 'Parse error' }); }
        };
        xhr.onerror = function() { callback({ success: false, error: 'Network error' }); };
        var payload = data || {};
        if (sessionToken) payload.sessionToken = sessionToken;
        xhr.send(JSON.stringify(payload));
    }

    function showToast(msg, isError) {
        var existing = document.querySelector('.manager-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'manager-toast' + (isError ? ' error' : '');
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    }

    function validateCoverImage(file, onValid, onInvalid) {
        var minW = CONFIG.DISC_COVER_MIN_WIDTH || 800;
        var minH = CONFIG.DISC_COVER_MIN_HEIGHT || 800;
        if (!file.type.startsWith('image/')) {
            onInvalid('Only images are supported');
            return;
        }
        var img = new Image();
        var objectUrl = URL.createObjectURL(file);
        img.onload = function() {
            URL.revokeObjectURL(objectUrl);
            if (img.naturalWidth < minW || img.naturalHeight < minH) {
                onInvalid('Cover image must be at least ' + minW + 'x' + minH + 'px (current: ' + img.naturalWidth + 'x' + img.naturalHeight + 'px)');
                return;
            }
            onValid();
        };
        img.onerror = function() {
            URL.revokeObjectURL(objectUrl);
            onInvalid('Failed to load image');
        };
        img.src = objectUrl;
    }

    function formatDate(isoStr) {
        if (!isoStr) return '-';
        var d = new Date(isoStr);
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function timeAgo(isoStr) {
        if (!isoStr) return '-';
        var d = new Date(isoStr);
        var now = new Date();
        var diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return formatDate(isoStr);
    }

    function buildSidebar() {
        var navHtml = '';
        for (var i = 0; i < navItems.length; i++) {
            var item = navItems[i];
            navHtml += '<button class="manager-nav-item' + (item.id === currentPage ? ' active' : '') + '" data-page="' + item.id + '">' +
                item.icon + '<span>' + item.label + '</span></button>';
        }

        return '<div class="manager-sidebar">' +
            '<div class="manager-sidebar-header">' +
            '<div class="manager-sidebar-logo">ManagerGo<span class="manager-sidebar-logo-plus">Plus</span></div>' +
            '<div class="manager-sidebar-sub">VIPEN ADMIN</div>' +
            '</div>' +
            '<div class="manager-sidebar-nav" id="managerNav">' + navHtml + '</div>' +
            '<div class="manager-sidebar-footer">' +
            '<div class="manager-sidebar-user">' +
            '<div class="manager-sidebar-username" id="managerSidebarUser">' + (adminUser ? adminUser.username : '') + '</div>' +
            '<button class="manager-sidebar-logout" id="managerLogoutBtn" title="Logout">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="manager-sidebar-back">' +
            '<button class="manager-sidebar-back-btn" id="managerBackToSiteBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
            '<span>Back to Site</span>' +
            '</button>' +
            '</div>' +
            '</div>';
    }

    function buildMainArea() {
        return '<div class="manager-main" id="managerMainArea"></div>';
    }

    function renderLayout() {
        var app = document.getElementById('managerApp');
        if (!app) return;
        app.innerHTML = buildSidebar() + buildMainArea();

        var navItemsEl = document.querySelectorAll('.manager-nav-item');
        for (var i = 0; i < navItemsEl.length; i++) {
            navItemsEl[i].addEventListener('click', function() {
                var page = this.getAttribute('data-page');
                if (page) navigateTo(page);
            });
        }

        var logoutBtn = document.getElementById('managerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                sessionStorage.removeItem('manager_session');
                sessionStorage.removeItem('manager_user');
                window.location.reload();
            });
        }

        var backBtn = document.getElementById('managerBackToSiteBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                window.location.href = 'index.html';
            });
        }
    }

    function navigateTo(page) {
        currentPage = page;
        var navBtns = document.querySelectorAll('.manager-nav-item');
        for (var i = 0; i < navBtns.length; i++) {
            navBtns[i].classList.toggle('active', navBtns[i].getAttribute('data-page') === page);
        }
        var mainArea = document.getElementById('managerMainArea');
        if (!mainArea) return;

        if (page === 'dashboard') renderDashboard(mainArea);
        else if (page === 'home') renderHome(mainArea);
        else if (page === 'fresh') renderFreshManager(mainArea);
        else if (page === 'drafts') renderDrafts(mainArea);
        else if (page === 'design') renderDesignManager(mainArea);
        else if (page === 'disc') renderDiscManager(mainArea);
        else if (page === 'users') renderUsersManager(mainArea);
        else if (page === 'trash') renderTrash(mainArea);
        else if (page === 'settings') renderSettings(mainArea);
    }

    function loadJsonData(url, callback) {
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(d) { callback(d); })
            .catch(function() { callback(null); });
    }

    function renderDashboard(container) {
        container.innerHTML = '<div class="manager-main-header"><h1 class="manager-main-title">Dashboard</h1></div>' +
            '<div id="dashboardContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        loadJsonData('data/manager/users.json', function(users) {
            var savedUsers = loadFromLocalStorage(STORAGE_KEYS.users);
            if (savedUsers) {
                usersData = savedUsers;
            } else if (users) {
                usersData = users;
            }
            loadJsonData('data.json', function(siteData) {
                var dc = document.getElementById('dashboardContent');
                if (!dc) return;

                var totalUsers = usersData.length || 0;
                var activeUsers = usersData.filter(function(u) { return u.status === 'active'; }).length || 0;
                var totalArticles = (siteData && siteData.fresh && siteData.fresh.items) ? siteData.fresh.items.length : 0;
                var mgrDwItems = loadFromLocalStorage(STORAGE_KEYS.designDwItems);
                var mgrDiscTapes = loadFromLocalStorage(STORAGE_KEYS.discTapes);
                var mgrFreshHero = loadFromLocalStorage(STORAGE_KEYS.freshHeroItems);
                var totalWorks = mgrDwItems ? mgrDwItems.length : ((siteData && siteData.design && siteData.design.dwItems) ? siteData.design.dwItems.length : 0);
                var totalTracks = mgrDiscTapes ? mgrDiscTapes.length : ((siteData && siteData.disc && siteData.disc.tapes) ? siteData.disc.tapes.length : 0);
                var totalHeroGroups = mgrFreshHero ? mgrFreshHero.length : ((siteData && siteData.fresh && siteData.fresh.heroGroups) ? siteData.fresh.heroGroups.length : ((siteData && siteData.fresh && siteData.fresh.heroItems) ? siteData.fresh.heroItems.length : 0));

                var sortedUsers = usersData.slice().sort(function(a, b) {
                    return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
                });
                var topUsers = sortedUsers.slice(0, 5);

                dc.innerHTML =
                    '<div class="manager-stats-grid">' +
                    '<div class="manager-stat-card">' +
                    '<svg class="manager-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' +
                    '<div class="manager-stat-value">' + totalUsers + '</div>' +
                    '<div class="manager-stat-label">Total Users</div>' +
                    '</div>' +
                    '<div class="manager-stat-card">' +
                    '<svg class="manager-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                    '<div class="manager-stat-value">' + totalArticles + '</div>' +
                    '<div class="manager-stat-label">Fresh Articles</div>' +
                    '</div>' +
                    '<div class="manager-stat-card">' +
                    '<svg class="manager-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                    '<div class="manager-stat-value">' + totalWorks + '</div>' +
                    '<div class="manager-stat-label">Design Works</div>' +
                    '</div>' +
                    '<div class="manager-stat-card">' +
                    '<svg class="manager-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' +
                    '<div class="manager-stat-value">' + totalTracks + '</div>' +
                    '<div class="manager-stat-label">Disc Tracks</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="manager-card">' +
                    '<div class="manager-card-header">Activity Leaderboard</div>' +
                    buildActivityLeaderboard(topUsers) +
                    '</div>' +
                    '</div>';

            });
        });
    }

    function buildActivityLeaderboard(users) {
        if (!users || users.length === 0) return '<div style="color:rgba(255,255,255,.25);font-size:.11rem;padding:.1rem 0;">No data</div>';
        var html = '';
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            var rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
            html += '<div class="manager-leaderboard-item ' + rankClass + '" data-user-id="' + u.id + '">' +
                '<div class="manager-leaderboard-rank">' + (i + 1) + '</div>' +
                '<img src="' + u.avatar + '" style="width:.32rem;height:.32rem;border-radius:50%;object-fit:cover;">' +
                '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:.12rem;">' + u.username + '</div>' +
                '<div style="font-size:.1rem;color:rgba(255,255,255,.25);">Last login: ' + timeAgo(u.lastLogin) + '</div>' +
                '</div>' +
                '<span class="manager-badge manager-badge-' + (u.role || 'viper').toLowerCase() + '">' + (u.role || 'Viper') + '</span>' +
                '</div>';
        }
        return html;
    }

    function renderFreshManager(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Fresh Manager</h1>' +
            '<div class="manager-main-actions">' +
            '<button class="manager-btn manager-btn-primary" id="freshAddGroupBtn">' +
            '<svg class="manager-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            'Add Group</button>' +
            '</div>' +
            '</div>' +
            '<div id="freshManagerContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        loadJsonData('data.json', function(siteData) {
            var fc = document.getElementById('freshManagerContent');
            if (!fc) return;
            var savedHeroGroups = loadFromLocalStorage(STORAGE_KEYS.freshHeroItems);
            if (savedHeroGroups) {
                freshData.heroGroups = migrateLegacyData(savedHeroGroups);
            } else if (siteData && siteData.fresh && siteData.fresh.heroGroups) {
                freshData.heroGroups = siteData.fresh.heroGroups || [];
            } else if (siteData && siteData.fresh && siteData.fresh.heroItems) {
                freshData.heroGroups = migrateLegacyData(siteData.fresh.heroItems);
            }
            if (siteData && siteData.fresh) {
                freshData.categories = siteData.fresh.categories || [];
            }
            renderFreshGroups(fc);
        });

        document.getElementById('freshAddGroupBtn').addEventListener('click', function() {
            openFreshGroupEditor(null);
        });
    }

    function migrateLegacyData(oldData) {
        if (!oldData || !Array.isArray(oldData)) return [];
        if (oldData.length > 0 && oldData[0].headline) {
            return oldData.map(function(group) {
                if (!group.spot && group.headline && (group.headline.cardTag || group.headline.cardTitle || group.headline.cardDesc)) {
                    group.spot = {
                        tag: group.headline.cardTag || '',
                        title: group.headline.cardTitle || '',
                        titleEn: group.headline.cardTitleEn || '',
                        summary: group.headline.cardDesc || '',
                        summaryEn: group.headline.cardDescEn || '',
                        image: '',
                        body: '<p>' + (group.headline.cardTitle || '') + '</p><p>' + (group.headline.cardDesc || '') + '</p>',
                        bodyEn: '',
                        date: '',
                        bgColor: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)'
                    };
                    delete group.headline.cardTag;
                    delete group.headline.cardTitle;
                    delete group.headline.cardDesc;
                }
                if (!group.spot) group.spot = { tag: '', title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', bgColor: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)' };
                return group;
            });
        }
        return oldData.map(function(item) {
            var hotNews = [];
            if (item.newsItems) {
                hotNews = item.newsItems.map(function(n) {
                    return {
                        title: n.text || '',
                        titleEn: '',
                        summary: '',
                        summaryEn: '',
                        image: '',
                        body: '<p>' + (n.text || '') + '</p>',
                        bodyEn: '',
                        date: n.date || '',
                        category: n.label || ''
                    };
                });
            }
            return {
                id: item.id,
                headline: {
                    bgImage: item.bgImage || '',
                    mainTitle: item.mainTitle || '',
                    subTitle: item.subTitle || '',
                    titleImage: '',
                    body: '<p>' + (item.cardTitle || '') + '</p><p>' + (item.cardDesc || '') + '</p>'
                },
                spot: {
                    tag: item.cardTag || '',
                    title: item.cardTitle || '',
                    titleEn: '',
                    summary: item.cardDesc || '',
                    summaryEn: '',
                    image: '',
                    body: '<p>' + (item.cardTitle || '') + '</p><p>' + (item.cardDesc || '') + '</p>',
                    bodyEn: '',
                    date: '',
                    bgColor: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)'
                },
                hotNews: hotNews
            };
        });
    }

    function renderFreshGroups(container) {
        if (!freshData.heroGroups || freshData.heroGroups.length === 0) {
            container.innerHTML = '<div class="manager-empty">No groups yet. Create your first news group.</div>';
            return;
        }

        var html = '<div class="manager-fresh-groups">';
        for (var i = 0; i < freshData.heroGroups.length; i++) {
            var group = freshData.heroGroups[i];
            html += buildFreshGroupCard(group, i);
        }
        html += '</div>';
        container.innerHTML = html;

        bindFreshGroupEvents(container);
    }

    function buildFreshGroupCard(group, index) {
        var h = group.headline || {};
        var s = group.spot || {};
        var hotNews = group.hotNews || [];

        var hotNewsHtml = '';
        for (var i = 0; i < 3; i++) {
            var n = (hotNews[i]) ? hotNews[i] : null;
            if (n && n.title) {
                var thumbHtml = n.image
                    ? '<img src="' + n.image + '" alt="">'
                    : '<div class="manager-fresh-hot-thumb-noimg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                hotNewsHtml += '<div class="manager-fresh-hot-item" data-group-idx="' + index + '" data-hot-idx="' + i + '">' +
                    '<div class="manager-fresh-hot-thumb">' + thumbHtml + '</div>' +
                    '<div class="manager-fresh-hot-body">' +
                    '<div class="manager-fresh-hot-title">' + (n.title || 'Untitled') + '</div>' +
                    '<div class="manager-fresh-hot-summary">' + (n.summary || '') + '</div>' +
                    '</div>' +
                    '<span class="manager-fresh-hot-date">' + (n.date || '') + '</span>' +
                    '</div>';
            } else {
                hotNewsHtml += '<div class="manager-fresh-hot-item manager-fresh-hot-item-empty" data-group-idx="' + index + '" data-hot-idx="' + i + '">' +
                    '<div class="manager-fresh-hot-thumb">' +
                    '<div class="manager-fresh-hot-thumb-noimg">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    '</div>' +
                    '</div>' +
                    '<div class="manager-fresh-hot-body">' +
                    '<div class="manager-fresh-hot-title">New Article</div>' +
                    '<div class="manager-fresh-hot-summary">Click to add content</div>' +
                    '</div>' +
                    '</div>';
            }
        }

        var spotBgStyle = s.bgColor ? 'background:' + s.bgColor + ';' : '';

        return '<div class="manager-fresh-weekly-group" data-group-index="' + index + '">' +
            '<div class="manager-fresh-weekly-divider">' +
            '<div class="manager-fresh-weekly-label">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
            'Group ' + (index + 1) + '</div>' +
            '<div class="manager-fresh-weekly-actions">' +
            '<button class="manager-btn manager-btn-danger manager-btn-sm btn-fresh-delete-group" data-idx="' + index + '">Delete</button>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-headline-section">' +
            '<div class="manager-fresh-section-label"><span class="manager-fresh-section-dot"></span>HEADLINE</div>' +
            '<div class="manager-fresh-headline-preview" style="background-image:url(' + (h.bgImage || '') + ')">' +
            '<div class="manager-fresh-headline-overlay"></div>' +
            '<div class="manager-fresh-headline-info">' +
            '<h3>' + (h.mainTitle || 'Untitled') + '</h3>' +
            '<p>' + (h.subTitle || '') + '</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-spot-section" data-group-idx="' + index + '">' +
            '<div class="manager-fresh-section-label"><span class="manager-fresh-section-dot" style="background:#f59e0b;"></span>SPOT</div>' +
            '<div class="manager-fresh-spot-card" style="' + spotBgStyle + '">' +
            '<div class="manager-fresh-spot-card-tag">' + (s.tag || 'No tag') + '</div>' +
            '<div class="manager-fresh-spot-card-title">' + (s.title || 'No title') + '</div>' +
            '<div class="manager-fresh-spot-card-summary">' + (s.summary || 'No summary') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-hot-section">' +
            '<div class="manager-fresh-section-label"><span class="manager-fresh-section-dot hot"></span>HOT NEWS <span class="manager-fresh-count">' + hotNews.length + '</span></div>' +
            '<div class="manager-fresh-hot-list">' + hotNewsHtml + '</div>' +
            '</div>' +
            '<div class="manager-fresh-group-actions">' +
            '<button class="manager-fresh-group-preview-btn btn-fresh-preview-group" data-idx="' + index + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            'Preview</button>' +
            '<button class="manager-fresh-group-publish-btn btn-fresh-publish-group" data-idx="' + index + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
            'Publish</button>' +
            '</div>' +
            '</div>';
    }

    function bindFreshGroupEvents(container) {
        var headlineSections = container.querySelectorAll('.manager-fresh-headline-section');
        headlineSections.forEach(function(section) {
            section.addEventListener('click', function() {
                var groupEl = section.closest('.manager-fresh-weekly-group');
                var idx = parseInt(groupEl.getAttribute('data-group-index'), 10);
                openFreshHeadlineEditor(idx);
            });
        });

        var hotItems = container.querySelectorAll('.manager-fresh-hot-item');
        hotItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var gIdx = parseInt(this.getAttribute('data-group-idx'), 10);
                var hIdx = parseInt(this.getAttribute('data-hot-idx'), 10);
                openFreshArticleEditor(gIdx, hIdx);
            });
        });

        var spotSections = container.querySelectorAll('.manager-fresh-spot-section');
        spotSections.forEach(function(section) {
            section.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-group-idx'), 10);
                openFreshSpotEditor(idx);
            });
        });

        var delBtns = container.querySelectorAll('.btn-fresh-delete-group');
        delBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-idx'), 10);
                var group = freshData.heroGroups[idx];
                var self = this;
                showDeleteConfirm(
                    'Delete Group',
                    'Are you sure you want to delete this group and all its articles? This will be moved to Trash.',
                    'Delete',
                    'Move to Trash',
                    function(confirmed) {
                        if (!confirmed) return;
                        saveToTrash('fresh_group', JSON.parse(JSON.stringify(group)), STORAGE_KEYS.freshHeroItems);
                        freshData.heroGroups.splice(idx, 1);
                        saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
                        var fc = document.getElementById('freshManagerContent');
                        if (fc) renderFreshGroups(fc);
                        showToast('Group moved to Trash');
                    }
                );
            });
        });

        var previewBtns = container.querySelectorAll('.btn-fresh-preview-group');
        previewBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-idx'), 10);
                openFreshPreview(idx);
            });
        });

        var publishBtns = container.querySelectorAll('.btn-fresh-publish-group');
        publishBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-idx'), 10);
                openFreshPreview(idx);
            });
        });
    }

    function createImageUploadField(idSuffix, currentValue, label, fieldId) {
        var bgStyle = currentValue
            ? 'background:url(' + currentValue + ') center/cover no-repeat'
            : '';
        return '<div class="manager-form-group">' +
            '<label class="manager-form-label">' + label + '</label>' +
            '<div class="manager-design-cover-zone" id="' + fieldId + '">' +
            '<input type="file" class="manager-design-file-input" id="' + fieldId + 'Input" accept="image/*">' +
            '<div class="manager-design-cover-preview" id="' + fieldId + 'Preview" style="' + bgStyle + '" data-image-url="' + escapeAttr(currentValue || '') + '"></div>' +
            '<div class="manager-design-cover-placeholder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '<span>Click to upload</span>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function validateFreshImage(file, onValid, onInvalid) {
        var minW = 1200;
        var minH = 400;
        if (!file.type.startsWith('image/')) {
            onInvalid('Only images are supported');
            return;
        }
        var img = new Image();
        var objectUrl = URL.createObjectURL(file);
        img.onload = function() {
            URL.revokeObjectURL(objectUrl);
            if (img.naturalWidth < minW || img.naturalHeight < minH) {
                onInvalid('Banner image must be at least ' + minW + 'x' + minH + 'px (current: ' + img.naturalWidth + 'x' + img.naturalHeight + 'px)');
                return;
            }
            onValid();
        };
        img.onerror = function() {
            URL.revokeObjectURL(objectUrl);
            onInvalid('Failed to load image');
        };
        img.src = objectUrl;
    }

    function bindImageUploadField(overlay, fieldId, validator) {
        var zone = overlay.querySelector('#' + fieldId);
        var input = overlay.querySelector('#' + fieldId + 'Input');
        var preview = overlay.querySelector('#' + fieldId + 'Preview');
        if (!zone || !input) return;
        zone.addEventListener('click', function() { input.click(); });
        zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) handleImageFile(e.dataTransfer.files[0]);
        });
        input.addEventListener('change', function() {
            if (this.files.length > 0) handleImageFile(this.files[0]);
        });
        function handleImageFile(file) {
            var v = validator || validateCoverImage;
            v(file, function() {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var dataUrl = e.target.result;
                    preview.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
                    preview.setAttribute('data-image-url', dataUrl);
                    showToast('Image uploaded successfully');
                };
                reader.readAsDataURL(file);
            }, function(msg) {
                showToast(msg, true);
            });
        }
    }

    function getImageUploadValue(overlay, fieldId) {
        var preview = overlay.querySelector('#' + fieldId + 'Preview');
        if (!preview) return '';
        return preview.getAttribute('data-image-url') || '';
    }

    function buildRichTextToolbar(idPrefix) {
        return '<div class="manager-rte-toolbar">' +
            '<button class="manager-rte-btn" data-cmd="bold" title="Bold"><b>B</b></button>' +
            '<button class="manager-rte-btn" data-cmd="italic" title="Italic"><i>I</i></button>' +
            '<button class="manager-rte-btn" data-cmd="underline" title="Underline"><u>U</u></button>' +
            '<span class="manager-rte-sep"></span>' +
            '<button class="manager-rte-btn" data-cmd="formatBlock" data-arg="h2" title="Heading 2">H2</button>' +
            '<button class="manager-rte-btn" data-cmd="formatBlock" data-arg="h3" title="Heading 3">H3</button>' +
            '<button class="manager-rte-btn" data-cmd="formatBlock" data-arg="p" title="Paragraph">P</button>' +
            '<span class="manager-rte-sep"></span>' +
            '<button class="manager-rte-btn" data-cmd="insertImage" title="Insert Image">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '</button>' +
            '<button class="manager-rte-btn" data-cmd="insertLink" title="Insert Link">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
            '</button>' +
            '<span class="manager-rte-sep"></span>' +
            '<button class="manager-rte-btn" data-cmd="insertUnorderedList" title="Bullet List">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
            '</button>' +
            '<button class="manager-rte-btn manager-rte-btn-expand" data-cmd="expand" title="Expand Editor">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
            '</button>' +
            '</div>';
    }

    function bindRichTextToolbar(toolbar, editorId) {
        var buttons = toolbar.querySelectorAll('.manager-rte-btn');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var cmd = this.getAttribute('data-cmd');
                var arg = this.getAttribute('data-arg') || null;
                var editor = document.getElementById(editorId);
                if (!editor) return;

                if (cmd === 'expand') {
                    openFullscreenEditor(editor);
                    return;
                }

                if (cmd === 'insertImage') {
                    var imgInput = document.createElement('input');
                    imgInput.type = 'file';
                    imgInput.accept = 'image/*';
                    imgInput.style.display = 'none';
                    document.body.appendChild(imgInput);
                    imgInput.click();
                    imgInput.addEventListener('change', function() {
                        if (this.files.length > 0) {
                            var reader = new FileReader();
                            reader.onload = function(e) {
                                editor.focus();
                                var imgHtml = '<figure class="rte-figure" contenteditable="false">' +
                                    '<div class="rte-figure-img-wrap">' +
                                    '<img src="' + e.target.result + '" alt="" style="max-width:100%">' +
                                    '<div class="rte-figure-resize-handle"></div>' +
                                    '</div>' +
                                    '<figcaption class="rte-figure-caption" contenteditable="true">Click to add caption</figcaption>' +
                                    '</figure>';
                                document.execCommand('insertHTML', false, imgHtml);
                                bindFigureInteractions(editor);
                            };
                            reader.readAsDataURL(this.files[0]);
                        }
                        document.body.removeChild(imgInput);
                    });
                } else if (cmd === 'insertLink') {
                    var linkUrl = prompt('Enter link URL:');
                    if (linkUrl) {
                        editor.focus();
                        document.execCommand('createLink', false, linkUrl);
                    }
                } else if (cmd === 'formatBlock') {
                    document.execCommand(cmd, false, arg);
                } else {
                    document.execCommand(cmd, false, null);
                }
                editor.focus();
            });
        });
    }

    function bindFigureInteractions(editor) {
        var figures = editor.querySelectorAll('.rte-figure');
        figures.forEach(function(fig) {
            var caption = fig.querySelector('.rte-figure-caption');
            var imgWrap = fig.querySelector('.rte-figure-img-wrap');
            var img = imgWrap ? imgWrap.querySelector('img') : null;
            var handle = imgWrap ? imgWrap.querySelector('.rte-figure-resize-handle') : null;

            if (caption) {
                caption.addEventListener('focus', function() {
                    if (this.textContent === 'Click to add caption') {
                        this.textContent = '';
                    }
                });
                caption.addEventListener('blur', function() {
                    if (this.textContent.trim() === '') {
                        this.textContent = 'Click to add caption';
                    }
                });
            }

            if (handle && img) {
                handle.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handle._resizing = true;
                    handle._startX = e.clientX;
                    handle._startY = e.clientY;
                    handle._startW = img.offsetWidth;
                    handle._startH = img.offsetHeight;
                    handle._ratio = img.offsetWidth / img.offsetHeight;
                    document.body.style.cursor = 'nwse-resize';
                    document.body.style.userSelect = 'none';
                });
            }

            if (!fig.querySelector('.rte-figure-delete-btn')) {
                var delBtn = document.createElement('button');
                delBtn.className = 'rte-figure-delete-btn';
                delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                delBtn.title = 'Delete image';
                delBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    fig.remove();
                });
                fig.appendChild(delBtn);
            }

            fig.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });

        if (!editor._figureListenersBound) {
            editor._figureListenersBound = true;
            window.addEventListener('mousemove', function(e) {
                var figures = editor.querySelectorAll('.rte-figure');
                figures.forEach(function(fig) {
                    var img = fig.querySelector('img');
                    if (!img) return;
                    var handle = fig.querySelector('.rte-figure-resize-handle');
                    var rect = handle ? handle.getBoundingClientRect() : null;
                    if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                        var startX = handle._startX, startY = handle._startY, startW = handle._startW, startH = handle._startH, ratio = handle._ratio;
                        if (handle._resizing && startX !== undefined) {
                            var dx = e.clientX - startX;
                            var newW = Math.max(80, startW + dx);
                            var newH = newW / ratio;
                            img.style.width = newW + 'px';
                            img.style.height = newH + 'px';
                            img.style.maxWidth = 'none';
                        }
                    }
                });
            });
            window.addEventListener('mouseup', function() {
                var figures = editor.querySelectorAll('.rte-figure');
                figures.forEach(function(fig) {
                    var handle = fig.querySelector('.rte-figure-resize-handle');
                    if (handle) handle._resizing = false;
                });
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            });
        }
    }

    function openFullscreenEditor(sourceEditor) {
        var currentContent = sourceEditor.innerHTML;
        var overlay = document.createElement('div');
        overlay.className = 'manager-rte-fullscreen-overlay';
        overlay.innerHTML =
            '<div class="manager-rte-fullscreen-editor">' +
            '<div class="manager-rte-fullscreen-header">' +
            '<span class="manager-rte-fullscreen-title">Expanded Editor</span>' +
            '<button class="manager-rte-fullscreen-close" id="fsEditorClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
            'Collapse' +
            '</button>' +
            '</div>' +
            '<div class="manager-rte-fullscreen-body">' +
            buildRichTextToolbar('rte-fullscreen') +
            '<div class="manager-rte-editor" id="rte-fullscreen-editor" contenteditable="true">' + currentContent + '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var fsEditor = overlay.querySelector('#rte-fullscreen-editor');
        var toolbarBars = overlay.querySelectorAll('.manager-rte-toolbar');
        toolbarBars.forEach(function(bar) {
            bindRichTextToolbar(bar, 'rte-fullscreen-editor');
        });

        fsEditor.focus();

        function closeFullscreen() {
            sourceEditor.innerHTML = fsEditor.innerHTML;
            overlay.remove();
            sourceEditor.focus();
        }

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeFullscreen();
        });
        overlay.querySelector('#fsEditorClose').addEventListener('click', closeFullscreen);

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeFullscreen();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function openFreshGroupEditor(editIndex) {
        var isEdit = editIndex !== null;
        var group = isEdit
            ? JSON.parse(JSON.stringify(freshData.heroGroups[editIndex]))
            : {
                id: Date.now(),
                headline: { bgImage: '', mainTitle: '', subTitle: '', mainTitleEn: '', subTitleEn: '', titleImage: '', body: '', bodyEn: '' },
                spot: { tag: '', title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', bgColor: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)' },
                hotNews: []
            };

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-fresh-editor-overlay';
        overlay.id = 'freshEditorOverlay';

        var hotNewsHtml = '';
        for (var hi = 0; hi < 3; hi++) {
            var hn = (group.hotNews && group.hotNews[hi]) ? group.hotNews[hi] : { title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', category: '' };
            hotNewsHtml += '<div class="manager-fresh-hot-editor" data-hot-idx="' + hi + '">' +
                '<div class="manager-fresh-hot-editor-header">' +
                '<span class="manager-fresh-hot-editor-num">Hot #' + (hi + 1) + '</span>' +
                (hi >= (group.hotNews ? group.hotNews.length : 0) ? '<span class="manager-fresh-hot-editor-empty">(empty)</span>' : '') +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.12rem;">' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Title</label>' +
                '<input type="text" class="manager-form-input fresh-hot-title" value="' + escapeAttr(hn.title) + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Title (EN)</label>' +
                '<input type="text" class="manager-form-input fresh-hot-title-en" value="' + escapeAttr(hn.titleEn) + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Date</label>' +
                '<input type="text" class="manager-form-input manager-form-input-readonly fresh-hot-date" value="' + escapeAttr(hn.date) + '" readonly></div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.12rem;">' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Summary</label>' +
                '<input type="text" class="manager-form-input fresh-hot-summary" value="' + escapeAttr(hn.summary) + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Summary (EN)</label>' +
                '<input type="text" class="manager-form-input fresh-hot-summary-en" value="' + escapeAttr(hn.summaryEn) + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Category</label>' +
                '<input type="text" class="manager-form-input fresh-hot-cat" value="' + escapeAttr(hn.category) + '">' +
                '</div>' +
                '</div>' +
                createImageUploadField('hot-' + hi, hn.image, 'Cover Image', 'freshHotImage' + hi) +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Body Content</label>' +
                buildRichTextToolbar('rte-hot-' + hi) +
                '<div class="manager-rte-editor" id="rte-hot-' + hi + '" contenteditable="true">' + (hn.body || '') + '</div>' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Body Content (EN)</label>' +
                buildRichTextToolbar('rte-hot-en-' + hi) +
                '<div class="manager-rte-editor" id="rte-hot-en-' + hi + '" contenteditable="true">' + (hn.bodyEn || '') + '</div>' +
                '</div>' +
                '</div>';
        }

        overlay.innerHTML =
            '<div class="manager-fresh-editor">' +
            '<div class="manager-fresh-editor-header">' +
            '<button class="manager-design-editor-back" id="freshEditorBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<div class="manager-design-editor-title">' + (isEdit ? 'Edit Group' : 'New Group') + '</div>' +
            '<button class="manager-btn manager-btn-primary manager-design-editor-save active" id="freshEditorSave">Save</button>' +
            '</div>' +
            '<div class="manager-fresh-editor-body">' +
            '<div class="manager-fresh-editor-section">' +
            '<div class="manager-fresh-section-label large"><span class="manager-fresh-section-dot"></span>HEADLINE</div>' +
            createImageUploadField('headline-bg', group.headline.bgImage, 'Background Image', 'freshBgImage') +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Main Title</label>' +
            '<input type="text" class="manager-form-input" id="freshMainTitle" value="' + escapeAttr(group.headline.mainTitle) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Main Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshMainTitleEn" value="' + escapeAttr(group.headline.mainTitleEn) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Sub Title</label>' +
            '<input type="text" class="manager-form-input" id="freshSubTitle" value="' + escapeAttr(group.headline.subTitle) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Sub Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshSubTitleEn" value="' + escapeAttr(group.headline.subTitleEn) + '">' +
            '</div>' +
            '</div>' +
            createImageUploadField('headline-ti', group.headline.titleImage, 'Title Image', 'freshTitleImage') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content</label>' +
            buildRichTextToolbar('rte-headline') +
            '<div class="manager-rte-editor" id="rte-headline" contenteditable="true">' + (group.headline.body || '') + '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content (EN)</label>' +
            buildRichTextToolbar('rte-headline-en') +
            '<div class="manager-rte-editor" id="rte-headline-en" contenteditable="true">' + (group.headline.bodyEn || '') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-editor-section">' +
            '<div class="manager-fresh-section-label large"><span class="manager-fresh-section-dot" style="background:#f59e0b;"></span>SPOT</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Tag</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTag" value="' + escapeAttr(group.spot.tag) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Date</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotDate" value="' + escapeAttr(group.spot.date) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTitle" value="' + escapeAttr(group.spot.title) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTitleEn" value="' + escapeAttr(group.spot.titleEn) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotSummary" value="' + escapeAttr(group.spot.summary) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotSummaryEn" value="' + escapeAttr(group.spot.summaryEn) + '">' +
            '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Background Color (CSS gradient)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotBgColor" value="' + escapeAttr(group.spot.bgColor) + '" placeholder="linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)">' +
            '</div>' +
            createImageUploadField('spot-img', group.spot.image, 'Spot Image', 'freshSpotImage') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content</label>' +
            buildRichTextToolbar('rte-spot') +
            '<div class="manager-rte-editor" id="rte-spot" contenteditable="true">' + (group.spot.body || '') + '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content (EN)</label>' +
            buildRichTextToolbar('rte-spot-en') +
            '<div class="manager-rte-editor" id="rte-spot-en" contenteditable="true">' + (group.spot.bodyEn || '') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-editor-section">' +
            '<div class="manager-fresh-section-label large"><span class="manager-fresh-section-dot hot"></span>HOT NEWS</div>' +
            hotNewsHtml +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var toolbarBars = overlay.querySelectorAll('.manager-rte-toolbar');
        toolbarBars.forEach(function(bar) {
            var editorId = bar.nextElementSibling ? bar.nextElementSibling.id : null;
            if (editorId) bindRichTextToolbar(bar, editorId);
        });

        bindImageUploadField(overlay, 'freshBgImage', validateFreshImage);
        bindImageUploadField(overlay, 'freshTitleImage');
        bindImageUploadField(overlay, 'freshSpotImage');
        for (var hi = 0; hi < 3; hi++) {
            bindImageUploadField(overlay, 'freshHotImage' + hi);
        }

        function closeEditor() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditor(); });
        overlay.querySelector('#freshEditorBack').addEventListener('click', closeEditor);

        overlay.querySelector('#freshEditorSave').addEventListener('click', function() {
            var headlineBody = overlay.querySelector('#rte-headline').innerHTML.trim();
            var headlineBodyEn = overlay.querySelector('#rte-headline-en').innerHTML.trim();
            var spotBody = overlay.querySelector('#rte-spot').innerHTML.trim();
            var spotBodyEn = overlay.querySelector('#rte-spot-en').innerHTML.trim();
            var updated = {
                id: group.id,
                headline: {
                    bgImage: getImageUploadValue(overlay, 'freshBgImage'),
                    mainTitle: overlay.querySelector('#freshMainTitle').value.trim(),
                    mainTitleEn: overlay.querySelector('#freshMainTitleEn').value.trim(),
                    subTitle: overlay.querySelector('#freshSubTitle').value.trim(),
                    subTitleEn: overlay.querySelector('#freshSubTitleEn').value.trim(),
                    titleImage: getImageUploadValue(overlay, 'freshTitleImage'),
                    body: headlineBody,
                    bodyEn: headlineBodyEn
                },
                spot: {
                    tag: overlay.querySelector('#freshSpotTag').value.trim(),
                    title: overlay.querySelector('#freshSpotTitle').value.trim(),
                    titleEn: overlay.querySelector('#freshSpotTitleEn').value.trim(),
                    summary: overlay.querySelector('#freshSpotSummary').value.trim(),
                    summaryEn: overlay.querySelector('#freshSpotSummaryEn').value.trim(),
                    image: getImageUploadValue(overlay, 'freshSpotImage'),
                    body: spotBody,
                    bodyEn: spotBodyEn,
                    date: overlay.querySelector('#freshSpotDate').value.trim(),
                    bgColor: overlay.querySelector('#freshSpotBgColor').value.trim()
                },
                hotNews: []
            };

            var hotEditors = overlay.querySelectorAll('.manager-fresh-hot-editor');
            hotEditors.forEach(function(he) {
                var hi = parseInt(he.getAttribute('data-hot-idx'), 10);
                var titleEl = he.querySelector('.fresh-hot-title');
                var titleEnEl = he.querySelector('.fresh-hot-title-en');
                var dateEl = he.querySelector('.fresh-hot-date');
                var catEl = he.querySelector('.fresh-hot-cat');
                var summaryEl = he.querySelector('.fresh-hot-summary');
                var summaryEnEl = he.querySelector('.fresh-hot-summary-en');
                var bodyEl = he.querySelector('.manager-rte-editor[id^="rte-hot-"][id$="' + hi + '"]');
                var bodyEnEl = he.querySelector('#rte-hot-en-' + hi);

                var titleVal = titleEl ? titleEl.value.trim() : '';
                if (titleVal) {
                    updated.hotNews.push({
                        title: titleVal,
                        titleEn: titleEnEl ? titleEnEl.value.trim() : '',
                        summary: summaryEl ? summaryEl.value.trim() : '',
                        summaryEn: summaryEnEl ? summaryEnEl.value.trim() : '',
                        image: getImageUploadValue(he, 'freshHotImage' + hi),
                        body: bodyEl ? bodyEl.innerHTML.trim() : '',
                        bodyEn: bodyEnEl ? bodyEnEl.innerHTML.trim() : '',
                        date: dateEl ? dateEl.value.trim() : '',
                        category: catEl ? catEl.value.trim() : ''
                    });
                }
            });

            if (isEdit) {
                freshData.heroGroups[editIndex] = updated;
            } else {
                freshData.heroGroups.push(updated);
            }
            saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
            var fc = document.getElementById('freshManagerContent');
            if (fc) renderFreshGroups(fc);
            showToast(isEdit ? 'Group updated' : 'Group added');
            closeEditor();
        });
    }

    function openFreshHeadlineEditor(groupIdx) {
        var group = freshData.heroGroups[groupIdx];
        if (!group) return;
        var h = group.headline || {};

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-fresh-editor-overlay';
        overlay.id = 'freshHeadlineEditorOverlay';

        overlay.innerHTML =
            '<div class="manager-fresh-editor">' +
            '<div class="manager-fresh-editor-header">' +
            '<button class="manager-design-editor-back" id="freshHeadlineEditorBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<div class="manager-design-editor-title">Edit Headline</div>' +
            '<button class="manager-btn manager-btn-primary manager-design-editor-save active" id="freshHeadlineEditorSave">Save</button>' +
            '</div>' +
            '<div class="manager-fresh-editor-body">' +
            createImageUploadField('hl-bg', h.bgImage, 'Background Image', 'freshHLBgImage') +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Main Title</label>' +
            '<input type="text" class="manager-form-input" id="freshHLMainTitle" value="' + escapeAttr(h.mainTitle) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Main Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshHLMainTitleEn" value="' + escapeAttr(h.mainTitleEn) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Sub Title</label>' +
            '<input type="text" class="manager-form-input" id="freshHLSubTitle" value="' + escapeAttr(h.subTitle) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Sub Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshHLSubTitleEn" value="' + escapeAttr(h.subTitleEn) + '">' +
            '</div>' +
            '</div>' +
            createImageUploadField('hl-ti', h.titleImage, 'Title Image', 'freshHLTitleImage') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content</label>' +
            buildRichTextToolbar('rte-headline-edit') +
            '<div class="manager-rte-editor" id="rte-headline-edit" contenteditable="true">' + (h.body || '') + '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content (EN)</label>' +
            buildRichTextToolbar('rte-headline-edit-en') +
            '<div class="manager-rte-editor" id="rte-headline-edit-en" contenteditable="true">' + (h.bodyEn || '') + '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var toolbarBars = overlay.querySelectorAll('.manager-rte-toolbar');
        toolbarBars.forEach(function(bar) {
            var editorId = bar.nextElementSibling ? bar.nextElementSibling.id : null;
            if (editorId) bindRichTextToolbar(bar, editorId);
        });

        bindImageUploadField(overlay, 'freshHLBgImage', validateFreshImage);
        bindImageUploadField(overlay, 'freshHLTitleImage');

        function closeEditor() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditor(); });
        overlay.querySelector('#freshHeadlineEditorBack').addEventListener('click', closeEditor);

        overlay.querySelector('#freshHeadlineEditorSave').addEventListener('click', function() {
            group.headline.bgImage = getImageUploadValue(overlay, 'freshHLBgImage');
            group.headline.mainTitle = overlay.querySelector('#freshHLMainTitle').value.trim();
            group.headline.mainTitleEn = overlay.querySelector('#freshHLMainTitleEn').value.trim();
            group.headline.subTitle = overlay.querySelector('#freshHLSubTitle').value.trim();
            group.headline.subTitleEn = overlay.querySelector('#freshHLSubTitleEn').value.trim();
            group.headline.titleImage = getImageUploadValue(overlay, 'freshHLTitleImage');
            group.headline.body = overlay.querySelector('#rte-headline-edit').innerHTML.trim();
            group.headline.bodyEn = overlay.querySelector('#rte-headline-edit-en').innerHTML.trim();
            saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
            var fc = document.getElementById('freshManagerContent');
            if (fc) renderFreshGroups(fc);
            showToast('Headline updated');
            closeEditor();
        });
    }

    function openFreshSpotEditor(groupIdx) {
        var group = freshData.heroGroups[groupIdx];
        if (!group) return;
        if (!group.spot) group.spot = { tag: '', title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', bgColor: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)' };
        var s = group.spot;

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-fresh-editor-overlay';
        overlay.id = 'freshSpotEditorOverlay';

        overlay.innerHTML =
            '<div class="manager-fresh-editor">' +
            '<div class="manager-fresh-editor-header">' +
            '<button class="manager-design-editor-back" id="freshSpotEditorBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<div class="manager-design-editor-title">Edit Spot</div>' +
            '<button class="manager-btn manager-btn-primary manager-design-editor-save active" id="freshSpotEditorSave">Save</button>' +
            '</div>' +
            '<div class="manager-fresh-editor-body">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Tag</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTag2" value="' + escapeAttr(s.tag) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Date</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotDate2" value="' + escapeAttr(s.date) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTitle2" value="' + escapeAttr(s.title) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotTitleEn2" value="' + escapeAttr(s.titleEn) + '">' +
            '</div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotSummary2" value="' + escapeAttr(s.summary) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotSummaryEn2" value="' + escapeAttr(s.summaryEn) + '">' +
            '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Background Color (CSS gradient)</label>' +
            '<input type="text" class="manager-form-input" id="freshSpotBgColor2" value="' + escapeAttr(s.bgColor) + '" placeholder="linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%)">' +
            '</div>' +
            createImageUploadField('spot2-img', s.image, 'Spot Image', 'freshSpotImage2') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content</label>' +
            buildRichTextToolbar('rte-spot-edit') +
            '<div class="manager-rte-editor" id="rte-spot-edit" contenteditable="true">' + (s.body || '') + '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content (EN)</label>' +
            buildRichTextToolbar('rte-spot-edit-en') +
            '<div class="manager-rte-editor" id="rte-spot-edit-en" contenteditable="true">' + (s.bodyEn || '') + '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var toolbarBars = overlay.querySelectorAll('.manager-rte-toolbar');
        toolbarBars.forEach(function(bar) {
            var editorId = bar.nextElementSibling ? bar.nextElementSibling.id : null;
            if (editorId) bindRichTextToolbar(bar, editorId);
        });

        bindImageUploadField(overlay, 'freshSpotImage2');

        function closeEditor() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditor(); });
        overlay.querySelector('#freshSpotEditorBack').addEventListener('click', closeEditor);

        overlay.querySelector('#freshSpotEditorSave').addEventListener('click', function() {
            group.spot.tag = overlay.querySelector('#freshSpotTag2').value.trim();
            group.spot.title = overlay.querySelector('#freshSpotTitle2').value.trim();
            group.spot.titleEn = overlay.querySelector('#freshSpotTitleEn2').value.trim();
            group.spot.summary = overlay.querySelector('#freshSpotSummary2').value.trim();
            group.spot.summaryEn = overlay.querySelector('#freshSpotSummaryEn2').value.trim();
            group.spot.image = getImageUploadValue(overlay, 'freshSpotImage2');
            group.spot.body = overlay.querySelector('#rte-spot-edit').innerHTML.trim();
            group.spot.bodyEn = overlay.querySelector('#rte-spot-edit-en').innerHTML.trim();
            group.spot.date = overlay.querySelector('#freshSpotDate2').value.trim();
            group.spot.bgColor = overlay.querySelector('#freshSpotBgColor2').value.trim();
            saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
            var fc = document.getElementById('freshManagerContent');
            if (fc) renderFreshGroups(fc);
            showToast('Spot updated');
            closeEditor();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeEditor();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function openFreshArticleEditor(groupIdx, articleIdx) {
        var group = freshData.heroGroups[groupIdx];
        if (!group) return;
        if (!group.hotNews) group.hotNews = [];
        if (articleIdx >= group.hotNews.length && articleIdx < 3) {
            group.hotNews.push({ title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', category: '' });
        }
        var article = group.hotNews[articleIdx] || { title: '', titleEn: '', summary: '', summaryEn: '', image: '', body: '', bodyEn: '', date: '', category: '' };

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-fresh-editor-overlay';
        overlay.id = 'freshArticleEditorOverlay';

        overlay.innerHTML =
            '<div class="manager-fresh-editor">' +
            '<div class="manager-fresh-editor-header">' +
            '<button class="manager-design-editor-back" id="freshArticleEditorBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<div class="manager-design-editor-title">Edit Article #' + (articleIdx + 1) + '</div>' +
            '<button class="manager-btn manager-btn-primary manager-design-editor-save active" id="freshArticleEditorSave">Save</button>' +
            '</div>' +
            '<div class="manager-fresh-editor-body">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title</label>' +
            '<input type="text" class="manager-form-input" id="freshArtTitle" value="' + escapeAttr(article.title) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshArtTitleEn" value="' + escapeAttr(article.titleEn) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Date</label>' +
            '<input type="text" class="manager-form-input manager-form-input-readonly" id="freshArtDate" value="' + escapeAttr(article.date) + '" readonly></div>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.12rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary</label>' +
            '<input type="text" class="manager-form-input" id="freshArtSummary" value="' + escapeAttr(article.summary) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Summary (EN)</label>' +
            '<input type="text" class="manager-form-input" id="freshArtSummaryEn" value="' + escapeAttr(article.summaryEn) + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Category</label>' +
            '<input type="text" class="manager-form-input" id="freshArtCat" value="' + escapeAttr(article.category) + '">' +
            '</div>' +
            '</div>' +
            createImageUploadField('art', article.image, 'Cover Image', 'freshArtImage') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content</label>' +
            buildRichTextToolbar('rte-article-edit') +
            '<div class="manager-rte-editor" id="rte-article-edit" contenteditable="true">' + (article.body || '') + '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Body Content (EN)</label>' +
            buildRichTextToolbar('rte-article-edit-en') +
            '<div class="manager-rte-editor" id="rte-article-edit-en" contenteditable="true">' + (article.bodyEn || '') + '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var toolbarBars = overlay.querySelectorAll('.manager-rte-toolbar');
        toolbarBars.forEach(function(bar) {
            var editorId = bar.nextElementSibling ? bar.nextElementSibling.id : null;
            if (editorId) bindRichTextToolbar(bar, editorId);
        });

        bindImageUploadField(overlay, 'freshArtImage');

        function closeEditor() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditor(); });
        overlay.querySelector('#freshArticleEditorBack').addEventListener('click', closeEditor);

        overlay.querySelector('#freshArticleEditorSave').addEventListener('click', function() {
            article.title = overlay.querySelector('#freshArtTitle').value.trim();
            article.titleEn = overlay.querySelector('#freshArtTitleEn').value.trim();
            article.date = overlay.querySelector('#freshArtDate').value.trim();
            article.category = overlay.querySelector('#freshArtCat').value.trim();
            article.summary = overlay.querySelector('#freshArtSummary').value.trim();
            article.summaryEn = overlay.querySelector('#freshArtSummaryEn').value.trim();
            article.image = getImageUploadValue(overlay, 'freshArtImage');
            article.body = overlay.querySelector('#rte-article-edit').innerHTML.trim();
            article.bodyEn = overlay.querySelector('#rte-article-edit-en').innerHTML.trim();
            group.hotNews[articleIdx] = article;
            saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
            var fc = document.getElementById('freshManagerContent');
            if (fc) renderFreshGroups(fc);
            showToast('Article updated');
            closeEditor();
        });
    }

    function openFreshPreview(groupIdx) {
        var group = freshData.heroGroups[groupIdx];
        if (!group) return;
        var h = group.headline || {};
        var s = group.spot || {};
        var hotNews = group.hotNews || [];

        var overlay = document.createElement('div');
        overlay.className = 'manager-fresh-preview-overlay';
        overlay.id = 'freshPreviewOverlay';

        var hotNewsHtml = '';
        for (var i = 0; i < hotNews.length; i++) {
            var n = hotNews[i];
            if (!n || !n.title) continue;
            hotNewsHtml += '<div class="fresh-hero-news-item" style="padding:.14rem .2rem;border-bottom:1px solid rgba(255,255,255,.06);">' +
                '<span class="fresh-hero-news-text" style="color:rgba(255,255,255,.8);">' + n.title + '</span>' +
                '<span class="fresh-hero-news-date" style="color:rgba(255,255,255,.4);">' + (n.date || '') + '</span>' +
                '</div>';
        }

        overlay.innerHTML =
            '<div class="manager-fresh-preview-header">' +
            '<div class="manager-fresh-preview-header-left">' +
            '<button class="manager-fresh-preview-back" id="freshPreviewBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<span class="manager-fresh-preview-title">Preview — Group ' + (groupIdx + 1) + '</span>' +
            '</div>' +
            '<div class="manager-fresh-preview-actions">' +
            '<button class="manager-fresh-preview-draft" id="freshPreviewAddDraft">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
            'Add to Drafts</button>' +
            '<button class="manager-fresh-preview-publish" id="freshPreviewPublish">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
            'Publish</button>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-preview-body">' +
            '<div class="manager-fresh-preview-hero" style="background-image:url(' + (h.bgImage || '') + ')">' +
            '<div class="manager-fresh-preview-hero-mask"></div>' +
            '<div class="manager-fresh-preview-hero-content">' +
            '<h1 class="manager-fresh-preview-hero-main">' + (h.mainTitle || 'Untitled') + '</h1>' +
            '<p class="manager-fresh-preview-hero-sub">' + (h.subTitle || '') + '</p>' +
            '</div>' +
            '</div>' +
            '<div class="manager-fresh-preview-content">' +
            (h.titleImage ? '<img src="' + h.titleImage + '" style="max-width:100%;border-radius:.12rem;margin-bottom:.32rem;">' : '') +
            '<div class="manager-rte-editor">' + (h.body || '') + '</div>' +
            (s.title ? '<div style="margin-top:.6rem;padding:.32rem;border-radius:.16rem;' + (s.bgColor ? 'background:' + s.bgColor + ';' : '') + '"><h3 style="font-size:.18rem;color:rgba(255,255,255,.4);margin-bottom:.24rem;letter-spacing:.04rem;">SPOT</h3><p style="font-size:.14rem;color:#fff;font-weight:600;margin-bottom:.08rem;">' + s.title + '</p><p style="font-size:.12rem;color:rgba(255,255,255,.6);">' + (s.summary || '') + '</p></div>' : '') +
            (hotNews.length > 0 ? '<div style="margin-top:.6rem;padding-top:.4rem;border-top:1px solid rgba(255,255,255,.08);"><h3 style="font-size:.18rem;color:rgba(255,255,255,.4);margin-bottom:.24rem;letter-spacing:.04rem;">HOT NEWS</h3>' + hotNewsHtml + '</div>' : '') +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        function closePreview() {
            overlay.remove();
            document.body.style.overflow = '';
        }

        overlay.querySelector('#freshPreviewBack').addEventListener('click', closePreview);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePreview();
        });

        overlay.querySelector('#freshPreviewAddDraft').addEventListener('click', function() {
            var draftEntry = {
                id: 'draft_' + Date.now(),
                type: 'fresh_group',
                groupIndex: groupIdx,
                name: (h.mainTitle || 'Group ' + (groupIdx + 1)),
                headline: h,
                spot: s,
                hotNews: hotNews,
                createdAt: new Date().toISOString(),
                createdBy: adminUser ? adminUser.username : 'unknown'
            };
            var drafts = loadFromLocalStorage(STORAGE_KEYS.drafts) || [];
            drafts.unshift(draftEntry);
            saveToLocalStorage(STORAGE_KEYS.drafts, drafts);
            showToast('Added to Drafts');
        });

        overlay.querySelector('#freshPreviewPublish').addEventListener('click', function() {
            var published = loadFromLocalStorage(STORAGE_KEYS.published) || [];
            var alreadyPublished = false;
            for (var pi = 0; pi < published.length; pi++) {
                if (published[pi].groupIndex === groupIdx && published[pi].type === 'fresh_group') {
                    alreadyPublished = true;
                    published[pi] = {
                        id: published[pi].id,
                        type: 'fresh_group',
                        groupIndex: groupIdx,
                        name: (h.mainTitle || 'Group ' + (groupIdx + 1)),
                        headline: JSON.parse(JSON.stringify(h)),
                        spot: JSON.parse(JSON.stringify(s)),
                        hotNews: JSON.parse(JSON.stringify(hotNews)),
                        publishedAt: new Date().toISOString(),
                        publishedBy: adminUser ? adminUser.username : 'unknown'
                    };
                    break;
                }
            }
            if (!alreadyPublished) {
                published.unshift({
                    id: 'pub_' + Date.now(),
                    type: 'fresh_group',
                    groupIndex: groupIdx,
                    name: (h.mainTitle || 'Group ' + (groupIdx + 1)),
                    headline: JSON.parse(JSON.stringify(h)),
                    spot: JSON.parse(JSON.stringify(s)),
                    hotNews: JSON.parse(JSON.stringify(hotNews)),
                    publishedAt: new Date().toISOString(),
                    publishedBy: adminUser ? adminUser.username : 'unknown'
                });
            }
            saveToLocalStorage(STORAGE_KEYS.published, published);
            showToast('Published successfully!');
            closePreview();
            var fc = document.getElementById('freshManagerContent');
            if (fc) renderFreshGroups(fc);
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closePreview();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function renderDrafts(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Drafts</h1>' +
            '</div>' +
            '<div id="draftsContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        var dc = document.getElementById('draftsContent');
        if (!dc) return;

        var drafts = loadFromLocalStorage(STORAGE_KEYS.drafts) || [];

        if (drafts.length === 0) {
            dc.innerHTML = '<div class="manager-empty">No drafts yet. Use the Preview page to add items to drafts.</div>';
            return;
        }

        var html = '<div class="manager-drafts-list">';
        for (var i = 0; i < drafts.length; i++) {
            var draft = drafts[i];
            var thumbHtml = draft.headline && draft.headline.bgImage
                ? '<img src="' + draft.headline.bgImage + '" alt="">'
                : '<div class="manager-drafts-thumb-noimg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';

            html += '<div class="manager-drafts-item" data-draft-id="' + draft.id + '">' +
                '<div class="manager-drafts-thumb">' + thumbHtml + '</div>' +
                '<div class="manager-drafts-body">' +
                '<div class="manager-drafts-name">' + (draft.name || 'Untitled') + '</div>' +
                '<div class="manager-drafts-type">' + (draft.type === 'fresh_group' ? 'Fresh Group' : draft.type) + '</div>' +
                '</div>' +
                '<div class="manager-drafts-meta">' +
                '<span class="manager-drafts-status">Draft</span>' +
                '<div style="margin-top:.04rem;">' + formatDate(draft.createdAt) + '</div>' +
                '</div>' +
                '<div class="manager-drafts-actions">' +
                '<button class="manager-btn manager-btn-outline manager-btn-sm btn-drafts-edit" data-draft-idx="' + i + '">Edit</button>' +
                '<button class="manager-btn manager-btn-danger manager-btn-sm btn-drafts-delete" data-draft-idx="' + i + '">Delete</button>' +
                '</div>' +
                '</div>';
        }
        html += '</div>';
        dc.innerHTML = html;

        var editBtns = dc.querySelectorAll('.btn-drafts-edit');
        editBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-draft-idx'), 10);
                var draft = drafts[idx];
                if (!draft) return;
                var groupData = {
                    id: draft.headline && draft.headline.id ? draft.headline.id : Date.now(),
                    headline: draft.headline || {},
                    hotNews: draft.hotNews || []
                };
                freshData.heroGroups.push(groupData);
                saveToLocalStorage(STORAGE_KEYS.freshHeroItems, freshData.heroGroups);
                drafts.splice(idx, 1);
                saveToLocalStorage(STORAGE_KEYS.drafts, drafts);
                showToast('Draft moved to Fresh');
                renderDrafts(container);
            });
        });

        var delBtns = dc.querySelectorAll('.btn-drafts-delete');
        delBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-draft-idx'), 10);
                var draft = drafts[idx];
                if (!draft) return;
                showDeleteConfirm(
                    'Delete Draft',
                    'Are you sure you want to delete this draft? This cannot be undone.',
                    'Delete',
                    'Delete Draft',
                    function(confirmed) {
                        if (!confirmed) return;
                        drafts.splice(idx, 1);
                        saveToLocalStorage(STORAGE_KEYS.drafts, drafts);
                        renderDrafts(container);
                        showToast('Draft deleted');
                    }
                );
            });
        });
    }

    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var designCategories = ['Brand Identity', 'Motion Graphics', 'Web Design', 'Editorial Design', 'Product Design', '3D Art'];
    var designToolOptions = [
        { id: 'figma', label: 'Figma', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H8.5A3.5 3.5 0 0 0 5 5.5v0A3.5 3.5 0 0 0 8.5 9H12"/><path d="M12 9H8.5A3.5 3.5 0 0 0 5 12.5v0A3.5 3.5 0 0 0 8.5 16H12"/><path d="M12 2v14"/><path d="M12 16v3.5a3.5 3.5 0 0 0 3.5 3.5v0a3.5 3.5 0 0 0 3.5-3.5V12.5a3.5 3.5 0 0 0-3.5-3.5H12"/><path d="M12 9V5.5A3.5 3.5 0 0 1 15.5 2v0A3.5 3.5 0 0 1 19 5.5V9a3.5 3.5 0 0 1-3.5 3.5H12"/></svg>' },
        { id: 'blender', label: 'Blender', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l4-4"/><path d="M12 12l-4-4"/></svg>' },
        { id: 'ae', label: 'AE', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>' },
        { id: 'cinema4d', label: 'Cinema 4D', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>' },
        { id: 'redshift', label: 'Redshift', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>' },
        { id: 'react', label: 'React', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/></svg>' },
        { id: 'threejs', label: 'Three.js', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
        { id: 'webgl', label: 'WebGL', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>' },
        { id: 'indesign', label: 'InDesign', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8v8"/><path d="M12 8l4 8"/><path d="M16 8v8"/></svg>' },
        { id: 'photoshop', label: 'Photoshop', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 16V8h2a3 3 0 0 1 0 6H8"/><path d="M15 12a2 2 0 1 1 0 4h-1V8h1"/></svg>' },
        { id: 'ai', label: 'AI', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22h20L12 2z"/><path d="M12 10v6"/></svg>' },
        { id: 'protopie', label: 'Protopie', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>' },
        { id: 'spline', label: 'Spline', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l4-4"/><path d="M12 12l-4-4"/></svg>' },
        { id: 'unreal', label: 'Unreal Engine', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
        { id: 'illustrator', label: 'Adobe Illustrator', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' }
    ];
    var designEditState = { isDirty: false, currentWorkIndex: null, originalWork: null };

    function renderDesignManager(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Design Work</h1>' +
            '<div class="manager-main-actions">' +
            '<button class="manager-btn manager-btn-primary" id="designAddBtn">' +
            '<svg class="manager-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            'Add Work</button>' +
            '</div>' +
            '</div>' +
            '<div id="designManagerContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        loadJsonData('data.json', function(siteData) {
            var dc = document.getElementById('designManagerContent');
            if (!dc) return;
            var savedDwItems = loadFromLocalStorage(STORAGE_KEYS.designDwItems);
            if (savedDwItems) {
                designData.works = savedDwItems;
            } else if (siteData && siteData.design) {
                designData.works = siteData.design.dwItems || [];
            }
            renderDesignWorks(dc);
        });

        document.getElementById('designAddBtn').addEventListener('click', function() {
            openDesignWorkEditor(null);
        });
    }

    function renderDesignWorks(container) {
        if (!designData.works || designData.works.length === 0) {
            container.innerHTML = '<div class="manager-empty">No design works yet.</div>';
            return;
        }

        var html = '<div class="manager-design-grid">';
        for (var i = 0; i < designData.works.length; i++) {
            var work = designData.works[i];
            var thumbStyle = work.coverImage ? work.coverImage : (work.gradient || 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)');
            html += '<div class="manager-design-item" data-work-index="' + i + '">' +
                '<div class="manager-design-thumb" style="background:' + thumbStyle + '"></div>' +
                '<div class="manager-design-body">' +
                '<span class="manager-design-cat">' + work.cat + '</span>' +
                '<h3 class="manager-design-title">' + work.title + '</h3>' +
                '<p class="manager-design-desc">' + work.desc + '</p>' +
                '<div class="manager-design-tools">' + (Array.isArray(work.tools) ? work.tools.join(' / ') : work.tools) + '</div>' +
                '<div style="display:flex;gap:.06rem;margin-top:.1rem;">' +
                '<button class="manager-design-work-preview-btn" data-action="preview" data-work-index="' + i + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                'Preview</button>' +
                '</div>' +
                '</div>' +
                '</div>';
        }
        html += '</div>';
        container.innerHTML = html;

        bindDesignWorkEvents(container);
    }

    function bindDesignWorkEvents(container) {
        var items = container.querySelectorAll('.manager-design-item');
        items.forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('[data-action="preview"]')) return;
                var idx = parseInt(this.getAttribute('data-work-index'), 10);
                openDesignWorkEditor(idx);
            });
        });

        var previewBtns = container.querySelectorAll('.manager-design-work-preview-btn');
        previewBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-work-index'), 10);
                var work = designData.works[idx];
                var previewOverlay = buildDesignPreviewModal(work);
                document.body.appendChild(previewOverlay);
                bindDesignPreviewEvents(previewOverlay);
            });
        });
    }

    function openDesignWorkEditor(editIndex) {
        var isEdit = editIndex !== null;
        var work = isEdit ? JSON.parse(JSON.stringify(designData.works[editIndex])) : {
            title: '',
            cat: '',
            gradient: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
            publishedAt: new Date().toISOString(),
            tools: [],
            desc: '',
            coverImage: '',
            fanCardImage: '',
            listThumbImage: '',
            media: []
        };

        designEditState.isDirty = false;
        designEditState.currentWorkIndex = editIndex;
        designEditState.originalWork = JSON.parse(JSON.stringify(work));

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-design-editor-overlay';
        overlay.id = 'designEditorOverlay';

        var catOptions = '';
        for (var ci = 0; ci < designCategories.length; ci++) {
            var selected = work.cat === designCategories[ci] ? ' selected' : '';
            catOptions += '<option value="' + designCategories[ci] + '"' + selected + '>' + designCategories[ci] + '</option>';
        }

        var toolsHtml = '';
        var selectedTools = Array.isArray(work.tools) ? work.tools : [];
        for (var ti = 0; ti < designToolOptions.length; ti++) {
            var tool = designToolOptions[ti];
            var isSelected = selectedTools.indexOf(tool.label) !== -1 ? ' selected' : '';
            toolsHtml += '<div class="manager-design-tool-chip' + isSelected + '" data-tool="' + tool.label + '">' +
                '<span class="manager-design-tool-icon">' + tool.icon + '</span>' +
                '<span class="manager-design-tool-label">' + tool.label + '</span>' +
                '</div>';
        }

        var mediaHtml = '';
        var mediaItems = work.media || [];
        for (var mi = 0; mi < mediaItems.length; mi++) {
            var src = mediaItems[mi];
            if (src.indexOf('data:video') === 0 || src.match(/\.(mp4|webm|ogg)($|\?)/i)) {
                mediaHtml += '<div class="manager-design-media-item">' +
                    '<video src="' + src + '" controls></video>' +
                    '<button class="manager-design-media-remove" data-media-idx="' + mi + '">&times;</button>' +
                    '</div>';
            } else {
                mediaHtml += '<div class="manager-design-media-item">' +
                    '<img src="' + src + '" alt="">' +
                    '<button class="manager-design-media-remove" data-media-idx="' + mi + '">&times;</button>' +
                    '</div>';
            }
        }

        overlay.innerHTML =
            '<div class="manager-modal manager-design-editor">' +
            '<div class="manager-design-editor-header">' +
            '<button class="manager-design-editor-back" id="designEditorBack">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
            'Back</button>' +
            '<div class="manager-design-editor-title">' + (isEdit ? 'Edit Work' : 'New Work') + '</div>' +
            '<div style="display:flex;align-items:center;">' +
            '<button class="manager-design-editor-preview-btn" id="designEditorPreviewBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            'Preview</button>' +
            '<button class="manager-btn manager-btn-primary manager-design-editor-save" id="designEditorSave" disabled>Save</button>' +
            '</div>' +
            '</div>' +
            '<div class="manager-design-editor-body">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title</label>' +
            '<input type="text" class="manager-form-input" id="designTitle" value="' + (work.title || '') + '">' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr;gap:.16rem;">' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Category</label>' +
            '<select class="manager-form-select" id="designCat">' +
            '<option value="">Select category</option>' + catOptions +
            '</select>' +
            '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Cover Image</label>' +
            '<div class="manager-design-cover-zone" id="designCoverZone">' +
            '<input type="file" class="manager-design-file-input" id="designCoverInput" accept="image/*,video/*">' +
            '<div class="manager-design-cover-preview" id="designCoverPreview" style="background:' + (work.coverImage || work.gradient || 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)') + '"></div>' +
            '<div class="manager-design-cover-placeholder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
            '<span>Click or drag to upload cover</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-design-size-info">' +
            '<div class="manager-design-size-item">' +
            '<div class="manager-design-size-label">Fan Card</div>' +
            '<div class="manager-design-size-value">2.6 × 3.6 rem</div>' +
            '<div class="manager-design-size-sub">260 × 360 px</div>' +
            '</div>' +
            '<div class="manager-design-size-item">' +
            '<div class="manager-design-size-label">List Thumb</div>' +
            '<div class="manager-design-size-value">35% × 1.6 rem</div>' +
            '<div class="manager-design-size-sub">min 160px height</div>' +
            '</div>' +
            '<div class="manager-design-size-item">' +
            '<div class="manager-design-size-label">Detail Hero</div>' +
            '<div class="manager-design-size-value">100% × 55 vh</div>' +
            '<div class="manager-design-size-sub">full-width hero</div>' +
            '</div>' +
            '</div>' +
            createImageUploadField('fanCard', work.fanCardImage || '', 'Fan Card Image<br><span style="font-size:.09rem;color:rgba(255,255,255,.3);font-weight:400;">260×360px recommended</span>', 'designFanCardZone') +
            createImageUploadField('listThumb', work.listThumbImage || '', 'List Thumb Image<br><span style="font-size:.09rem;color:rgba(255,255,255,.3);font-weight:400;">min 160px height</span>', 'designListThumbZone') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Media Content (Images / Videos)</label>' +
            '<div class="manager-design-media-grid" id="designMediaGrid">' + mediaHtml + '</div>' +
            '<div class="manager-design-media-upload" id="designMediaUpload">' +
            '<input type="file" class="manager-design-file-input" id="designMediaInput" accept="image/*,video/*" multiple>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '<span>Add media</span>' +
            '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Tools Used <span style="color:rgba(255,255,255,.25);font-weight:400;">(select at least one)</span></label>' +
            '<div class="manager-design-tools-grid" id="designToolsGrid">' + toolsHtml + '</div>' +
            '<div class="manager-design-custom-tool-row">' +
            '<input type="text" class="manager-form-input" id="designCustomTool" placeholder="Custom tool name (max 10 chars)" maxlength="10" style="flex:1;font-size:.12rem;">' +
            '<button class="manager-btn manager-btn-secondary manager-design-custom-tool-add" id="designCustomToolAdd">Add</button>' +
            '</div>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Project Description</label>' +
            '<textarea class="manager-form-textarea" id="designDesc">' + (work.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        bindDesignEditorEvents(overlay, isEdit);
    }

    function formatDateTimeLocal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function bindDesignEditorEvents(overlay, isEdit) {
        var saveBtn = overlay.querySelector('#designEditorSave');
        var backBtn = overlay.querySelector('#designEditorBack');
        var titleInput = overlay.querySelector('#designTitle');
        var catSelect = overlay.querySelector('#designCat');
        var descTextarea = overlay.querySelector('#designDesc');
        var coverZone = overlay.querySelector('#designCoverZone');
        var coverInput = overlay.querySelector('#designCoverInput');
        var coverPreview = overlay.querySelector('#designCoverPreview');
        var mediaInput = overlay.querySelector('#designMediaInput');
        var mediaUpload = overlay.querySelector('#designMediaUpload');
        var mediaGrid = overlay.querySelector('#designMediaGrid');
        var toolsGrid = overlay.querySelector('#designToolsGrid');

        function getCurrentWork() {
            var selectedTools = [];
            var toolChips = toolsGrid.querySelectorAll('.manager-design-tool-chip.selected');
            toolChips.forEach(function(chip) {
                selectedTools.push(chip.getAttribute('data-tool'));
            });
            var customTool = (overlay.querySelector('#designCustomTool') || {}).value;
            if (customTool && customTool.trim()) {
                selectedTools.push(customTool.trim());
            }

            var mediaItems = [];
            var mediaEls = mediaGrid.querySelectorAll('img, video');
            mediaEls.forEach(function(el) {
                mediaItems.push(el.src || el.getAttribute('src'));
            });

            var coverImageUrl = coverPreview.getAttribute('data-cover-url') || '';
            var coverBg = coverPreview.style.background || '';
            var hasCoverImage = coverImageUrl !== '' || coverBg.indexOf('url(') !== -1;
            var finalCoverImage = coverImageUrl || (hasCoverImage ? coverBg : '');

            return {
                title: titleInput.value.trim(),
                cat: catSelect.value,
                gradient: finalCoverImage || designEditState.originalWork.gradient || 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
                coverImage: finalCoverImage,
                fanCardImage: getImageUploadValue(overlay, 'designFanCardZone'),
                listThumbImage: getImageUploadValue(overlay, 'designListThumbZone'),
                year: designEditState.originalWork.year || new Date().getFullYear().toString(),
                client: designEditState.originalWork.client || '',
                publishedAt: designEditState.originalWork.publishedAt || new Date().toISOString(),
                tools: selectedTools,
                desc: descTextarea.value.trim(),
                media: mediaItems
            };
        }

        function checkDirty() {
            var current = getCurrentWork();
            var orig = designEditState.originalWork;
            var dirty = false;
            if (current.title !== (orig.title || '')) dirty = true;
            if (current.cat !== (orig.cat || '')) dirty = true;
            if (current.desc !== (orig.desc || '')) dirty = true;
            if (JSON.stringify(current.tools) !== JSON.stringify(orig.tools || [])) dirty = true;
            if (JSON.stringify(current.media) !== JSON.stringify(orig.media || [])) dirty = true;
            if (current.gradient !== (orig.gradient || '')) dirty = true;
            if (current.coverImage !== (orig.coverImage || '')) dirty = true;
            if (current.fanCardImage !== (orig.fanCardImage || '')) dirty = true;
            if (current.listThumbImage !== (orig.listThumbImage || '')) dirty = true;

            designEditState.isDirty = dirty;
            saveBtn.disabled = !dirty;
            if (dirty) {
                saveBtn.classList.add('active');
            } else {
                saveBtn.classList.remove('active');
            }
        }

        function closeEditor(force) {
            if (!force && designEditState.isDirty) {
                showUnsavedConfirm(function(confirmed) {
                    if (confirmed) {
                        doSaveAndClose();
                    } else {
                        designEditState.isDirty = false;
                        overlay.remove();
                    }
                });
                return;
            }
            overlay.remove();
        }

        function doSaveAndClose() {
            var updated = getCurrentWork();
            var selectedTools = updated.tools;
            if (selectedTools.length === 0) {
                showToast('Please select at least one tool', true);
                return;
            }
            if (!updated.title.trim()) {
                showToast('Please enter a title', true);
                return;
            }
            if (isEdit) {
                designData.works[designEditState.currentWorkIndex] = updated;
            } else {
                designData.works.push(updated);
            }
            saveToLocalStorage(STORAGE_KEYS.designDwItems, designData.works);
            if (typeof dwItems !== 'undefined') {
                dwItems = designData.works;
            }
            var dc = document.getElementById('designManagerContent');
            if (dc) renderDesignWorks(dc);
            showToast(isEdit ? 'Work updated' : 'Work added');
            designEditState.isDirty = false;
            overlay.remove();
        }

        titleInput.addEventListener('input', checkDirty);
        catSelect.addEventListener('change', checkDirty);
        descTextarea.addEventListener('input', checkDirty);

        backBtn.addEventListener('click', function() { closeEditor(false); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEditor(false); });
        saveBtn.addEventListener('click', doSaveAndClose);

        var previewBtn = overlay.querySelector('#designEditorPreviewBtn');
        previewBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var previewOverlay = buildDesignPreviewModal(getCurrentWork());
            document.body.appendChild(previewOverlay);
            bindDesignPreviewEvents(previewOverlay);
        });

        coverZone.addEventListener('click', function() { coverInput.click(); });
        coverZone.addEventListener('dragover', function(e) { e.preventDefault(); coverZone.classList.add('dragover'); });
        coverZone.addEventListener('dragleave', function() { coverZone.classList.remove('dragover'); });
        coverZone.addEventListener('drop', function(e) {
            e.preventDefault();
            coverZone.classList.remove('dragover');
            var files = e.dataTransfer.files;
            if (files.length > 0) handleCoverFile(files[0]);
        });
        coverInput.addEventListener('change', function() {
            if (this.files.length > 0) handleCoverFile(this.files[0]);
        });

        bindImageUploadField(overlay, 'designFanCardZone');
        bindImageUploadField(overlay, 'designListThumbZone');

        function handleCoverFile(file) {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                showToast('Only images and videos are supported', true);
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var imageUrl = 'url(' + e.target.result + ') center/cover no-repeat';
                coverPreview.style.background = imageUrl;
                coverPreview.setAttribute('data-cover-url', imageUrl);
                checkDirty();
            };
            reader.readAsDataURL(file);
        }

        mediaUpload.addEventListener('click', function() { mediaInput.click(); });
        mediaInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                for (var fi = 0; fi < this.files.length; fi++) {
                    handleMediaFile(this.files[fi]);
                }
            }
        });

        function handleMediaFile(file) {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                showToast('Only images and videos are supported', true);
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var item = document.createElement('div');
                item.className = 'manager-design-media-item';
                if (file.type.startsWith('video/')) {
                    item.innerHTML = '<video src="' + e.target.result + '" controls></video>' +
                        '<button class="manager-design-media-remove">&times;</button>';
                } else {
                    item.innerHTML = '<img src="' + e.target.result + '" alt="">' +
                        '<button class="manager-design-media-remove">&times;</button>';
                }
                mediaGrid.appendChild(item);
                bindMediaRemove(item);
                checkDirty();
            };
            reader.readAsDataURL(file);
        }

        function bindMediaRemove(item) {
            var btn = item.querySelector('.manager-design-media-remove');
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    item.remove();
                    checkDirty();
                });
            }
        }

        var existingMediaItems = mediaGrid.querySelectorAll('.manager-design-media-item');
        existingMediaItems.forEach(bindMediaRemove);

        var toolChips = toolsGrid.querySelectorAll('.manager-design-tool-chip');
        toolChips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                this.classList.toggle('selected');
                checkDirty();
            });
        });

        var customToolInput = overlay.querySelector('#designCustomTool');
        if (customToolInput) {
            customToolInput.addEventListener('input', checkDirty);
            customToolInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTool();
                }
            });
        }
        var customToolAddBtn = overlay.querySelector('#designCustomToolAdd');
        if (customToolAddBtn) {
            customToolAddBtn.addEventListener('click', addCustomTool);
        }
        function addCustomTool() {
            var val = customToolInput.value.trim();
            if (!val) return;
            var chip = document.createElement('div');
            chip.className = 'manager-design-tool-chip selected';
            chip.setAttribute('data-tool', val);
            chip.textContent = val;
            chip.addEventListener('click', function() {
                this.classList.toggle('selected');
                checkDirty();
            });
            toolsGrid.appendChild(chip);
            customToolInput.value = '';
            checkDirty();
        }
    }

    function buildDesignPreviewModal(work) {
        var overlay = document.createElement('div');
        overlay.className = 'manager-design-preview-overlay';
        overlay.id = 'designPreviewOverlay';

        var cardBg = work.coverImage || work.gradient || 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)';
        var toolsStr = Array.isArray(work.tools) ? work.tools.join(' / ') : (work.tools || '');

        overlay.innerHTML =
            '<div class="manager-design-preview-modal">' +
            '<div class="manager-design-preview-header">' +
            '<div class="manager-design-preview-tabs">' +
            '<button class="manager-design-preview-tab active" data-tab="card">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/></svg>' +
            'Card</button>' +
            '<button class="manager-design-preview-tab" data-tab="detail">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +
            'Detail</button>' +
            '<button class="manager-design-preview-tab" data-tab="both">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>' +
            'Both</button>' +
            '</div>' +
            '<button class="manager-design-preview-close" id="designPreviewClose">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            'Close</button>' +
            '</div>' +
            '<div class="manager-design-preview-body" id="designPreviewBody">' +
            '<div class="manager-design-preview-section" id="designPreviewCardSection">' +
            '<div class="manager-design-preview-section-label">Card Preview</div>' +
            '<div class="manager-design-preview-card-wrap">' +
            '<div class="manager-design-preview-fan-card">' +
            '<div class="manager-design-preview-card-img" style="background:' + cardBg + '"></div>' +
            '<div class="manager-design-preview-card-mask"></div>' +
            '<span class="manager-design-preview-card-corner">A&spades;</span>' +
            '<span class="manager-design-preview-card-corner-bottom">A&spades;</span>' +
            '<span class="manager-design-preview-card-suit">&spades;</span>' +
            '</div>' +
            '</div>' +
            '<div class="manager-design-preview-section-label">List Card Preview</div>' +
            '<div class="manager-design-preview-list-card">' +
            '<div class="manager-design-preview-list-thumb" style="background:' + cardBg + '"></div>' +
            '<div class="manager-design-preview-list-body">' +
            '<p class="manager-design-preview-list-cat">' + (work.cat || '') + '</p>' +
            '<h3 class="manager-design-preview-list-title">' + (work.title || 'Untitled') + '</h3>' +
            '<p class="manager-design-preview-list-meta">' + (work.year || '') + ' &middot; ' + (work.client || '') + '</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-design-preview-section" id="designPreviewDetailSection">' +
            '<div class="manager-design-preview-section-label">Detail Page Preview</div>' +
            '<div class="manager-design-preview-detail-hero">' +
            '<div class="manager-design-preview-detail-bg" style="background:' + cardBg + '"></div>' +
            '<div class="manager-design-preview-detail-mask"></div>' +
            '<div class="manager-design-preview-detail-content">' +
            '<h2 class="manager-design-preview-detail-title">' + (work.title || 'Untitled') + '</h2>' +
            '<p class="manager-design-preview-detail-cat">' + (work.cat || '') + '</p>' +
            '</div>' +
            '</div>' +
            '<p class="manager-design-preview-detail-desc">' + (work.desc || '') + '</p>' +
            '<div class="manager-design-preview-detail-meta">' +
            '<div class="manager-design-preview-detail-meta-item"><p class="manager-design-preview-detail-meta-label">Client</p><p class="manager-design-preview-detail-meta-value">' + (work.client || '') + '</p></div>' +
            '<div class="manager-design-preview-detail-meta-item"><p class="manager-design-preview-detail-meta-label">Published</p><p class="manager-design-preview-detail-meta-value">' + (work.year || '') + '</p></div>' +
            '<div class="manager-design-preview-detail-meta-item"><p class="manager-design-preview-detail-meta-label">Tools</p><p class="manager-design-preview-detail-meta-value">' + toolsStr + '</p></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        return overlay;
    }

    function bindDesignPreviewEvents(overlay) {
        var closeBtn = overlay.querySelector('#designPreviewClose');
        var tabs = overlay.querySelectorAll('.manager-design-preview-tab');
        var cardSection = overlay.querySelector('#designPreviewCardSection');
        var detailSection = overlay.querySelector('#designPreviewDetailSection');

        closeBtn.addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                var tabName = this.getAttribute('data-tab');
                if (tabName === 'card') {
                    cardSection.style.display = 'flex';
                    detailSection.style.display = 'none';
                } else if (tabName === 'detail') {
                    cardSection.style.display = 'none';
                    detailSection.style.display = 'flex';
                } else {
                    cardSection.style.display = 'flex';
                    detailSection.style.display = 'flex';
                }
            });
        });
    }

    function showDeleteConfirm(title, msg, confirmWord, dangerLabel, callback) {
        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay';

        var html = '<div class="manager-modal manager-delete-confirm-modal">' +
            '<div class="manager-confirm-title">' + title + '</div>' +
            '<div class="manager-confirm-msg">' + msg + '</div>' +
            '<div style="margin-bottom:.16rem;">' +
            '<label style="display:block;font-size:.11rem;color:rgba(255,255,255,.4);margin-bottom:.06rem;">Type <strong style="color:#ef4444;">' + confirmWord + '</strong> to confirm</label>' +
            '<input type="text" class="manager-form-input manager-delete-confirm-input" id="deleteConfirmInput" placeholder="' + confirmWord + '" autocomplete="off">' +
            '<div class="manager-delete-confirm-error" id="deleteConfirmError"></div>' +
            '</div>' +
            '<div class="manager-confirm-actions">' +
            '<button class="manager-btn manager-btn-outline" id="deleteConfirmCancel">Cancel</button>' +
            '<button class="manager-btn manager-btn-danger" id="deleteConfirmBtn" disabled>' + (dangerLabel || 'Delete') + '</button>' +
            '</div>' +
            '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        var input = overlay.querySelector('#deleteConfirmInput');
        var btn = overlay.querySelector('#deleteConfirmBtn');
        var error = overlay.querySelector('#deleteConfirmError');
        var cancelBtn = overlay.querySelector('#deleteConfirmCancel');

        function closeOverlay() { overlay.remove(); }

        function checkInput() {
            var val = input.value.trim();
            if (val === confirmWord) {
                btn.disabled = false;
                error.textContent = '';
            } else if (val.length > 0) {
                btn.disabled = true;
                error.textContent = 'Type exactly "' + confirmWord + '" to confirm';
            } else {
                btn.disabled = true;
                error.textContent = '';
            }
        }

        input.addEventListener('input', checkInput);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !btn.disabled) {
                closeOverlay();
                callback(true);
            }
        });

        btn.addEventListener('click', function() {
            if (!btn.disabled) {
                closeOverlay();
                callback(true);
            }
        });

        cancelBtn.addEventListener('click', function() {
            closeOverlay();
            callback(false);
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeOverlay();
                callback(false);
            }
        });

        setTimeout(function() { input.focus(); }, 100);
    }

    function saveToTrash(type, data, sourceKey) {
        var trash = loadFromLocalStorage(STORAGE_KEYS.trash) || [];
        trash.unshift({
            id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            type: type,
            data: data,
            sourceKey: sourceKey,
            deletedAt: new Date().toISOString(),
            deletedBy: adminUser ? adminUser.username : 'unknown'
        });
        saveToLocalStorage(STORAGE_KEYS.trash, trash);
    }

    function getTrash() {
        return loadFromLocalStorage(STORAGE_KEYS.trash) || [];
    }

    function removeFromTrash(trashId) {
        var trash = getTrash();
        for (var i = 0; i < trash.length; i++) {
            if (trash[i].id === trashId) {
                trash.splice(i, 1);
                break;
            }
        }
        saveToLocalStorage(STORAGE_KEYS.trash, trash);
    }

    function clearAllTrash() {
        saveToLocalStorage(STORAGE_KEYS.trash, []);
    }

    function uploadDiscFile(file, albumDir, callback) {
        var tokenXhr = new XMLHttpRequest();
        tokenXhr.open('POST', '/api/manager/disc-generate-upload-token', true);
        tokenXhr.setRequestHeader('Content-Type', 'application/json');
        tokenXhr.onload = function() {
            if (tokenXhr.status === 401) {
                try {
                    var errRes = JSON.parse(tokenXhr.responseText);
                    if (errRes.error && errRes.error.indexOf('session') !== -1) {
                        sessionToken = null;
                        sessionStorage.removeItem('manager_session');
                        callback('Session expired, please re-enter PIN', '');
                        return;
                    }
                } catch(e) {}
                callback('Unauthorized', '');
                return;
            }
            if (tokenXhr.status !== 200) {
                callback('Server error: HTTP ' + tokenXhr.status, '');
                return;
            }
            try {
                var tokenRes = JSON.parse(tokenXhr.responseText);
                if (!tokenRes.success) {
                    callback(tokenRes.error || 'Failed to get upload token', '');
                    return;
                }
                var uploadUrl = 'https://blob.vercel-storage.com/' + tokenRes.pathname;
                var putXhr = new XMLHttpRequest();
                putXhr.open('PUT', uploadUrl, true);
                putXhr.setRequestHeader('Authorization', 'Bearer ' + tokenRes.token);
                putXhr.onload = function() {
                    if (putXhr.status === 200 || putXhr.status === 201) {
                        try {
                            var blobRes = JSON.parse(putXhr.responseText);
                            callback(null, blobRes.url || ('https://' + new URL(uploadUrl).host + '/' + tokenRes.pathname));
                        } catch(e) {
                            callback(null, 'https://public.blob.vercel-storage.com/' + tokenRes.pathname);
                        }
                    } else {
                        callback('Upload failed: HTTP ' + putXhr.status, '');
                    }
                };
                putXhr.onerror = function() { callback('Network error during upload', ''); };
                putXhr.send(file);
            } catch(e) { callback('Token parse error', ''); }
        };
        tokenXhr.onerror = function() { callback('Network error', ''); };
        tokenXhr.send(JSON.stringify({ filename: file.name || 'unknown', albumDir: albumDir, sessionToken: sessionToken }));
    }

    function saveDiscToServer(callback) {
        var payload = { tapes: discData.tapes, playMode: 'sequence', currentTapeIndex: 0 };
        saveToLocalStorage(STORAGE_KEYS.discTapes, discData.tapes);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/manager/disc-save', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status === 401) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.error && res.error.indexOf('session') !== -1) {
                        sessionToken = null;
                        sessionStorage.removeItem('manager_session');
                        callback('Session expired, please re-enter PIN');
                        return;
                    }
                } catch(e) {}
                callback('Unauthorized');
                return;
            }
            if (xhr.status !== 200) {
                var errMsg = 'Server error: HTTP ' + xhr.status;
                try {
                    var errRes = JSON.parse(xhr.responseText);
                    if (errRes.error) errMsg += ' - ' + errRes.error;
                } catch(e) {}
                callback(errMsg);
                return;
            }
            try {
                var res = JSON.parse(xhr.responseText);
                callback(res.success ? null : (res.error || 'Save failed'));
            } catch(e) { callback('Parse error'); }
        };
        xhr.onerror = function() { callback('Network error'); };
        xhr.send(JSON.stringify({ data: payload, sessionToken: sessionToken }));
    }

    function renderDiscManager(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Disc Manager</h1>' +
            '<div class="manager-main-actions">' +
            '<button class="manager-btn manager-btn-primary" id="discAddBtn">' +
            '<svg class="manager-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            'Add Track</button>' +
            '</div>' +
            '</div>' +
            '<div id="discManagerContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        var savedDiscTapes = loadFromLocalStorage(STORAGE_KEYS.discTapes);
        if (savedDiscTapes) {
            discData.tapes = savedDiscTapes;
            var dc = document.getElementById('discManagerContent');
            if (dc) renderDiscTracks(dc);
        } else {
            fetch('data/disc.json')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    var dc = document.getElementById('discManagerContent');
                    if (!dc) return;
                    discData.tapes = data.tapes || [];
                    renderDiscTracks(dc);
                })
                .catch(function() {
                    var dc = document.getElementById('discManagerContent');
                    if (!dc) return;
                    discData.tapes = [];
                    renderDiscTracks(dc);
                });
        }

        document.getElementById('discAddBtn').addEventListener('click', function() {
            openDiscTrackModal(null);
        });
    }

    function renderDiscTracks(container) {
        if (!discData.tapes || discData.tapes.length === 0) {
            container.innerHTML = '<div class="manager-empty">No tracks yet.</div>';
            return;
        }

        var html = '<div class="manager-disc-list">';
        for (var i = 0; i < discData.tapes.length; i++) {
            var tape = discData.tapes[i];
            html += buildDiscTrackCard(tape, i);
        }
        html += '</div>';
        container.innerHTML = html;

        bindDiscTrackEvents(container);
    }

    function buildDiscTrackCard(tape, index) {
        return '<div class="manager-disc-item" data-track-index="' + index + '" draggable="true">' +
            '<div class="manager-disc-drag-handle" title="Drag to reorder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>' +
            '</div>' +
            '<div class="manager-disc-cover btn-disc-detail" data-idx="' + index + '">' +
            '<img src="' + (tape.cover || '') + '" alt="' + (tape.title || '') + '">' +
            '</div>' +
            '<div class="manager-disc-body">' +
            '<div class="manager-disc-track-info">' +
            '<h3 class="manager-disc-title">' + (tape.title || 'Unknown') + '</h3>' +
            '<p class="manager-disc-artist">' + (tape.artist || 'Vipen Music') + '</p>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function bindDiscTrackEvents(container) {
        var detailBtns = container.querySelectorAll('.btn-disc-detail');
        detailBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-idx'), 10);
                openDiscTrackDetail(idx);
            });
        });

        var items = container.querySelectorAll('.manager-disc-item');
        var dragSrcIndex = -1;

        items.forEach(function(item) {
            item.addEventListener('dragstart', function(e) {
                dragSrcIndex = parseInt(this.getAttribute('data-track-index'), 10);
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', dragSrcIndex);
            });

            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                items.forEach(function(it) { it.classList.remove('drag-over'); });
                dragSrcIndex = -1;
            });

            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                var targetIndex = parseInt(this.getAttribute('data-track-index'), 10);
                if (targetIndex !== dragSrcIndex) {
                    this.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });

            item.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                var targetIndex = parseInt(this.getAttribute('data-track-index'), 10);
                if (dragSrcIndex === -1 || dragSrcIndex === targetIndex) return;

                var moved = discData.tapes.splice(dragSrcIndex, 1)[0];
                discData.tapes.splice(targetIndex, 0, moved);
                saveDiscToServer(function(err) {
                    if (err) {
                        showToast('Reorder saved locally, but server sync failed: ' + err, true);
                    }
                });

                var dc = document.getElementById('discManagerContent');
                if (dc) renderDiscTracks(dc);
            });
        });
    }

    function dataUrlToBlob(dataUrl) {
        if (!dataUrl) return null;
        var parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        var mime = parts[0].match(/:(.*?);/);
        var mimeType = mime ? mime[1] : 'application/octet-stream';
        var binary = atob(parts[1]);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
    }

    function openDiscTrackModal(editIndex) {
        var isEdit = editIndex !== null;
        var tape = isEdit ? discData.tapes[editIndex] : {
            id: Date.now(),
            title: '',
            artist: 'Vipen Music',
            time: '0:00',
            cover: '',
            audio: ''
        };

        var currentAudio = tape.audio || '';
        var currentAudioFile = null;
        var currentCoverFile = null;

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay';
        overlay.innerHTML =
            '<div class="manager-modal" style="max-width:5rem;">' +
            '<button class="manager-modal-close" id="modalCloseBtn">&times;</button>' +
            '<div class="manager-modal-title">' + (isEdit ? 'Edit' : 'Add') + ' Track</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Title</label>' +
            '<input type="text" class="manager-form-input" id="discTitle" value="' + tape.title + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Artist</label>' +
            '<input type="text" class="manager-form-input" id="discArtist" value="' + tape.artist + '">' +
            '</div>' +
            createImageUploadField('disc', tape.cover, 'Cover Image', 'discCover') +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Audio File</label>' +
            '<div class="manager-design-cover-zone" id="discAudioZone" style="height:1rem;border-style:dashed;">' +
            '<input type="file" class="manager-design-file-input" id="discAudioInput" accept="audio/*">' +
            '<div class="manager-design-cover-placeholder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
            '<span id="discAudioLabel">' + (currentAudio ? 'Audio file selected' : 'Click to upload audio') + '</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="manager-modal-actions">' +
            '<button class="manager-btn manager-btn-outline" id="modalCancelBtn">Cancel</button>' +
            '<button class="manager-btn manager-btn-primary" id="modalSaveBtn">Save</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        bindImageUploadField(overlay, 'discCover');

        var audioZone = overlay.querySelector('#discAudioZone');
        var audioInput = overlay.querySelector('#discAudioInput');
        var audioLabel = overlay.querySelector('#discAudioLabel');
        if (audioZone && audioInput) {
            audioZone.addEventListener('click', function() { audioInput.click(); });
            audioZone.addEventListener('dragover', function(e) { e.preventDefault(); audioZone.classList.add('dragover'); });
            audioZone.addEventListener('dragleave', function() { audioZone.classList.remove('dragover'); });
            audioZone.addEventListener('drop', function(e) {
                e.preventDefault();
                audioZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) handleDiscAudioFile(e.dataTransfer.files[0]);
            });
            audioInput.addEventListener('change', function() {
                if (this.files.length > 0) handleDiscAudioFile(this.files[0]);
            });
        }

        function handleDiscAudioFile(file) {
            if (!file.type.startsWith('audio/')) {
                showToast('Only audio files are supported', true);
                return;
            }
            if (file.size > CONFIG.DISC_AUDIO_MAX_SIZE) {
                showToast('Audio too large (max 50MB)', true);
                return;
            }
            currentAudioFile = file;
            if (currentAudio && currentAudio.indexOf('blob:') === 0) {
                URL.revokeObjectURL(currentAudio);
            }
            currentAudio = URL.createObjectURL(file);
            if (audioLabel) audioLabel.textContent = file.name;
        }

        function closeModal() {
            if (currentAudio && currentAudio.indexOf('blob:') === 0) {
                URL.revokeObjectURL(currentAudio);
            }
            overlay.remove();
        }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        overlay.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
        overlay.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
        overlay.querySelector('#modalSaveBtn').addEventListener('click', function() {
            var trackId = tape.id;
            var title = overlay.querySelector('#discTitle').value.trim();
            var artist = overlay.querySelector('#discArtist').value.trim() || 'Vipen Music';
            var coverDataUrl = getImageUploadValue(overlay, 'discCover');
            var albumDir = title || 'untitled';

            var metaOnly = {
                id: trackId,
                title: title,
                artist: artist,
                time: '0:00',
                cover: coverDataUrl && coverDataUrl.indexOf('data:') === 0 ? '' : (coverDataUrl && coverDataUrl.indexOf('blob:') === 0 ? '' : (coverDataUrl || '')),
                audio: currentAudioFile ? '' : (currentAudio && currentAudio.indexOf('blob:') === 0 ? '' : (currentAudio || ''))
            };

            function finishSave() {
                if (isEdit) {
                    discData.tapes[editIndex] = metaOnly;
                } else {
                    discData.tapes.push(metaOnly);
                }
                saveDiscToServer(function(err) {
                    var dc = document.getElementById('discManagerContent');
                    if (dc) renderDiscTracks(dc);
                    if (err) {
                        showToast('Saved locally, but server sync failed: ' + err, true);
                    } else {
                        showToast(isEdit ? 'Track updated' : 'Track added');
                    }
                    closeModal();
                });
            }

            var pending = 0;
            function tryFinish() {
                pending--;
                if (pending <= 0) finishSave();
            }

            if (currentAudioFile) {
                pending++;
                uploadDiscFile(currentAudioFile, albumDir, function(err, path) {
                    if (err) {
                        showToast('Audio upload failed: ' + err, true);
                    } else if (path) {
                        metaOnly.audio = path;
                    } else {
                        showToast('Audio upload returned empty path', true);
                    }
                    tryFinish();
                });
            }
            if (coverDataUrl && coverDataUrl.indexOf('data:') === 0) {
                var coverBlob = dataUrlToBlob(coverDataUrl);
                if (coverBlob) {
                    pending++;
                    uploadDiscFile(coverBlob, albumDir, function(err, path) {
                        if (err) {
                            showToast('Cover upload failed: ' + err, true);
                        } else if (path) {
                            metaOnly.cover = path;
                        } else {
                            showToast('Cover upload returned empty path', true);
                        }
                        tryFinish();
                    });
                }
            }

            if (pending === 0) finishSave();
        });
    }

    function openDiscTrackDetail(editIndex) {
        var tape = JSON.parse(JSON.stringify(discData.tapes[editIndex]));
        if (!tape) return;

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay manager-disc-detail-overlay';
        overlay.id = 'discDetailOverlay';

        var detailAudio = new Audio();
        var isPlaying = false;
        var isDraggingProgress = false;
        var currentCover = tape.cover || '';
        var currentAudio = tape.audio || '';
        var currentCoverFile = null;
        var currentAudioFile = null;

        function formatDetailTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            var m = Math.floor(seconds / 60);
            var s = Math.floor(seconds % 60);
            return m + ':' + (s < 10 ? '0' + s : s);
        }

        function updateDetailProgress() {
            var bar = document.getElementById('detailProgressBar');
            var cur = document.getElementById('detailCurrentTime');
            var dur = document.getElementById('detailDuration');
            if (bar && detailAudio.duration) {
                bar.style.width = (detailAudio.currentTime / detailAudio.duration * 100) + '%';
            }
            if (cur) cur.textContent = formatDetailTime(detailAudio.currentTime);
            if (dur && detailAudio.duration) dur.textContent = formatDetailTime(detailAudio.duration);
        }

        var detailProgressInterval = null;

        function syncDetailPlayUI() {
            var icon = document.getElementById('detailPlayIcon');
            if (isPlaying) {
                if (icon) icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                if (detailProgressInterval) clearInterval(detailProgressInterval);
                detailProgressInterval = setInterval(updateDetailProgress, 500);
            } else {
                if (icon) icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
                if (detailProgressInterval) clearInterval(detailProgressInterval);
            }
        }

        function toggleDetailPlay() {
            if (isPlaying) {
                detailAudio.pause();
            } else {
                detailAudio.play().catch(function() {});
            }
        }

        function updateDetailCover(url) {
            var coverEl = document.getElementById('detailCoverImg');
            var bgEl = document.getElementById('detailPlayerBg');
            if (coverEl) coverEl.src = url;
            if (bgEl) bgEl.style.backgroundImage = 'url(' + url + ')';
        }

        function buildDetailUI() {
            return '<div class="manager-disc-detail">' +
                '<div class="manager-disc-detail-header">' +
                '<button class="manager-design-editor-back" id="detailBack">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>' +
                'Back</button>' +
                '<div class="manager-design-editor-title">Track Detail</div>' +
                '<button class="manager-btn manager-btn-primary manager-design-editor-save active" id="detailSave">Save</button>' +
                '</div>' +
                '<div class="manager-disc-detail-body">' +
                '<div class="manager-disc-detail-left">' +
                '<div class="manager-disc-detail-player" id="detailPlayer">' +
                '<div class="detail-player-bg" id="detailPlayerBg" style="background-image:url(' + currentCover + ')"></div>' +
                '<div class="detail-player-bg-overlay"></div>' +
                '<div class="detail-player-controls">' +
                '<button class="detail-player-btn" id="detailPrevBtn" disabled>' +
                '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>' +
                '</button>' +
                '<button class="detail-player-btn play" id="detailPlayBtn">' +
                '<svg viewBox="0 0 24 24" id="detailPlayIcon"><path d="M8 5v14l11-7z"/></svg>' +
                '</button>' +
                '<button class="detail-player-btn" id="detailNextBtn" disabled>' +
                '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>' +
                '</button>' +
                '</div>' +
                '<div class="detail-player-center">' +
                '<div class="detail-player-track-info">' +
                '<div class="detail-player-mini-cover">' +
                '<img src="' + currentCover + '" alt="' + (tape.title || '') + '" id="detailCoverImg">' +
                '</div>' +
                '<div class="detail-player-meta">' +
                '<div class="detail-player-title" id="detailPlayerTitle">' + (tape.title || 'Unknown') + '</div>' +
                '<div class="detail-player-artist" id="detailPlayerArtist">' + (tape.artist || 'Vipen Music') + '</div>' +
                '</div>' +
                '</div>' +
                '<div class="detail-player-progress-wrap">' +
                '<span class="detail-player-time" id="detailCurrentTime">0:00</span>' +
                '<div class="detail-player-progress-track" id="detailProgressTrack">' +
                '<div class="detail-player-progress-bar" id="detailProgressBar" style="width:0%"></div>' +
                '</div>' +
                '<span class="detail-player-time" id="detailDuration">0:00</span>' +
                '</div>' +
                '</div>' +
                '<button class="detail-player-delete" id="detailDelete" title="Delete Track">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                '</button>' +
                '</div>' +
                '</div>' +
                '<div class="manager-disc-detail-right">' +
                '<div class="manager-disc-detail-section">' +
                '<div class="manager-disc-detail-section-title">Track Info</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Title</label>' +
                '<input type="text" class="manager-form-input" id="detailTitle" value="' + (tape.title || '') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Artist</label>' +
                '<input type="text" class="manager-form-input" id="detailArtist" value="' + (tape.artist || '') + '">' +
                '</div>' +
                '</div>' +
                '<div class="manager-disc-detail-section">' +
                '<div class="manager-disc-detail-section-title">Cover Image</div>' +
                '<div class="manager-design-cover-zone" id="detailCoverZone" style="height:1.6rem;">' +
                '<input type="file" class="manager-design-file-input" id="detailCoverInput" accept="image/*">' +
                '<div class="manager-design-cover-preview" id="detailCoverPreview" style="background:url(' + currentCover + ') center/cover no-repeat"></div>' +
                '<div class="manager-design-cover-placeholder">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                '<span>Click to change cover</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="manager-disc-detail-section">' +
                '<div class="manager-disc-detail-section-title">Audio File</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Upload File</label>' +
                '<div class="manager-design-cover-zone" id="detailAudioZone" style="height:1rem;border-style:dashed;">' +
                '<input type="file" class="manager-design-file-input" id="detailAudioInput" accept="audio/*">' +
                '<div class="manager-design-cover-placeholder">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
                '<span>Click to upload audio</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }

        overlay.innerHTML = buildDetailUI();
        document.body.appendChild(overlay);

        if (currentAudio) {
            detailAudio.src = currentAudio;
            detailAudio.load();
        }

        detailAudio.addEventListener('play', function() {
            isPlaying = true;
            syncDetailPlayUI();
        });
        detailAudio.addEventListener('pause', function() {
            isPlaying = false;
            syncDetailPlayUI();
        });
        detailAudio.addEventListener('loadedmetadata', function() {
            var dur = document.getElementById('detailDuration');
            if (dur && detailAudio.duration) dur.textContent = formatDetailTime(detailAudio.duration);
        });
        detailAudio.addEventListener('ended', function() {
            isPlaying = false;
            syncDetailPlayUI();
            if (detailProgressInterval) clearInterval(detailProgressInterval);
            updateDetailProgress();
        });

        function closeDetail() {
            detailAudio.pause();
            if (detailProgressInterval) clearInterval(detailProgressInterval);
            if (currentAudio && currentAudio.indexOf('blob:') === 0) {
                URL.revokeObjectURL(currentAudio);
            }
            overlay.remove();
        }

        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeDetail(); });
        overlay.querySelector('#detailBack').addEventListener('click', closeDetail);

        var playBtn = overlay.querySelector('#detailPlayBtn');
        if (playBtn) {
            playBtn.addEventListener('click', toggleDetailPlay);
        }

        var progressTrack = overlay.querySelector('#detailProgressTrack');
        if (progressTrack) {
            function setDetailProgressFromX(clientX) {
                if (!detailAudio.duration) return;
                var rect = progressTrack.getBoundingClientRect();
                var percent = (clientX - rect.left) / rect.width;
                percent = Math.max(0, Math.min(1, percent));
                detailAudio.currentTime = percent * detailAudio.duration;
                updateDetailProgress();
            }
            progressTrack.addEventListener('mousedown', function(e) {
                isDraggingProgress = true;
                setDetailProgressFromX(e.clientX);
            });
            progressTrack.addEventListener('touchstart', function(e) {
                isDraggingProgress = true;
                if (e.touches && e.touches.length > 0) setDetailProgressFromX(e.touches[0].clientX);
            }, { passive: false });
        }

        window.addEventListener('mousemove', function(e) {
            if (isDraggingProgress) {
                var track = document.getElementById('detailProgressTrack');
                if (track) {
                    var rect = track.getBoundingClientRect();
                    var percent = (e.clientX - rect.left) / rect.width;
                    percent = Math.max(0, Math.min(1, percent));
                    detailAudio.currentTime = percent * detailAudio.duration;
                    updateDetailProgress();
                }
            }
        });
        window.addEventListener('mouseup', function() { isDraggingProgress = false; });
        window.addEventListener('touchmove', function(e) {
            if (isDraggingProgress && e.touches && e.touches.length > 0) {
                var track = document.getElementById('detailProgressTrack');
                if (track) {
                    var rect = track.getBoundingClientRect();
                    var percent = (e.touches[0].clientX - rect.left) / rect.width;
                    percent = Math.max(0, Math.min(1, percent));
                    detailAudio.currentTime = percent * detailAudio.duration;
                    updateDetailProgress();
                }
            }
        }, { passive: false });
        window.addEventListener('touchend', function() { isDraggingProgress = false; });

        var titleInput = overlay.querySelector('#detailTitle');
        var artistInput = overlay.querySelector('#detailArtist');
        if (titleInput) {
            titleInput.addEventListener('input', function() {
                var titleEl = overlay.querySelector('#detailPlayerTitle');
                if (titleEl) titleEl.textContent = titleInput.value.trim() || 'Unknown';
            });
        }
        if (artistInput) {
            artistInput.addEventListener('input', function() {
                var artistEl = overlay.querySelector('#detailPlayerArtist');
                if (artistEl) artistEl.textContent = artistInput.value.trim() || 'Vipen Music';
            });
        }

        var coverZone = overlay.querySelector('#detailCoverZone');
        var coverInput = overlay.querySelector('#detailCoverInput');
        var coverPreview = overlay.querySelector('#detailCoverPreview');
        if (coverZone && coverInput) {
            coverZone.addEventListener('click', function() { coverInput.click(); });
            coverZone.addEventListener('dragover', function(e) { e.preventDefault(); coverZone.classList.add('dragover'); });
            coverZone.addEventListener('dragleave', function() { coverZone.classList.remove('dragover'); });
            coverZone.addEventListener('drop', function(e) {
                e.preventDefault();
                coverZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) handleDetailCoverFile(e.dataTransfer.files[0]);
            });
            coverInput.addEventListener('change', function() {
                if (this.files.length > 0) handleDetailCoverFile(this.files[0]);
            });
        }

        function handleDetailCoverFile(file) {
            currentCoverFile = file;
            validateCoverImage(file, function() {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var dataUrl = e.target.result;
                    currentCover = dataUrl;
                    if (coverPreview) coverPreview.style.background = 'url(' + dataUrl + ') center/cover no-repeat';
                    updateDetailCover(dataUrl);
                    showToast('Cover image uploaded successfully');
                };
                reader.readAsDataURL(file);
            }, function(msg) {
                showToast(msg, true);
            });
        }

        var audioZone = overlay.querySelector('#detailAudioZone');
        var audioInput = overlay.querySelector('#detailAudioInput');
        if (audioZone && audioInput) {
            audioZone.addEventListener('click', function() { audioInput.click(); });
            audioZone.addEventListener('dragover', function(e) { e.preventDefault(); audioZone.classList.add('dragover'); });
            audioZone.addEventListener('dragleave', function() { audioZone.classList.remove('dragover'); });
            audioZone.addEventListener('drop', function(e) {
                e.preventDefault();
                audioZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) handleDetailAudioFile(e.dataTransfer.files[0]);
            });
            audioInput.addEventListener('change', function() {
                if (this.files.length > 0) handleDetailAudioFile(this.files[0]);
            });
        }

        function handleDetailAudioFile(file) {
            if (!file.type.startsWith('audio/')) {
                showToast('Only audio files are supported', true);
                return;
            }
            if (file.size > CONFIG.DISC_AUDIO_MAX_SIZE) {
                showToast('Audio too large (max 50MB)', true);
                return;
            }
            currentAudioFile = file;
            if (currentAudio && currentAudio.indexOf('blob:') === 0) {
                URL.revokeObjectURL(currentAudio);
            }
            currentAudio = URL.createObjectURL(file);
            detailAudio.src = currentAudio;
            detailAudio.load();
            isPlaying = false;
            syncDetailPlayUI();
        }

        overlay.querySelector('#detailSave').addEventListener('click', function() {
            var trackId = tape.id;
            var title = titleInput ? titleInput.value.trim() : tape.title;
            var artist = artistInput ? artistInput.value.trim() || 'Vipen Music' : tape.artist;
            var albumDir = title || 'untitled';

            var metaOnly = {
                id: trackId,
                title: title,
                artist: artist,
                time: '0:00',
                cover: currentCoverFile ? '' : (currentCover && currentCover.indexOf('data:') === 0 ? '' : (currentCover && currentCover.indexOf('blob:') === 0 ? '' : (currentCover || ''))),
                audio: currentAudioFile ? '' : (currentAudio && currentAudio.indexOf('data:') === 0 ? '' : (currentAudio && currentAudio.indexOf('blob:') === 0 ? '' : (currentAudio || '')))
            };

            function finishSave() {
                discData.tapes[editIndex] = metaOnly;
                saveDiscToServer(function(err) {
                    var dc = document.getElementById('discManagerContent');
                    if (dc) renderDiscTracks(dc);
                    if (err) {
                        showToast('Saved locally, but server sync failed: ' + err, true);
                    } else {
                        showToast('Track updated');
                    }
                    closeDetail();
                });
            }

            var pending = 0;
            function tryFinish() {
                pending--;
                if (pending <= 0) finishSave();
            }

            if (currentAudioFile) {
                pending++;
                uploadDiscFile(currentAudioFile, albumDir, function(err, path) {
                    if (err) {
                        showToast('Audio upload failed: ' + err, true);
                    } else if (path) {
                        metaOnly.audio = path;
                    } else {
                        showToast('Audio upload returned empty path', true);
                    }
                    tryFinish();
                });
            } else if (currentAudio && currentAudio.indexOf('data:') === 0) {
                var audioBlob = dataUrlToBlob(currentAudio);
                if (audioBlob) {
                    pending++;
                    uploadDiscFile(audioBlob, albumDir, function(err, path) {
                        if (err) {
                            showToast('Audio upload failed: ' + err, true);
                        } else if (path) {
                            metaOnly.audio = path;
                        } else {
                            showToast('Audio upload returned empty path', true);
                        }
                        tryFinish();
                    });
                }
            }
            if (currentCoverFile) {
                pending++;
                uploadDiscFile(currentCoverFile, albumDir, function(err, path) {
                    if (err) {
                        showToast('Cover upload failed: ' + err, true);
                    } else if (path) {
                        metaOnly.cover = path;
                    } else {
                        showToast('Cover upload returned empty path', true);
                    }
                    tryFinish();
                });
            } else if (currentCover && currentCover.indexOf('data:') === 0) {
                var coverBlob = dataUrlToBlob(currentCover);
                if (coverBlob) {
                    pending++;
                    uploadDiscFile(coverBlob, albumDir, function(err, path) {
                        if (err) {
                            showToast('Cover upload failed: ' + err, true);
                        } else if (path) {
                            metaOnly.cover = path;
                        } else {
                            showToast('Cover upload returned empty path', true);
                        }
                        tryFinish();
                    });
                }
            }

            if (pending === 0) finishSave();
        });

        overlay.querySelector('#detailDelete').addEventListener('click', function() {
            var track = discData.tapes[editIndex];
            showDeleteConfirm(
                'Delete Track',
                'Are you sure you want to delete "' + (track.title || 'Unknown') + '"? This will be moved to Trash.',
                'Delete',
                'Move to Trash',
                function(confirmed) {
                    if (!confirmed) return;
                    saveToTrash('disc_track', JSON.parse(JSON.stringify(track)), STORAGE_KEYS.discTapes);
                    discData.tapes.splice(editIndex, 1);
                    saveDiscToServer(function(err) {
                        var dc = document.getElementById('discManagerContent');
                        if (dc) renderDiscTracks(dc);
                        if (err) {
                            showToast('Deleted locally, but server sync failed: ' + err, true);
                        } else {
                            showToast('Track moved to Trash');
                        }
                        closeDetail();
                    });
                }
            );
        });
    }

    function renderUsersManager(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">User Management</h1>' +
            '</div>' +
            '<div id="usersManagerContent"><div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div></div>';

        loadJsonData('data/manager/users.json', function(users) {
            var uc = document.getElementById('usersManagerContent');
            if (!uc) return;
            var savedUsers = loadFromLocalStorage(STORAGE_KEYS.users);
            if (savedUsers) {
                usersData = savedUsers;
            } else if (users) {
                usersData = users;
            }
            renderUsersLeaderboard(uc);
        });
    }

    function renderUsersLeaderboard(container) {
        var sorted = usersData.slice().sort(function(a, b) {
            return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
        });

        var html = '<div class="manager-card">' +
            '<div class="manager-card-header">User Activity Leaderboard (by last login)</div>' +
            '<div class="manager-users-list">';

        for (var i = 0; i < sorted.length; i++) {
            var u = sorted[i];
            var rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
            html += '<div class="manager-user-row ' + rankClass + '" data-user-id="' + u.id + '">' +
                '<div class="manager-user-rank">' + (i + 1) + '</div>' +
                '<img src="' + u.avatar + '" class="manager-user-row-avatar" alt="">' +
                '<div class="manager-user-row-info">' +
                '<div class="manager-user-row-name">' + u.username + '</div>' +
                '<div class="manager-user-row-email">' + u.email + '</div>' +
                '</div>' +
                '<div class="manager-user-row-meta">' +
                '<span class="manager-badge manager-badge-' + u.role.toLowerCase() + '">' + u.role + '</span>' +
                '<span class="manager-badge manager-badge-' + u.status + '">' + u.status + '</span>' +
                '</div>' +
                '<div class="manager-user-row-login">' +
                '<div class="manager-user-row-login-label">Last Login</div>' +
                '<div class="manager-user-row-login-time">' + formatDate(u.lastLogin) + '</div>' +
                '</div>' +
                '<div class="manager-user-row-actions">' +
                '<button class="manager-btn manager-btn-outline manager-btn-sm btn-user-profile" data-uid="' + u.id + '">Profile</button>' +
                '<button class="manager-btn manager-btn-outline manager-btn-sm btn-user-edit" data-uid="' + u.id + '">Edit</button>' +
                '</div>' +
                '</div>';
        }

        html += '</div></div>';
        container.innerHTML = html;

        bindUsersEvents(container);
    }

    function bindUsersEvents(container) {
        var profileBtns = container.querySelectorAll('.btn-user-profile');
        profileBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var uid = this.getAttribute('data-uid');
                var user = usersData.find(function(u) { return u.id === uid; });
                if (user) {
                    window.open('#/profile?user=' + encodeURIComponent(user.username), '_blank');
                }
            });
        });

        var editBtns = container.querySelectorAll('.btn-user-edit');
        editBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var uid = this.getAttribute('data-uid');
                openUserEditModal(uid);
            });
        });
    }

    function openUserEditModal(userId) {
        var user = null;
        for (var i = 0; i < usersData.length; i++) {
            if (usersData[i].id === userId) { user = usersData[i]; break; }
        }
        if (!user) { showToast('User not found', true); return; }

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay';
        overlay.innerHTML =
            '<div class="manager-modal" style="position:relative;">' +
            '<button class="manager-modal-close" id="modalCloseBtn">&times;</button>' +
            '<div class="manager-modal-title">Edit User: ' + user.username + '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Username</label>' +
            '<input type="text" class="manager-form-input" id="editUsername" value="' + user.username + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Email</label>' +
            '<input type="email" class="manager-form-input" id="editEmail" value="' + user.email + '">' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Role</label>' +
            '<select class="manager-form-select" id="editRole">' +
            '<option value="Viper"' + (user.role === 'Viper' ? ' selected' : '') + '>Viper (User)</option>' +
            '<option value="GreatPen"' + (user.role === 'GreatPen' ? ' selected' : '') + '>GreatPen</option>' +
            '<option value="Co-creator"' + (user.role === 'Co-creator' ? ' selected' : '') + '>Co-creator</option>' +
            '<option value="ManagerGo"' + (user.role === 'ManagerGo' ? ' selected' : '') + '>ManagerGo (Admin)</option>' +
            '</select>' +
            '</div>' +
            '<div class="manager-form-group">' +
            '<label class="manager-form-label">Status</label>' +
            '<select class="manager-form-select" id="editStatus">' +
            '<option value="active"' + (user.status === 'active' ? ' selected' : '') + '>Active</option>' +
            '<option value="banned"' + (user.status === 'banned' ? ' selected' : '') + '>Banned</option>' +
            '</select>' +
            '</div>' +
            '<div class="manager-modal-actions">' +
            '<button class="manager-btn manager-btn-outline" id="modalCancelBtn">Cancel</button>' +
            '<button class="manager-btn manager-btn-primary" id="modalSaveBtn">Save Changes</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function closeModal() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        overlay.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
        overlay.querySelector('#modalCancelBtn').addEventListener('click', closeModal);
        overlay.querySelector('#modalSaveBtn').addEventListener('click', function() {
            user.username = overlay.querySelector('#editUsername').value.trim();
            user.email = overlay.querySelector('#editEmail').value.trim();
            user.role = overlay.querySelector('#editRole').value;
            user.status = overlay.querySelector('#editStatus').value;
            saveToLocalStorage(STORAGE_KEYS.users, usersData);
            var uc = document.getElementById('usersManagerContent');
            if (uc) renderUsersLeaderboard(uc);
            showToast('User updated');
            closeModal();
        });
    }

    function renderHome(container) {
        var homeBannerData = null;

        function buildHomeUI() {
            var groups = homeBannerData ? homeBannerData.groups : [];
            var html = '<div class="manager-main-header">' +
                '<h1 class="manager-main-title">HOME - Banner Manager</h1>' +
                '<div class="manager-main-actions">' +
                '<button class="manager-btn manager-btn-primary" id="homeSaveBtn">' +
                '<svg class="manager-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
                'Save</button>' +
                '</div>' +
                '</div>' +
                '<div class="manager-home-groups">';

            for (var i = 0; i < 4; i++) {
                var group = groups[i] || { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] };
                var bgImage = group.bgImage || '';
                var bgVideo = group.bgVideo || '';
                var bgType = group.bgType || 'image';
                var texts = group.carouselTexts || [];

                html += '<div class="manager-home-group" data-group-index="' + i + '">' +
                    '<div class="manager-home-group-header">' +
                    '<span class="manager-home-group-label">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:.18rem;height:.18rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                    'Banner ' + (i + 1) + '</span>' +
                    '<div class="manager-home-type-toggle" data-group="' + i + '">' +
                    '<button class="manager-home-type-btn' + (bgType === 'image' ? ' active' : '') + '" data-type="image" data-group="' + i + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:.14rem;height:.14rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                    'Image</button>' +
                    '<button class="manager-home-type-btn' + (bgType === 'video' ? ' active' : '') + '" data-type="video" data-group="' + i + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:.14rem;height:.14rem;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' +
                    'Video</button>' +
                    '</div>' +
                    '</div>' +
                    '<div class="manager-home-body">' +
                    '<div class="manager-home-banner-section" data-group="' + i + '">' +
                    '<div class="manager-home-media-area manager-home-image-area" data-group="' + i + '" style="' + (bgType === 'video' ? 'display:none' : '') + '">' +
                    '<label class="manager-form-label">Banner Image</label>' +
                    '<div class="manager-home-banner-upload" data-group="' + i + '">' +
                    (bgImage ?
                        '<div class="manager-home-banner-preview" style="background-image:url(' + bgImage + ')">' +
                        '<button class="manager-home-banner-replace" data-group="' + i + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                        'Replace</button>' +
                        '</div>' :
                        '<div class="manager-home-banner-placeholder">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                        '<span>Click to upload banner image</span>' +
                        '</div>') +
                    '<input type="file" class="manager-home-file-input" accept="image/*" data-group="' + i + '">' +
                    '</div>' +
                    '</div>' +
                    '<div class="manager-home-media-area manager-home-video-area" data-group="' + i + '" style="' + (bgType === 'image' ? 'display:none' : '') + '">' +
                    '<label class="manager-form-label">Banner Video</label>' +
                    '<div class="manager-home-video-upload" data-group="' + i + '">' +
                    (bgVideo ?
                        '<div class="manager-home-video-preview" data-group="' + i + '" data-video-path="' + escapeHtml(bgVideo) + '">' +
                        '<video src="' + bgVideo + '" muted loop preload="metadata"></video>' +
                        '<button class="manager-home-banner-replace manager-home-video-replace" data-group="' + i + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                        'Replace</button>' +
                        '</div>' :
                        '<div class="manager-home-video-placeholder">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' +
                        '<span>Click to upload banner video</span>' +
                        '</div>') +
                    '<input type="file" class="manager-home-video-file-input" accept="video/*" data-group="' + i + '">' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="manager-home-texts-section">' +
                    '<div class="manager-home-texts-header">' +
                    '<label class="manager-form-label">Carousel Texts</label>' +
                    '<button class="manager-btn manager-btn-outline manager-btn-sm home-add-text-btn" data-group="' + i + '">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:.14rem;height:.14rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                    'Add Text</button>' +
                    '</div>' +
                    '<div class="manager-home-texts-list" data-group="' + i + '">';

                for (var j = 0; j < texts.length; j++) {
                    var t = texts[j];
                    html += '<div class="manager-home-text-item" data-group="' + i + '" data-text-index="' + j + '">' +
                        '<div class="manager-home-text-fields">' +
                        '<input type="text" class="manager-form-input home-text-topic" value="' + escapeHtml(t.topic || '') + '" placeholder="Topic" data-group="' + i + '" data-text-index="' + j + '">' +
                        '<input type="text" class="manager-form-input home-text-note" value="' + escapeHtml(t.note || '') + '" placeholder="Note" data-group="' + i + '" data-text-index="' + j + '">' +
                        '</div>' +
                        '<button class="manager-btn manager-btn-danger manager-btn-sm home-remove-text-btn" data-group="' + i + '" data-text-index="' + j + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:.14rem;height:.14rem;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                        '</button>' +
                        '</div>';
                }

                if (texts.length === 0) {
                    html += '<div class="manager-empty" style="padding:.3rem;font-size:.11rem;">No carousel texts yet. Click "Add Text" to add one.</div>';
                }

                html += '</div></div></div></div>';
            }

            html += '</div>';
            container.innerHTML = html;

            bindHomeEvents();
        }

        function bindHomeEvents() {
            var saveBtn = document.getElementById('homeSaveBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    saveHomeBanner();
                });
            }

            var typeToggleBtns = container.querySelectorAll('.manager-home-type-btn');
            typeToggleBtns.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var groupIdx = parseInt(this.getAttribute('data-group'));
                    var type = this.getAttribute('data-type');
                    switchMediaType(groupIdx, type);
                });
            });

            var uploadZones = container.querySelectorAll('.manager-home-banner-upload');
            uploadZones.forEach(function(zone) {
                zone.addEventListener('click', function(e) {
                    if (e.target.closest('.manager-home-banner-replace')) return;
                    var groupIdx = zone.getAttribute('data-group');
                    var fileInput = zone.querySelector('.manager-home-file-input');
                    if (fileInput) fileInput.click();
                });

                var fileInput = zone.querySelector('.manager-home-file-input');
                if (fileInput) {
                    fileInput.addEventListener('change', function() {
                        var groupIdx = this.getAttribute('data-group');
                        handleBannerUpload(groupIdx, this);
                    });
                }

                var replaceBtn = zone.querySelector('.manager-home-banner-replace');
                if (replaceBtn) {
                    replaceBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        var groupIdx = this.getAttribute('data-group');
                        var fi = zone.querySelector('.manager-home-file-input');
                        if (fi) fi.click();
                    });
                }
            });

            var addTextBtns = container.querySelectorAll('.home-add-text-btn');
            addTextBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var groupIdx = parseInt(this.getAttribute('data-group'));
                    addCarouselText(groupIdx);
                });
            });

            var removeTextBtns = container.querySelectorAll('.home-remove-text-btn');
            removeTextBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var groupIdx = parseInt(this.getAttribute('data-group'));
                    var textIdx = parseInt(this.getAttribute('data-text-index'));
                    removeCarouselText(groupIdx, textIdx);
                });
            });

            var videoUploads = container.querySelectorAll('.manager-home-video-upload');
            videoUploads.forEach(function(zone) {
                zone.addEventListener('click', function(e) {
                    if (e.target.closest('.manager-home-video-replace')) return;
                    if (e.target.closest('video')) return;
                    var groupIdx = zone.getAttribute('data-group');
                    var fileInput = zone.querySelector('.manager-home-video-file-input');
                    if (fileInput) fileInput.click();
                });

                var videoInput = zone.querySelector('.manager-home-video-file-input');
                if (videoInput) {
                    videoInput.addEventListener('change', function() {
                        var groupIdx = this.getAttribute('data-group');
                        handleVideoUpload(groupIdx, this);
                    });
                }

                var replaceBtn = zone.querySelector('.manager-home-video-replace');
                if (replaceBtn) {
                    replaceBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        var groupIdx = this.getAttribute('data-group');
                        var fi = zone.querySelector('.manager-home-video-file-input');
                        if (fi) fi.click();
                    });
                }
            });

            var previewClickables = container.querySelectorAll('.manager-home-banner-preview, .manager-home-video-preview');
            previewClickables.forEach(function(el) {
                el.addEventListener('click', function(e) {
                    if (e.target.closest('.manager-home-banner-replace') || e.target.closest('.manager-home-video-replace')) return;
                    e.stopPropagation();
                    var videoPath = this.getAttribute('data-video-path');
                    if (videoPath) {
                        openMediaPreview('video', videoPath);
                    } else {
                        var bg = this.style.backgroundImage;
                        var imgUrl = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
                        if (imgUrl) openMediaPreview('image', imgUrl);
                    }
                });
            });
        }

        function switchMediaType(groupIdx, type) {
            collectFormData();
            if (!homeBannerData.groups[groupIdx]) {
                homeBannerData.groups[groupIdx] = { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] };
            }
            homeBannerData.groups[groupIdx].bgType = type;
            buildHomeUI();
        }

        function handleBannerUpload(groupIdx, fileInput) {
            var file = fileInput.files[0];
            if (!file) return;
            if (!file.type.match(/^image\//)) {
                showToast('Please select an image file', true);
                return;
            }

            var reader = new FileReader();
            reader.onload = function(e) {
                var dataUrl = e.target.result;
                if (!homeBannerData.groups[groupIdx]) {
                    homeBannerData.groups[groupIdx] = { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] };
                }
                homeBannerData.groups[groupIdx].bgImage = dataUrl;
                homeBannerData.groups[groupIdx].bgType = 'image';
                buildHomeUI();
                showToast('Banner image loaded');
            };
            reader.onerror = function() {
                showToast('Failed to read image', true);
            };
            reader.readAsDataURL(file);
        }

        function handleVideoUpload(groupIdx, fileInput) {
            var file = fileInput.files[0];
            if (!file) return;
            if (!file.type.match(/^video\//)) {
                showToast('Please select a video file', true);
                return;
            }
            if (file.size > 150 * 1024 * 1024) {
                showToast('Video too large (max 150MB)', true);
                return;
            }

            var formData = new FormData();
            formData.append('dest', 'banner');
            formData.append('file', file);

            var xhr = new XMLHttpRequest();
            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    var pct = Math.round((e.loaded / e.total) * 100);
                    showToast('Uploading video: ' + pct + '%');
                }
            };
            xhr.onload = function() {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success && res.files && res.files.length > 0) {
                        var videoPath = res.files[0].path;
                        if (!homeBannerData.groups[groupIdx]) {
                            homeBannerData.groups[groupIdx] = { bgImage: '', bgVideo: '', bgType: 'video', carouselTexts: [] };
                        }
                        homeBannerData.groups[groupIdx].bgVideo = videoPath;
                        homeBannerData.groups[groupIdx].bgType = 'video';
                        buildHomeUI();
                        showToast('Video uploaded successfully');
                    } else {
                        showToast('Upload failed: ' + (res.error || 'Server error'), true);
                    }
                } catch (e) {
                    showToast('Upload failed: unexpected response', true);
                }
            };
            xhr.onerror = function() {
                showToast('Upload failed: network error', true);
            };
            xhr.open('POST', '/api/manager/upload', true);
            xhr.send(formData);
        }

        function openMediaPreview(type, src) {
            var existing = document.getElementById('mediaPreviewOverlay');
            if (existing) existing.remove();

            var overlay = document.createElement('div');
            overlay.id = 'mediaPreviewOverlay';
            overlay.className = 'media-preview-overlay';
            overlay.innerHTML = '<button class="media-preview-close">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>' +
                '<div class="media-preview-content">' +
                (type === 'video' ?
                    '<video src="' + src + '" controls autoplay loop style="max-width:90vw;max-height:85vh;border-radius:.08rem;"></video>' :
                    '<img src="' + src + '" style="max-width:90vw;max-height:85vh;border-radius:.08rem;object-fit:contain;" alt="Preview">') +
                '</div>';

            overlay.addEventListener('click', function(e) {
                if (e.target === overlay || e.target.closest('.media-preview-close')) {
                    overlay.remove();
                }
            });
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    overlay.remove();
                    document.removeEventListener('keydown', escHandler);
                }
            });
            document.body.appendChild(overlay);
        }

        function addCarouselText(groupIdx) {
            if (!homeBannerData.groups[groupIdx]) {
                homeBannerData.groups[groupIdx] = { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] };
            }
            homeBannerData.groups[groupIdx].carouselTexts.push({ topic: '', note: '' });
            buildHomeUI();
        }

        function removeCarouselText(groupIdx, textIdx) {
            if (!homeBannerData.groups[groupIdx]) return;
            homeBannerData.groups[groupIdx].carouselTexts.splice(textIdx, 1);
            buildHomeUI();
        }

        function collectFormData() {
            var topicInputs = container.querySelectorAll('.home-text-topic');
            var noteInputs = container.querySelectorAll('.home-text-note');

            topicInputs.forEach(function(input) {
                var gIdx = parseInt(input.getAttribute('data-group'));
                var tIdx = parseInt(input.getAttribute('data-text-index'));
                if (homeBannerData.groups[gIdx] && homeBannerData.groups[gIdx].carouselTexts[tIdx]) {
                    homeBannerData.groups[gIdx].carouselTexts[tIdx].topic = input.value;
                }
            });

            noteInputs.forEach(function(input) {
                var gIdx = parseInt(input.getAttribute('data-group'));
                var tIdx = parseInt(input.getAttribute('data-text-index'));
                if (homeBannerData.groups[gIdx] && homeBannerData.groups[gIdx].carouselTexts[tIdx]) {
                    homeBannerData.groups[gIdx].carouselTexts[tIdx].note = input.value;
                }
            });
        }

        function saveHomeBanner() {
            collectFormData();
            try { localStorage.setItem('vipen_mgr_home_banner', JSON.stringify(homeBannerData)); } catch (e) {}
            apiCall('home-banner-save', { data: homeBannerData }, function(res) {
                if (res.success) {
                    showToast('Banner saved successfully! Synced to main website.');
                } else {
                    showToast('Save failed: ' + (res.error || 'Unknown error'), true);
                }
            });
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        container.innerHTML = '<div style="text-align:center;padding:.6rem;color:rgba(255,255,255,.25);">Loading...</div>';

        loadJsonData('data/home-banner.json', function(data) {
            if (data) {
                homeBannerData = data;
            } else {
                homeBannerData = {
                    groups: [
                        { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] },
                        { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] },
                        { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] },
                        { bgImage: '', bgVideo: '', bgType: 'image', carouselTexts: [] }
                    ],
                    current: 0,
                    textSlideIndex: 0
                };
            }
            buildHomeUI();
        });
    }

    function renderSettings(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Site Settings</h1>' +
            '</div>' +
            '<div class="manager-card">' +
            '<div id="managerSettingsForm"><div style="text-align:center;padding:.4rem;color:rgba(255,255,255,.25);">Loading...</div></div>' +
            '</div>';

        apiCall('settings', { mode: 'read' }, function(res) {
            var formEl = document.getElementById('managerSettingsForm');
            if (!formEl) return;
            if (!res.success) {
                formEl.innerHTML = '<div class="manager-empty">Failed to load settings</div>';
                return;
            }
            var s = res.settings || {};
            formEl.innerHTML =
                '<div class="manager-settings-grid">' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Contact</label>' +
                '<input type="email" class="manager-form-input" id="setContact" value="' + (s.contact || 'Jahyuofficial@gmail.com') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Title</label>' +
                '<input type="text" class="manager-form-input" id="setTitle" value="' + (s.title || 'Design By Jah72') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Rights</label>' +
                '<input type="text" class="manager-form-input" id="setRights" value="' + (s.rights || '\u00a92026 Vipen All rights reserved') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Footer Content</label>' +
                '<input type="text" class="manager-form-input" id="setFooterContent" value="' + (s.footerContent || '') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Contact Email</label>' +
                '<input type="email" class="manager-form-input" id="setContactEmail" value="' + (s.contactEmail || '') + '">' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Bar Font Style</label>' +
                '<select class="manager-form-select" id="setBarFontStyle">' +
                '<option value="normal"' + (s.extraBarFontStyle !== 'handwriting' ? ' selected' : '') + '>Normal</option>' +
                '<option value="handwriting"' + (s.extraBarFontStyle === 'handwriting' ? ' selected' : '') + '>Handwriting</option>' +
                '</select>' +
                '</div>' +
                '<div class="manager-form-group">' +
                '<label class="manager-form-label">Italic</label>' +
                '<label class="manager-toggle">' +
                '<input type="checkbox" id="setBarItalic"' + (s.extraBarItalic ? ' checked' : '') + '>' +
                '<span class="manager-toggle-slider"></span>' +
                '</label>' +
                '</div>' +
                '</div>' +
                '<div class="manager-color-palette-group">' +
                '<label class="manager-form-label">Footer Background</label>' +
                '<div class="manager-color-grid" id="footerBgPalette">' +
                '<div class="manager-color-swatch" data-color="#ffffff" style="background:#ffffff" title="#ffffff"></div>' +
                '<div class="manager-color-swatch" data-color="#f5f5f5" style="background:#f5f5f5" title="#f5f5f5"></div>' +
                '<div class="manager-color-swatch" data-color="#e8ecf1" style="background:#e8ecf1" title="#e8ecf1"></div>' +
                '<div class="manager-color-swatch" data-color="#fafafa" style="background:#fafafa" title="#fafafa"></div>' +
                '<div class="manager-color-swatch" data-color="#1a1a2e" style="background:#1a1a2e" title="#1a1a2e"></div>' +
                '<div class="manager-color-swatch" data-color="#0d1117" style="background:#0d1117" title="#0d1117"></div>' +
                '<div class="manager-color-swatch" data-color="#111827" style="background:#111827" title="#111827"></div>' +
                '<div class="manager-color-swatch" data-color="#2d2d2d" style="background:#2d2d2d" title="#2d2d2d"></div>' +
                '<div class="manager-color-swatch" data-color="#1e1e1e" style="background:#1e1e1e" title="#1e1e1e"></div>' +
                '<div class="manager-color-swatch" data-color="#000000" style="background:#000000" title="#000000"></div>' +
                '</div>' +
                '<input type="color" class="manager-color-input" id="setFooterBg" value="' + (s.footerBackground || '#ffffff') + '">' +
                '</div>' +
                '<div class="manager-color-palette-group">' +
                '<label class="manager-form-label">Footer Text Color</label>' +
                '<div class="manager-color-grid" id="footerTextPalette">' +
                '<div class="manager-color-swatch" data-color="#000000" style="background:#000000" title="#000000"></div>' +
                '<div class="manager-color-swatch" data-color="#333333" style="background:#333333" title="#333333"></div>' +
                '<div class="manager-color-swatch" data-color="#555555" style="background:#555555" title="#555555"></div>' +
                '<div class="manager-color-swatch" data-color="#888888" style="background:#888888" title="#888888"></div>' +
                '<div class="manager-color-swatch" data-color="#aaaaaa" style="background:#aaaaaa" title="#aaaaaa"></div>' +
                '<div class="manager-color-swatch" data-color="#cccccc" style="background:#cccccc" title="#cccccc"></div>' +
                '<div class="manager-color-swatch" data-color="#e0e0e0" style="background:#e0e0e0" title="#e0e0e0"></div>' +
                '<div class="manager-color-swatch" data-color="#ffffff" style="background:#ffffff;border:1px solid rgba(255,255,255,.15)" title="#ffffff"></div>' +
                '<div class="manager-color-swatch" data-color="#6366f1" style="background:#6366f1" title="#6366f1"></div>' +
                '<div class="manager-color-swatch" data-color="#ef4444" style="background:#ef4444" title="#ef4444"></div>' +
                '</div>' +
                '<input type="color" class="manager-color-input" id="setFooterTextColor" value="' + (s.footerTextColor || '#000000') + '">' +
                '</div>' +
                '<div style="margin-top:.2rem;">' +
                '<button class="manager-btn manager-btn-primary" id="managerSettingsSave">Save Settings</button>' +
                '</div>';

            var saveBtn = document.getElementById('managerSettingsSave');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    var settings = {
                        contact: document.getElementById('setContact').value.trim(),
                        title: document.getElementById('setTitle').value.trim(),
                        rights: document.getElementById('setRights').value.trim(),
                        footerContent: document.getElementById('setFooterContent').value.trim(),
                        contactEmail: document.getElementById('setContactEmail').value.trim(),
                        extraBarFontStyle: document.getElementById('setBarFontStyle').value,
                        extraBarItalic: document.getElementById('setBarItalic').checked,
                        footerBackground: document.getElementById('setFooterBg').value,
                        footerTextColor: document.getElementById('setFooterTextColor').value
                    };
                    apiCall('settings', settings, function(r) {
                        if (r.success) showToast('Settings saved');
                        else showToast(r.error, true);
                    });
                });
            }

            function bindColorPalette(gridId, inputId) {
                var grid = document.getElementById(gridId);
                var input = document.getElementById(inputId);
                if (!grid || !input) return;
                var swatches = grid.querySelectorAll('.manager-color-swatch');
                var currentVal = input.value;
                swatches.forEach(function(sw) {
                    if (sw.getAttribute('data-color') === currentVal) {
                        sw.classList.add('active');
                    }
                });
                swatches.forEach(function(sw) {
                    sw.addEventListener('click', function() {
                        var color = sw.getAttribute('data-color');
                        input.value = color;
                        swatches.forEach(function(s) { s.classList.remove('active'); });
                        sw.classList.add('active');
                    });
                });
                input.addEventListener('input', function() {
                    swatches.forEach(function(s) {
                        s.classList.toggle('active', s.getAttribute('data-color') === input.value);
                    });
                });
            }
            bindColorPalette('footerBgPalette', 'setFooterBg');
            bindColorPalette('footerTextPalette', 'setFooterTextColor');
        });
    }

    function renderTrash(container) {
        container.innerHTML =
            '<div class="manager-main-header">' +
            '<h1 class="manager-main-title">Recycle Bin</h1>' +
            '<div class="manager-main-actions">' +
            '<button class="manager-btn manager-btn-danger" id="trashEmptyAllBtn">' +
            '<svg class="manager-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            'Empty Trash</button>' +
            '</div>' +
            '</div>' +
            '<div id="trashContent"></div>';

        function renderTrashItems() {
            var tc = document.getElementById('trashContent');
            if (!tc) return;
            var trash = getTrash();

            if (!trash || trash.length === 0) {
                tc.innerHTML = '<div class="manager-empty">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:.48rem;height:.48rem;margin-bottom:.16rem;color:rgba(255,255,255,.1);"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                    '<div>Trash is empty</div>' +
                    '<div style="font-size:.1rem;color:rgba(255,255,255,.15);margin-top:.04rem;">Deleted items will appear here</div>' +
                    '</div>';
                return;
            }

            var typeLabels = {
                'fresh_group': 'Fresh Group',
                'disc_track': 'Disc Track'
            };

            var html = '';
            for (var i = 0; i < trash.length; i++) {
                var item = trash[i];
                var label = typeLabels[item.type] || item.type;
                var name = '';
                var subtitle = '';

                if (item.type === 'fresh_group' && item.data && item.data.headline) {
                    name = item.data.headline.mainTitle || 'Untitled Group';
                    var hotCount = (item.data.hotNews || []).length;
                    subtitle = hotCount + ' article' + (hotCount !== 1 ? 's' : '');
                } else if (item.type === 'disc_track' && item.data) {
                    name = item.data.title || 'Unknown Track';
                    subtitle = item.data.artist || '';
                } else {
                    name = 'Unknown Item';
                    subtitle = '';
                }

                html += '<div class="manager-trash-item" data-trash-id="' + item.id + '">' +
                    '<div class="manager-trash-item-type">' +
                    '<span class="manager-trash-type-badge">' + label + '</span>' +
                    '</div>' +
                    '<div class="manager-trash-item-info">' +
                    '<div class="manager-trash-item-name">' + name + '</div>' +
                    '<div class="manager-trash-item-sub">' + subtitle + '</div>' +
                    '</div>' +
                    '<div class="manager-trash-item-meta">' +
                    '<div class="manager-trash-item-time" title="' + formatDate(item.deletedAt) + '">' + timeAgo(item.deletedAt) + '</div>' +
                    '<div class="manager-trash-item-by">by ' + (item.deletedBy || 'unknown') + '</div>' +
                    '</div>' +
                    '<div class="manager-trash-item-actions">' +
                    '<button class="manager-btn manager-btn-outline manager-btn-sm btn-trash-view" data-trash-id="' + item.id + '">View</button>' +
                    '<button class="manager-btn manager-btn-danger manager-btn-sm btn-trash-delete" data-trash-id="' + item.id + '">Delete Forever</button>' +
                    '</div>' +
                    '</div>';
            }

            html += '<div class="manager-trash-footer">' +
                '<span>' + trash.length + ' item' + (trash.length !== 1 ? 's' : '') + ' in trash</span>' +
                '</div>';
            tc.innerHTML = html;

            var viewBtns = tc.querySelectorAll('.btn-trash-view');
            viewBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var tid = this.getAttribute('data-trash-id');
                    showTrashItemDetail(tid);
                });
            });

            var delBtns = tc.querySelectorAll('.btn-trash-delete');
            delBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var tid = this.getAttribute('data-trash-id');
                    var trashItem = null;
                    var allTrash = getTrash();
                    for (var j = 0; j < allTrash.length; j++) {
                        if (allTrash[j].id === tid) { trashItem = allTrash[j]; break; }
                    }
                    var itemName = '';
                    if (trashItem) {
                        if (trashItem.type === 'fresh_group' && trashItem.data && trashItem.data.headline) {
                            itemName = trashItem.data.headline.mainTitle || 'Untitled';
                        } else if (trashItem.type === 'disc_track' && trashItem.data) {
                            itemName = trashItem.data.title || 'Unknown';
                        }
                    }
                    showDeleteConfirm(
                        'Permanently Delete',
                        'Are you sure you want to permanently delete "' + itemName + '"? This action cannot be undone.',
                        'Delete',
                        'Delete Forever',
                        function(confirmed) {
                            if (!confirmed) return;
                            removeFromTrash(tid);
                            renderTrashItems();
                            showToast('Item permanently deleted');
                        }
                    );
                });
            });
        }

        renderTrashItems();

        var emptyBtn = document.getElementById('trashEmptyAllBtn');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', function() {
                var trash = getTrash();
                if (!trash || trash.length === 0) {
                    showToast('Trash is already empty', true);
                    return;
                }
                showDeleteConfirm(
                    'Empty Trash',
                    'Are you sure you want to permanently delete ALL ' + trash.length + ' item' + (trash.length !== 1 ? 's' : '') + ' in the trash? This action cannot be undone.',
                    'empty the bin',
                    'Empty Trash',
                    function(confirmed) {
                        if (!confirmed) return;
                        clearAllTrash();
                        renderTrashItems();
                        showToast('Trash emptied');
                    }
                );
            });
        }
    }

    function showTrashItemDetail(trashId) {
        var trash = getTrash();
        var item = null;
        for (var i = 0; i < trash.length; i++) {
            if (trash[i].id === trashId) { item = trash[i]; break; }
        }
        if (!item) { showToast('Item not found', true); return; }

        var overlay = document.createElement('div');
        overlay.className = 'manager-modal-overlay';

        var title = '';
        var detailHtml = '';

        if (item.type === 'fresh_group') {
            var group = item.data;
            var h = group.headline || {};
            title = h.mainTitle || 'Untitled Group';

            var hotNewsHtml = '';
            var hotNews = group.hotNews || [];
            for (var hi = 0; hi < hotNews.length; hi++) {
                var hn = hotNews[hi];
                hotNewsHtml += '<div class="manager-trash-detail-item">' +
                    '<span class="manager-trash-detail-num">#' + (hi + 1) + '</span>' +
                    '<div>' +
                    '<div style="font-size:.12rem;">' + (hn.title || 'Untitled') + '</div>' +
                    '<div style="font-size:.1rem;color:rgba(255,255,255,.3);">' + (hn.summary || '') + '</div>' +
                    '</div>' +
                    '</div>';
            }

            detailHtml =
                '<div class="manager-trash-detail-section">' +
                '<div class="manager-trash-detail-label">HEADLINE</div>' +
                '<div style="font-size:.12rem;color:rgba(255,255,255,.5);">Main: ' + (h.mainTitle || '-') + '</div>' +
                '<div style="font-size:.12rem;color:rgba(255,255,255,.5);">Sub: ' + (h.subTitle || '-') + '</div>' +
                '<div style="font-size:.12rem;color:rgba(255,255,255,.5);">Tag: ' + (h.cardTag || '-') + '</div>' +
                '</div>' +
                '<div class="manager-trash-detail-section">' +
                '<div class="manager-trash-detail-label">HOT NEWS (' + hotNews.length + ')</div>' +
                hotNewsHtml +
                '</div>';
        } else if (item.type === 'disc_track') {
            var track = item.data;
            title = track.title || 'Unknown Track';
            detailHtml =
                '<div class="manager-trash-detail-section">' +
                '<div class="manager-trash-detail-label">Track Info</div>' +
                '<div style="font-size:.12rem;color:rgba(255,255,255,.5);">Title: ' + (track.title || '-') + '</div>' +
                '<div style="font-size:.12rem;color:rgba(255,255,255,.5);">Artist: ' + (track.artist || '-') + '</div>' +
                (track.cover ? '<img src="' + track.cover + '" style="width:1rem;height:1rem;border-radius:.08rem;object-fit:cover;margin-top:.1rem;">' : '') +
                '</div>';
        }

        overlay.innerHTML =
            '<div class="manager-modal" style="max-width:6rem;">' +
            '<button class="manager-modal-close" id="trashDetailClose">&times;</button>' +
            '<div class="manager-modal-title">' + title + '</div>' +
            '<div style="font-size:.1rem;color:rgba(255,255,255,.3);margin-bottom:.2rem;">' +
            'Type: <span class="manager-trash-type-badge">' + (item.type === 'fresh_group' ? 'Fresh Group' : 'Disc Track') + '</span>' +
            ' &middot; Deleted ' + timeAgo(item.deletedAt) + ' by ' + (item.deletedBy || 'unknown') +
            '</div>' +
            detailHtml +
            '<div class="manager-modal-actions" style="margin-top:.2rem;">' +
            '<button class="manager-btn manager-btn-danger" id="trashDetailDelete">Delete Forever</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        function closeOverlay() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeOverlay(); });
        overlay.querySelector('#trashDetailClose').addEventListener('click', closeOverlay);

        overlay.querySelector('#trashDetailDelete').addEventListener('click', function() {
            showDeleteConfirm(
                'Permanently Delete',
                'Are you sure you want to permanently delete "' + title + '"? This action cannot be undone.',
                'Delete',
                'Delete Forever',
                function(confirmed) {
                    if (!confirmed) return;
                    removeFromTrash(trashId);
                    closeOverlay();
                    var tc = document.getElementById('trashContent');
                    if (tc) renderTrashWrapper();
                    showToast('Item permanently deleted');
                }
            );
        });

        function renderTrashWrapper() {
            var tc = document.getElementById('trashContent');
            if (!tc) return;
            var trash = getTrash();
            if (!trash || trash.length === 0) {
                tc.innerHTML = '<div class="manager-empty">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:.48rem;height:.48rem;margin-bottom:.16rem;color:rgba(255,255,255,.1);"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                    '<div>Trash is empty</div>' +
                    '<div style="font-size:.1rem;color:rgba(255,255,255,.15);margin-top:.04rem;">Deleted items will appear here</div>' +
                    '</div>';
                return;
            }
            var typeLabels = {
                'fresh_group': 'Fresh Group',
                'disc_track': 'Disc Track'
            };
            var html = '';
            for (var i = 0; i < trash.length; i++) {
                var tItem = trash[i];
                var label = typeLabels[tItem.type] || tItem.type;
                var name = '';
                var subtitle = '';
                if (tItem.type === 'fresh_group' && tItem.data && tItem.data.headline) {
                    name = tItem.data.headline.mainTitle || 'Untitled Group';
                    var hotCount = (tItem.data.hotNews || []).length;
                    subtitle = hotCount + ' article' + (hotCount !== 1 ? 's' : '');
                } else if (tItem.type === 'disc_track' && tItem.data) {
                    name = tItem.data.title || 'Unknown Track';
                    subtitle = tItem.data.artist || '';
                } else {
                    name = 'Unknown Item';
                    subtitle = '';
                }
                html += '<div class="manager-trash-item" data-trash-id="' + tItem.id + '">' +
                    '<div class="manager-trash-item-type"><span class="manager-trash-type-badge">' + label + '</span></div>' +
                    '<div class="manager-trash-item-info"><div class="manager-trash-item-name">' + name + '</div><div class="manager-trash-item-sub">' + subtitle + '</div></div>' +
                    '<div class="manager-trash-item-meta"><div class="manager-trash-item-time" title="' + formatDate(tItem.deletedAt) + '">' + timeAgo(tItem.deletedAt) + '</div><div class="manager-trash-item-by">by ' + (tItem.deletedBy || 'unknown') + '</div></div>' +
                    '<div class="manager-trash-item-actions">' +
                    '<button class="manager-btn manager-btn-outline manager-btn-sm btn-trash-view" data-trash-id="' + tItem.id + '">View</button>' +
                    '<button class="manager-btn manager-btn-danger manager-btn-sm btn-trash-delete" data-trash-id="' + tItem.id + '">Delete Forever</button>' +
                    '</div></div>';
            }
            html += '<div class="manager-trash-footer"><span>' + trash.length + ' item' + (trash.length !== 1 ? 's' : '') + ' in trash</span></div>';
            tc.innerHTML = html;

            var vBtns = tc.querySelectorAll('.btn-trash-view');
            vBtns.forEach(function(b) {
                b.addEventListener('click', function() { showTrashItemDetail(this.getAttribute('data-trash-id')); });
            });
            var dBtns = tc.querySelectorAll('.btn-trash-delete');
            dBtns.forEach(function(b) {
                b.addEventListener('click', function() {
                    var tid2 = this.getAttribute('data-trash-id');
                    var tItem2 = null;
                    var aTrash = getTrash();
                    for (var j = 0; j < aTrash.length; j++) {
                        if (aTrash[j].id === tid2) { tItem2 = aTrash[j]; break; }
                    }
                    var iname = '';
                    if (tItem2) {
                        if (tItem2.type === 'fresh_group' && tItem2.data && tItem2.data.headline) iname = tItem2.data.headline.mainTitle || 'Untitled';
                        else if (tItem2.type === 'disc_track' && tItem2.data) iname = tItem2.data.title || 'Unknown';
                    }
                    showDeleteConfirm('Permanently Delete', 'Are you sure you want to permanently delete "' + iname + '"? This action cannot be undone.', 'Delete', 'Delete Forever', function(cf) {
                        if (!cf) return;
                        removeFromTrash(tid2);
                        renderTrashWrapper();
                        showToast('Item permanently deleted');
                    });
                });
            });
        }
    }

    function shakePinInput(el) {
        el.classList.add('manager-pin-shake');
        el.classList.add('manager-pin-error-border');
        setTimeout(function() {
            el.classList.remove('manager-pin-shake');
        }, 500);
        setTimeout(function() {
            el.classList.remove('manager-pin-error-border');
        }, 2000);
    }

    function showPinScreen() {
        var app = document.getElementById('managerApp');
        if (!app) return;
        var auth = sessionStorage.getItem('vipen_auth');
        var userEmail = '';
        var username = '';
        if (auth) {
            try {
                var parsed = JSON.parse(auth);
                userEmail = parsed.email || '';
                username = parsed.username || '';
            } catch (e) {}
        }

        app.innerHTML =
            '<div class="manager-pin-overlay" style="background:url(\'images/PIN验证.png\') center/cover no-repeat">' +
            '<button class="manager-pin-back" id="managerPinBack">' +
            '<svg viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg> Back' +
            '</button>' +
            '<div class="manager-pin-input-wrap">' +
            '<input type="password" class="manager-pin-input" id="managerPinInput" placeholder="Enter PIN" maxlength="6" inputmode="numeric" autocomplete="off">' +
            '</div>' +
            '</div>';

        var pinInput = document.getElementById('managerPinInput');
        var pinBack = document.getElementById('managerPinBack');

        if (pinBack) {
            pinBack.addEventListener('click', function() {
                window.history.back();
            });
        }

        function submitPin() {
            var pin = pinInput.value.trim();
            if (pin.length !== 6) {
                shakePinInput(pinInput);
                return;
            }
            pinInput.disabled = true;

            apiCall('verify-pin', { email: userEmail, pin: pin }, function(res) {
                pinInput.disabled = false;
                if (res.success) {
                    sessionToken = res.sessionToken;
                    adminUser = { username: res.username, email: res.email };
                    sessionStorage.setItem('manager_session', sessionToken);
                    sessionStorage.setItem('manager_user', JSON.stringify(adminUser));
                    renderLayout();
                    navigateTo('dashboard');
                } else {
                    shakePinInput(pinInput);
                    pinInput.value = '';
                    pinInput.focus();
                }
            });
        }

        pinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') submitPin();
        });
        pinInput.focus();
    }

    function init() {
        sessionToken = sessionStorage.getItem('manager_session');
        var storedUser = sessionStorage.getItem('manager_user');
        if (storedUser) {
            try { adminUser = JSON.parse(storedUser); } catch (e) {}
        }

        if (sessionToken) {
            apiCall('check-session', {}, function(res) {
                if (res.success) {
                    if (res.username) adminUser = { username: res.username, email: res.email };
                    renderLayout();
                    navigateTo('dashboard');
                } else {
                    sessionToken = null;
                    sessionStorage.removeItem('manager_session');
                    showPinScreen();
                }
            });
        } else {
            showPinScreen();
        }
    }

    return {
        init: init
    };
})();
