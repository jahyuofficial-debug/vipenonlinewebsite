var helpers = require('../../lib/manager-helpers');
var fs = require('fs');
var path = require('path');

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

function sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim();
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
            var albumDir = sanitizeFilename(fields.albumDir || '');
            var destRoot = path.join('/tmp', 'Disc', 'MusicAlbum');

            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                var destDir = path.join(destRoot, albumDir || 'Unknown');
                fs.mkdirSync(destDir, { recursive: true });
                var destPath = path.join(destDir, f.filename);
                fs.writeFileSync(destPath, Buffer.from(f.body, 'binary'), 'binary');
                uploadedFiles.push({ name: f.filename, path: f.filename });
            }

            if (uploadedFiles.length > 0) {
                helpers.addLog('disc_upload', session.username, 'Uploaded ' + uploadedFiles.length + ' disc file(s)');
            }
            helpers.sendJSON(res, 200, { success: true, files: uploadedFiles });
        });
    });
};
