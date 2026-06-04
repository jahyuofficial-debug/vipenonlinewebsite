var helpers = require('../../lib/auth-helpers');

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
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            helpers.sendJSON(res, 400, { success: false, error: 'Invalid email address' });
            return;
        }

        var code = helpers.generateCode();
        var ts = Date.now();
        var hash = helpers.computeHash(email, code, ts);

        helpers.sendEmailViaResend(email, code, function(err) {
            if (err) {
                console.error('Resend send error:', err.message);
                helpers.sendJSON(res, 500, { success: false, error: 'Failed to send email. Please try again.' });
                return;
            }
            console.log('Verification code sent to', email, '| code:', code);
            helpers.sendJSON(res, 200, { success: true, hash: hash, ts: ts });
        });
    });
};