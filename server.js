var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PORT = 3001;
var ROOT = __dirname;

var MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

http.createServer(function(req, res){
    var uri = url.parse(req.url).pathname;
    var filePath = path.join(ROOT, decodeURIComponent(uri));
    if(filePath.indexOf(ROOT) !== 0){ res.writeHead(403); res.end(); return; }
    if(uri === '/') filePath = path.join(ROOT, 'index.html');

    fs.stat(filePath, function(err, stats){
        if(err){ res.writeHead(404); res.end('Not Found'); return; }

        var ext = path.extname(filePath).toLowerCase();
        var contentType = MIME[ext] || 'application/octet-stream';

        if(req.headers.range){
            var range = req.headers.range;
            var parts = range.replace(/bytes=/, '').split('-');
            var start = parseInt(parts[0], 10);
            var end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            var chunkSize = end - start + 1;

            res.writeHead(206, {
                'Content-Range': 'bytes ' + start + '-' + end + '/' + stats.size,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType
            });

            var stream = fs.createReadStream(filePath, {start: start, end: end});
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': stats.size,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });
}).listen(PORT, function(){
    console.log('Server running at http://localhost:' + PORT);
});
