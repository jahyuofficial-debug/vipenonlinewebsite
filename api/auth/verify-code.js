var bcrypt = require('bcrypt');

var helpers = require('../../lib/auth-helpers');
var generateToken = require('../../lib/secret').generateToken;
var storage = require('../../lib/manager-storage');

var BCRYPT_ROUNDS = 12;

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
        helpers.sendJSON(res, 405, { success: false, error: 'Method not allowed' });
        return;
    }

    helpers.parseBody(req, function(err, body) {
        if (err) {
            helpers.sendJSON(res, 400, { success: false, error: err.message });
            return;
        }

        var email = (body.email || '').trim();
        var code = (body.code || '').trim();
        var hash = (body.hash || '').trim();
        var ts = parseInt(body.ts, 10) || 0;

        if (!email || !code) {
            helpers.sendJSON(res, 400, { success: false, error: 'Email and code are required' });
            return;
        }

        if (!helpers.verifyHash(email, code, ts, hash)) {
            helpers.sendJSON(res, 400, { success: false, error: 'Invalid or expired verification code' });
            return;
        }

        var username = body.username || email.split('@')[0];
        var password = body.password || '';

        function respondWithToken(tokenEmail, tokenUsername, tokenRole) {
            var token = generateToken(tokenEmail, tokenUsername, tokenRole);
            helpers.sendJSON(res, 200, {
                success: true,
                token: token,
                username: tokenUsername,
                email: tokenEmail,
                role: tokenRole
            });
        }

        if (password) {
            bcrypt.hash(password, BCRYPT_ROUNDS, function(bcryptErr, passwordHash) {
                if (bcryptErr) {
                    helpers.sendJSON(res, 500, { success: false, error: 'Server error' });
                    return;
                }

                storage.readJSON('users.json', function(readErr, users) {
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
                            role: helpers.isManagerGoEmail(email) ? 'ManagerGo' : 'Viper',
                            passwordHash: passwordHash,
                            status: 'active',
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString()
                        });
                    }

                    storage.writeJSON('users.json', users, function() {
                        var existing = existingIdx >= 0 ? users[existingIdx] : null;
                        var role = existing ? existing.role : (helpers.isManagerGoEmail(email) ? 'ManagerGo' : 'Viper');
                        respondWithToken(email, username, role);
                    });
                });
            });
        } else {
            storage.readJSON('users.json', function(readErr, users) {
                if (readErr) users = [];
                var existingUser = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email.toLowerCase()) {
                        existingUser = users[i];
                        break;
                    }
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
};