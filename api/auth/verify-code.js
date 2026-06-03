var crypto = require('crypto');

var getAuthSecret = require('../../lib/secret').getAuthSecret;
var storage = require('../../lib/auth-storage');
var readUsers = storage.readUsers;
var writeUsers = storage.writeUsers;
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

        var hmac = crypto.createHmac('sha256', getAuthSecret());
        hmac.update(email + '|' + code + '|' + ts);
        var expectedHash = hmac.digest('hex');

        if (expectedHash !== hash) {
            sendJSON(res, 400, { success: false, error: 'Invalid verification code' });
            return;
        }

        var username = body.username || email.split('@')[0];
        var password = body.password || '';

        if (password) {
            var hmacPwd = crypto.createHmac('sha256', getAuthSecret());
            hmacPwd.update(email + '|' + password);
            var passwordHash = hmacPwd.digest('hex');

            readUsers(function(readErr, users) {
                if (readErr) users = [];

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
                        role: 'Viper',
                        passwordHash: passwordHash,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    });
                }

                writeUsers(users, function() {
                    var token = generateToken(email);
                    var role = existingIdx >= 0 ? users[existingIdx].role : 'Viper';
                    sendJSON(res, 200, {
                        success: true,
                        token: token,
                        username: username,
                        email: email,
                        role: role
                    });
                });
            });
        } else {
            var token = generateToken(email);
            sendJSON(res, 200, {
                success: true,
                token: token,
                username: username,
                email: email
            });
        }
    });
};
