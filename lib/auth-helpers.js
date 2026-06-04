var crypto = require('crypto');
var https = require('https');
var fs = require('fs');
var path = require('path');

var getAuthSecret = require('./secret').getAuthSecret;
var storage = require('./manager-storage');

var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var RESEND_FROM = process.env.RESEND_FROM || 'Vipen <noreply@vipenonline.com>';
var CODE_EXPIRE_MS = 5 * 60 * 1000;

if (!RESEND_API_KEY) {
    try {
        RESEND_API_KEY = fs.readFileSync(path.join(process.cwd(), 'resend-key.txt'), 'utf8').trim();
    } catch (e) {}
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
        try { callback(null, JSON.parse(body)); } catch (e) { callback(new Error('Invalid JSON')); }
    });
}

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function sendEmailViaResend(toEmail, code, callback) {
    var VerificationEmail = require('../emails/VerificationEmail');
    var html = VerificationEmail({ code: code });

    var postData = JSON.stringify({
        from: RESEND_FROM,
        to: toEmail,
        subject: 'Vipen Verification Code',
        html: html
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
                callback(null);
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

function computeHash(email, code, ts) {
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(email + '|' + code + '|' + ts);
    return hmac.digest('hex');
}

function verifyHash(email, code, ts, hash) {
    if (Date.now() - ts > CODE_EXPIRE_MS) return false;
    return computeHash(email, code, ts) === hash;
}

function isManagerGoEmail(email) {
    var MANAGERGO_EMAILS = ['riverjia9527@gmail.com'];
    return MANAGERGO_EMAILS.indexOf((email || '').toLowerCase().trim()) !== -1;
}

var loginAttempts = {};

function checkRateLimit(key) {
    var now = Date.now();
    var entry = loginAttempts[key];
    if (!entry || now - entry.windowStart > 60000) {
        loginAttempts[key] = { count: 1, windowStart: now };
        return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
}

module.exports = {
    sendJSON: sendJSON,
    parseBody: parseBody,
    generateCode: generateCode,
    sendEmailViaResend: sendEmailViaResend,
    computeHash: computeHash,
    verifyHash: verifyHash,
    isManagerGoEmail: isManagerGoEmail,
    checkRateLimit: checkRateLimit
};