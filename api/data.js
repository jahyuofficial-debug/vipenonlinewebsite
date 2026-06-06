var { list } = require('@vercel/blob');

var blobUrlCache = {};
var CACHE_TTL = 5 * 60 * 1000;

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.end(JSON.stringify(data));
}

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

function getCachedUrl(key) {
    var entry = blobUrlCache[key];
    if (entry && (Date.now() - entry.ts) < CACHE_TTL) return entry.url;
    return null;
}

function setCachedUrl(key, url) {
    blobUrlCache[key] = { url: url, ts: Date.now() };
}

function fetchBlobData(key, callback) {
    var cachedUrl = getCachedUrl(key);
    if (cachedUrl) {
        fetch(cachedUrl)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(data) {
                callback({ code: 200, body: data, raw: true });
            })
            .catch(function() {
                blobUrlCache[key] = null;
                fetchBlobDataFresh(key, callback);
            });
        return;
    }
    fetchBlobDataFresh(key, callback);
}

function fetchBlobDataFresh(key, callback) {
    list({ prefix: 'data/' + key + '.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            callback({ code: 404, body: { error: 'Not found' } });
            return;
        }
        var blob = response.blobs[0];
        setCachedUrl(key, blob.url);
        fetch(blob.url)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(data) {
                callback({ code: 200, body: data, raw: true });
            })
            .catch(function() {
                callback({ code: 500, body: { error: 'Failed to fetch blob' } });
            });
    }).catch(function() {
        callback({ code: 500, body: { error: 'Failed to list blobs' } });
    });
}

function handleDataGeneric(req, res, key) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }

    fetchBlobData(key, function(result) {
        if (result.raw) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
            res.end(result.body);
        } else {
            sendJSON(res, result.code, result.body);
        }
    });
}

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action;

    switch (action) {
        case 'disc':
            handleDataGeneric(req, res, 'disc');
            break;
        case 'home-banner':
            handleDataGeneric(req, res, 'home-banner');
            break;
        case 'design':
            handleDataGeneric(req, res, 'design-works');
            break;
        case 'fresh':
            handleDataGeneric(req, res, 'fresh-hero');
            break;
        case 'settings':
            handleDataGeneric(req, res, 'manager/settings');
            break;
        default:
            sendJSON(res, 404, { error: 'Not found', message: 'Unknown action: ' + (action || 'none') });
    }
};
