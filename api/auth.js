var crypto = require('crypto');
var bcrypt = require('bcryptjs');

var getAuthSecret = require('../lib/secret').getAuthSecret;
var getOldAuthSecret = require('../lib/secret').getOldAuthSecret;
var generateToken = require('../lib/secret').generateToken;
var storage = require('../lib/manager-storage');
var authHelpers = require('../lib/auth-helpers');

var BCRYPT_ROUNDS = 12;

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

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

function handleAuthSendCode(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var email = (body.email || '').trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            sendJSON(res, 400, { success: false, error: 'Invalid email address' });
            return;
        }
        var code = authHelpers.generateCode();
        var ts = Date.now();
        var hash = authHelpers.computeHash(email, code, ts);
        authHelpers.sendEmailViaResend(email, code, function(err2) {
            if (err2) {
                console.error('Resend send error:', err2.message);
                sendJSON(res, 500, { success: false, error: 'Failed to send email. Please try again.' });
                return;
            }
            console.log('Verification code sent to', email, '| code:', code);
            sendJSON(res, 200, { success: true, hash: hash, ts: ts });
        });
    });
}

function handleAuthVerifyCode(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var email = (body.email || '').trim();
        var code = (body.code || '').trim();
        var hash = (body.hash || '').trim();
        var ts = parseInt(body.ts, 10) || 0;

        if (!email || !code) {
            sendJSON(res, 400, { success: false, error: 'Email and code are required' });
            return;
        }
        if (!authHelpers.verifyHash(email, code, ts, hash)) {
            sendJSON(res, 400, { success: false, error: 'Invalid or expired verification code' });
            return;
        }

        var username = body.username || email.split('@')[0];
        var password = body.password || '';

        function respondWithToken(tokenEmail, tokenUsername, tokenRole) {
            var token = generateToken(tokenEmail, tokenUsername, tokenRole);
            sendJSON(res, 200, { success: true, token: token, username: tokenUsername, email: tokenEmail, role: tokenRole });
        }

        if (password) {
            bcrypt.hash(password, BCRYPT_ROUNDS, function(bcryptErr, passwordHash) {
                if (bcryptErr) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }
                storage.readJSON('users.json', function(readErr, users) {
                    if (readErr) users = [];
                    var existingIdx = -1;
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].email.toLowerCase() === email.toLowerCase()) { existingIdx = i; break; }
                    }
                    if (existingIdx >= 0) {
                        users[existingIdx].passwordHash = passwordHash;
                        if (body.username) users[existingIdx].username = body.username;
                        users[existingIdx].lastLogin = new Date().toISOString();
                    } else {
                        users.push({
                            id: 'u' + String(users.length + 1).padStart(3, '0'),
                            username: username, email: email,
                            role: authHelpers.isManagerGoEmail(email) ? 'ManagerGo' : 'Viper',
                            passwordHash: passwordHash, status: 'active',
                            createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
                        });
                    }
                    storage.writeJSON('users.json', users, function() {
                        var existing = existingIdx >= 0 ? users[existingIdx] : null;
                        var role = existing ? existing.role : (authHelpers.isManagerGoEmail(email) ? 'ManagerGo' : 'Viper');
                        respondWithToken(email, username, role);
                    });
                });
            });
        } else {
            storage.readJSON('users.json', function(readErr, users) {
                if (readErr) users = [];
                var existingUser = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email.toLowerCase()) { existingUser = users[i]; break; }
                }
                if (existingUser) {
                    existingUser.lastLogin = new Date().toISOString();
                    storage.writeJSON('users.json', users, function() {});
                }
                var role = existingUser ? existingUser.role : 'Viper';
                respondWithToken(email, existingUser ? existingUser.username : username, role);
            });
        }
    });
}

function handleAuthLogin(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var loginField = (body.email || body.username || '').trim();
        var password = body.password || '';

        if (!loginField || !password) {
            sendJSON(res, 400, { success: false, error: 'Email/Username and password are required' });
            return;
        }
        if (!authHelpers.checkRateLimit('login_' + loginField.toLowerCase())) {
            sendJSON(res, 429, { success: false, error: 'Too many attempts. Please try again later.' });
            return;
        }

        storage.readJSON('users.json', function(readErr, users) {
            if (readErr) users = [];

            function verifyPassword(storedHash, callback) {
                if (storedHash.indexOf('$2') === 0) {
                    bcrypt.compare(password, storedHash, callback);
                    return;
                }
                var newHash = crypto.createHmac('sha256', getAuthSecret()).update(loginField.toLowerCase() + '|' + password).digest('hex');
                var oldSecret = getOldAuthSecret();
                if (storedHash === newHash) { callback(null, true); return; }
                if (oldSecret) {
                    var oldHash = crypto.createHmac('sha256', oldSecret).update(loginField.toLowerCase() + '|' + password).digest('hex');
                    if (storedHash === oldHash) { callback(null, true); return; }
                }
                callback(null, false);
            }

            function findAndVerify(email, callback) {
                var user = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email.toLowerCase()) { user = users[i]; break; }
                }
                if (!user) { callback(null); return; }
                verifyPassword(user.passwordHash, function(vErr, match) {
                    if (match) {
                        if (user.passwordHash.indexOf('$2') !== 0) {
                            bcrypt.hash(password, BCRYPT_ROUNDS, function(hErr, bcryptHash) {
                                if (!hErr) user.passwordHash = bcryptHash;
                                callback(user);
                            });
                            return;
                        }
                        callback(user);
                    } else {
                        callback(null);
                    }
                });
            }

            findAndVerify(loginField, function(matchedUser) {
                if (matchedUser) {
                    matchedUser.lastLogin = new Date().toISOString();
                    storage.writeJSON('users.json', users, function() {});
                    var token = generateToken(matchedUser.email, matchedUser.username, matchedUser.role);
                    sendJSON(res, 200, {
                        success: true, token: token,
                        username: matchedUser.username, email: matchedUser.email,
                        role: authHelpers.isManagerGoEmail(matchedUser.email) ? 'ManagerGo' : (matchedUser.role || '')
                    });
                    return;
                }
                for (var i = 0; i < users.length; i++) {
                    if (users[i].username.toLowerCase() === loginField.toLowerCase()) {
                        findAndVerify(users[i].email, function(userByUsername) {
                            if (userByUsername) {
                                userByUsername.lastLogin = new Date().toISOString();
                                storage.writeJSON('users.json', users, function() {});
                                var token = generateToken(userByUsername.email, userByUsername.username, userByUsername.role);
                                sendJSON(res, 200, {
                                    success: true, token: token,
                                    username: userByUsername.username, email: userByUsername.email,
                                    role: authHelpers.isManagerGoEmail(userByUsername.email) ? 'ManagerGo' : (userByUsername.role || '')
                                });
                            } else {
                                sendJSON(res, 401, { success: false, error: 'Invalid email/username or password' });
                            }
                        });
                        return;
                    }
                }
                sendJSON(res, 401, { success: false, error: 'Invalid email/username or password' });
            });
        });
    });
}

var routeMap = {
    'send-code': handleAuthSendCode,
    'verify-code': handleAuthVerifyCode,
    'login': handleAuthLogin
};

module.exports = function(req, res) {
    var queryString = req.url.split('?')[1] || '';
    var action = '';
    if (queryString) {
        var params = queryString.split('&');
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            if (decodeURIComponent(pair[0]) === 'action') {
                action = decodeURIComponent(pair[1] || '');
                break;
            }
        }
    }

    var handler = routeMap[action];
    if (handler) {
        handler(req, res);
    } else {
        sendJSON(res, 404, { success: false, error: 'Unknown auth action: ' + (action || '(none)') });
    }
};