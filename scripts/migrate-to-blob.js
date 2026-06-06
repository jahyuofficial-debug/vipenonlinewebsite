var fs = require('fs');
var path = require('path');
process.env.BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || process.env.vipen_READ_WRITE_TOKEN;
var { put } = require('@vercel/blob');

var ROOT = path.join(__dirname, '..');

var files = [
    { local: 'data/disc.json', blob: 'data/disc.json', name: 'Disc' },
    { local: 'data/home-banner.json', blob: 'data/home-banner.json', name: 'Banner' }
];

var pending = files.length;

files.forEach(function(f) {
    var filePath = path.join(ROOT, f.local);
    if (!fs.existsSync(filePath)) {
        console.log('[' + f.name + '] File not found: ' + f.local);
        pending--;
        if (pending === 0) process.exit(0);
        return;
    }

    var content = fs.readFileSync(filePath, 'utf8');
    put(f.blob, content, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true
    }).then(function(blob) {
        console.log('[' + f.name + '] Uploaded successfully: ' + blob.url);
        pending--;
        if (pending === 0) process.exit(0);
    }).catch(function(err) {
        console.error('[' + f.name + '] Upload failed: ' + err.message);
        pending--;
        if (pending === 0) process.exit(1);
    });
});