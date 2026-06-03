var storage = require('./storage');
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

        var requiredSession = body.sessionToken;
        if (!requiredSession) {
            helpers.sendJSON(res, 401, { success: false, error: 'No session token' });
            return;
        }

        helpers.verifySessionToken(requiredSession, function(err2, session) {
            if (err2) {
                helpers.sendJSON(res, 401, { success: false, error: err2 });
                return;
            }

            if (body && Object.keys(body).length > 1 && body.mode !== 'read') {
                storage.readJSON('settings.json', function(err3, existing) {
                    if (err3) existing = {};
                    var settings = existing;
                    if (body.contact !== undefined) settings.contact = body.contact;
                    if (body.title !== undefined) settings.title = body.title;
                    if (body.rights !== undefined) settings.rights = body.rights;
                    if (body.siteName !== undefined) settings.siteName = body.siteName;
                    if (body.siteLogo !== undefined) settings.siteLogo = body.siteLogo;
                    if (body.homeBanner !== undefined) settings.homeBanner = body.homeBanner;
                    if (body.footerContent !== undefined) settings.footerContent = body.footerContent;
                    if (body.contactEmail !== undefined) settings.contactEmail = body.contactEmail;
                    if (body.contactInfo !== undefined) settings.contactInfo = body.contactInfo;
                    if (body.siteAnnouncement !== undefined) settings.siteAnnouncement = body.siteAnnouncement;
                    if (body.socials !== undefined) settings.socials = body.socials;
                    if (body.extraBarFontStyle !== undefined) settings.extraBarFontStyle = body.extraBarFontStyle;
                    if (body.extraBarItalic !== undefined) settings.extraBarItalic = body.extraBarItalic;
                    if (body.footerBackground !== undefined) settings.footerBackground = body.footerBackground;
                    if (body.footerTextColor !== undefined) settings.footerTextColor = body.footerTextColor;

                    storage.writeJSON('settings.json', settings, function(err4) {
                        if (err4) {
                            helpers.sendJSON(res, 500, { success: false, error: 'Failed to save settings' });
                            return;
                        }
                        helpers.addLog('settings_update', session.username, 'Updated site settings');
                        helpers.sendJSON(res, 200, { success: true, settings: settings });
                    });
                });
            } else {
                storage.readJSON('settings.json', function(err3, settings) {
                    if (err3) {
                        helpers.sendJSON(res, 500, { success: false, error: 'Failed to read settings' });
                        return;
                    }
                    helpers.sendJSON(res, 200, { success: true, settings: settings });
                });
            }
        });
    });
};