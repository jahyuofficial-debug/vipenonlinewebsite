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

        var pin = body.pin || '';

        if (!pin) {
            helpers.sendJSON(res, 400, { success: false, error: 'PIN is required' });
            return;
        }

        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            helpers.sendJSON(res, 400, { success: false, error: 'PIN must be 6 digits' });
            return;
        }

        var newHash = helpers.hashPIN(pin);

        storage.readJSON('design-pin.json', function(err2, designPin) {
            if (err2 || !designPin) {
                helpers.sendJSON(res, 500, { success: false, error: 'Server error' });
                return;
            }

            if (designPin.pin_hash === newHash) {
                helpers.sendJSON(res, 200, { success: true });
            } else {
                helpers.sendJSON(res, 401, { success: false, error: 'Invalid PIN' });
            }
        });
    });
};