// Cloudflare Pages Function: /api/msg/region
// Returns the visitor's IP-based region (province/city) using Cloudflare cf object.
// Response: { "region": "上海" } or { "region": "" } if unavailable.

export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf || {};

  // Prefer city, then region/subdivision, then postal region name
  var region = cf.city || cf.region || cf.subdivision && cf.subdivision.name || '';

  return new Response(JSON.stringify({ region: region }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  });
}
