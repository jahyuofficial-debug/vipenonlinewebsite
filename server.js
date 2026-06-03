var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var crypto = require('crypto');
var VerificationEmail = require('./emails/VerificationEmail');
var canvas;
try { canvas = require('canvas'); } catch (e) { canvas = null; }

var PORT = process.env.PORT || 3000;
var ROOT = __dirname;

var MANAGER_DATA_DIR = path.join(ROOT, 'data', 'manager');
var MANAGER_SESSIONS = {};
var MANAGER_SESSION_TTL = 30 * 60 * 1000;


var RESEND_API_KEY = process.env.RESEND_API_KEY || '';
var RESEND_KEY_PATH = 'D:\\设计文档\\Web素材\\APIkeys\\ResendAPI.txt';
var RESEND_FROM = process.env.RESEND_FROM || 'Vipen <noreply@vipenonline.com>';
var CODE_EXPIRE_MS = 5 * 60 * 1000;
var MANAGERGO_EMAILS = ['riverjia9527@gmail.com'];
var getAuthSecret = require('./api/auth/secret').getAuthSecret;
var getOldAuthSecret = require('./api/auth/secret').getOldAuthSecret;

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

function sendEmailViaResend(toEmail, html, callback) {
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

function generateOGImage(title, author, callback) {
    if (!canvas) {
        callback(new Error('Canvas not available'));
        return;
    }
    var createCanvas = canvas.createCanvas;
    var registerFont = canvas.registerFont;
    var WIDTH = 1200;
    var HEIGHT = 630;
    var c = createCanvas(WIDTH, HEIGHT);
    var ctx = c.getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#111118');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    var accentGradient = ctx.createLinearGradient(0, 0, WIDTH, 0);
    accentGradient.addColorStop(0, '#6366f1');
    accentGradient.addColorStop(0.5, '#8b5cf6');
    accentGradient.addColorStop(1, '#a855f7');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(60, 60, 80, 6);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    var maxWidth = WIDTH - 120;
    var lineHeight = 64;
    var words = (title || 'Vipen Article').split('');
    var lines = [];
    var currentLine = '';
    for (var i = 0; i < words.length; i++) {
        var testLine = currentLine + words[i];
        var metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    if (lines.length > 3) {
        lines = lines.slice(0, 3);
        lines[2] = lines[2].slice(0, -3) + '...';
    }
    var startY = 280 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach(function(line, idx) {
        ctx.fillText(line, 60, startY + idx * lineHeight);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px sans-serif';
    ctx.fillText('By ' + (author || 'Vipen'), 60, startY + lines.length * lineHeight + 24);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Vipen', WIDTH - 60, HEIGHT - 140);

    var buf = c.toBuffer('image/png');
    callback(null, buf);
}

function handleOGImage(req, res, query) {
    var q = query || {};
    var title = decodeURIComponent(q.title || 'Vipen Article');
    var author = decodeURIComponent(q.author || 'Vipen');
    generateOGImage(title, author, function(err, buf) {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('OG generation failed');
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buf.length,
            'Cache-Control': 'public, max-age=3600'
        });
        res.end(buf);
    });
}

function handleAPIRoute(req, res, apiPath) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (apiPath === '/api/og') {
        var parsed = url.parse(req.url, true);
        handleOGImage(req, res, parsed.query);
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
        } else if (apiPath === '/api/auth/login') {
            handleLogin(res, body);
        } else if (apiPath === '/api/profile/save') {
            handleSaveProfile(res, body);
        } else if (apiPath.indexOf('/api/manager/') === 0) {
            handleManagerAPI(req, res, apiPath, body);
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
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update(email + '|' + code + '|' + ts);
    var hash = hmac.digest('hex');

    var html = VerificationEmail({ code: code });

    sendEmailViaResend(email, html, function(err, result) {
        if (err) {
            console.error('Resend send error:', err.message);
            sendJSON(res, 500, { success: false, error: 'Failed to send email. Please try again.' });
            return;
        }
        console.log('Verification code sent to', email, '| code:', code, '| id:', result.id);
        sendJSON(res, 200, { success: true, hash: hash, ts: ts });
    });
}

function isManagerGoEmail(email) {
    return MANAGERGO_EMAILS.indexOf((email || '').toLowerCase().trim()) !== -1;
}

function handleLogin(res, body) {
    var loginField = (body.email || '').trim();
    var password = body.password || '';

    if (!loginField || !password) {
        sendJSON(res, 400, { success: false, error: 'Email/Username and password are required' });
        return;
    }

    readManagerJSON('users.json', function(err, users) {
        if (err) users = [];

        function tryMatch(email) {
            var newHash = crypto.createHmac('sha256', getAuthSecret()).update(email.toLowerCase() + '|' + password).digest('hex');
            var oldSecret = getOldAuthSecret();
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() !== email.toLowerCase()) continue;
                if (users[i].passwordHash === newHash) return users[i];
                if (oldSecret) {
                    var oldHash = crypto.createHmac('sha256', oldSecret).update(email.toLowerCase() + '|' + password).digest('hex');
                    if (users[i].passwordHash === oldHash) {
                        users[i].passwordHash = newHash;
                        return users[i];
                    }
                }
            }
            return null;
        }

        var matchedUser = tryMatch(loginField);

        if (!matchedUser) {
            for (var i = 0; i < users.length; i++) {
                if (users[i].username.toLowerCase() === loginField.toLowerCase()) {
                    matchedUser = tryMatch(users[i].email);
                    break;
                }
            }
        }

        if (matchedUser) {
            matchedUser.lastLogin = new Date().toISOString();
            writeManagerJSON('users.json', users, function() {});

            var token = generateToken(matchedUser.email);
            sendJSON(res, 200, {
                success: true,
                token: token,
                username: matchedUser.username,
                email: matchedUser.email,
                role: isManagerGoEmail(matchedUser.email) ? 'ManagerGo' : (matchedUser.role || '')
            });
            return;
        }

        sendJSON(res, 401, { success: false, error: 'Invalid email/username or password' });
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

        var hmac = crypto.createHmac('sha256', getAuthSecret());
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

    var username = body.username || email.split('@')[0];
    var password = body.password || '';

    if (password) {
        var hmacPwd = crypto.createHmac('sha256', getAuthSecret());
        hmacPwd.update(email + '|' + password);
        var passwordHash = hmacPwd.digest('hex');

        readManagerJSON('users.json', function(err, users) {
            if (err) users = [];

            var existingIdx = -1;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() === email.toLowerCase()) {
                    existingIdx = i;
                    break;
                }
            }

            if (existingIdx >= 0) {
                users[existingIdx].passwordHash = passwordHash;
                if (body.username) users[existingIdx].username = body.username;
                users[existingIdx].lastLogin = new Date().toISOString();
            } else {
                users.push({
                    id: 'u' + String(users.length + 1).padStart(3, '0'),
                    username: username,
                    email: email,
                    role: isManagerGoEmail(email) ? 'ManagerGo' : 'Viper',
                    passwordHash: passwordHash,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
            }

            writeManagerJSON('users.json', users, function() {
                var token = generateToken(email);
                sendJSON(res, 200, {
                    success: true,
                    token: token,
                    username: username,
                    email: email,
                    role: isManagerGoEmail(email) ? 'ManagerGo' : (existingIdx >= 0 ? users[existingIdx].role : 'Viper')
                });
            });
        });
    } else {
        readManagerJSON('users.json', function(err, users) {
            if (err) users = [];
            var existingUser = null;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() === email.toLowerCase()) {
                    existingUser = users[i];
                    break;
                }
            }
            if (existingUser) {
                existingUser.lastLogin = new Date().toISOString();
                writeManagerJSON('users.json', users, function() {});
            }
            var token = generateToken(email);
            sendJSON(res, 200, {
                success: true,
                token: token,
                username: existingUser ? existingUser.username : username,
                email: email,
                role: isManagerGoEmail(email) ? 'ManagerGo' : (existingUser ? existingUser.role : 'Viper')
            });
        });
    }
}

function handleSaveProfile(res, body) {
    var filePath = path.join(ROOT, 'data', 'profile.json');
    var json = JSON.stringify(body, null, 2);
    fs.writeFile(filePath, json, 'utf8', function(err) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to save profile' });
            return;
        }
        sendJSON(res, 200, { success: true });
    });
}

function readManagerJSON(filename, callback) {
    var fp = path.join(MANAGER_DATA_DIR, filename);
    fs.readFile(fp, 'utf8', function(err, raw) {
        if (err) {
            if (err.code === 'ENOENT') { callback(null, []); return; }
            callback(err); return;
        }
        try { callback(null, JSON.parse(raw)); } catch (e) { callback(e); }
    });
}

function writeManagerJSON(filename, data, callback) {
    var fp = path.join(MANAGER_DATA_DIR, filename);
    var dir = path.dirname(fp);
    fs.mkdir(dir, { recursive: true }, function() {
        fs.writeFile(fp, JSON.stringify(data, null, 2), 'utf8', function(err) {
            callback(err);
        });
    });
}

function addManagerLog(action, admin, detail, callback) {
    readManagerJSON('logs.json', function(err, logs) {
        if (err) logs = [];
        logs.unshift({
            id: 'log' + Date.now(),
            action: action,
            admin: admin || 'unknown',
            detail: detail,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 500) logs = logs.slice(0, 500);
        writeManagerJSON('logs.json', logs, function() {
            if (callback) callback();
        });
    });
}

function verifyManagerSession(body, callback) {
    var sessionToken = body.sessionToken;
    if (!sessionToken) { callback('No session token'); return; }
    var session = MANAGER_SESSIONS[sessionToken];
    if (!session) { callback('Invalid session'); return; }
    if (Date.now() - session.createdAt > MANAGER_SESSION_TTL) {
        delete MANAGER_SESSIONS[sessionToken];
        callback('Session expired');
        return;
    }
    callback(null, session);
}

function handleManagerAPI(req, res, apiPath, body) {
    if (apiPath === '/api/manager/verify-pin') {
        handleManagerVerifyPin(res, body);
        return;
    }
    if (apiPath === '/api/manager/set-pin') {
        handleManagerSetPin(res, body);
        return;
    }
    if (apiPath === '/api/manager/check-session') {
        handleManagerCheckSession(res, body);
        return;
    }

    verifyManagerSession(body, function(err, session) {
        if (err) {
            sendJSON(res, 401, { success: false, error: err });
            return;
        }
        if (apiPath === '/api/manager/dashboard') {
            handleManagerDashboard(res, session);
        } else if (apiPath === '/api/manager/users') {
            handleManagerUsers(res, body, session);
        } else if (apiPath === '/api/manager/user-update') {
            handleManagerUserUpdate(res, body, session);
        } else if (apiPath === '/api/manager/user-delete') {
            handleManagerUserDelete(res, body, session);
        } else if (apiPath === '/api/manager/content') {
            handleManagerContent(res, session);
        } else if (apiPath === '/api/manager/content-action') {
            handleManagerContentAction(res, body, session);
        } else if (apiPath === '/api/manager/media') {
            handleManagerMedia(res, session);
        } else if (apiPath === '/api/manager/media-delete') {
            handleManagerMediaDelete(res, body, session);
        } else if (apiPath === '/api/manager/settings') {
            handleManagerSettings(res, body, session);
        } else if (apiPath === '/api/manager/logs') {
            handleManagerLogs(res, session);
        } else if (apiPath === '/api/manager/upload') {
            handleManagerUpload(req, res, session);
        } else if (apiPath === '/api/manager/home-banner-save') {
            handleManagerHomeBannerSave(res, body, session);
        } else {
            sendJSON(res, 404, { success: false, error: 'Unknown manager endpoint' });
        }
    });
}

function hashPIN(pin) {
    var hmac = crypto.createHmac('sha256', getAuthSecret());
    hmac.update('manager_pin_' + pin);
    return hmac.digest('hex');
}

function handleManagerVerifyPin(res, body) {
    var email = (body.email || '').toLowerCase().trim();
    var pin = body.pin || '';

    if (!pin) {
        sendJSON(res, 400, { success: false, error: 'PIN is required' });
        return;
    }

    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
        return;
    }

    if (!email) {
        sendJSON(res, 400, { success: false, error: 'Email is required' });
        return;
    }

    var newHash = hashPIN(pin);
    var oldSecret = getOldAuthSecret();
    var oldHash = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + pin).digest('hex') : null;

    readManagerJSON('pins.json', function(err, pins) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Server error' });
            return;
        }

        readManagerJSON('users.json', function(err2, users) {
            if (err2) {
                sendJSON(res, 500, { success: false, error: 'Server error' });
                return;
            }

            var user = null;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() === email) {
                    user = users[i];
                    break;
                }
            }

            if (!user) {
                sendJSON(res, 404, { success: false, error: 'User not found' });
                return;
            }

            var pinRecord = null;
            for (var j = 0; j < pins.length; j++) {
                if (pins[j].user_id === user.id) {
                    pinRecord = pins[j];
                    break;
                }
            }

            if (!pinRecord) {
                sendJSON(res, 400, { success: false, error: 'PIN not set up' });
                return;
            }

            if (pinRecord.pin_hash === newHash) {
                createAndSendSession(res, user);
                return;
            }

            if (oldHash && pinRecord.pin_hash === oldHash) {
                pinRecord.pin_hash = newHash;
                writeManagerJSON('pins.json', pins, function() {});
                createAndSendSession(res, user);
                return;
            }

            sendJSON(res, 401, { success: false, error: 'Invalid PIN' });
        });
    });
}

function createAndSendSession(res, user) {
    var sessionToken = crypto.randomBytes(32).toString('hex');
    MANAGER_SESSIONS[sessionToken] = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: Date.now()
    };
    addManagerLog('admin_login', user.username, 'ManagerGo admin logged in via PIN');
    sendJSON(res, 200, {
        success: true,
        sessionToken: sessionToken,
        username: user.username,
        email: user.email
    });
}

function handleManagerSetPin(res, body) {
    var email = (body.email || '').toLowerCase().trim();
    var oldPin = body.oldPin || '';
    var newPin = body.newPin || '';

    if (!email || !oldPin || !newPin) {
        sendJSON(res, 400, { success: false, error: 'All fields are required' });
        return;
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
        return;
    }

    readManagerJSON('users.json', function(err, users) {
        var user = null;
        for (var i = 0; i < users.length; i++) {
            if (users[i].email.toLowerCase() === email && users[i].role === 'ManagerGo') {
                user = users[i];
                break;
            }
        }
        if (!user) {
            sendJSON(res, 403, { success: false, error: 'Access denied' });
            return;
        }

        readManagerJSON('pins.json', function(err2, pins) {
            var pinRecord = null;
            for (var j = 0; j < pins.length; j++) {
                if (pins[j].user_id === user.id) {
                    pinRecord = pins[j];
                    break;
                }
            }

            var newPinHash = hashPIN(oldPin);
            var oldSecret = getOldAuthSecret();
            var oldPinHash = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + oldPin).digest('hex') : null;
            var pinValid = (pinRecord && pinRecord.pin_hash === newPinHash);
            if (!pinValid && oldPinHash && pinRecord && pinRecord.pin_hash === oldPinHash) {
                pinValid = true;
            }

            if (!pinValid) {
                if (pinRecord) {
                    sendJSON(res, 401, { success: false, error: 'Current PIN is incorrect' });
                } else {
                    sendJSON(res, 400, { success: false, error: 'PIN not set up' });
                }
                return;
            }

            if (pinRecord) {
                pinRecord.pin_hash = hashPIN(newPin);
                pinRecord.updated_at = new Date().toISOString();
            } else {
                pins.push({
                    user_id: user.id,
                    pin_hash: hashPIN(newPin),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
            writeManagerJSON('pins.json', pins, function() {
                sendJSON(res, 200, { success: true });
            });
        });
    });
}

function handleManagerCheckSession(res, body) {
    verifyManagerSession(body, function(err, session) {
        if (err) {
            sendJSON(res, 401, { success: false, error: err });
            return;
        }
        sendJSON(res, 200, { success: true, username: session.username, email: session.email });
    });
}

function handleManagerDashboard(res, session) {
    readManagerJSON('users.json', function(err, users) {
        var stats = {
            totalUsers: users ? users.length : 0,
            newUsersToday: 0,
            activeUsers: 0,
            bannedUsers: 0,
            totalPosts: 42,
            totalComments: 189,
            onlineUsers: Math.floor(Math.random() * 5) + 1,
            recentLogins: [],
            recentRegistrations: []
        };

        if (users) {
            var today = new Date().toISOString().slice(0, 10);
            users.forEach(function(u) {
                if (u.status === 'active') stats.activeUsers++;
                if (u.status === 'banned') stats.bannedUsers++;
                if (u.createdAt && u.createdAt.slice(0, 10) === today) stats.newUsersToday++;
            });
            var sorted = users.slice().sort(function(a, b) {
                return (b.lastLogin || '').localeCompare(a.lastLogin || '');
            });
            stats.recentLogins = sorted.slice(0, 5).map(function(u) {
                return { username: u.username, avatar: u.avatar, lastLogin: u.lastLogin, role: u.role };
            });
            var sortedReg = users.slice().sort(function(a, b) {
                return (b.createdAt || '').localeCompare(a.createdAt || '');
            });
            stats.recentRegistrations = sortedReg.slice(0, 5).map(function(u) {
                return { username: u.username, avatar: u.avatar, createdAt: u.createdAt, role: u.role };
            });
        }

        sendJSON(res, 200, { success: true, stats: stats });
    });
}

function handleManagerUsers(res, body, session) {
    var search = (body.search || '').toLowerCase().trim();

    readManagerJSON('users.json', function(err, users) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to read users' });
            return;
        }

        if (search) {
            users = users.filter(function(u) {
                return u.username.toLowerCase().indexOf(search) !== -1 ||
                    u.email.toLowerCase().indexOf(search) !== -1;
            });
        }

        users = users.map(function(u) {
            var clone = {};
            for (var k in u) { clone[k] = u[k]; }
            clone.actions = [];
            return clone;
        });

        sendJSON(res, 200, { success: true, users: users });
    });
}

function handleManagerUserUpdate(res, body, session) {
    var userId = body.userId;
    var updates = body.updates || {};

    if (!userId) {
        sendJSON(res, 400, { success: false, error: 'User ID required' });
        return;
    }

    readManagerJSON('users.json', function(err, users) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Server error' });
            return;
        }

        var idx = -1;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === userId) { idx = i; break; }
        }
        if (idx === -1) {
            sendJSON(res, 404, { success: false, error: 'User not found' });
            return;
        }

        var oldUser = JSON.parse(JSON.stringify(users[idx]));

        if (updates.username !== undefined) users[idx].username = updates.username;
        if (updates.email !== undefined) users[idx].email = updates.email;
        if (updates.role !== undefined) users[idx].role = updates.role;
        if (updates.status !== undefined) users[idx].status = updates.status;

        writeManagerJSON('users.json', users, function(writeErr) {
            if (writeErr) {
                sendJSON(res, 500, { success: false, error: 'Failed to save' });
                return;
            }
            var detailParts = [];
            if (updates.username !== undefined && updates.username !== oldUser.username)
                detailParts.push('username: ' + oldUser.username + ' -> ' + updates.username);
            if (updates.email !== undefined && updates.email !== oldUser.email)
                detailParts.push('email: ' + oldUser.email + ' -> ' + updates.email);
            if (updates.role !== undefined && updates.role !== oldUser.role)
                detailParts.push('role: ' + oldUser.role + ' -> ' + updates.role);
            if (updates.status !== undefined && updates.status !== oldUser.status)
                detailParts.push('status: ' + oldUser.status + ' -> ' + updates.status);
            addManagerLog('user_update', session.username,
                'Updated ' + oldUser.username + ': ' + (detailParts.join(', ') || 'no changes'));
            sendJSON(res, 200, { success: true, user: users[idx] });
        });
    });
}

function handleManagerUserDelete(res, body, session) {
    var userId = body.userId;

    readManagerJSON('users.json', function(err, users) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Server error' });
            return;
        }

        var idx = -1;
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === userId) { idx = i; break; }
        }
        if (idx === -1) {
            sendJSON(res, 404, { success: false, error: 'User not found' });
            return;
        }

        var delUser = users[idx];
        users.splice(idx, 1);

        writeManagerJSON('users.json', users, function(writeErr) {
            if (writeErr) {
                sendJSON(res, 500, { success: false, error: 'Failed to save' });
                return;
            }
            addManagerLog('user_delete', session.username,
                'Deleted user: ' + delUser.username + ' (' + delUser.email + ')');
            sendJSON(res, 200, { success: true });
        });
    });
}

function handleManagerContent(res, session) {
    var posts = [];
    try {
        var raw = fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8');
        var data = JSON.parse(raw);
        if (data.action) {
            posts = data.action.map(function(item, i) {
                return {
                    id: 'post_' + i,
                    type: 'action',
                    username: item.username,
                    avatar: item.avatar,
                    content: (item.caption || '').slice(0, 60),
                    likes: item.likes || 0,
                    commentsCount: item.commentList ? item.commentList.length : 0,
                    timeAgo: item.timeAgo,
                    hidden: false
                };
            });
        }
    } catch (e) {}

    var msgPosts = [];
    try {
        var rawMsg = fs.readFileSync(path.join(ROOT, 'data', 'msg.json'), 'utf8');
    } catch (e) {}

    sendJSON(res, 200, { success: true, posts: posts });
}

function handleManagerContentAction(res, body, session) {
    var postId = body.postId;
    var action = body.action;

    if (!postId || !action) {
        sendJSON(res, 400, { success: false, error: 'Post ID and action required' });
        return;
    }

    addManagerLog('content_' + action, session.username,
        'Performed ' + action + ' on post ' + postId);
    sendJSON(res, 200, { success: true });
}

function handleManagerMedia(res, session) {
    var mediaDir = path.join(ROOT, 'images');
    var bannerDir = path.join(ROOT, 'banner');
    var discDir = path.join(ROOT, 'Disc');
    var items = [];

    function appendDir(dir, type) {
        try {
            var entries = fs.readdirSync(dir);
            entries.forEach(function(entry) {
                var fp = path.join(dir, entry);
                var stat = fs.statSync(fp);
                if (stat.isFile()) {
                    var relPath = path.relative(ROOT, fp).replace(/\\/g, '/');
                    items.push({
                        name: entry,
                        path: relPath,
                        type: type,
                        size: stat.size,
                        modified: stat.mtime.toISOString()
                    });
                }
            });
        } catch (e) {}
    }

    appendDir(mediaDir, 'image');
    appendDir(bannerDir, 'banner');

    try {
        var albums = fs.readdirSync(discDir);
        albums.forEach(function(album) {
            var albumPath = path.join(discDir, album);
            var stat = fs.statSync(albumPath);
            if (stat.isDirectory()) {
                var sub = fs.readdirSync(albumPath);
                sub.forEach(function(f) {
                    var fp = path.join(albumPath, f);
                    var s = fs.statSync(fp);
                    if (s.isFile()) {
                        var relPath = path.relative(ROOT, fp).replace(/\\/g, '/');
                        var ext = path.extname(f).toLowerCase();
                        items.push({
                            name: f,
                            path: relPath,
                            type: ext === '.mp3' ? 'audio' : 'image',
                            size: s.size,
                            modified: s.mtime.toISOString()
                        });
                    }
                });
            }
        });
    } catch (e) {}

    sendJSON(res, 200, { success: true, media: items });
}

function handleManagerMediaDelete(res, body, session) {
    var filePath = body.path;
    if (!filePath) {
        sendJSON(res, 400, { success: false, error: 'File path required' });
        return;
    }

    var fullPath = path.join(ROOT, filePath);
    if (fullPath.indexOf(ROOT) !== 0 || fullPath === ROOT) {
        sendJSON(res, 403, { success: false, error: 'Access denied' });
        return;
    }

    fs.unlink(fullPath, function(err) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to delete file' });
            return;
        }
        addManagerLog('media_delete', session.username, 'Deleted file: ' + filePath);
        sendJSON(res, 200, { success: true });
    });
}

function handleManagerSettings(res, body, session) {
    if (body && Object.keys(body).length > 0 && body.mode !== 'read') {
        readManagerJSON('settings.json', function(err, existing) {
            if (err) existing = {};
            var settings = existing;
            if (body.contact !== undefined) settings.contact = body.contact;
            if (body.title !== undefined) settings.title = body.title;
            if (body.rights !== undefined) settings.rights = body.rights;
            if (body.siteName !== undefined) settings.siteName = body.siteName;
            if (body.siteLogo !== undefined) settings.siteLogo = body.siteLogo;
            if (body.homeBanner !== undefined) settings.homeBanner = body.homeBanner;
            if (body.footerContent !== undefined) settings.footerContent = body.footerContent;
            if (body.contactEmail !== undefined) settings.contactEmail = body.contactEmail;
            if (body.contactInfo !== undefined) settings.contactInfo = body.contactInfo;
            if (body.siteAnnouncement !== undefined) settings.siteAnnouncement = body.siteAnnouncement;
            if (body.socials !== undefined) settings.socials = body.socials;
            if (body.extraBarFontStyle !== undefined) settings.extraBarFontStyle = body.extraBarFontStyle;
            if (body.extraBarItalic !== undefined) settings.extraBarItalic = body.extraBarItalic;

            writeManagerJSON('settings.json', settings, function(err2) {
                if (err2) {
                    sendJSON(res, 500, { success: false, error: 'Failed to save settings' });
                    return;
                }
                addManagerLog('settings_update', session.username, 'Updated site settings');
                sendJSON(res, 200, { success: true, settings: settings });
            });
        });
    } else {
        readManagerJSON('settings.json', function(err, settings) {
            if (err) {
                sendJSON(res, 500, { success: false, error: 'Failed to read settings' });
                return;
            }
            sendJSON(res, 200, { success: true, settings: settings });
        });
    }
}

function handleManagerLogs(res, session) {
    readManagerJSON('logs.json', function(err, logs) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to read logs' });
            return;
        }
        sendJSON(res, 200, { success: true, logs: logs });
    });
}

function handleManagerUpload(req, res, session) {
    var boundary = '';
    var contentType = req.headers['content-type'] || '';
    var match = contentType.match(/boundary=(.+)$/);
    if (!match) {
        sendJSON(res, 400, { success: false, error: 'No boundary found' });
        return;
    }
    boundary = '--' + match[1];

    var totalSize = 0;
    var MAX_SIZE = 150 * 1024 * 1024;
    var chunks = [];
    req.on('data', function(chunk) {
        totalSize += chunk.length;
        if (totalSize > MAX_SIZE) {
            req.destroy();
            return;
        }
        chunks.push(chunk);
    });
    req.on('end', function() {
        if (totalSize > MAX_SIZE) {
            sendJSON(res, 413, { success: false, error: 'File too large (max 150MB)' });
            return;
        }
        var buffer = Buffer.concat(chunks);
        var str = buffer.toString('binary');
        var parts = str.split(boundary);
        var uploadedFiles = [];
        var dest = 'images/uploads';

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.indexOf('Content-Disposition') === -1) continue;

            var headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd === -1) continue;
            var header = part.substring(0, headerEnd);

            var nameMatch = header.match(/name="([^"]+)"/);
            var filenameMatch = header.match(/filename="([^"]+)"/);
            if (!nameMatch) continue;

            var bodyStart = headerEnd + 4;
            var bodyEnd = part.lastIndexOf('\r\n');
            if (bodyEnd === -1) bodyEnd = part.length;
            var bodyStr = part.substring(bodyStart, bodyEnd);

            if (filenameMatch) {
                var filename = filenameMatch[1].replace(/[\\/:*?"<>|]/g, '_');
                var destDir = path.join(ROOT, dest);
                fs.mkdirSync(destDir, { recursive: true });
                var uniqueName = Date.now() + '_' + filename;
                var destPath = path.join(destDir, uniqueName);
                fs.writeFileSync(destPath, Buffer.from(bodyStr, 'binary'), 'binary');
                var relPath = path.relative(ROOT, destPath).replace(/\\/g, '/');
                uploadedFiles.push({ name: filename, path: relPath });
            } else {
                var value = bodyStr.trim();
                if (nameMatch[1] === 'dest') {
                    var safeDest = value.replace(/\.\./g, '').replace(/\\/g, '/').replace(/^\/+/, '');
                    if (safeDest && safeDest.indexOf('/') === -1) {
                        dest = safeDest;
                    } else {
                        dest = 'images/uploads';
                    }
                }
            }
        }

        if (uploadedFiles.length > 0) {
            addManagerLog('media_upload', session.username, 'Uploaded ' + uploadedFiles.length + ' file(s)');
        }
        sendJSON(res, 200, { success: true, files: uploadedFiles });
    });
}

function handleManagerHomeBannerSave(res, body, session) {
    var data = body.data;
    if (!data) {
        sendJSON(res, 400, { success: false, error: 'No data provided' });
        return;
    }

    var homeBannerPath = path.join(ROOT, 'data', 'home-banner.json');
    var json = JSON.stringify(data, null, 2);
    fs.writeFile(homeBannerPath, json, 'utf8', function(err) {
        if (err) {
            sendJSON(res, 500, { success: false, error: 'Failed to save home banner data' });
            return;
        }
        addManagerLog('home_banner_save', session.username, 'Updated HOME banner data');
        sendJSON(res, 200, { success: true });
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
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-cache, must-revalidate'
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

    if (uri === '/' || uri === '') {
        filePath = path.join(ROOT, 'index.html');
    }

    if (uri === '/manager') {
        filePath = path.join(ROOT, 'manager.html');
    }

    serveStatic(req, res, filePath);
}).listen(PORT, function() {
    console.log('Server running at http://localhost:' + PORT);
});