// Cloudflare Pages Function: /api/msg/list
// GET /api/msg/list?limit=200  -> { messages: [{ id, content, region, time }] }  (newest first)
import { json, handleOptions, getDb } from '../_lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const opt = handleOptions(request); if (opt) return opt;
  const db = getDb(env);
  if (!db) return json({ success: false, error: 'D1 not configured.' }, 500);
  if (request.method !== 'GET') return json({ success: false, error: 'Method not allowed' }, 405);

  const url = new URL(request.url);
  let limit = parseInt(url.searchParams.get('limit') || '200', 10);
  if (!limit || limit < 1) limit = 200;
  if (limit > 500) limit = 500;

  const rs = await db.prepare(
    'SELECT id, content, region, created_at FROM messages ORDER BY id DESC LIMIT ?'
  ).bind(limit).all();

  const messages = (rs.results || []).map(function (r) {
    return { id: r.id, content: r.content, region: r.region || '', time: r.created_at };
  });
  return json({ messages: messages });
}
