var crypto = require('crypto');
var bcrypt = require('bcrypt');

var helpers = require('../../lib/auth-helpers');
var getAuthSecret = require('../../lib/secret').getAuthSecret;
var getOldAuthSecret = require('../../lib/secret').getOldAuthSecret;
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

        var loginField = (body.email || body.username || '').trim();
        var password = body.password || '';

        if (!loginField || !password) {
            helpers.sendJSON(res, 400, { success: false, error: 'Email/Username and password are required' });
            return;
        }

        if (!helpers.checkRateLimit('login_' + loginField.toLowerCase())) {
            helpers.sendJSON(res, 429, { success: false, error: 'Too many attempts. Please try again later.' });
            return;
        }

        storage.readJSON('users.json', function(readErr, users) {
            if (readErr) users = [];

            function verifyPassword(storedHash, callback) {
                if (storedHash.indexOf('$2') === 0) {
                    bcrypt.compare(password, storedHash, callback);
                    return;
                }
                var newHash = crypto.createHmac('sha256', getAuthSecret())
                    .update(loginField.toLowerCase() + '|' + password).digest('hex');
                var oldSecret = getOldAuthSecret();
                if (storedHash === newHash) {
                    callback(null, true);
                    return;
                }
                if (oldSecret) {
                    var oldHash = crypto.createHmac('sha256', oldSecret)
                        .update(loginField.toLowerCase() + '|' + password).digest('hex');
                    if (storedHash === oldHash) {
                        callback(null, true);
                        return;
                    }
                }
                callback(null, false);
            }

            function findAndVerify(email, callback) {
                var user = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email.toLowerCase()) {
                        user = users[i];
                        break;
                    }
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
                    helpers.sendJSON(res, 200, {
                        success: true,
                        token: token,
                        username: matchedUser.username,
                        email: matchedUser.email,
                        role: helpers.isManagerGoEmail(matchedUser.email) ? 'ManagerGo' : (matchedUser.role || '')
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
                                helpers.sendJSON(res, 200, {
                                    success: true,
                                    token: token,
                                    username: userByUsername.username,
                                    email: userByUsername.email,
                                    role: helpers.isManagerGoEmail(userByUsername.email) ? 'ManagerGo' : (userByUsername.role || '')
                                });
                            } else {
                                helpers.sendJSON(res, 401, { success: false, error: 'Invalid email/username or password' });
                            }
                        });
                        return;
                    }
                }

                helpers.sendJSON(res, 401, { success: false, error: 'Invalid email/username or password' });
            });
        });
    });
};