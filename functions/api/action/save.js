// Cloudflare Pages Function: /api/action/save
// Saves action feed (posts) to R2 (path: action/index.json) + uploads post images.
// Public read URL: https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev/action/index.json
// Binding: ARTICLES_BUCKET (preferred) or DESIGN_BUCKET (fallback, shared with design works & articles)
//
// Body (multipart/form-data):
//   - json: stringified array of posts
//     Post shape: { id, username, avatar, images: [url|blob:|""], caption,
//                   likes, comments, timeAgo, isLiked, commentList: [{user,text}] }
//   - img_<postIdx>_<imgIdx>: File — a new/replaced image for posts[postIdx].images[imgIdx]
//
// Images that are blob: URLs or bare filenames are stripped to "" here, then back-filled
// with the real R2 https URL once the matching img_<postIdx>_<imgIdx> file is uploaded.
// This mirrors the disc/save.js pattern and prevents dead pseudo-URLs in action/index.json.

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

    const posts = JSON.parse(jsonStr);
    if (!Array.isArray(posts)) {
      return json({ success: false, error: 'Expected an array of posts' }, 400);
    }

    // Keep ONLY real http(s) URLs in avatar / images[]. Strip blob: URLs (valid only on
    // the upload page) AND bare filenames — both would otherwise become dead pseudo-URLs
    // in action/index.json that the main-site <img> tries to load and 404s on. Files uploaded
    // via img_<postIdx>_<imgIdx> below back-fill the correct https URL afterwards.
    posts.forEach(function(p) {
      if (!p) return;
      if (p.avatar && !/^https?:\/\//.test(p.avatar)) p.avatar = '';
      if (Array.isArray(p.images)) {
        for (var i = 0; i < p.images.length; i++) {
            if (p.images[i] && !/^https?:\/\//.test(p.images[i])) p.images[i] = '';
        }
      }
      // Ensure numeric fields are numbers (defensive)
      p.likes = Number(p.likes) || 0;
      p.comments = Number(p.comments) || 0;
      if (typeof p.isLiked !== 'boolean') p.isLiked = false;
      if (!Array.isArray(p.commentList)) p.commentList = [];
    });

    const r2Base = 'https://pub-541a045d0ee14f489c6d0115be4f5a34.r2.dev';

    // 1. Upload new/replaced post images AND avatars.
    //    Key formats:
    //      img_<postIdx>_<imgIdx>   — post image at images[imgIdx]
    //      img_<postIdx>_avatar     — post avatar (post.avatar field)
    let uploadedCount = 0;
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('img_') || !(value instanceof File)) continue;
      const parts = key.split('_');           // ['img', postIdx, field]
      const pi = parseInt(parts[1]);
      const field = parts[2];                 // imgIdx (numeric) or 'avatar'
      if (isNaN(pi) || field == null) continue;

      const post = posts[pi];
      if (!post) continue;

      // Build a safe id-based folder so a post's files live together and don't clash
      // with other posts even if filenames repeat.
      const idStr = String(post.id != null ? post.id : pi).replace(/[^a-zA-Z0-9_-]/g, '_') || ('post-' + pi);
      const safeFolder = 'post-' + idStr;

      const isAvatar = (field === 'avatar');
      const origName = value.name || (isAvatar ? 'avatar.bin' : ('img-' + field + '.bin'));
      const safeName = origName.replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '_');
      const prefix = isAvatar ? 'avatar-' : (field + '-');
      const r2Path = 'action/' + safeFolder + '/' + prefix + safeName;

      await bucket.put(r2Path, value.stream(), {
        httpMetadata: { contentType: value.type || 'application/octet-stream' }
      });

      const newUrl = r2Base + '/action/' + encodeURIComponent(safeFolder) + '/' + encodeURIComponent(prefix + safeName);

      if (isAvatar) {
        // Back-fill avatar URL
        post.avatar = newUrl;
      } else {
        const ii = parseInt(field);
        if (isNaN(ii)) continue;
        // Back-fill the URL into the post's images array at the matching slot.
        if (!Array.isArray(post.images)) post.images = [];
        while (post.images.length <= ii) post.images.push('');
        post.images[ii] = newUrl;
      }

      uploadedCount++;
    }

    // 2. Persist JSON (always — order/caption/metadata may have changed even with no new files)
    await bucket.put('action/index.json', JSON.stringify(posts, null, 2), {
      httpMetadata: { contentType: 'application/json; charset=utf-8' }
    });

    return json({ success: true, uploaded: uploadedCount, count: posts.length });
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
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
