var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var getAuthSecret = require('./secret').getAuthSecret;
var getOldAuthSecret = require('./secret').getOldAuthSecret;

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

function readUsers(callback) {
    var fp = path.join(process.cwd(), 'data', 'manager', 'users.json');
    fs.readFile(fp, 'utf8', function(err, raw) {
        if (err) {
            callback(null, []);
            return;
        }
        try {
            callback(null, JSON.parse(raw));
        } catch (e) {
            callback(null, []);
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

        var email = (body.email || '').toLowerCase().trim();
        var password = body.password || '';

        if (!email || !password) {
            sendJSON(res, 400, { success: false, error: 'Email and password are required' });
            return;
        }

        var newHash = crypto.createHmac('sha256', getAuthSecret()).update(email + '|' + password).digest('hex');
        var oldSecret = getOldAuthSecret();

        readUsers(function(readErr, users) {
            if (readErr) {
                sendJSON(res, 500, { success: false, error: 'Server error' });
                return;
            }

            var matchedUser = null;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() !== email) continue;
                if (users[i].passwordHash === newHash) {
                    matchedUser = users[i];
                    break;
                }
                if (oldSecret) {
                    var oldHash = crypto.createHmac('sha256', oldSecret).update(email + '|' + password).digest('hex');
                    if (users[i].passwordHash === oldHash) {
                        matchedUser = users[i];
                        break;
                    }
                }
            }

            if (matchedUser) {
                var token = generateToken(email);
                sendJSON(res, 200, {
                    success: true,
                    token: token,
                    username: matchedUser.username,
                    email: email,
                    role: matchedUser.role || ''
                });
                return;
            }

            sendJSON(res, 401, { success: false, error: 'Invalid email or password' });
        });
    });
};
