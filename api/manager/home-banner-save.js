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

        helpers.verifySessionToken(body.sessionToken, function(err2, session) {
            if (err2) {
                helpers.sendJSON(res, 401, { success: false, error: err2 });
                return;
            }

            var data = body.data;
            if (!data) {
                helpers.sendJSON(res, 400, { success: false, error: 'No data provided' });
                return;
            }

            var fs = require('fs');
            var path = require('path');
            var fp = path.join('/tmp', 'home-banner.json');
            var json = JSON.stringify(data, null, 2);
            fs.writeFile(fp, json, 'utf8', function(writeErr) {
                if (writeErr) {
                    helpers.sendJSON(res, 500, { success: false, error: 'Failed to save' });
                    return;
                }
                helpers.addLog('home_banner_save', session.username, 'Updated HOME banner data');
                helpers.sendJSON(res, 200, { success: true });
            });
        });
    });
};