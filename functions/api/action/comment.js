// Cloudflare Pages Function: /api/action/comment
// POST { post_id, content, region, uid } -> { success, comment: { id, author, content, region, time } }
import { json, handleOptions, getDb, ipHash, rateLimit, clamp, validUid } from '../../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const opt = handleOptions(request); if (opt) return opt;
  const db = getDb(env);
  if (!db) return json({ success: false, error: 'D1 not configured.' }, 500);
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  // 10 comments per minute per IP
  if (!rateLimit('comment:' + ip, 60000, 10)) return json({ success: false, error: 'Too fast, please slow down.' }, 429);

  let body;
  try { body = await request.json(); } catch (e) { return json({ success: false, error: 'Invalid JSON' }, 400); }

  const postId = parseInt(body.post_id, 10);
  if (!postId || postId < 1) return json({ success: false, error: 'bad post_id' }, 400);
  const content = clamp((body.content || '').trim(), 300);
  const region = clamp((body.region || '').trim(), 40);
  if (!content) return json({ success: false, error: 'empty content' }, 400);
  if (body.uid !== undefined && body.uid !== '' && !validUid(body.uid)) {
    return json({ success: false, error: 'bad uid' }, 400);
  }

  const hash = await ipHash(request);
  const now = Date.now();
  const r = await db.prepare(
    'INSERT INTO action_comments (post_id, author, content, region, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
  ).bind(postId, 'Guest', content, region, hash, now).first();

  return json({
    success: true,
    comment: { id: r && r.id, author: 'Guest', content: content, region: region, time: now }
  });
}
