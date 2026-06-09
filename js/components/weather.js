(function() {
'use strict';

var Weather = {
    cacheKey: 'vipen_weather_cache',
    cacheTTL: 10 * 60 * 1000,
    defaultLat: 31.2304,
    defaultLon: 121.4737,
    defaultCity: 'Shanghai',

    icons: {
        sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"/></svg>',
        cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.5 0-.8.1C16 6.1 12.9 4 9.5 4 5.4 4 2 7.4 2 11.5c0 .4 0 .7.1 1.1C.9 13.4 0 14.9 0 16.5 0 19 2 21 4.5 21h13z"/></svg>',
        partlyCloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.5 0-.8.1C16 6.1 12.9 4 9.5 4c-2.3 0-4.4 1.1-5.8 2.9"/><circle cx="18" cy="6" r="2.5"/><path d="M4.5 21h13c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10"/></svg>',
        rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.5 0-.8.1C16 6.1 12.9 4 9.5 4 5.4 4 2 7.4 2 11.5c0 .4 0 .7.1 1.1C.9 13.4 0 14.9 0 16.5 0 19 2 21 4.5 21h13z"/><path d="M8 22l-1 2M12 22l-1 2M16 22l-1 2"/></svg>',
        snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.5 0-.8.1C16 6.1 12.9 4 9.5 4 5.4 4 2 7.4 2 11.5c0 .4 0 .7.1 1.1C.9 13.4 0 14.9 0 16.5 0 19 2 21 4.5 21h13z"/><path d="M8 22l.5-1.5.5 1.5-.5 1.5zM12 22l.5-1.5.5 1.5-.5 1.5zM16 22l.5-1.5.5 1.5-.5 1.5z"/></svg>',
        thunder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.5 0-.8.1C16 6.1 12.9 4 9.5 4 5.4 4 2 7.4 2 11.5c0 .4 0 .7.1 1.1C.9 13.4 0 14.9 0 16.5 0 19 2 21 4.5 21h13z"/><path d="M11 16l-2 4h3l-1 4"/></svg>',
        fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h16M4 18h16M4 10h16"/></svg>'
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
