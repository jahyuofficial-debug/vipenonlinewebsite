var { list, put } = require('@vercel/blob');
var crypto = require('crypto');
var getAuthSecret = require('../lib/secret').getAuthSecret;
var verifyToken = require('../lib/secret').verifyToken;

var VALID_KEYS = ['posts', 'drafts', 'actions', 'actionDrafts', 'likes', 'comments', 'notifications', 'chat'];

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
}

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

function parseBody(req, callback) {
    var body = '';
    req.on('data', function(chunk) {
        body += chunk;
        if (body.length > 500 * 1024) {
            req.destroy();
            callback(new Error('Payload too large'));
        }
    });
    req.on('end', function() {
        try { callback(null, JSON.parse(body)); } catch (e) { callback(new Error('Invalid JSON')); }
    });
}

function getUserIdFromToken(req) {
    var authHeader = req.headers['authorization'] || '';
    var token = authHeader.indexOf('Bearer ') === 0 ? authHeader.slice(7) : '';
    if (!token) return null;
    var payload = verifyToken(token);
    if (!payload) return null;
    return payload.username || payload.email;
}

function handleRead(req, res) {
    var parsed = require('url').parse(req.url, true);
    var key = parsed.query.key;
    if (!key || VALID_KEYS.indexOf(key) === -1) {
        sendJSON(res, 400, { success: false, error: 'Invalid key' });
        return;
    }
    var userId = getUserIdFromToken(req);
    if (!userId) { sendJSON(res, 401, { success: false, error: 'Unauthorized' }); return; }

    list({ prefix: 'user-data/' + userId + '/' + key + '.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            sendJSON(res, 200, { success: true, data: null });
            return;
        }
        var blob = response.blobs[0];
        fetch(blob.url)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(text) {
                try { sendJSON(res, 200, { success: true, data: JSON.parse(text) }); }
                catch (e) { sendJSON(res, 500, { success: false, error: 'Parse error' }); }
            })
            .catch(function(e) {
                sendJSON(res, 500, { success: false, error: 'Failed to fetch: ' + e.message });
            });
    }).catch(function(e) {
        sendJSON(res, 500, { success: false, error: 'Failed to list: ' + e.message });
    });
}

function handleWrite(req, res) {
    var parsed = require('url').parse(req.url, true);
    var key = parsed.query.key;
    if (!key || VALID_KEYS.indexOf(key) === -1) {
        sendJSON(res, 400, { success: false, error: 'Invalid key' });
        return;
    }
    var userId = getUserIdFromToken(req);
    if (!userId) { sendJSON(res, 401, { success: false, error: 'Unauthorized' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var data = body.data;
        if (data === undefined) { sendJSON(res, 400, { success: false, error: 'No data provided' }); return; }
        var json = JSON.stringify(data, null, 2);
        put('user-data/' + userId + '/' + key + '.json', json, {
            access: 'public',
            contentType: 'application/json',
            allowOverwrite: true
        }).then(function(blob) {
            sendJSON(res, 200, { success: true, url: blob.url });
        }).catch(function(e) {
            sendJSON(res, 500, { success: false, error: 'Failed to write: ' + e.message });
        });
    });
}

function handleReadAll(req, res) {
    var userId = getUserIdFromToken(req);
    if (!userId) { sendJSON(res, 401, { success: false, error: 'Unauthorized' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var keys = (body && body.keys) || VALID_KEYS;
        var result = {};
        var pending = keys.length;

        if (pending === 0) { sendJSON(res, 200, { success: true, data: {} }); return; }

        function done() {
            sendJSON(res, 200, { success: true, data: result });
        }

        keys.forEach(function(key) {
            list({ prefix: 'user-data/' + userId + '/' + key + '.json' }).then(function(response) {
                if (!response.blobs || response.blobs.length === 0) {
                    pending--;
                    if (pending === 0) done();
                    return;
                }
                var blob = response.blobs[0];
                fetch(blob.url)
                    .then(function(r) {
                        if (!r.ok) throw new Error('HTTP ' + r.status);
                        return r.text();
                    })
                    .then(function(text) {
                        try { result[key] = JSON.parse(text); } catch (e) { result[key] = null; }
                        pending--;
                        if (pending === 0) done();
                    })
                    .catch(function() {
                        pending--;
                        if (pending === 0) done();
                    });
            }).catch(function() {
                pending--;
                if (pending === 0) done();
            });
        });
    });
}

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action;

    if (req.method === 'OPTIONS') {
        handleOptions(req, res, 'POST, GET, OPTIONS');
        return;
    }

    switch (action) {
        case 'read':
            handleRead(req, res);
            break;
        case 'write':
            handleWrite(req, res);
            break;
        case 'read-all':
            handleReadAll(req, res);
            break;
        default:
            sendJSON(res, 404, { success: false, error: 'Unknown action: ' + (action || 'none') });
    }
};