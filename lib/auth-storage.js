var fs = require('fs');
var path = require('path');

var DATA_DIR = path.join('/tmp', 'data', 'manager');
var USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDir() {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e) {}
}

function readUsers(callback) {
    ensureDir();
    fs.readFile(USERS_FILE, 'utf8', function(err, raw) {
        if (err) {
            var fallbackPath = path.join(process.cwd(), 'data', 'manager', 'users.json');
            fs.readFile(fallbackPath, 'utf8', function(err2, raw2) {
                if (err2) {
                    callback(null, []);
                    return;
                }
                try {
                    callback(null, JSON.parse(raw2));
                } catch(e) {
                    callback(null, []);
                }
            });
            return;
        }
        try {
            callback(null, JSON.parse(raw));
        } catch(e) {
            callback(null, []);
        }
    });
}

function writeUsers(users, callback) {
    ensureDir();
    var json = JSON.stringify(users, null, 2);
    fs.writeFile(USERS_FILE, json, 'utf8', function(err) {
        if (err) { console.error('[STORAGE] writeUsers failed:', err.message); }
        if (callback) callback(err);
    });
}

module.exports = { readUsers: readUsers, writeUsers: writeUsers };