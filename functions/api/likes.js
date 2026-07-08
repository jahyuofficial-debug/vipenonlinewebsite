// Cloudflare Pages Function: /api/likes
// Generic like store for action / design / disc.
//   GET  /api/likes?feature=design&ids=a,b,c&uid=xxx  -> { counts: {a:3}, liked: {a:false} }
//   POST /api/likes  { feature, item_id, uid }         -> toggles, returns { liked, count }
import { json, handleOptions, validUid, getDb, inClause } from './_lib.js';

const FEATURES = { action: true, design: true, disc: true };
const MAX_IDS = 60;

export async function onRequest(context) {
  const { request, env } = context;
  const opt = handleOptions(request); if (opt) return opt;
  const db = getDb(env);
  if (!db) return json({ success: false, error: 'D1 not configured. Bind DB in Pages settings.' }, 500);

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const feature = (url.searchParams.get('feature') || '').trim();
    const idsRaw = url.searchParams.get('ids') || '';
    const uid = (url.searchParams.get('uid') || '').trim();
    if (!FEATURES[feature] || !idsRaw) return json({ counts: {}, liked: {} });

    let ids = idsRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, MAX_IDS);
    if (!ids.length) return json({ counts: {}, liked: {} });

    const counts = {};
    const liked = {};
    const ic = inClause(ids);

    const rs = await db.prepare(
      'SELECT item_id, COUNT(*) AS c FROM likes WHERE feature = ? AND item_id IN (' + ic.sql + ') GROUP BY item_id'
    ).bind(feature, ...ic.params).all();
    (rs.results || []).forEach(function (r) { counts[r.item_id] = r.c; });
    ids.forEach(function (id) { if (counts[id] === undefined) counts[id] = 0; });

    if (validUid(uid)) {
      const rs2 = await db.prepare(
        'SELECT item_id FROM likes WHERE feature = ? AND uid = ? AND item_id IN (' + ic.sql + ')'
      ).bind(feature, uid, ...ic.params).all();
      (rs2.results || []).forEach(function (r) { liked[r.item_id] = true; });
    }
    ids.forEach(function (id) { if (liked[id] === undefined) liked[id] = false; });

    return json({ counts: counts, liked: liked });
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return json({ success: false, error: 'Invalid JSON' }, 400); }
    const feature = (body.feature || '').trim();
    const itemId = (body.item_id == null ? '' : body.item_id).toString().trim();
    const uid = (body.uid || '').trim();
    const action = (body.action || 'toggle').trim(); // 'like' | 'unlike' | 'toggle'
    if (!FEATURES[feature]) return json({ success: false, error: 'bad feature' }, 400);
    if (!itemId || itemId.length > 128) return json({ success: false, error: 'bad item_id' }, 400);
    if (!validUid(uid)) return json({ success: false, error: 'bad uid' }, 400);

    const existing = await db.prepare(
      'SELECT 1 FROM likes WHERE feature = ? AND item_id = ? AND uid = ?'
    ).bind(feature, itemId, uid).first();

    let liked;
    if (action === 'like') {
      // Idempotent add — only insert if not already liked
      if (!existing) {
        await db.prepare('INSERT INTO likes (feature, item_id, uid, created_at) VALUES (?, ?, ?, ?)').bind(feature, itemId, uid, Date.now());
      }
      liked = true;
    } else if (action === 'unlike') {
      // Idempotent remove — only delete if currently liked
      if (existing) {
        await db.prepare('DELETE FROM likes WHERE feature = ? AND item_id = ? AND uid = ?').bind(feature, itemId, uid);
      }
      liked = false;
    } else {
      // Default: toggle
      if (existing) {
        await db.prepare('DELETE FROM likes WHERE feature = ? AND item_id = ? AND uid = ?').bind(feature, itemId, uid);
        liked = false;
      } else {
        await db.prepare('INSERT INTO likes (feature, item_id, uid, created_at) VALUES (?, ?, ?, ?)').bind(feature, itemId, uid, Date.now());
        liked = true;
      }
    }
    const cnt = await db.prepare('SELECT COUNT(*) AS c FROM likes WHERE feature = ? AND item_id = ?').bind(feature, itemId).first();
    return json({ liked: liked, count: (cnt && cnt.c) || 0 });
  }

  return json({ success: false, error: 'Method not allowed' }, 405);
}
