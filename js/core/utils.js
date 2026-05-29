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
    setAuth: function(user) {
        sessionStorage.setItem('vipen_auth', JSON.stringify({
            username: user.username,
            email: user.email,
            token: user.token || '',
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
    }
};