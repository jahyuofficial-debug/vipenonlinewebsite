// One-shot: upload local design/index.json to R2
var fs = require('fs');
var path = require('path');
var { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

var ROOT = path.join(__dirname, '..');
var idxPath = path.join(ROOT, 'design', 'index.json');

var idx = fs.readFileSync(idxPath, 'utf8');
var data = JSON.parse(idx);
console.log('Local design/index.json: ' + data.length + ' project(s)');
data.forEach(function(d, i) {
    console.log('  [' + i + '] ' + d.title + '  cardBg=' + d.cardBg);
});

var r2 = new S3Client({
    region: 'auto',
    endpoint: 'https://acd0341912fe1a13179c9b78f2b9272a.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: '6cd2bd73fb8c2f2bde7e18cb98341ff6',
        secretAccessKey: '9bd29dae8297cac299f7a2b97adbbf227149afac9ee53356f7c3de3bd43beb7b',
    },
    forcePathStyle: true
});

r2.send(new PutObjectCommand({
    Bucket: 'vipen-design',
    Key: 'design/index.json',
    Body: idx,
    ContentType: 'application/json',
})).then(function() {
    console.log('\nDone! index.json synced to R2.');
}).catch(function(err) {
    console.error('Upload failed:', err.message);
});
