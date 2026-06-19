/**
 * Design Auto-Uploader — Vipen2.0 (Simplified)
 *
 * Usage:
 *   node scripts/design-add.js "D:/path/to/07-My Project/"
 *
 * The folder should contain:
 *   card-bg.png       — 卡牌正面背景
 *   card-hover.png    — 悬停展开背景
 *   header-bg.png     — 详情页大图
 *   content-1.png     — 内容图 (content-2.png, content-3.png ... 可多张)
 *   meta.txt           — 作品信息 (见下方格式)
 *
 * meta.txt 格式 (一行一条，等号分隔):
 *   title=作品名
 *   cat=Brand Identity
 *   suit=♠
 *   rank=A
 *   desc=作品描述
 *   client=客户名
 *   year=2026
 *   tools=Figma / Blender
 *   tags=tag1, tag2
 *
 * Env vars (一次性设置):
 *   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'design', 'index.json');
const R2_BUCKET = 'pub-541a045d0ee14f489c6d0115be4f5a34';
const R2_BASE = `https://${R2_BUCKET}.r2.dev`;

// ── Read meta.txt ──────────────────────────────────────────
function readMeta(folderPath) {
  const metaPath = path.join(folderPath, 'meta.txt');
  if (!fs.existsSync(metaPath)) {
    console.error('❌ meta.txt not found in folder. Format:');
    console.error('   title=My Work');
    console.error('   cat=Brand Identity');
    console.error('   suit=♠');
    console.error('   rank=A');
    console.error('   desc=Description');
    console.error('   client=Client');
    console.error('   year=2026');
    console.error('   tools=Figma / Blender');
    process.exit(1);
  }
  const meta = {};
  const lines = fs.readFileSync(metaPath, 'utf8').split('\n');
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq > 0) {
      meta[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return meta;
}

// ── Validate required meta fields ──────────────────────────
function validateMeta(meta) {
  const required = ['title', 'cat', 'suit', 'rank', 'desc', 'client', 'year', 'tools'];
  const missing = required.filter(k => !meta[k]);
  if (missing.length) {
    console.error('❌ meta.txt missing fields:', missing.join(', '));
    process.exit(1);
  }
}

// ── Find images in folder ──────────────────────────────────
function findImages(folderPath) {
  const files = fs.readdirSync(folderPath);
  const images = {};
  for (const f of files) {
    if (/\.png$/i.test(f)) images[f] = path.join(folderPath, f);
  }
  // Check required images
  const required = ['card-bg.png', 'card-hover.png', 'header-bg.png', 'content-1.png'];
  for (const r of required) {
    if (!images[r]) {
      console.error(`❌ Missing required image: ${r}`);
      process.exit(1);
    }
  }
  return images;
}

// ── Determine next workId ──────────────────────────────────
function nextWorkId(existing) {
  let maxNum = 0;
  for (const w of existing) {
    const m = (w.workId || '').match(/work(\d+)/);
    if (m) maxNum = Math.max(maxNum, +m[1]);
  }
  const n = maxNum + 1;
  return `work${String(n).padStart(2, '0')}`;
}

// ── Auto-upload to R2 via S3 API ───────────────────────────
async function uploadAll(folderName, images) {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!accessKeyId || !secretAccessKey || !accountId) return false;

  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  let count = 0;
  for (const [filename, filePath] of Object.entries(images)) {
    try {
      const key = `${folderName}/${filename}`;
      await client.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fs.readFileSync(filePath),
        ContentType: 'image/png',
      }));
      console.log(`  ✅ ${filename}`);
      count++;
    } catch (err) {
      console.error(`  ❌ ${filename}:`, err.message);
    }
  }
  if (count > 0) console.log(`\n📤 ${count} files uploaded to R2`);
  return count > 0;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
(async () => {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error('Usage: node scripts/design-add.js "D:/path/to/07-My Project/"');
    console.error('');
    console.error('The folder must contain:');
    console.error('  meta.txt        — 作品元信息');
    console.error('  card-bg.png     — 卡牌正面');
    console.error('  card-hover.png  — 悬停展开');
    console.error('  header-bg.png   — 详情大图');
    console.error('  content-1.png   — 内容图');
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found: ${folderPath}`);
    process.exit(1);
  }

  const folderName = path.basename(folderPath);
  const meta = readMeta(folderPath);
  validateMeta(meta);

  const images = findImages(folderPath);
  const imageFiles = Object.keys(images).sort();

  console.log(`\n📁 ${folderName}`);
  console.log(`   ${Object.keys(images).length} images found: ${imageFiles.join(', ')}`);
  console.log(`   Title: ${meta.title}`);
  console.log(`   Cat:   ${meta.cat}`);

  // Upload to R2
  const uploaded = await uploadAll(folderName, images);
  if (!uploaded) {
    console.log('\n⚠️  R2 credentials not set — upload skipped.');
    console.log('   Set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY to enable auto-upload.');
    console.log('   Upload manually: Cloudflare Dashboard → R2 → create folder → drag images');
  }

  // Read existing index.json
  const existing = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const workId = nextWorkId(existing);

  const contentImages = imageFiles
    .filter(f => /^content-\d+\.png$/i.test(f))
    .map(f => `${R2_BASE}/${folderName}/${f}`);

  const entry = {
    folder: folderName,
    workId,
    cat: meta.cat,
    suit: meta.suit,
    rank: meta.rank,
    likeCount: 0,
    cardBg: `${R2_BASE}/${folderName}/card-bg.png`,
    cardHoverBg: `${R2_BASE}/${folderName}/card-hover.png`,
    headerBg: `${R2_BASE}/${folderName}/header-bg.png`,
    contentImages,
    title: meta.title,
    description: meta.desc,
    client: meta.client,
    published: meta.year,
    tools: meta.tools,
    tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
  };

  // Append to index.json
  existing.push(entry);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(existing, null, 2), 'utf8');

  console.log(`\n📋 design/index.json ← ${entry.title}`);
  console.log(`   ${existing.length} works total`);

  // Git commit
  try {
    const { execSync } = require('child_process');
    execSync(`git add design/index.json && git commit -m "design: add ${entry.title}"`, {
      cwd: ROOT, stdio: 'pipe'
    });
    console.log('\n✅ Git committed');
    console.log('   Run `git push` to deploy.');
  } catch (e) {
    console.log('\n   (git commit skipped — check manually)');
  }
})();
