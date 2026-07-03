// Cloudflare Pages Function: /api/disc/save
// Saves updated disc/index.json + audio/cover files to R2
// Requires R2 binding named "DISC_BUCKET" in Cloudflare Pages dashboard

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

  if (!env.DISC_BUCKET) {
    return json({ success: false, error: 'R2 bucket not configured. Add DISC_BUCKET binding in Cloudflare Pages dashboard.' }, 500);
  }

  try {
    const formData = await request.formData();
    const jsonStr = formData.get('json');
    if (!jsonStr) return json({ success: false, error: 'Missing json field' }, 400);

    const tracks = JSON.parse(jsonStr);
    // Keep ONLY real http(s) URLs in audio/coverUrl. This strips blob: URLs (valid only on
    // the upload page) AND any bare filenames left over from older buggy uploads — both
    // would otherwise become dead pseudo-URLs in disc/index.json that the main-site player
    // tries to load and 404s on. Files uploaded via img_<idx>_<field> below will back-fill
    // the correct https URL afterwards.
    tracks.forEach(function(t) {
        if (t.coverUrl && !/^https?:\/\//.test(t.coverUrl)) t.coverUrl = '';
        if (t.audio && !/^https?:\/\//.test(t.audio)) t.audio = '';
    });
    const r2Base = 'https://pub-162f7a76795447d39c6186670b92ffa0.r2.dev';

    // 1. Upload new/replaced audio & cover files
    let uploadedCount = 0;
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('img_') || !(value instanceof File)) continue;
      // key: "img_0_audio" or "img_0_cover"
      const parts = key.split('_');
      const ti = parseInt(parts[1]);
      const field = parts[2]; // "audio" or "cover"
      const folder = (tracks[ti] && tracks[ti].folder) || `track-${ti}`;
      const safeFolder = folder.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');

      // Preserve original filename & extension for readability
      const origName = value.name || `track-${ti}.bin`;
      const safeName = origName.replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '_');
      const r2Path = `${safeFolder}/${safeName}`;

      await env.DISC_BUCKET.put(r2Path, value.stream(), {
        httpMetadata: { contentType: value.type || 'application/octet-stream' }
      });

      const newUrl = `${r2Base}/${encodeURIComponent(safeFolder)}/${encodeURIComponent(safeName)}`;

      // Update URL in tracks data
      if (tracks[ti]) {
        if (field === 'audio') {
          tracks[ti].audio = newUrl;
        } else if (field === 'cover') {
          tracks[ti].coverUrl = newUrl;
          tracks[ti].coverFile = origName;
        }
      }
      uploadedCount++;
    }

    // 2. Save JSON (always, even if no files changed — order/metadata may have changed)
    await env.DISC_BUCKET.put('disc/index.json', JSON.stringify(tracks, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

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
