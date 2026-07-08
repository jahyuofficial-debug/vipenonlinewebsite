// Cloudflare Pages Function: /api/action/comments
// GET /api/action/comments?post_ids=1,2,3  -> { "1": [{id,author,content,region,time}], "2": [...] }
import { json, handleOptions, getDb, inClause } from '../_lib.js';

const MAX_IDS = 60;

export async function onRequest(context) {
  const { request, env } = context;
  const opt = handleOptions(request); if (opt) return opt;
  const db = getDb(env);
  if (!db) return json({ success: false, error: 'D1 not configured.' }, 500);
  if (request.method !== 'GET') return json({ success: false, error: 'Method not allowed' }, 405);

  const url = new URL(request.url);
  const idsRaw = url.searchParams.get('post_ids') || url.searchParams.get('post_id') || '';
  let ids = idsRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, MAX_IDS);
  if (!ids.length) return json({ comments: {} });

  const ic = inClause(ids);
  const rs = await db.prepare(
    'SELECT id, post_id, author, content, region, created_at FROM action_comments WHERE post_id IN (' + ic.sql + ') ORDER BY post_id, id'
  ).bind(...ic.params).all();

  const out = {};
  ids.forEach(function (id) { out[id] = []; });
  (rs.results || []).forEach(function (r) {
    const key = String(r.post_id);
    if (!out[key]) out[key] = [];
    out[key].push({ id: r.id, author: r.author || 'Guest', content: r.content, region: r.region || '', time: r.created_at });
  });
  return json({ comments: out });
}
