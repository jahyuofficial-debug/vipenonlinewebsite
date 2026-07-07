-- Vipen D1 schema — cloud-shared messages, action comments, and likes
-- Run once in Cloudflare D1 (dashboard console or `wrangler d1 execute vipen --file=db/schema.sql`).
-- Binding name expected by the code: DB  (add it in Pages → Settings → Functions → D1 bindings)

-- Public message board (MSG page barrage)
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  content    TEXT    NOT NULL,
  region     TEXT,
  ip_hash    TEXT,                 -- sha-256 of visitor IP, for moderation only
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Comments on Action posts (per post_id from action/index.json)
CREATE TABLE IF NOT EXISTS action_comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  author     TEXT    NOT NULL DEFAULT 'Guest',
  content    TEXT    NOT NULL,
  region     TEXT,
  ip_hash    TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_action_comments_post ON action_comments(post_id, id);

-- Generic likes for action / design / disc (one row = one user liked one item)
CREATE TABLE IF NOT EXISTS likes (
  feature    TEXT NOT NULL,        -- 'action' | 'design' | 'disc'
  item_id    TEXT NOT NULL,        -- action: post_id | design: folder | disc: folder
  uid        TEXT NOT NULL,        -- anonymous client id (localStorage UUID)
  created_at INTEGER NOT NULL,
  PRIMARY KEY (feature, item_id, uid)
);
CREATE INDEX IF NOT EXISTS idx_likes_feature_item ON likes(feature, item_id);
