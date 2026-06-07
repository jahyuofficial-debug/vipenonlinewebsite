var fs = require('fs');
var path = require('path');

var DATA_DIR = path.join('/tmp', 'data', 'manager');
var ROOT_DATA_DIR = path.join(process.cwd(), 'data', 'manager');

function ensureDir() {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch(e) {}
}

function readJSON(filename, callback) {
    var tmpPath = path.join(DATA_DIR, filename);
    ensureDir();
    fs.readFile(tmpPath, 'utf8', function(err, raw) {
        if (!err) {
            try { callback(null, JSON.parse(raw)); } catch(e) { callback(e); }
            return;
        }
        var srcPath = path.join(ROOT_DATA_DIR, filename);
        fs.readFile(srcPath, 'utf8', function(err2, raw2) {
            if (err2) { callback(err2); return; }
            try { callback(null, JSON.parse(raw2)); } catch(e) { callback(e); }
        });
    });
}

function writeJSON(filename, data, callback) {
    var tmpPath = path.join(DATA_DIR, filename);
    ensureDir();
    var json = JSON.stringify(data, null, 2);
    fs.writeFile(tmpPath, json, 'utf8', function(err) {
        if (callback) callback(err);
    });
}

function readRootJSON(filename, callback) {
    var fp = path.join(process.cwd(), 'data', filename);
    fs.readFile(fp, 'utf8', function(err, raw) {
        if (err) { callback(err); return; }
        try { callback(null, JSON.parse(raw)); } catch(e) { callback(e); }
    });
}

function writeRootJSON(filename, data, callback) {
    var fp = path.join('/tmp', filename);
    var dir = path.dirname(fp);
    try { fs.mkdirSync(dir, { recursive: true }); } catch(e) {}
    var json = JSON.stringify(data, null, 2);
    fs.writeFile(fp, json, 'utf8', function(err) {
        if (callback) callback(err);
    });
}

var blobPut = null;
try { blobPut = require('@vercel/blob').put; } catch (e) { blobPut = null; }
var blobList = null;
try { blobList = require('@vercel/blob').list; } catch (e) { blobList = null; }

function readFromBlob(key, callback) {
    if (!blobList) { callback(new Error('Blob not available')); return; }
    blobList({ prefix: 'data/manager/' + key }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            callback(new Error('Not found'));
            return;
        }
        var blob = response.blobs[0];
        fetch(blob.url)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(data) {
                try { callback(null, JSON.parse(data)); } catch(e) { callback(e); }
            })
            .catch(function(e) { callback(e); });
    }).catch(function(e) { callback(e); });
}

function writeToBlob(key, data, callback) {
    if (!blobPut) { if (callback) callback(new Error('Blob not available')); return; }
    var json = JSON.stringify(data, null, 2);
    blobPut('data/manager/' + key, json, { access: 'public', contentType: 'application/json', allowOverwrite: true })
        .then(function() { if (callback) callback(null); })
        .catch(function(e) { if (callback) callback(e); });
}

function readUserDataFromBlob(userId, key, callback) {
    if (!blobList) { callback(new Error('Blob not available')); return; }
    blobList({ prefix: 'user-data/' + userId + '/' + key + '.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            callback(new Error('Not found'));
            return;
        }
        var blob = response.blobs[0];
        fetch(blob.url)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(data) {
                try { callback(null, JSON.parse(data)); } catch(e) { callback(e); }
            })
            .catch(function(e) { callback(e); });
    }).catch(function(e) { callback(e); });
}

function writeUserDataToBlob(userId, key, data, callback) {
    if (!blobPut) { if (callback) callback(new Error('Blob not available')); return; }
    var json = JSON.stringify(data, null, 2);
    blobPut('user-data/' + userId + '/' + key + '.json', json, { access: 'public', contentType: 'application/json', allowOverwrite: true })
        .then(function() { if (callback) callback(null); })
        .catch(function(e) { if (callback) callback(e); });
}

module.exports = {
    readJSON: readJSON,
    writeJSON: writeJSON,
    readRootJSON: readRootJSON,
    writeRootJSON: writeRootJSON,
    readFromBlob: readFromBlob,
    writeToBlob: writeToBlob,
    readUserDataFromBlob: readUserDataFromBlob,
    writeUserDataToBlob: writeUserDataToBlob
};