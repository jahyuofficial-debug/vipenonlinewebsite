var https = require('https');
process.env.BLOB_STORE_ID = process.env.vipen_STORE_ID || process.env.BLOB_STORE_ID;
process.env.BLOB_READ_WRITE_TOKEN = process.env.vipen_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
process.env.BLOB_WEBHOOK_PUBLIC_KEY = process.env.vipen_WEBHOOK_PUBLIC_KEY || process.env.BLOB_WEBHOOK_PUBLIC_KEY;
var { list } = require('@vercel/blob');

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
}

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

function handleDataHomeBanner(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }

    list({ prefix: 'data/home-banner.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }
        var blob = response.blobs[0];
        https.get(blob.url, function(blobRes) {
            var data = '';
            blobRes.on('data', function(chunk) { data += chunk; });
            blobRes.on('end', function() {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
        }).on('error', function() {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch blob' }));
        });
    }).catch(function() {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to list blobs' }));
    });
}

function handleDataDisc(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }

    list({ prefix: 'data/disc.json' }).then(function(response) {
        if (!response.blobs || response.blobs.length === 0) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Not found' }));
            return;
        }
        var blob = response.blobs[0];
        https.get(blob.url, function(blobRes) {
            var data = '';
            blobRes.on('data', function(chunk) { data += chunk; });
            blobRes.on('end', function() {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
            });
        }).on('error', function() {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch blob' }));
        });
    }).catch(function() {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to list blobs' }));
    });
}

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action;

    switch (action) {
        case 'disc':
            handleDataDisc(req, res);
            break;
        case 'home-banner':
            handleDataHomeBanner(req, res);
            break;
        default:
            sendJSON(res, 404, { error: 'Not found', message: 'Unknown action: ' + (action || 'none') });
    }
};