// Cloudflare Pages Function: /api/design/save
// Saves updated design/index.json to R2 and uploads replaced images

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

  try {
    const formData = await request.formData();
    const jsonStr = formData.get('json');
    if (!jsonStr) return json({ success: false, error: 'Missing json field' }, 400);

    const projects = JSON.parse(jsonStr);
    const r2Base = 'https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev';

    // Process image replacements (upload new images to R2)
    const imageFiles = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('img_') && value instanceof File) {
        imageFiles.push({ key, file: value });
      }
    }

    // Upload replaced images to R2
    const uploadedUrls = {};
    for (const { key, file } of imageFiles) {
      // key format: img_{projectIndex}_{imageKey}
      // e.g. img_0_cardBg, img_0_content_3
      const parts = key.split('_');
      const pi = parts[1];
      const imgKey = parts.slice(2).join('_');
      const folder = projects[pi]?.folder || `project-${pi}`;
      const safeName = imgKey.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const r2Path = `${folder}/${safeName}-${Date.now()}.png`;

      if (env.DESIGN_BUCKET) {
        await env.DESIGN_BUCKET.put(r2Path, file.stream(), {
          httpMetadata: { contentType: file.type || 'image/png' }
        });
        uploadedUrls[key] = `${r2Base}/${encodeURIComponent(folder)}/${encodeURIComponent(safeName)}-${Date.now()}.png`;
      }
    }

    // Update image URLs in projects data
    for (const [key, url] of Object.entries(uploadedUrls)) {
      const parts = key.split('_');
      const pi = parseInt(parts[1]);
      const imgKey = parts.slice(2).join('_');

      if (projects[pi]) {
        if (imgKey === 'cardBg' || imgKey === 'cardHoverBg' || imgKey === 'headerBg') {
          projects[pi][imgKey] = url;
        } else if (imgKey.startsWith('content-')) {
          const ci = parseInt(imgKey.replace('content-', ''));
          if (projects[pi].contentImages && projects[pi].contentImages[ci] !== undefined) {
            projects[pi].contentImages[ci] = url;
          }
        }
      }
    }

    // Upload updated JSON to R2
    const jsonContent = JSON.stringify(projects, null, 2);
    if (env.DESIGN_BUCKET) {
      await env.DESIGN_BUCKET.put('design/index.json', jsonContent, {
        httpMetadata: { contentType: 'application/json; charset=utf-8' }
      });
    }

    return json({
      success: true,
      uploaded: Object.keys(uploadedUrls).length,
      urls: uploadedUrls
    });
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
