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

module.exports = {
    readJSON: readJSON,
    writeJSON: writeJSON,
    readRootJSON: readRootJSON,
    writeRootJSON: writeRootJSON
};