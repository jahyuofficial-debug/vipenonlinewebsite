var helpers = require('./helpers');

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

        var sessionToken = body.sessionToken;
        if (!sessionToken) {
            helpers.sendJSON(res, 401, { success: false, error: 'No session token' });
            return;
        }

        helpers.verifySessionToken(sessionToken, function(err2, session) {
            if (err2) {
                helpers.sendJSON(res, 401, { success: false, error: err2 });
                return;
            }
            helpers.sendJSON(res, 200, {
                success: true,
                username: session.username,
                email: session.email
            });
        });
    });
};