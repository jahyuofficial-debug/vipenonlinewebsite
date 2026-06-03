var helpers = require('./helpers');
var fs = require('fs');
var path = require('path');

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

    var contentType = req.headers['content-type'] || '';
    var match = contentType.match(/boundary=(.+)$/);

    if (!match) {
        helpers.sendJSON(res, 400, { success: false, error: 'No boundary found' });
        return;
    }

    var boundary = '--' + match[1];
    var totalSize = 0;
    var MAX_SIZE = 10 * 1024 * 1024;
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
            helpers.sendJSON(res, 413, { success: false, error: 'File too large (max 10MB)' });
            return;
        }

        var buffer = Buffer.concat(chunks);
        var str = buffer.toString('binary');
        var parts = str.split(boundary);
        var uploadedFiles = [];
        var dest = path.join('/tmp', 'uploads');

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
                var filename = filenameMatch[1].replace(/[\\/:*?"<>|]/g, '_');
                fs.mkdirSync(dest, { recursive: true });
                var uniqueName = Date.now() + '_' + filename;
                var destPath = path.join(dest, uniqueName);
                fs.writeFileSync(destPath, Buffer.from(bodyStr, 'binary'), 'binary');
                uploadedFiles.push({
                    name: filename,
                    path: uniqueName
                });
            }
        }

        if (uploadedFiles.length > 0) {
            helpers.sendJSON(res, 200, { success: true, files: uploadedFiles });
        } else {
            helpers.sendJSON(res, 400, { success: false, error: 'No files uploaded' });
        }
    });
};