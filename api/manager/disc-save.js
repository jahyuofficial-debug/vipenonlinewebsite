var helpers = require('../../lib/manager-helpers');
var { put } = require('@vercel/blob');

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

        helpers.verifySessionToken(body.sessionToken, function(sessErr, session) {
            if (sessErr) {
                helpers.sendJSON(res, 401, { success: false, error: sessErr });
                return;
            }

            var data = body.data;
            if (!data) {
                helpers.sendJSON(res, 400, { success: false, error: 'No data provided' });
                return;
            }

            var json = JSON.stringify(data, null, 2);
            put('data/disc.json', json, {
                access: 'public',
                contentType: 'application/json',
                addRandomSuffix: false
            }).then(function(blob) {
                helpers.addLog('disc_save', session.username, 'Updated disc track data');
                helpers.sendJSON(res, 200, { success: true, url: blob.url });
            }).catch(function(putErr) {
                helpers.sendJSON(res, 500, { success: false, error: 'Failed to save disc data: ' + putErr.message });
            });
        });
    });
};