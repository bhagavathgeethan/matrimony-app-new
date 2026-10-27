-- Files move to Depot object storage (one private bucket, STORAGE_BUCKET). Each file reference is bucket + key.

ALTER TABLE photos
  ALTER COLUMN storage_key TYPE VARCHAR(1024),
  ALTER COLUMN blur_key TYPE VARCHAR(1024),
  ADD COLUMN storage_bucket VARCHAR(42) NOT NULL DEFAULT 'knotfiles',   -- original
  ADD COLUMN blur_bucket VARCHAR(42) NOT NULL DEFAULT 'knotfiles';      -- blurred copy shown before mutual interest

ALTER TABLE verifications
  ALTER COLUMN selfie_key TYPE VARCHAR(1024),
  ADD COLUMN selfie_bucket VARCHAR(42) NOT NULL DEFAULT 'knotfiles';

ALTER TABLE messages
  ALTER COLUMN media_key TYPE VARCHAR(1024),
  ADD COLUMN media_bucket VARCHAR(42),
  ADD COLUMN media_size INT,
  ADD COLUMN media_type VARCHAR(100);
UPDATE messages SET media_bucket = 'knotfiles' WHERE media_key IS NOT NULL;

-- Direct browser uploads: a row is created when the server signs an upload URL, so the "complete" step only
-- accepts keys this server issued to this user. Rows never completed are swept (and their objects deleted).
CREATE TABLE uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(20) NOT NULL,                     -- photo | selfie | voice | video
  bucket VARCHAR(42) NOT NULL,
  key VARCHAR(1024) NOT NULL UNIQUE,
  content_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,       -- e.g. { conversationId }
  multipart_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX uploads_pending_idx ON uploads (created_at) WHERE completed_at IS NULL;
