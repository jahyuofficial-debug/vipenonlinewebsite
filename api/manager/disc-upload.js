var helpers = require('../../lib/manager-helpers');
var { put } = require('@vercel/blob');

function parseMultipart(req, callback) {
    var contentType = req.headers['content-type'] || '';
    var match = contentType.match(/boundary=(.+)$/);
    if (!match) {
        callback(new Error('No boundary found'));
        return;
    }

    var boundary = '--' + match[1];
    var totalSize = 0;
    var MAX_SIZE = 60 * 1024 * 1024;
    var chunks = [];

    req.on('data', function(chunk) {
        totalSize += chunk.length;
        if (totalSize > MAX_SIZE) {
            req.destroy();
            return;
        }
        chunks.push(chunk);
    });

    req.on('end', function() {
        if (totalSize > MAX_SIZE) {
            callback(new Error('File too large (max 60MB)'));
            return;
        }

        var buffer = Buffer.concat(chunks);
        var str = buffer.toString('binary');
        var parts = str.split(boundary);
        var fields = {};
        var files = [];

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.indexOf('Content-Disposition') === -1) continue;

            var headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd === -1) continue;
            var header = part.substring(0, headerEnd);

            var nameMatch = header.match(/name="([^"]+)"/);
            var filenameMatch = header.match(/filename="([^"]+)"/);
            if (!nameMatch) continue;

            var bodyStart = headerEnd + 4;
            var bodyEnd = part.lastIndexOf('\r\n');
            if (bodyEnd === -1) bodyEnd = part.length;
            var bodyStr = part.substring(bodyStart, bodyEnd);

            if (filenameMatch) {
                files.push({
                    filename: filenameMatch[1].replace(/[\\/:*?"<>|]/g, '_'),
                    body: bodyStr
                });
            } else {
                fields[nameMatch[1]] = bodyStr.trim();
            }
        }

        callback(null, fields, files);
    });
}

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

    parseMultipart(req, function(err, fields, files) {
        if (err) {
            helpers.sendJSON(res, 400, { success: false, error: err.message });
            return;
        }

        helpers.verifySessionToken(fields.sessionToken, function(sessErr, session) {
            if (sessErr) {
                helpers.sendJSON(res, 401, { success: false, error: sessErr });
                return;
            }

            var uploadedFiles = [];
            var albumDir = (fields.albumDir || 'Unknown').replace(/[\\/:*?"<>|]/g, '_').trim();
            var pending = files.length;

            if (pending === 0) {
                helpers.sendJSON(res, 400, { success: false, error: 'No files uploaded' });
                return;
            }

            function done() {
                if (uploadedFiles.length > 0) {
                    helpers.addLog('disc_upload', session.username, 'Uploaded ' + uploadedFiles.length + ' disc file(s) to Blob');
                }
                helpers.sendJSON(res, 200, { success: true, files: uploadedFiles });
            }

            for (var i = 0; i < files.length; i++) {
                (function(f) {
                    var blobPath = 'disc/' + albumDir + '/' + Date.now() + '_' + f.filename;
                    var buffer = Buffer.from(f.body, 'binary');
                    put(blobPath, buffer, {
                        access: 'public',
                        contentType: getContentType(f.filename)
                    }).then(function(blob) {
                        uploadedFiles.push({ name: f.filename, path: blob.url });
                        pending--;
                        if (pending === 0) done();
                    }).catch(function(e) {
                        pending--;
                        if (pending === 0) done();
                    });
                })(files[i]);
            }
        });
    });
};

function getContentType(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var map = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
        m4a: 'audio/mp4',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif'
    };
    return map[ext] || 'application/octet-stream';
}
