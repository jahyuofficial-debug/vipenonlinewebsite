var fs = require('fs');
var path = require('path');

var ROOT = process.cwd();

function sendJSON(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.end(JSON.stringify(data));
}

function handleOptions(req, res, methods) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods || 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
}

function serveStaticFile(req, res, filePath) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') { handleOptions(req, res, 'GET, OPTIONS'); return; }
    try {
        var data = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
        res.end(data);
    } catch (e) {
        sendJSON(res, 404, { error: 'Not found' });
    }
}

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action;

    switch (action) {
        case 'design':
            serveStaticFile(req, res, 'data/design.json');
            break;
        case 'fresh':
            serveStaticFile(req, res, 'data/fresh.json');
            break;
        case 'settings':
            serveStaticFile(req, res, 'data/manager/settings.json');
            break;
        default:
            sendJSON(res, 404, { error: 'Not found', message: 'Unknown action: ' + (action || 'none') });
    }
};
