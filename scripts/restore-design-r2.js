// Rebuild R2 design/index.json from captured original data, only fix cardBg
var { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

var data = [
  {
    "folder": "Magsafe Power Bank",
    "workId": "work08",
    "cat": "Graphic Design",
    "likeCount": 0,
    "cardBg": "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/card-bg.png",
    "cardHoverBg": "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/card-hover.png",
    "headerBg": "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/header-bg.png",
    "contentImages": [
      "https://youtu.be/LgGI3rCX_aM",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/content-1-1782047451197.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-8.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-3.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-14.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-15.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-13.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-9.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-10.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-2.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-12.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-11.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-6.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-4.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-5.png",
      "https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/Magsafe%20Power%20Bank/content-7.png"
    ],
    "title": "Magsafe Power Bank",
    "subtitle": "Y2K Style Design",
    "description": "Seamlessly merges advanced engineering with a bold avant-garde aesthetic.",
    "client": "Jah72",
    "published": "2026",
    "tools": "PS / AI / Figma / Nano / GPT",
    "spacing": "medium",
    "descPosition": "bottom",
    "tags": ["Graphic", "Product", "Visual", "EC"]
  }
];

var json = JSON.stringify(data, null, 2);
console.log('Rebuilding with:');
console.log('  subtitle: ' + data[0].subtitle);
console.log('  descPosition: ' + data[0].descPosition);
console.log('  contentImages count: ' + data[0].contentImages.length + ' (first: ' + data[0].contentImages[0].substring(0,30) + '...)');
console.log('  cardBg: ' + data[0].cardBg);

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
    Body: json,
    ContentType: 'application/json',
})).then(function() {
    console.log('\nDone! Restored to original data with cardBg fixed.');
}).catch(function(err) {
    console.error('Failed:', err.message);
});
