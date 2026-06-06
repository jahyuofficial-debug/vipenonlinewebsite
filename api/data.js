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

module.exports = function(req, res) {
    var url = require('url');
    var parsed = url.parse(req.url, true);
    var action = parsed.query.action;

    if (req.method === 'OPTIONS') {
        handleOptions(req, res, 'GET, OPTIONS');
        return;
    }

    sendJSON(res, 503, { error: 'Service unavailable', message: 'Storage backend not configured' });
};
