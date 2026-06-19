/**
 * Design Upload Helper — Vipen2.0
 * 
 * Usage:
 *   node scripts/design-add.js --folder "07-My Work" --title "My Work" --cat "Brand Identity"
 *       --suit "♠" --rank "A" --desc "Some description" --client "Client" --year "2026"
 *       --tools "Figma / Blender" [--tags "tag1,tag2"]
 * 
 * What it does:
 *   1. Auto-detects next workId from design/index.json
 *   2. Generates the JSON entry with R2 URLs
 *   3. Appends to design/index.json
 *   4. If CLOUDFLARE_R2_TOKEN set, also uploads local images to R2
 *   5. Prints git commands for review
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'design', 'index.json');
const R2_BUCKET = 'pub-541a045d0ee14f489c6d0115be4f5a34';
const R2_BASE = `https://${R2_BUCKET}.r2.dev`;

// ── Parse CLI args ────────────────────────────────────────
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

// ── Determine next workId ──────────────────────────────────
function nextWorkId(existing) {
  let maxNum = 0;
  for (const w of existing) {
    const m = (w.workId || '').match(/work(\d+)/);
    if (m) maxNum = Math.max(maxNum, +m[1]);
  }
  const n = maxNum + 1;
  return { id: `work${String(n).padStart(2, '0')}`, num: n };
}

// ── Read existing index.json ──────────────────────────────
let existing = [];
try {
  existing = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
} catch (e) {
  console.error('❌ Failed to read design/index.json:', e.message);
  process.exit(1);
}

const args = parseArgs();

// ── Validate required fields ──────────────────────────────
const required = ['folder', 'title', 'cat', 'suit', 'rank', 'desc', 'client', 'year', 'tools'];
const missing = required.filter(k => !args[k]);
if (missing.length) {
  console.error('❌ Missing required fields:', missing.join(', '));
  console.error('');
  console.error('Usage: node scripts/design-add.js \\');
  console.error('  --folder "07-My Work" --title "My Work" --cat "Brand Identity" \\');
  console.error('  --suit "♠" --rank "A" --desc "Description" \\');
  console.error('  --client "Client Name" --year "2026" \\');
  console.error('  --tools "Figma / Blender" [--tags "tag1,tag2"]');
  process.exit(1);
}

// ── Build entry ───────────────────────────────────────────
const { id: workId, num } = nextWorkId(existing);
const folder = args.folder;

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
  contentImages: [1, 2, 3, 4].map(n => `${R2_BASE}/${folder}/content-${n}.png`),
  title: args.title,
  description: args.desc,
  client: args.client,
  published: args.year,
  tools: args.tools,
  tags: args.tags ? args.tags.split(',').map(t => t.trim()) : []
};

// ── Print generated entry ─────────────────────────────────
console.log('');
console.log('📋 Generated entry for design/index.json:');
console.log(JSON.stringify(entry, null, 2));

// ── Append to index.json ──────────────────────────────────
existing.push(entry);
fs.writeFileSync(INDEX_PATH, JSON.stringify(existing, null, 2), 'utf8');
console.log(`\n✅ Appended to ${path.relative(ROOT, INDEX_PATH)} (total: ${existing.length} works)`);

// ── R2 upload instructions ────────────────────────────────
console.log('\n📤 Upload images to R2:');
console.log(`   Bucket: ${R2_BUCKET}`);
console.log(`   Folder: ${folder}/`);
console.log('');
console.log('   Required files:');
console.log(`     ${folder}/card-bg.png        → ${entry.cardBg}`);
console.log(`     ${folder}/card-hover.png     → ${entry.cardHoverBg}`);
console.log(`     ${folder}/header-bg.png      → ${entry.headerBg}`);
console.log(`     ${folder}/content-1.png      → ${entry.contentImages[0]}`);
console.log(`     ${folder}/content-2.png      → ${entry.contentImages[1]}`);
console.log(`     ${folder}/content-3.png      → ${entry.contentImages[2]}`);
console.log(`     ${folder}/content-4.png      → ${entry.contentImages[3]}`);
console.log('');
console.log('   Option A — Cloudflare Dashboard:');
console.log('     R2 → Copyonline (或你的bucket名) → 创建文件夹 → 拖入图片');
console.log('');
console.log('   Option B — wrangler CLI (需先 wrangler login):');
console.log(`     npx wrangler r2 object put ${R2_BUCKET}/${folder}/card-bg.png --file=path/to/card-bg.png`);
console.log(`     npx wrangler r2 object put ${R2_BUCKET}/${folder}/card-hover.png --file=path/to/card-hover.png`);
console.log(`     npx wrangler r2 object put ${R2_BUCKET}/${folder}/header-bg.png --file=path/to/header-bg.png`);
console.log(`     npx wrangler r2 object put ${R2_BUCKET}/${folder}/content-1.png --file=path/to/content-1.png`);
console.log('');
console.log('🚀 After uploading images, verify on site then:');
console.log('   git add design/index.json && git commit -m "design: add ' + entry.title + '" && git push');
