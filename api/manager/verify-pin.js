var crypto = require('crypto');

var getAuthSecret = require('../../lib/secret').getAuthSecret;
var getOldAuthSecret = require('../../lib/secret').getOldAuthSecret;
var storage = require('../../lib/manager-storage');
var helpers = require('../../lib/manager-helpers');

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

        var email = (body.email || '').toLowerCase().trim();
        var pin = body.pin || '';

        if (!email) {
            helpers.sendJSON(res, 400, { success: false, error: 'Email is required' });
            return;
        }
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            helpers.sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }

        var newHash = helpers.hashPIN(pin);
        var oldSecret = getOldAuthSecret();
        var oldHash = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + pin).digest('hex') : null;

        storage.readJSON('pins.json', function(err2, pins) {
            if (err2) { helpers.sendJSON(res, 500, { success: false, error: 'Server error' }); return; }

            storage.readJSON('users.json', function(err3, users) {
                if (err3) { helpers.sendJSON(res, 500, { success: false, error: 'Server error' }); return; }

                var user = null;
                for (var i = 0; i < users.length; i++) {
                    if (users[i].email.toLowerCase() === email) { user = users[i]; break; }
                }

                if (!user) {
                    helpers.sendJSON(res, 404, { success: false, error: 'User not found' });
                    return;
                }

                var pinRecord = null;
                for (var j = 0; j < pins.length; j++) {
                    if (pins[j].user_id === user.id) { pinRecord = pins[j]; break; }
                }

                if (!pinRecord) {
                    helpers.sendJSON(res, 400, { success: false, error: 'PIN not set up' });
                    return;
                }

                if (pinRecord.pin_hash === newHash) {
                    helpers.addLog('admin_login', user.username, 'ManagerGo admin logged in via PIN', function() {
                        var sessionToken = helpers.createSessionToken(user);
                        helpers.sendJSON(res, 200, {
                            success: true,
                            sessionToken: sessionToken,
                            username: user.username,
                            email: user.email
                        });
                    });
                    return;
                }

                if (oldHash && pinRecord.pin_hash === oldHash) {
                    pinRecord.pin_hash = newHash;
                    storage.writeJSON('pins.json', pins, function() {
                        helpers.addLog('admin_login', user.username, 'ManagerGo admin logged in via PIN (hash migrated)', function() {
                            var sessionToken = helpers.createSessionToken(user);
                            helpers.sendJSON(res, 200, {
                                success: true,
                                sessionToken: sessionToken,
                                username: user.username,
                                email: user.email
                            });
                        });
                    });
                    return;
                }

                helpers.sendJSON(res, 401, { success: false, error: 'Invalid PIN' });
            });
        });
    });
};