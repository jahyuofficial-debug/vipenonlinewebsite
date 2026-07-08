/* ============================================================
   Cloud client — D1-backed shared data (messages, likes, comments)
   All calls fail soft (return null/empty) so the site still works
   before D1 is bound or if the network is down.
   ============================================================ */
var Cloud = (function () {
  'use strict';
  var UID_KEY = 'vipen_uid';

  function uid() {
    try {
      var v = localStorage.getItem(UID_KEY);
      if (v && /^[A-Za-z0-9_-]{6,64}$/.test(v)) return v;
      v = 'u-' + (crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).slice(2) + Date.now().toString(36)));
      // crypto.randomUUID may produce 36 chars (with dashes) — fine, within 64
      v = v.slice(0, 64);
      localStorage.setItem(UID_KEY, v);
      return v;
    } catch (e) {
      return 'u-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
  }

  function get(url) {
    return fetch(url).then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function post(url, obj) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj)
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }

  // Cached visitor region (province, via /api/msg/region). Shared by MSG + Action comments.
  var _region = null;
  function region() {
    if (_region !== null) return Promise.resolve(_region);
    return fetch('/api/msg/region').then(function (r) { return r.json(); }).then(function (d) {
      _region = (d && d.region) || '';
      return _region;
    }).catch(function () { _region = ''; return ''; });
  }

  return {
    uid: uid,
    region: region,
    likes: {
      // ids -> { counts: {id:n}, liked: {id:bool} }
      get: function (feature, ids) {
        if (!ids || !ids.length) return Promise.resolve({ counts: {}, liked: {} });
        var q = '/api/likes?feature=' + encodeURIComponent(feature) +
          '&ids=' + encodeURIComponent(ids.join(',')) +
          '&uid=' + encodeURIComponent(uid());
        return get(q).then(function (d) { return d || { counts: {}, liked: {} }; });
      },
      // -> { liked: bool, count: n }  (idempotent add)
      like: function (feature, itemId) {
        return post('/api/likes', { feature: feature, item_id: String(itemId), uid: uid(), action: 'like' });
      },
      // -> { liked: bool, count: n }  (idempotent remove)
      unlike: function (feature, itemId) {
        return post('/api/likes', { feature: feature, item_id: String(itemId), uid: uid(), action: 'unlike' });
      },
      // -> { liked: bool, count: n }  (legacy toggle)
      toggle: function (feature, itemId) {
        return post('/api/likes', { feature: feature, item_id: String(itemId), uid: uid() });
      }
    },
    msg: {
      list: function (limit) {
        return get('/api/msg/list?limit=' + (limit || 200)).then(function (d) { return (d && d.messages) || []; });
      },
      save: function (content, region) {
        return post('/api/msg/save', { content: content, region: region || '' });
      }
    },
    comments: {
      // postIds -> { "1": [comments], ... }
      list: function (postIds) {
        if (!postIds || !postIds.length) return Promise.resolve({});
        return get('/api/action/comments?post_ids=' + encodeURIComponent(postIds.join(',')))
          .then(function (d) { return (d && d.comments) || {}; });
      },
      add: function (postId, content, region) {
        return post('/api/action/comment', { post_id: postId, content: content, region: region || '' });
      }
    }
  };
})();
