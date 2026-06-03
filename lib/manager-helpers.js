var crypto = require('crypto');

var getAuthSecret = require('./secret').getAuthSecret;
var getOldAuthSecret = require('./secret').getOldAuthSecret;
var storage = require('./manager-storage');

var SESSION_TTL = 30 * 60 * 1000;

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
}

function parseBody(req, callback) {
    var body = '';
    req.on('data', function(chunk) {
        body += chunk;
        if (body.length > 1024) {
            req.destroy();
            callback(new Error('Payload too large'));
        }
    });
    req.on('end', function() {
        try { callback(null, JSON.parse(body)); } catch (e) { callback(new Error('Invalid JSON')); }
    });
}

function hashPIN(pin) {
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update('manager_pin_' + pin);
    return hmac.digest('hex');
}

function createSessionToken(user) {
    var payload = JSON.stringify({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        exp: Date.now() + SESSION_TTL
    });
    var encoded = Buffer.from(payload).toString('base64');
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(encoded);
    var sig = hmac.digest('hex');
    return encoded + '.' + sig;
}

function verifySessionToken(token, callback) {
    if (!token) { callback('No token'); return; }
    var parts = token.split('.');
    if (parts.length !== 2) { callback('Invalid token format'); return; }
    var encoded = parts[0];
    var sig = parts[1];
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(encoded);
    if (hmac.digest('hex') !== sig) { callback('Invalid signature'); return; }
    try {
        var payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        if (Date.now() > payload.exp) { callback('Session expired'); return; }
        callback(null, payload);
    } catch(e) {
        callback('Invalid payload');
    }
}

function addLog(action, admin, detail, callback) {
    storage.readJSON('logs.json', function(err, logs) {
        if (err) logs = [];
        logs.unshift({
            id: 'log' + Date.now(),
            action: action,
            admin: admin || 'unknown',
            detail: detail,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 500) logs = logs.slice(0, 500);
        storage.writeJSON('logs.json', logs, callback);
    });
}

module.exports = {
    sendJSON: sendJSON,
    parseBody: parseBody,
    hashPIN: hashPIN,
    createSessionToken: createSessionToken,
    verifySessionToken: verifySessionToken,
    addLog: addLog
};