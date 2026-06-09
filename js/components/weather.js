(function() {
'use strict';

var Weather = {
    cacheKey: 'vipen_weather_cache',
    cacheTTL: 10 * 60 * 1000,
    defaultLat: 31.2304,
    defaultLon: 121.4737,
    defaultCity: 'Shanghai',

    // 极简线框风格 — stroke-only, 24×24, 统一 1.5px 描边
    icons: {
        sun:            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2.5M12 18.5v2.5M3 12h2.5M18.5 12H21"/></svg>',
        partlyCloudy:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="3"/><path d="M7 2.5v1.5M4 8h1.5"/><path d="M5 17a4 4 0 0 1 3-7.5M10 10a5 5 0 0 1 7.5 2.5M19 11a4 4 0 0 1 3.5 5H4.5Z"/></svg>',
        cloud:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a4 4 0 0 1 3-7.5M10 10a5 5 0 0 1 7.5 2.5M19 11a4 4 0 0 1 3.5 5H4.5Z"/></svg>',
        fog:            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h18M5 14h14M2 20h20"/></svg>',
        rain:           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 17a4 4 0 0 1 3-7.5M10 10a5 5 0 0 1 7.5 2.5M19 11a4 4 0 0 1 3.5 5H4.5Z"/><path d="M7 18v4M10.5 17v5M14 18v4"/></svg>',
        snow:           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 17a4 4 0 0 1 3-7.5M10 10a5 5 0 0 1 7.5 2.5M19 11a4 4 0 0 1 3.5 5H4.5Z"/><circle cx="7" cy="20" r="1"/><circle cx="11" cy="18.5" r="1"/><circle cx="15" cy="20" r="1"/><circle cx="9" cy="22.5" r="1"/><circle cx="13" cy="22.5" r="1"/></svg>',
        thunder:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17a4 4 0 0 1 3-7.5M10 10a5 5 0 0 1 7.5 2.5M19 11a4 4 0 0 1 3.5 5H4.5Z"/><path d="M11.5 15 9 19.5h2.5L10 23"/></svg>'
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
