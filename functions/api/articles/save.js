// Cloudflare Pages Function: /api/articles/save
// Saves Fresh page articles to R2 (path: articles/articles.json)
// Public read URL: https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/articles/articles.json
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback, shared with design works)

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
    const articles = Array.isArray(body) ? body : body.articles;
    if (!Array.isArray(articles)) {
      return json({ success: false, error: 'Expected array of articles or { articles: [...] }' }, 400);
    }

    // Normalize IDs to array index (main.js routes detail by freshItems[id])
    articles.forEach(function(a, i) { a.id = i; });

    // Write JSON to R2
    await bucket.put('articles/articles.json', JSON.stringify(articles, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    return json({ success: true, count: articles.length });
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
