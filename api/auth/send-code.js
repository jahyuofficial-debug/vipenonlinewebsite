var crypto = require('crypto');
var https = require('https');

var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var RESEND_FROM = process.env.RESEND_FROM || 'Vipen <noreply@vipenonline.com>';
var AUTH_SECRET = process.env.AUTH_SECRET || 'vipen-auth-secret-v2-2026';
var CODE_EXPIRE_MS = 5 * 60 * 1000;

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function sendEmailViaResend(toEmail, code, callback) {
    var postData = JSON.stringify({
        from: RESEND_FROM,
        to: toEmail,
        subject: 'Vipen Verification Code',
        html: '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#111;color:#fff;border-radius:12px;text-align:center;">' +
            '<h1 style="color:#32c864;font-size:24px;margin-bottom:8px;">Vipen</h1>' +
            '<p style="font-size:16px;color:rgba(255,255,255,.7);margin-bottom:24px;">Your verification code</p>' +
            '<div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#32c864;padding:16px 24px;background:#1a1a1a;border-radius:8px;display:inline-block;margin-bottom:24px;">' + code + '</div>' +
            '<p style="font-size:13px;color:rgba(255,255,255,.35);">This code expires in 5 minutes.</p>' +
            '<p style="font-size:13px;color:rgba(255,255,255,.35);">If you didn\'t request this, please ignore this email.</p>' +
            '</div>'
    });

    var options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + RESEND_API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var req = https.request(options, function(res) {
        var body = '';
        res.on('data', function(chunk) { body += chunk; });
        res.on('end', function() {
            if (res.statusCode === 200 || res.statusCode === 201) {
                callback(null, JSON.parse(body));
            } else {
                callback(new Error('Resend API error: ' + res.statusCode + ' ' + body));
            }
        });
    });

    req.on('error', function(err) {
        callback(err);
    });

    req.write(postData);
    req.end();
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
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            sendJSON(res, 400, { success: false, error: 'Invalid email address' });
            return;
        }

        var code = generateCode();
        var ts = Date.now();
        var hmac = crypto.createHmac('sha256', AUTH_SECRET);
        hmac.update(email + '|' + code + '|' + ts);
        var hash = hmac.digest('hex');

        sendEmailViaResend(email, code, function(err, result) {
            if (err) {
                console.error('Resend send error:', err.message);
                sendJSON(res, 500, { success: false, error: 'Failed to send email. Please try again.' });
                return;
            }
            console.log('Verification code sent to', email, '| id:', result.id);
            sendJSON(res, 200, { success: true, hash: hash, ts: ts });
        });
    });
};
