var crypto = require('crypto');
var getAuthSecret = require('../lib/secret').getAuthSecret;
var verifyToken = require('../lib/secret').verifyToken;

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
}

function handleUserDataRead(req, res, action) {
    // Static site: user data is not persisted. Return empty.
    var parts = action.split('/');
    var key = parts[1] || '';
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.end();
        return;
    }
    // Return empty data — no Blob storage
    sendJSON(res, 200, key === 'drafts' || key === 'actions' || key === 'actionDrafts' ? [] :
                    key === 'posts' ? [] :
                    key === 'likes' ? {} :
                    key === 'comments' ? {} :
                    key === 'notifications' ? [] :
                    key === 'chat' ? [] : {});
}

function handleUserDataWrite(req, res) {
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.end();
        return;
    }
    // Static site: no persistence. Return success to avoid errors.
    sendJSON(res, 200, { success: true });
}

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action || '';
    if (req.method === 'GET') {
        handleUserDataRead(req, res, action);
    } else if (req.method === 'POST') {
        handleUserDataWrite(req, res);
    } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
    }
};
