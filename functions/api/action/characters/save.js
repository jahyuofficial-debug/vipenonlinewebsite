// Cloudflare Pages Function: /api/action/characters/save
// Saves the action-publisher "characters" (roles) to R2 (path: action/characters.json).
// Public read URL: https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/action/characters.json
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback, shared with design works & articles)
//
// Body (multipart/form-data):
//   - json: stringified array of characters
//     Character shape: { id, name, avatar }
//       avatar may be a full https URL, a data: URL (decoded + uploaded to R2 here),
//       or "" (no avatar). Bare filenames / blob: URLs are stripped to "".
//
// This decouples character persistence from the browser's localStorage so roles survive
// cache clears, browser switches, and machine switches.

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  const bucket = env.ARTICLES_BUCKET || env.DESIGN_BUCKET;
  if (!bucket) {
    return json({
      success: false,
      error: 'R2 bucket not configured. Add ARTICLES_BUCKET (or DESIGN_BUCKET) binding in Cloudflare Pages dashboard.'
    }, 500);
  }

  try {
    const formData = await request.formData();
    const jsonStr = formData.get('json');
    if (!jsonStr) return json({ success: false, error: 'Missing json field' }, 400);

    let chars = JSON.parse(jsonStr);
    if (!Array.isArray(chars)) {
      return json({ success: false, error: 'Expected an array of characters' }, 400);
    }

    const r2Base = 'https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev';

    // Normalize + upload data-URL avatars
    chars = await Promise.all(chars.map(async function (c) {
      if (!c || typeof c !== 'object') return null;
      const id = c.id != null ? String(c.id).replace(/[^a-zA-Z0-9_-]/g, '_') : '';
      let avatar = c.avatar || '';

      if (typeof avatar === 'string' && avatar.indexOf('data:') === 0) {
        // data:<mime>;base64,<payload>
        const m = avatar.match(/^data:(.+?);base64,(.*)$/);
        if (m) {
          const mime = m[1];
          const payload = m[2];
          const ext = (mime.split('/')[1] || 'bin').replace(/[^a-zA-Z0-9]/g, '');
          const safeName = 'char-' + (id || 'x') + '-avatar.' + ext;
          const r2Path = 'action/characters/' + safeName;
          await bucket.put(r2Path, base64ToArrayBuffer(payload), {
            httpMetadata: { contentType: mime }
          });
          avatar = r2Base + '/action/characters/' + encodeURIComponent(safeName);
        } else {
          avatar = '';
        }
      } else if (typeof avatar === 'string' && /^https?:\/\//.test(avatar)) {
        // keep as-is
      } else {
        // blob: URL or bare filename -> strip
        avatar = '';
      }

      return {
        id: c.id != null ? c.id : id,
        name: c.name || '',
        avatar: avatar
      };
    }));

    chars = chars.filter(Boolean);

    await bucket.put('action/characters.json', JSON.stringify(chars, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    return json({ success: true, count: chars.length });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function json(data, status) {
  status = status || 200;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
