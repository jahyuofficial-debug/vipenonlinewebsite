// Cloudflare Pages Function: /api/msg/save
// POST { content, region, uid } -> { success, id, content, region, time }
import { json, handleOptions, getDb, ipHash, rateLimit, clamp, validUid } from '../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const opt = handleOptions(request); if (opt) return opt;
  const db = getDb(env);
  if (!db) return json({ success: false, error: 'D1 not configured.' }, 500);
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  // 5 messages per minute per IP
  if (!rateLimit('msg:' + ip, 60000, 5)) return json({ success: false, error: 'Too fast, please slow down.' }, 429);

  let body;
  try { body = await request.json(); } catch (e) { return json({ success: false, error: 'Invalid JSON' }, 400); }

  const content = clamp((body.content || '').trim(), 500);
  const region = clamp((body.region || '').trim(), 40);
  if (!content) return json({ success: false, error: 'empty content' }, 400);
  // uid optional here (messages are public, no per-user dedupe), but validate if present
  if (body.uid !== undefined && body.uid !== '' && !validUid(body.uid)) {
    return json({ success: false, error: 'bad uid' }, 400);
  }

  const hash = await ipHash(request);
  const now = Date.now();
  const r = await db.prepare(
    'INSERT INTO messages (content, region, ip_hash, created_at) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(content, region, hash, now).first();

  return json({ success: true, id: r && r.id, content: content, region: region, time: now });
}
