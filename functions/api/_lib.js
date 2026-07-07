// Shared helpers for /api/* Pages Functions.
// Files/dirs prefixed with "_" are excluded from routing by Cloudflare Pages,
// so this module is import-only and never exposed as an endpoint.

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

// Call at the top of every function: returns a Response for OPTIONS preflight, else null.
export function handleOptions(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }
  return null;
}

// Anonymous client id validation: 6-64 chars of [A-Za-z0-9_-]
export function validUid(uid) {
  return typeof uid === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(uid);
}

// sha-256 hex of the visitor IP (for moderation/audit only; never returned to clients)
export async function ipHash(request) {
  try {
    const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!ip) return '';
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    return [...new Uint8Array(buf)].map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  } catch (e) {
    return '';
  }
}

// Best-effort in-memory rate limit (per isolate). Returns true if allowed.
const rateMap = new Map();
export function rateLimit(key, windowMs, maxHits) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    rateMap.set(key, { windowStart: now, hits: 1 });
    return true;
  }
  entry.hits++;
  return entry.hits <= maxHits;
}

// D1 binding (accept either DB or D1)
export function getDb(env) {
  return (env && (env.DB || env.D1)) || null;
}

export function clamp(str, max) {
  if (typeof str !== 'string') return '';
  return str.slice(0, max);
}

// Safe IN-clause builder: returns { sql: "?,?,?", params: [...] }
export function inClause(values) {
  const params = values.filter(function (v) { return v !== undefined && v !== null && v !== ''; });
  const sql = params.map(function () { return '?'; }).join(',');
  return { sql: sql, params: params };
}
