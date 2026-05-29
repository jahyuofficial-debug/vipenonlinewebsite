var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var crypto = require('crypto');

var PORT = 3000;
var ROOT = __dirname;

var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var RESEND_KEY_PATH = 'D:\\设计文档\\Web素材\\APIkeys\\ResendAPI.txt';
var RESEND_FROM = process.env.RESEND_FROM || 'Vipen <noreply@vipenonline.com>';
var CODE_EXPIRE_MS = 5 * 60 * 1000;
var AUTH_SECRET = process.env.AUTH_SECRET || 'vipen-auth-secret-v2-2026';

if (!RESEND_API_KEY) {
    try {
        RESEND_API_KEY = fs.readFileSync(RESEND_KEY_PATH, 'utf8').trim();
    } catch (e) {}
}

if (!RESEND_API_KEY) {
    try {
        RESEND_API_KEY = fs.readFileSync(path.join(ROOT, 'resend-key.txt'), 'utf8').trim();
    } catch (e) {}
}

if (!RESEND_API_KEY) {
    console.warn('[WARNING] RESEND_API_KEY is not set. Email sending will fail.');
    console.warn('[WARNING] Key file path: ' + RESEND_KEY_PATH);
    console.warn('[WARNING] Get your API key at https://resend.com/api-keys');
} else {
    console.log('[OK] RESEND_API_KEY loaded (length=' + RESEND_API_KEY.length + ')');
}

var codeStore = {};

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(email) {
    var payload = email + '|' + Date.now();
    return Buffer.from(payload).toString('base64');
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

function sendJSON(res, statusCode, data) {
    var json = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(json),
        'Access-Control-Allow-Origin': '*'
    });
    res.end(json);
}

function handleAPIRoute(req, res, apiPath) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
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

        if (apiPath === '/api/auth/send-code') {
            handleSendCode(res, body);
        } else if (apiPath === '/api/auth/verify-code') {
            handleVerifyCode(res, body);
        } else {
            sendJSON(res, 404, { success: false, error: 'Unknown API endpoint' });
        }
    });
}

function handleSendCode(res, body) {
    var email = body.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendJSON(res, 400, { success: false, error: 'Invalid email address' });
        return;
    }

    var existing = codeStore[email];
    if (existing && Date.now() - existing.sentAt < 60000) {
        sendJSON(res, 429, { success: false, error: 'Please wait before requesting another code' });
        return;
    }

    var code = generateCode();
    codeStore[email] = {
        code: code,
        expiresAt: Date.now() + CODE_EXPIRE_MS,
        sentAt: Date.now()
    };

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
        console.log('Verification code sent to', email, '| code:', code, '| id:', result.id);
        sendJSON(res, 200, { success: true, hash: hash, ts: ts });
    });
}

function handleVerifyCode(res, body) {
    var email = body.email;
    var code = body.code;
    var hash = body.hash;
    var ts = body.ts;

    if (!email || !code) {
        sendJSON(res, 400, { success: false, error: 'Email and code are required' });
        return;
    }

    if (hash && ts) {
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
    } else {
        var record = codeStore[email];
        if (!record) {
            sendJSON(res, 400, { success: false, error: 'No verification code found. Please request a new one.' });
            return;
        }

        if (Date.now() > record.expiresAt) {
            delete codeStore[email];
            sendJSON(res, 400, { success: false, error: 'Verification code expired. Please request a new one.' });
            return;
        }

        if (record.code !== code) {
            sendJSON(res, 400, { success: false, error: 'Invalid verification code' });
            return;
        }

        delete codeStore[email];
    }

    var token = generateToken(email);
    var username = email.split('@')[0];

    sendJSON(res, 200, {
        success: true,
        token: token,
        username: username,
        email: email
    });
}

function serveStatic(req, res, filePath) {
    if (filePath.indexOf(ROOT) !== 0) {
        res.writeHead(403);
        res.end();
        return;
    }

    fs.stat(filePath, function(err, stats) {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        var ext = path.extname(filePath).toLowerCase();
        var contentType = MIME[ext] || 'application/octet-stream';

        if (req.headers.range) {
            var range = req.headers.range;
            var parts = range.replace(/bytes=/, '').split('-');
            var start = parseInt(parts[0], 10);
            var end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            var chunkSize = end - start + 1;

            res.writeHead(206, {
                'Content-Range': 'bytes ' + start + '-' + end + '/' + stats.size,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType
            });

            var stream = fs.createReadStream(filePath, { start: start, end: end });
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': stats.size,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });
}

var MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

http.createServer(function(req, res) {
    var parsedUrl = url.parse(req.url);
    var uri = parsedUrl.pathname;
    var filePath = path.join(ROOT, decodeURIComponent(uri));

    if (uri.indexOf('/api/') === 0) {
        handleAPIRoute(req, res, uri);
        return;
    }

    if (uri === '/') {
        filePath = path.join(ROOT, 'index.html');
    }

    serveStatic(req, res, filePath);
}).listen(PORT, function() {
    console.log('Server running at http://localhost:' + PORT);
});