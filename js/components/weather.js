(function() {
'use strict';

var Weather = {
    cacheKey: 'vipen_weather_cache',
    cacheTTL: 10 * 60 * 1000,
    defaultLat: 31.2304,
    defaultLon: 121.4737,
    defaultCity: 'Shanghai',

    // iOS 风格纯色填充 — fill only, 24×24, 单色剪影
    icons: {
        sun:            '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.5"/><rect x="10.5" y="1.5" width="3" height="4" rx="1.5"/><rect x="10.5" y="18.5" width="3" height="4" rx="1.5"/><rect x="1.5" y="10.5" width="4" height="3" rx="1.5"/><rect x="18.5" y="10.5" width="4" height="3" rx="1.5"/></svg>',
        partlyCloudy:   '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="7" cy="7" r="2.5"/><rect x="5.5" y="2" width="3" height="3" rx="1.5"/><rect x="2" y="5.5" width="3" height="3" rx="1.5"/><circle cx="10" cy="14" r="3.5"/><circle cx="14" cy="13" r="4"/><circle cx="18" cy="14" r="3"/><rect x="6" y="14" width="16" height="7" rx="3.5"/></svg>',
        cloud:          '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="14" r="4.5"/><circle cx="13.5" cy="13" r="4.5"/><circle cx="17.5" cy="14" r="3.5"/><rect x="4" y="14" width="17" height="7" rx="3.5"/></svg>',
        fog:            '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="7" width="20" height="3" rx="1.5"/><rect x="3" y="14" width="18" height="3" rx="1.5"/><rect x="1" y="21" width="22" height="3" rx="1.5"/></svg>',
        rain:           '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="13" r="4"/><circle cx="13" cy="12" r="4.5"/><circle cx="17" cy="13.5" r="3.5"/><rect x="4.5" y="13" width="16" height="7" rx="3.5"/><rect x="7" y="18" width="2.5" height="5" rx="1.25"/><rect x="11" y="17.5" width="2.5" height="6" rx="1.25"/><rect x="15" y="18" width="2.5" height="5" rx="1.25"/></svg>',
        snow:           '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="13" r="4"/><circle cx="13" cy="12" r="4.5"/><circle cx="17" cy="13.5" r="3.5"/><rect x="4.5" y="13" width="16" height="7" rx="3.5"/><circle cx="7" cy="20" r="1.5"/><circle cx="11" cy="19" r="1.5"/><circle cx="15" cy="20" r="1.5"/><circle cx="9" cy="22.5" r="1.5"/><circle cx="13" cy="22.5" r="1.5"/></svg>',
        thunder:        '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8.5" cy="13" r="4"/><circle cx="13" cy="12" r="4.5"/><circle cx="17" cy="13.5" r="3.5"/><rect x="4.5" y="13" width="16" height="7" rx="3.5"/><path d="M11 17l-2.5 4h3l-1.5 2.5h-1l1-2H7.5l3.5-4.5z"/></svg>'
    },

    getIconByCode: function(code) {
        if (code === 0) return this.icons.sun;
        if (code >= 1 && code <= 3) return this.icons.partlyCloudy;
        if (code >= 45 && code <= 48) return this.icons.fog;
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return this.icons.rain;
        if (code >= 71 && code <= 77) return this.icons.snow;
        if (code >= 85 && code <= 86) return this.icons.snow;
        if (code >= 95 && code <= 99) return this.icons.thunder;
        return this.icons.cloud;
    },

    getDescByCode: function(code) {
        var map = {
            0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing Rime Fog',
            51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
            56: 'Light Freezing Drizzle', 57: 'Freezing Drizzle',
            61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
            66: 'Light Freezing Rain', 67: 'Freezing Rain',
            71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
            80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
            85: 'Light Snow Showers', 86: 'Snow Showers',
            95: 'Thunderstorm', 96: 'Thunderstorm & Hail', 99: 'Heavy Thunderstorm'
        };
        return map[code] || 'Unknown';
    },

    formatDate: function() {
        var now = new Date();
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        return months[now.getMonth()] + ' ' + now.getDate() + ', ' + days[now.getDay()];
    },

    render: function(data) {
        var widget = document.getElementById('weatherWidget');
        var iconEl = document.getElementById('weatherIcon');
        var tipIconEl = document.getElementById('weatherTooltipIcon');
        var dateEl = document.getElementById('weatherDate');
        var tempEl = document.getElementById('weatherTemp');
        var descEl = document.getElementById('weatherDesc');
        var humEl = document.getElementById('weatherHumidity');
        var windEl = document.getElementById('weatherWind');
        if (!widget || !iconEl) return;

        var code = data.current.weather_code;
        var iconSvg = this.getIconByCode(code);
        iconEl.innerHTML = iconSvg;
        if (tipIconEl) tipIconEl.innerHTML = iconSvg;
        if (dateEl) dateEl.textContent = this.formatDate();
        if (tempEl) tempEl.textContent = Math.round(data.current.temperature_2m) + '°C';
        if (descEl) descEl.textContent = this.getDescByCode(code);
        if (humEl) humEl.textContent = 'Humidity ' + data.current.relative_humidity_2m + '%';
        if (windEl) windEl.textContent = 'Wind ' + Math.round(data.current.wind_speed_10m) + ' km/h';
    },

    fetchWeather: function(lat, lon) {
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto';
        return fetch(url).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    },

    load: function() {
        var self = this;
        var cached = null;
        try {
            cached = JSON.parse(localStorage.getItem(this.cacheKey));
        } catch (e) {}

        if (cached && cached.ts && (Date.now() - cached.ts) < this.cacheTTL) {
            this.render(cached.data);
            return;
        }

        function doFetch(lat, lon) {
            self.fetchWeather(lat, lon).then(function(data) {
                localStorage.setItem(self.cacheKey, JSON.stringify({ ts: Date.now(), data: data }));
                self.render(data);
            }).catch(function(err) {
                console.warn('Weather fetch failed:', err);
                if (cached && cached.data) self.render(cached.data);
            });
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                doFetch(pos.coords.latitude, pos.coords.longitude);
            }, function() {
                doFetch(self.defaultLat, self.defaultLon);
            }, { timeout: 5000 });
        } else {
            doFetch(this.defaultLat, this.defaultLon);
        }
    },

    init: function() {
        this.load();
    }
};

window.Weather = Weather;
})();
