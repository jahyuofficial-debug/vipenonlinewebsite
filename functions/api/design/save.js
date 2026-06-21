// Cloudflare Pages Function: /api/design/save
// Saves updated design/index.json + replaced images to R2
// Requires R2 binding named "DESIGN_BUCKET" in Cloudflare Pages dashboard

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

  if (!env.DESIGN_BUCKET) {
    return json({ success: false, error: 'R2 bucket not configured. Add DESIGN_BUCKET binding in Cloudflare Pages.' }, 500);
  }

  try {
    const formData = await request.formData();
    const jsonStr = formData.get('json');
    if (!jsonStr) return json({ success: false, error: 'Missing json field' }, 400);

    const projects = JSON.parse(jsonStr);
    const r2Base = 'https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev';

    // 1. Upload the JSON first
    await env.DESIGN_BUCKET.put('design/index.json', JSON.stringify(projects, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    // 2. Upload any replaced image/video files
    let uploadedCount = 0;
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('img_') || !(value instanceof File)) continue;
      const parts = key.split('_');
      const pi = parseInt(parts[1]);
      const imgKey = parts.slice(2).join('_');
      const folder = (projects[pi] && projects[pi].folder) || `project-${pi}`;
      const safeBase = imgKey.replace(/[^a-zA-Z0-9-_.]/g, '_');
      // Preserve original file extension
      const extMatch = (value.name || '').match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? '.' + extMatch[1].toLowerCase() : '.png';
      const ts = Date.now();
      const r2Path = `${folder}/${safeBase}-${ts}${ext}`;

      await env.DESIGN_BUCKET.put(r2Path, value.stream(), {
        httpMetadata: { contentType: value.type || 'application/octet-stream' }
      });

      const newUrl = `${r2Base}/${safeBase}-${ts}${ext}`;

      // Update URL in projects data
      if (projects[pi]) {
        if (imgKey === 'cardBg' || imgKey === 'cardHoverBg' || imgKey === 'headerBg') {
          projects[pi][imgKey] = newUrl;
        } else if (imgKey.startsWith('content-')) {
          const ci = parseInt(imgKey.replace('content-', ''));
          if (projects[pi].contentImages && projects[pi].contentImages[ci] !== undefined) {
            projects[pi].contentImages[ci] = newUrl;
          }
        }
      }
      uploadedCount++;
    }

    // 3. Re-save JSON with updated image URLs
    if (uploadedCount > 0) {
      await env.DESIGN_BUCKET.put('design/index.json', JSON.stringify(projects, null, 2), {
        httpMetadata: { contentType: 'application/json; charset=utf-8' }
      });
    }

    return json({ success: true, uploaded: uploadedCount });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
