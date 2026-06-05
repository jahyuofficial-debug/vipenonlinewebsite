var { list } = require('@vercel/blob');
var https = require('https');

module.exports = function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.end();
        return;
    }

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
};