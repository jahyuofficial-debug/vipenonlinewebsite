// Cloudflare Pages Function: /api/design/upload
// Uploads a new project's images + metadata to R2 and appends to design/index.json
// Requires R2 binding named "DESIGN_BUCKET"

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

    // Read metadata fields
    const folderName = (formData.get('folderName') || '').trim();
    if (!folderName) return json({ success: false, error: 'Missing folderName' }, 400);

    const title = (formData.get('title') || '').trim();
    if (!title) return json({ success: false, error: 'Missing title' }, 400);

    const entry = {
      folder: folderName,
      workId: 'work' + Date.now().toString(36),
      cat: (formData.get('cat') || 'Graphic Design').trim(),
      likeCount: 0,
      cardBg: '',
      cardHoverBg: '',
      headerBg: '',
      contentImages: [],
      title: title,
      subtitle: (formData.get('subtitle') || '').trim(),
      description: (formData.get('desc') || '').trim(),
      client: (formData.get('client') || '').trim(),
      published: (formData.get('year') || new Date().getFullYear().toString()).trim(),
      tools: (formData.get('tools') || '').trim(),
      spacing: (formData.get('spacing') || 'medium').trim(),
      descPosition: (formData.get('descPos') || 'top').trim(),
      tags: (formData.get('tags') || '').split(',').map(function(t){ return t.trim(); }).filter(Boolean)
    };

    // YouTube URLs (optional)
    const ytRaw = formData.get('youtubeUrls');
    let youtubeUrls = [];
    if (ytRaw) {
      try { youtubeUrls = JSON.parse(ytRaw); } catch(e) {}
    }

    // Upload files
    let filesUploaded = 0;
    const files = formData.getAll('files');

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const fileName = file.name || 'untitled.png';
      const r2Path = `${folderName}/${fileName}`;

      await env.DESIGN_BUCKET.put(r2Path, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' }
      });

      const url = `${R2_BASE}/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;

      if (fileName === 'card-bg.png') entry.cardBg = url;
      else if (fileName === 'card-hover.png') entry.cardHoverBg = url;
      else if (fileName === 'header-bg.png') entry.headerBg = url;
      else if (fileName.startsWith('content-')) entry.contentImages.push(url);

      filesUploaded++;
    }

    // Prepend YouTube URLs to contentImages
    entry.contentImages = youtubeUrls.concat(entry.contentImages);

    // Fetch existing index.json from R2
    let projects = [];
    const existing = await env.DESIGN_BUCKET.get('design/index.json');
    if (existing) {
      try { projects = await existing.json(); } catch(e) { projects = []; }
    }

    // Append new entry
    projects.push(entry);

    // Save updated index.json
    await env.DESIGN_BUCKET.put('design/index.json', JSON.stringify(projects, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    return json({ success: true, entry: entry, files: filesUploaded });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}
