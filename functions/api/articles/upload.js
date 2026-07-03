// Cloudflare Pages Function: /api/articles/upload
// Uploads article image (bg or inline) to R2
// Path: articles/images/group-{groupIdx}/{type}-{timestamp}.{ext}
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback)
//
// FormData fields:
//   groupIdx (string): group index (0, 1, 2, ...)
//   type (string): "bg" or "inline"
//   file (File): image file
//
// For type=bg, automatically deletes old bg image of that group before upload.

const R2_BASE = 'https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function getExt(fileName) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(fileName || '');
  return m ? m[1].toLowerCase() : 'jpg';
}

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
    const groupIdx = (formData.get('groupIdx') || '').toString().trim();
    const type = (formData.get('type') || '').toString().trim();
    const file = formData.get('file');

    if (!groupIdx) return json({ success: false, error: 'Missing groupIdx' }, 400);
    if (type !== 'bg' && type !== 'inline') {
      return json({ success: false, error: 'type must be "bg" or "inline"' }, 400);
    }
    if (!(file instanceof File)) return json({ success: false, error: 'Missing file' }, 400);

    const groupPrefix = `articles/images/group-${groupIdx}/`;

    // For bg: delete old bg image(s) of this group first
    let deletedOld = 0;
    if (type === 'bg') {
      const listed = await bucket.list({ prefix: groupPrefix });
      for (const obj of listed.objects) {
        if (/\/bg-\d+\./.test(obj.key)) {
          await bucket.delete(obj.key);
          deletedOld++;
        }
      }
    }

    // Upload new image
    const ts = Date.now();
    const ext = getExt(file.name);
    const r2Path = `${groupPrefix}${type}-${ts}.${ext}`;

    await bucket.put(r2Path, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' }
    });

    const url = `${R2_BASE}/${r2Path}`;

    return json({ success: true, url: url, deletedOld: deletedOld });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}
