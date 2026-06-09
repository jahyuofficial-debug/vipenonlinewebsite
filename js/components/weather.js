(function() {
'use strict';

var Weather = {
    cacheKey: 'vipen_weather_cache',
    cacheTTL: 10 * 60 * 1000,
    defaultLat: 31.2304,
    defaultLon: 121.4737,
    defaultCity: 'Shanghai',

    icons: {
        sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
        partlyCloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><circle cx="18" cy="6" r="2"/></svg>',
        rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 22v-2M12 22v-2M16 22v-2"/></svg>',
        snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 22l2-2-2-2M14 22l2-2-2-2M11 22v-4"/></svg>',
        thunder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M13 16l-2 4h3l-2 4"/></svg>',
        fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16M4 18h16M4 10h16M8 6h8"/></svg>'
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
        var dateEl = document.getElementById('weatherDate');
        var tempEl = document.getElementById('weatherTemp');
        var descEl = document.getElementById('weatherDesc');
        var humEl = document.getElementById('weatherHumidity');
        var windEl = document.getElementById('weatherWind');
        if (!widget || !iconEl) return;

        var code = data.current.weather_code;
        iconEl.innerHTML = this.getIconByCode(code);
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
