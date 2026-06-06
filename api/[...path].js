var crypto = require('crypto');
var https = require('https');
var bcrypt = require('bcryptjs');
var { list, put } = require('@vercel/blob');

var getAuthSecret = require('../lib/secret').getAuthSecret;
var getOldAuthSecret = require('../lib/secret').getOldAuthSecret;
var generateToken = require('../lib/secret').generateToken;
var storage = require('../lib/manager-storage');
var authHelpers = require('../lib/auth-helpers');
var managerHelpers = require('../lib/manager-helpers');

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

function parseMultipart(req, callback) {
    var contentType = req.headers['content-type'] || '';
    var match = contentType.match(/boundary=(.+)$/);
    if (!match) {
        callback(new Error('No boundary found'));
        return;
    }
    var boundary = '--' + match[1];
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
            callback(new Error('File too large (max 150MB)'));
            return;
        }
        var buffer = Buffer.concat(chunks);
        var str = buffer.toString('binary');
        var parts = str.split(boundary);
        var fields = {};
        var files = [];

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
                files.push({
                    filename: filenameMatch[1].replace(/[\\/:*?"<>|]/g, '_'),
                    body: bodyStr
                });
            } else {
                fields[nameMatch[1]] = bodyStr.trim();
            }
        }
        callback(null, fields, files);
    });
}

function getContentType(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var map = {
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        avi: 'video/x-msvideo', mkv: 'video/x-matroska',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
        flac: 'audio/flac', m4a: 'audio/mp4',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        webp: 'image/webp', gif: 'image/gif'
    };
    return map[ext] || 'application/octet-stream';
}

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

// ========== Route Handlers ==========

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

// ========== Data Route Handlers ==========

function handleDataHomeBanner(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }

    list({ prefix: 'data/home-banner.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }
        var blob = response.blobs[0];
        https.get(blob.url, function(blobRes) {
            var data = '';
            blobRes.on('data', function(chunk) { data += chunk; });
            blobRes.on('end', function() {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
        }).on('error', function() {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch blob' }));
        });
    }).catch(function() {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to list blobs' }));
    });
}

function handleDataDisc(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }

    list({ prefix: 'data/disc.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }
        var blob = response.blobs[0];
        https.get(blob.url, function(blobRes) {
            var data = '';
            blobRes.on('data', function(chunk) { data += chunk; });
            blobRes.on('end', function() {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
        }).on('error', function() {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch blob' }));
        });
    }).catch(function() {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to list blobs' }));
    });
}

// ========== Manager Route Handlers ==========

function handleManagerVerifyPin(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var email = (body.email || '').toLowerCase().trim();
        var pin = body.pin || '';

        if (!email) { sendJSON(res, 400, { success: false, error: 'Email is required' }); return; }
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }

        var newHash = managerHelpers.hashPIN(pin);
        var oldSecret = getOldAuthSecret();
        var oldHash = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + pin).digest('hex') : null;

        storage.readJSON('pins.json', function(err2, pins) {
            if (err2) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }
            storage.readJSON('users.json', function(err3, users) {
                if (err3) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }

                var user = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email) { user = users[i]; break; }
                }
                if (!user) { sendJSON(res, 404, { success: false, error: 'User not found' }); return; }

                var pinRecord = null;
                for (var j = 0; j < pins.length; j++) {
                    if (pins[j].user_id === user.id) { pinRecord = pins[j]; break; }
                }
                if (!pinRecord) { sendJSON(res, 400, { success: false, error: 'PIN not set up' }); return; }

                if (pinRecord.pin_hash === newHash) {
                    managerHelpers.addLog('admin_login', user.username, 'ManagerGo admin logged in via PIN', function() {
                        var sessionToken = managerHelpers.createSessionToken(user);
                        sendJSON(res, 200, { success: true, sessionToken: sessionToken, username: user.username, email: user.email });
                    });
                    return;
                }
                if (oldHash && pinRecord.pin_hash === oldHash) {
                    pinRecord.pin_hash = newHash;
                    storage.writeJSON('pins.json', pins, function() {
                        managerHelpers.addLog('admin_login', user.username, 'ManagerGo admin logged in via PIN (hash migrated)', function() {
                            var sessionToken = managerHelpers.createSessionToken(user);
                            sendJSON(res, 200, { success: true, sessionToken: sessionToken, username: user.username, email: user.email });
                        });
                    });
                    return;
                }
                sendJSON(res, 401, { success: false, error: 'Invalid PIN' });
            });
        });
    });
}

function handleManagerVerifyDesignPin(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var pin = body.pin || '';
        if (!pin) { sendJSON(res, 400, { success: false, error: 'PIN is required' }); return; }
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }
        var newHash = managerHelpers.hashPIN(pin);
        storage.readJSON('design-pin.json', function(err2, designPin) {
            if (err2 || !designPin) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }
            if (designPin.pin_hash === newHash) {
                sendJSON(res, 200, { success: true });
            } else {
                sendJSON(res, 401, { success: false, error: 'Invalid PIN' });
            }
        });
    });
}

function handleManagerSetPin(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var email = (body.email || '').toLowerCase().trim();
        var oldPin = body.oldPin || '';
        var newPin = body.newPin || '';

        if (!email || !oldPin || !newPin) { sendJSON(res, 400, { success: false, error: 'All fields are required' }); return; }
        if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }

        storage.readJSON('users.json', function(err2, users) {
            if (err2) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }
            var user = null;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() === email && users[i].role === 'ManagerGo') { user = users[i]; break; }
            }
            if (!user) { sendJSON(res, 403, { success: false, error: 'Access denied' }); return; }

            storage.readJSON('pins.json', function(err3, pins) {
                if (err3) { sendJSON(res, 500, { success: false, error: 'Server error' }); return; }
                var pinRecord = null;
                for (var j = 0; j < pins.length; j++) {
                    if (pins[j].user_id === user.id) { pinRecord = pins[j]; break; }
                }

                var oldPinHash = managerHelpers.hashPIN(oldPin);
                var oldSecret = getOldAuthSecret();
                var oldPinHashOld = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + oldPin).digest('hex') : null;
                var pinValid = (pinRecord && pinRecord.pin_hash === oldPinHash);
                if (!pinValid && oldPinHashOld && pinRecord && pinRecord.pin_hash === oldPinHashOld) {
                    pinValid = true;
                }
                if (!pinValid) {
                    sendJSON(res, 401, { success: false, error: pinRecord ? 'Current PIN is incorrect' : 'PIN not set up' });
                    return;
                }

                if (pinRecord) {
                    pinRecord.pin_hash = managerHelpers.hashPIN(newPin);
                    pinRecord.updated_at = new Date().toISOString();
                } else {
                    pins.push({
                        user_id: user.id, pin_hash: managerHelpers.hashPIN(newPin),
                        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
                    });
                }
                storage.writeJSON('pins.json', pins, function() {
                    sendJSON(res, 200, { success: true });
                });
            });
        });
    });
}

function handleManagerCheckSession(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var sessionToken = body.sessionToken;
        if (!sessionToken) { sendJSON(res, 401, { success: false, error: 'No session token' }); return; }
        managerHelpers.verifySessionToken(sessionToken, function(err2, session) {
            if (err2) { sendJSON(res, 401, { success: false, error: err2 }); return; }
            sendJSON(res, 200, { success: true, username: session.username, email: session.email });
        });
    });
}

function handleManagerUpload(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseMultipart(req, function(err, fields, files) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var dir = (fields.dest || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '_');
        var uploadedFiles = [];
        var pending = files.length;

        if (pending === 0) { sendJSON(res, 400, { success: false, error: 'No files uploaded' }); return; }

        function done() {
            sendJSON(res, 200, { success: true, files: uploadedFiles });
        }

        for (var i = 0; i < files.length; i++) {
            (function(f) {
                var blobPath = dir + '/' + Date.now() + '_' + f.filename;
                var buffer = Buffer.from(f.body, 'binary');
                put(blobPath, buffer, { access: 'public', contentType: getContentType(f.filename) })
                    .then(function(blob) {
                        uploadedFiles.push({ name: f.filename, path: blob.url });
                        pending--;
                        if (pending === 0) done();
                    }).catch(function(e) {
                        pending--;
                        if (pending === 0) done();
                    });
            })(files[i]);
        }
    });
}

function handleManagerDiscUpload(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseMultipart(req, function(err, fields, files) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }

        managerHelpers.verifySessionToken(fields.sessionToken, function(sessErr, session) {
            if (sessErr) { sendJSON(res, 401, { success: false, error: sessErr }); return; }

            var uploadedFiles = [];
            var albumDir = (fields.albumDir || 'Unknown').replace(/[\\/:*?"<>|]/g, '_').trim();
            var pending = files.length;

            if (pending === 0) { sendJSON(res, 400, { success: false, error: 'No files uploaded' }); return; }

            function done() {
                if (uploadedFiles.length > 0) {
                    managerHelpers.addLog('disc_upload', session.username, 'Uploaded ' + uploadedFiles.length + ' disc file(s) to Blob');
                }
                sendJSON(res, 200, { success: true, files: uploadedFiles });
            }

            for (var i = 0; i < files.length; i++) {
                (function(f) {
                    var blobPath = 'disc/' + albumDir + '/' + Date.now() + '_' + f.filename;
                    var buffer = Buffer.from(f.body, 'binary');
                    put(blobPath, buffer, { access: 'public', contentType: getContentType(f.filename) })
                        .then(function(blob) {
                            uploadedFiles.push({ name: f.filename, path: blob.url });
                            pending--;
                            if (pending === 0) done();
                        }).catch(function(e) {
                            pending--;
                            if (pending === 0) done();
                        });
                })(files[i]);
            }
        });
    });
}

function handleManagerDiscSave(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        managerHelpers.verifySessionToken(body.sessionToken, function(sessErr, session) {
            if (sessErr) { sendJSON(res, 401, { success: false, error: sessErr }); return; }
            var data = body.data;
            if (!data) { sendJSON(res, 400, { success: false, error: 'No data provided' }); return; }
            var json = JSON.stringify(data, null, 2);
            put('data/disc.json', json, { access: 'public', contentType: 'application/json', addRandomSuffix: false })
                .then(function(blob) {
                    managerHelpers.addLog('disc_save', session.username, 'Updated disc track data');
                    sendJSON(res, 200, { success: true, url: blob.url });
                }).catch(function(putErr) {
                    sendJSON(res, 500, { success: false, error: 'Failed to save disc data: ' + putErr.message });
                });
        });
    });
}

function handleManagerHomeBannerSave(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        managerHelpers.verifySessionToken(body.sessionToken, function(err2, session) {
            if (err2) { sendJSON(res, 401, { success: false, error: err2 }); return; }
            var data = body.data;
            if (!data) { sendJSON(res, 400, { success: false, error: 'No data provided' }); return; }
            var json = JSON.stringify(data, null, 2);
            put('data/home-banner.json', json, { access: 'public', contentType: 'application/json', addRandomSuffix: false })
                .then(function(blob) {
                    managerHelpers.addLog('home_banner_save', session.username, 'Updated HOME banner data');
                    sendJSON(res, 200, { success: true, url: blob.url });
                }).catch(function(putErr) {
                    sendJSON(res, 500, { success: false, error: 'Failed to save: ' + putErr.message });
                });
        });
    });
}

function handleManagerSettings(req, res) {
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'POST, OPTIONS'); return; }
    if (req.method !== 'POST') { sendJSON(res, 405, { success: false, error: 'Method not allowed' }); return; }

    parseBody(req, function(err, body) {
        if (err) { sendJSON(res, 400, { success: false, error: err.message }); return; }
        var requiredSession = body.sessionToken;
        if (!requiredSession) { sendJSON(res, 401, { success: false, error: 'No session token' }); return; }

        managerHelpers.verifySessionToken(requiredSession, function(err2, session) {
            if (err2) { sendJSON(res, 401, { success: false, error: err2 }); return; }

            if (body && Object.keys(body).length > 1 && body.mode !== 'read') {
                storage.readJSON('settings.json', function(err3, existing) {
                    if (err3) existing = {};
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
                    if (body.footerBackground !== undefined) settings.footerBackground = body.footerBackground;
                    if (body.footerTextColor !== undefined) settings.footerTextColor = body.footerTextColor;

                    storage.writeJSON('settings.json', settings, function(err4) {
                        if (err4) { sendJSON(res, 500, { success: false, error: 'Failed to save settings' }); return; }
                        managerHelpers.addLog('settings_update', session.username, 'Updated site settings');
                        sendJSON(res, 200, { success: true, settings: settings });
                    });
                });
            } else {
                storage.readJSON('settings.json', function(err3, settings) {
                    if (err3) { sendJSON(res, 500, { success: false, error: 'Failed to read settings' }); return; }
                    sendJSON(res, 200, { success: true, settings: settings });
                });
            }
        });
    });
}

// ========== Main Router ==========

module.exports = function(req, res) {
    var path = req.url.split('?')[0];

    // Remove leading /api/ prefix to get the sub-path
    var route = path.replace(/^\/api\//, '');

    var routeMap = {
        'auth/send-code': handleAuthSendCode,
        'auth/verify-code': handleAuthVerifyCode,
        'auth/login': handleAuthLogin,
        'data/home-banner': handleDataHomeBanner,
        'data/disc': handleDataDisc,
        'manager/verify-pin': handleManagerVerifyPin,
        'manager/verify-design-pin': handleManagerVerifyDesignPin,
        'manager/set-pin': handleManagerSetPin,
        'manager/check-session': handleManagerCheckSession,
        'manager/upload': handleManagerUpload,
        'manager/disc-upload': handleManagerDiscUpload,
        'manager/disc-save': handleManagerDiscSave,
        'manager/home-banner-save': handleManagerHomeBannerSave,
        'manager/settings': handleManagerSettings
    };

    var handler = routeMap[route];
    if (handler) {
        handler(req, res);
    } else {
        sendJSON(res, 404, { success: false, error: 'Unknown API endpoint: ' + route });
    }
};