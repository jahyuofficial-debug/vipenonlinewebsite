var crypto = require('crypto');

var AUTH_SECRET = process.env.AUTH_SECRET || 'vipen-auth-secret-v2-2026';
var CODE_EXPIRE_MS = 5 * 60 * 1000;

function generateToken(email) {
    var payload = email + '|' + Date.now();
    return Buffer.from(payload).toString('base64');
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

module.exports = function(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
        var data;
        try { data = JSON.parse(body); } catch (e) {
            sendJSON(res, 400, { success: false, error: 'Invalid JSON' });
            return;
        }

        var email = data.email;
        var code = data.code;
        var hash = data.hash;
        var ts = data.ts;

        if (!email || !code || !hash || !ts) {
            sendJSON(res, 400, { success: false, error: 'Email, code, hash and ts are required' });
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