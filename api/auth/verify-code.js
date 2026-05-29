var crypto = require('crypto');

var AUTH_SECRET = process.env.AUTH_SECRET || 'vipen-auth-secret-v2-2026';
var CODE_EXPIRE_MS = 5 * 60 * 1000;

function generateToken(email) {
    var payload = email + '|' + Date.now();
    return Buffer.from(payload).toString('base64');
}

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
        try {
            callback(null, JSON.parse(body));
        } catch (e) {
            callback(new Error('Invalid JSON'));
        }
    });
}

module.exports = function(req, res) {
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        sendJSON(res, 405, { success: false, error: 'Method not allowed' });
        return;
    }

    parseBody(req, function(err, body) {
        if (err) {
            sendJSON(res, 400, { success: false, error: err.message });
            return;
        }

        var email = body.email;
        var code = body.code;
        var hash = body.hash;
        var ts = body.ts;

        if (!email || !code) {
            sendJSON(res, 400, { success: false, error: 'Email and code are required' });
            return;
        }

        if (!hash || !ts) {
            sendJSON(res, 400, { success: false, error: 'Verification hash and timestamp are required' });
            return;
        }

        if (Date.now() - ts > CODE_EXPIRE_MS) {
            sendJSON(res, 400, { success: false, error: 'Verification code expired. Please request a new one.' });
            return;
        }

        var hmac = crypto.createHmac('sha256', AUTH_SECRET);
        hmac.update(email + '|' + code + '|' + ts);
        var expectedHash = hmac.digest('hex');

        if (expectedHash !== hash) {
            sendJSON(res, 400, { success: false, error: 'Invalid verification code' });
            return;
        }

        var token = generateToken(email);
        var username = email.split('@')[0];

        sendJSON(res, 200, {
            success: true,
            token: token,
            username: username,
            email: email
        });
    });
};
