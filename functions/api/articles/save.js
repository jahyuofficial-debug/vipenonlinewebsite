// Cloudflare Pages Function: /api/articles/save
// Saves Fresh page heroGroups to R2 (path: articles/hero-groups.json)
// Public read URL: https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/articles/hero-groups.json
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback, shared with design works)
//
// Expected body: array of groups [{ id, headline: {...}, hotNews: [...] }, ...]
// Each group: 1 headline + up to 3 hotNews (1+3 combination)

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
    const groups = Array.isArray(body) ? body : body.groups;
    if (!Array.isArray(groups)) {
      return json({ success: false, error: 'Expected array of groups or { groups: [...] }' }, 400);
    }

    // Normalize group ids to array index
    groups.forEach(function(g, i) {
      g.id = i;
      // Cap hotNews at 3 items (1+3 combination rule)
      if (Array.isArray(g.hotNews) && g.hotNews.length > 3) {
        g.hotNews = g.hotNews.slice(0, 3);
      }
    });

    // Write JSON to R2
    await bucket.put('articles/hero-groups.json', JSON.stringify(groups, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    return json({ success: true, count: groups.length });
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
