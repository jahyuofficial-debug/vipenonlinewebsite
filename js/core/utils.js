var Utils = {
    formatTime: function(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    },
    getRelativeTime: function(dateStr) {
        var now = new Date();
        var date = new Date(dateStr);
        var diff = now - date;
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        var hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h ago';
        var days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ago';
        return dateStr;
    },
    throttle: function(fn, delay) {
        var last = 0;
        return function() {
            var now = Date.now();
            if (now - last >= delay) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    },
    debounce: function(fn, delay) {
        var timer;
        return function() {
            var ctx = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
    },
    select: function(sel, parent) {
        return (parent || document).querySelector(sel);
    },
    selectAll: function(sel, parent) {
        return (parent || document).querySelectorAll(sel);
    },
    authFetch: function(url, options) {
        var auth = this.getAuth();
        var opts = options || {};
        opts.headers = opts.headers || {};
        if (auth && auth.token) {
            opts.headers['Authorization'] = 'Bearer ' + auth.token;
        }
        return fetch(url, opts);
    },
    setAuth: function(user) {
        sessionStorage.setItem('vipen_auth', JSON.stringify({
            username: user.username,
            email: user.email,
            token: user.token || '',
            role: user.role || '',
            loggedAt: Date.now()
        }));
    },
    getAuth: function() {
        var raw = sessionStorage.getItem('vipen_auth');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch(e) { return null; }
    },
    isLoggedIn: function() {
        return !!this.getAuth();
    },
    logout: function() {
        sessionStorage.removeItem('vipen_auth');
    },
    getUserData: function(key) {
        var auth = this.getAuth();
        if (!auth) return null;
        var userId = auth.username || auth.email;
        var raw = localStorage.getItem('vipen_' + key + '_' + userId);
        try { return JSON.parse(raw); } catch(e) { return null; }
    },
    setUserData: function(key, data) {
        var auth = this.getAuth();
        if (!auth) return;
        var userId = auth.username || auth.email;
        localStorage.setItem('vipen_' + key + '_' + userId, JSON.stringify(data));
    },
    getGlobalData: function(key) {
        var raw = localStorage.getItem('vipen_global_' + key);
        try { return JSON.parse(raw); } catch(e) { return null; }
    },
    setGlobalData: function(key, data) {
        localStorage.setItem('vipen_global_' + key, JSON.stringify(data));
    },
    getUserId: function() {
        var auth = this.getAuth();
        if (!auth) return null;
        return auth.username || auth.email;
    },
    migrateUserData: function() {
        var auth = this.getAuth();
        if (!auth) return;
        var userId = auth.username || auth.email;
        var email = auth.email;
        var migrated = localStorage.getItem('vipen_migrated_' + userId);
        if (migrated) return;

        var oldKeys = ['vipenPosts', 'vipenDrafts', 'vipenActionPosts', 'vipenActionDrafts'];
        var newKeys = ['posts', 'drafts', 'actions', 'actionDrafts'];
        oldKeys.forEach(function(oldKey, i) {
            var newKey = 'vipen_' + newKeys[i] + '_' + userId;
            if (localStorage.getItem(newKey)) return;
            var raw = localStorage.getItem(oldKey);
            if (raw) {
                try {
                    localStorage.setItem(newKey, raw);
                    localStorage.removeItem(oldKey);
                } catch(e) {}
            }
        });

        var newLikesKey = 'vipen_likes_' + userId;
        if (!localStorage.getItem(newLikesKey)) {
            var likedArticlesRaw = localStorage.getItem('vipenLikedArticles');
            var likedDiscRaw = localStorage.getItem('vipenLikedDisc');
            if (likedArticlesRaw || likedDiscRaw) {
                var likes = {};
                try { likes.likedArticles = likedArticlesRaw ? JSON.parse(likedArticlesRaw) : []; } catch(e) { likes.likedArticles = []; }
                try { likes.likedDisc = likedDiscRaw ? JSON.parse(likedDiscRaw) : []; } catch(e) { likes.likedDisc = []; }
                try {
                    localStorage.setItem(newLikesKey, JSON.stringify(likes));
                    localStorage.removeItem('vipenLikedArticles');
                    localStorage.removeItem('vipenLikedDisc');
                } catch(e) {}
            }
        }

        if (email) {
            var newNotifKey = 'vipen_notifications_' + userId;
            var oldNotifKey = 'vipen_notifications_' + email;
            if (!localStorage.getItem(newNotifKey)) {
                var rawNotif = localStorage.getItem(oldNotifKey);
                if (rawNotif) {
                    try {
                        localStorage.setItem(newNotifKey, rawNotif);
                        localStorage.removeItem(oldNotifKey);
                    } catch(e) {}
                }
            }
            var newChatKey = 'vipen_chat_' + userId;
            var oldChatKey = 'vipen_chat_' + email;
            if (!localStorage.getItem(newChatKey)) {
                var rawChat = localStorage.getItem(oldChatKey);
                if (rawChat) {
                    try {
                        localStorage.setItem(newChatKey, rawChat);
                        localStorage.removeItem(oldChatKey);
                    } catch(e) {}
                }
            }
        }

        try {
            localStorage.setItem('vipen_migrated_' + userId, '1');
        } catch(e) {}
    }
};