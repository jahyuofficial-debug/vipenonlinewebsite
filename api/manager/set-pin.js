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
        var oldPin = body.oldPin || '';
        var newPin = body.newPin || '';

        if (!email || !oldPin || !newPin) {
            helpers.sendJSON(res, 400, { success: false, error: 'All fields are required' });
            return;
        }
        if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            helpers.sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }

        storage.readJSON('users.json', function(err2, users) {
            if (err2) { helpers.sendJSON(res, 500, { success: false, error: 'Server error' }); return; }

            var user = null;
            for (var i = 0; i < users.length; i++) {
                if (users[i].email.toLowerCase() === email && users[i].role === 'ManagerGo') {
                    user = users[i]; break;
                }
            }
            if (!user) {
                helpers.sendJSON(res, 403, { success: false, error: 'Access denied' });
                return;
            }

            storage.readJSON('pins.json', function(err3, pins) {
                if (err3) { helpers.sendJSON(res, 500, { success: false, error: 'Server error' }); return; }

                var pinRecord = null;
                for (var j = 0; j < pins.length; j++) {
                    if (pins[j].user_id === user.id) { pinRecord = pins[j]; break; }
                }

                var oldPinHash = helpers.hashPIN(oldPin);
                var oldSecret = getOldAuthSecret();
                var oldPinHashOld = oldSecret ? crypto.createHmac('sha256', oldSecret).update('manager_pin_' + oldPin).digest('hex') : null;

                var pinValid = (pinRecord && pinRecord.pin_hash === oldPinHash);
                if (!pinValid && oldPinHashOld && pinRecord && pinRecord.pin_hash === oldPinHashOld) {
                    pinValid = true;
                }

                if (!pinValid) {
                    helpers.sendJSON(res, 401, { success: false, error: pinRecord ? 'Current PIN is incorrect' : 'PIN not set up' });
                    return;
                }

                if (pinRecord) {
                    pinRecord.pin_hash = helpers.hashPIN(newPin);
                    pinRecord.updated_at = new Date().toISOString();
                } else {
                    pins.push({
                        user_id: user.id,
                        pin_hash: helpers.hashPIN(newPin),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                }
                storage.writeJSON('pins.json', pins, function() {
                    helpers.sendJSON(res, 200, { success: true });
                });
            });
        });
    });
};