/**
 * Design Auto-Uploader — Vipen2.0
 *
 * Mode A — Full auto (set R2 env vars once):
 *   node scripts/design-add.js --folder "07-My Work" --title "My Work" \\
 *     --cat "Brand Identity" --suit "♠" --rank "A" --desc "..." \\
 *     --client "Client" --year "2026" --tools "Figma / Blender" \\
 *     --images "D:/path/to/images/"
 *
 * Mode B — JSON-only (no credentials):
 *   Same command, generates index.json entry + prints manual upload steps.
 *
 * Env vars for Mode A (get from Cloudflare Dashboard → R2 → API Tokens):
 *   R2_ACCOUNT_ID       — Cloudflare Account ID
 *   R2_ACCESS_KEY_ID    — R2 Access Key ID
 *   R2_SECRET_ACCESS_KEY — R2 Secret Access Key
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'design', 'index.json');
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';

// R2 public bucket name
const R2_BUCKET = 'pub-541a045d0ee14f489c6d0115be4f5a34';
const R2_BASE = `https://${R2_BUCKET}.r2.dev`;

// Required image files for each design work
const REQUIRED_IMAGES = ['card-bg.png', 'card-hover.png', 'header-bg.png', 'content-1.png'];

// ── Parse CLI args ──────────────────────────────────────────
function parseArgs() {
  const args = {};
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].slice(2);
      const val = raw[i + 1] && !raw[i + 1].startsWith('--') ? raw[++i] : 'true';
      args[key] = val;
    }
  }
  return args;
}

// ── Determine next workId ────────────────────────────────────
function nextWorkId(existing) {
  let maxNum = 0;
  for (const w of existing) {
    const m = (w.workId || '').match(/work(\d+)/);
    if (m) maxNum = Math.max(maxNum, +m[1]);
  }
  const n = maxNum + 1;
  return { id: `work${String(n).padStart(2, '0')}`, num: n };
}

// ── Validate image files exist locally ──────────────────────
function validateImages(folderPath, folderName) {
  const results = {};
  const files = fs.readdirSync(folderPath);
  for (const img of REQUIRED_IMAGES) {
    // Match exact filename or prefix match (e.g. "card-bg.png" or "card-bg_01.png")
    const match = files.find(f => f === img || f.startsWith(img.replace('.png', '')));
    if (match) {
      results[img] = path.join(folderPath, match);
    } else {
      console.error(`⚠️  Local image not found: ${folderPath}/${img}`);
      results[img] = null;
    }
  }
  // Also find any extra content-*.png files
  const extraContent = files.filter(f => /^content-\d+\.png$/.test(f) && !results[f]).sort();
  for (const ec of extraContent) {
    results[ec] = path.join(folderPath, ec);
  }
  return results;
}

// ── Upload single file to R2 via S3 API ─────────────────────
async function uploadToR2(client, bucket, key, filePath) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const fileBuffer = fs.readFileSync(filePath);
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: 'image/png',
  });
  await client.send(cmd);
}

// ── Auto-upload all images ──────────────────────────────────
async function autoUpload(imageMap, folderName) {
  const { S3Client } = require('@aws-sdk/client-s3');

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!accessKeyId || !secretAccessKey || !accountId) {
    console.log('ℹ️  R2 credentials not set — skipping auto-upload.');
    console.log('   Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars for full auto.');
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  let uploaded = 0;
  for (const [filename, filePath] of Object.entries(imageMap)) {
    if (!filePath) {
      console.log(`  ⏭️  ${filename} — skipped (not found)`);
      continue;
    }
    const key = `${folderName}/${filename}`;
    try {
      await uploadToR2(client, R2_BUCKET, key, filePath);
      console.log(`  ✅ ${filename} → ${R2_BASE}/${key}`);
      uploaded++;
    } catch (err) {
      console.error(`  ❌ ${filename} failed:`, err.message);
    }
  }
  console.log(`\n📤 Uploaded ${uploaded} files to R2`);
  return uploaded;
}

// ── Print manual instructions ───────────────────────────────
function printManualSteps(folderName, entry) {
  console.log('\n📤 Upload images to R2 manually:');
  console.log(`   Bucket: ${R2_BUCKET}`);
  console.log(`   Folder: ${folderName}/`);
  console.log('');
  console.log('   Cloudflare Dashboard → R2 → 创建文件夹 → 拖入图片:');
  for (const img of REQUIRED_IMAGES) {
    console.log(`     ${img}`);
  }
  console.log('');
  console.log('🚀 Then commit:');
  console.log(`   git add design/index.json && git commit -m "design: add ${entry.title}" && git push`);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
(async () => {
  // Read existing
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  } catch (e) {
    console.error('❌ Failed to read design/index.json:', e.message);
    process.exit(1);
  }

  const args = parseArgs();
  const required = ['folder', 'title', 'cat', 'suit', 'rank', 'desc', 'client', 'year', 'tools'];
  const missing = required.filter(k => !args[k]);
  if (missing.length) {
    console.error('❌ Missing required fields:', missing.join(', '));
    console.error('');
    console.error('Usage: node scripts/design-add.js \\');
    console.error('  --folder "07-My Work" --title "My Work" --cat "Brand Identity" \\');
    console.error('  --suit "♠" --rank "A" --desc "Description" \\');
    console.error('  --client "Client" --year "2026" --tools "Figma / Blender" \\');
    console.error('  [--images "D:/path/to/images/"] [--tags "tag1,tag2"]');
    process.exit(1);
  }

  const { id: workId } = nextWorkId(existing);
  const folder = args.folder;

  // Validate images if --images provided
  let imageMap = {};
  let uploaded = false;
  if (args.images) {
    const imagesDir = path.resolve(args.images);
    if (!fs.existsSync(imagesDir)) {
      console.error(`❌ Images directory not found: ${imagesDir}`);
      process.exit(1);
    }
    imageMap = validateImages(imagesDir, folder);
    uploaded = await autoUpload(imageMap, folder);
  }

  // Build entry — only include content images that actually exist / were uploaded
  const contentImages = Object.keys(imageMap)
    .filter(f => f.startsWith('content-'))
    .sort()
    .map(f => `${R2_BASE}/${folder}/${f}`);
  if (contentImages.length === 0) {
    // Fallback: generate 4 default content URLs
    contentImages.push(...[1,2,3,4].map(n => `${R2_BASE}/${folder}/content-${n}.png`));
  }

  const entry = {
    folder,
    workId,
    cat: args.cat,
    suit: args.suit,
    rank: args.rank,
    likeCount: 0,
    cardBg: `${R2_BASE}/${folder}/card-bg.png`,
    cardHoverBg: `${R2_BASE}/${folder}/card-hover.png`,
    headerBg: `${R2_BASE}/${folder}/header-bg.png`,
    contentImages,
    title: args.title,
    description: args.desc,
    client: args.client,
    published: args.year,
    tools: args.tools,
    tags: args.tags ? args.tags.split(',').map(t => t.trim()) : [],
  };

  console.log('\n📋 Design entry:');
  console.log(JSON.stringify(entry, null, 2));

  // Append to index.json
  existing.push(entry);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`\n✅ Added to design/index.json (${existing.length} works total)`);

  // If auto-upload worked, commit automatically
  if (uploaded) {
    const { execSync } = require('child_process');
    try {
      console.log('\n🚀 Auto-committing...');
      execSync(`git add design/index.json && git commit -m "design: add ${entry.title}"`, {
        cwd: ROOT,
        stdio: 'inherit',
      });
      console.log('   Done. Run `git push` to deploy.');
    } catch (e) {
      console.log('   Auto-commit skipped (check git status).');
    }
  } else if (!args.images) {
    printManualSteps(folder, entry);
  }
})();
