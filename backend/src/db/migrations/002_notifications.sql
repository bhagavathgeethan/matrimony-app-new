-- Notifications: in-app inbox, per-user preferences, and device tokens for push delivery

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,          -- message | mutual | match | family_feedback | family_linked | security
  title VARCHAR(140) NOT NULL,
  body VARCHAR(300) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- deep-link target, e.g. { "conversationId": "…" }
  group_key VARCHAR(120),             -- unread notifications with the same key collapse into one (count++)
  count INT NOT NULL DEFAULT 1,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, updated_at DESC);
CREATE UNIQUE INDEX notifications_unread_group_idx
  ON notifications (user_id, group_key) WHERE read_at IS NULL AND group_key IS NOT NULL;

-- Category switches; security alerts are always delivered
ALTER TABLE users ADD COLUMN notification_prefs JSONB NOT NULL
  DEFAULT '{"messages": true, "matches": true, "family": true, "push": true}'::jsonb;

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  token VARCHAR(512) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);
