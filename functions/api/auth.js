// Cloudflare Pages Function: /api/auth/*
import bcrypt from 'bcryptjs';

// --- User store ---
const USERS = [
  {
    id: "u_admin_001",
    username: "Jah72",
    email: "riverjia9527@gmail.com",
    role: "ManagerGo",
    status: "active",
    displayName: "Admin",
    avatar: "",
    passwordHash: "$2b$12$Tj8L1RMW6cPGHfzKsP7Z5uUFjkn.x8enT8t7UlmRsyIm1PRfkIoNa",
    lastLogin: null
  }
];

const codeStore = new Map();

const AUTH_SECRET = 'vipen-auth-secret-2026';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function hmacSHA256(key, text) {
  const enc = new TextEncoder();
  const keyData = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', keyData, enc.encode(text));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64url(str) {
  return btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function createToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const sigHex = await hmacSHA256(AUTH_SECRET, header + '.' + body);
  const bin = new Uint8Array(sigHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  return header + '.' + body + '.' + base64url(String.fromCharCode(...bin));
}

async function sendEmail(env, to, code) {
  const key = env.RESEND_API_KEY;
  const from = env.RESEND_FROM || 'Vipen <noreply@vipenonline.com>';
  if (!key) throw new Error('RESEND_API_KEY not configured');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#000;color:#fff;font-family:Arial;text-align:center;padding:40px">
<div style="max-width:400px;margin:0 auto">
<h1 style="color:#d4a853;font-size:24px;margin-bottom:20px">Vipen Verification</h1>
<p style="font-size:16px;color:#999;margin-bottom:30px">Your verification code:</p>
<div style="background:#1a1a2e;border-radius:12px;padding:30px;margin-bottom:30px;border:1px solid #333">
<span style="font-size:48px;font-weight:bold;letter-spacing:8px;color:#d4a853">${code}</span>
</div>
<p style="font-size:12px;color:#666">Code expires in 5 minutes.</p>
</div></body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: 'Vipen Verification Code', html })
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}`);
  return res.json();
}

async function handleSendCode(env, body) {
  const email = body.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: 'Invalid email' }, 400);
  }
  const ex = codeStore.get(email);
  if (ex && Date.now() - ex.sentAt < 60000) {
    return json({ success: false, error: 'Please wait 60s' }, 429);
  }
  const code = generateCode();
  const ts = Date.now();
  codeStore.set(email, { code, expiresAt: ts + 300000, sentAt: ts });
  const hash = await hmacSHA256(AUTH_SECRET, email + '|' + code + '|' + ts);
  try {
    await sendEmail(env, email, code);
    return json({ success: true, hash, ts });
  } catch (e) {
    codeStore.delete(email);
    return json({ success: false, error: 'Email failed: ' + e.message }, 500);
  }
}

async function handleVerifyCode(env, body) {
  const { email, code, hash, ts } = body;
  if (!email || !code || !hash || !ts) return json({ success: false, error: 'Missing fields' }, 400);
  const s = codeStore.get(email);
  if (!s || Date.now() > s.expiresAt) { codeStore.delete(email); return json({ success: false, error: 'Code expired' }, 400); }
  if (s.code !== String(code).trim()) return json({ success: false, error: 'Invalid code' }, 400);
  const h = await hmacSHA256(AUTH_SECRET, email + '|' + code + '|' + ts);
  if (hash !== h) return json({ success: false, error: 'Invalid hash' }, 400);
  codeStore.delete(email);

  let user = USERS.find(u => u.email === email);
  if (!user) {
    user = { id: 'u_' + Date.now().toString(36), username: email.split('@')[0], email, role: 'user', status: 'active', displayName: email.split('@')[0], avatar: '', passwordHash: '', lastLogin: new Date().toISOString() };
    USERS.push(user);
  } else {
    user.lastLogin = new Date().toISOString();
  }

  const token = await createToken({ sub: user.id, username: user.username, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) });
  return json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role, displayName: user.displayName, avatar: user.avatar } });
}

async function handleLogin(env, body) {
  const login = (body.email || body.username || '').trim();
  const pw = body.password || '';
  if (!login || !pw) return json({ success: false, error: 'Missing credentials' }, 400);

  const user = USERS.find(u => u.email.toLowerCase() === login.toLowerCase() || u.username.toLowerCase() === login.toLowerCase());
  if (!user) return json({ success: false, error: 'Invalid credentials' }, 401);

  if (user.passwordHash) {
    const ok = bcrypt.compareSync(pw, user.passwordHash);
    if (!ok) return json({ success: false, error: 'Invalid credentials' }, 401);
  }

  user.lastLogin = new Date().toISOString();
  const token = await createToken({ sub: user.id, username: user.username, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) });
  return json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role, displayName: user.displayName, avatar: user.avatar } });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }
  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  const action = new URL(request.url).pathname.replace(/\/+$/, '').split('/').pop();
  let body;
  try { body = await request.json(); } catch (e) { return json({ success: false, error: 'Invalid JSON' }, 400); }

  if (action === 'send-code') return handleSendCode(env, body);
  if (action === 'verify-code') return handleVerifyCode(env, body);
  if (action === 'login') return handleLogin(env, body);
  return json({ success: false, error: 'Unknown action' }, 400);
}
