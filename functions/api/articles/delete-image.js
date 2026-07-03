// Cloudflare Pages Function: /api/articles/delete-image
// Deletes an article image from R2 by URL
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback)
//
// POST JSON: { url: "https://pub-...r2.dev/articles/images/group-0/inline-xxx.jpg" }
// Safety: only deletes keys under "articles/images/" prefix

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

  const bucket = env.ARTICLES_BUCKET || env.DESIGN_BUCKET;
  if (!bucket) {
    return json({
      success: false,
      error: 'R2 bucket not configured. Add ARTICLES_BUCKET (or DESIGN_BUCKET) binding in Cloudflare Pages dashboard.'
    }, 500);
  }

  try {
    const body = await request.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return json({ success: false, error: 'Missing url' }, 400);
    }

    // Extract path from URL: everything after the R2 domain
    // URL format: https://pub-xxx.r2.dev/articles/images/group-0/inline-xxx.jpg
    const match = /r2\.dev\/(.+)$/.exec(url);
    if (!match) {
      return json({ success: false, error: 'Invalid R2 URL' }, 400);
    }

    const key = decodeURIComponent(match[1]);

    // Safety: only allow deletion under articles/images/
    if (!key.startsWith('articles/images/')) {
      return json({ success: false, error: 'Refused: key outside articles/images/' }, 400);
    }

    await bucket.delete(key);

    return json({ success: true, deleted: key });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
}
