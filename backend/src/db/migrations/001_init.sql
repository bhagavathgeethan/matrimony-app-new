-- Sangam schema v1: real multi-user data, no seed rows

CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(16) NOT NULL UNIQUE,              -- E.164, e.g. +919876543210
  first_name VARCHAR(60),
  gender VARCHAR(10) CHECK (gender IN ('woman', 'man')),
  birth_year INT CHECK (birth_year BETWEEN 1940 AND 2010),
  birth_month INT CHECK (birth_month BETWEEN 1 AND 12),
  city VARCHAR(80),
  intent_timeline VARCHAR(40),
  family_involvement VARCHAR(40),
  profession VARCHAR(100),
  quote VARCHAR(280),
  vibes JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_blurred_until_mutual BOOLEAN NOT NULL DEFAULT TRUE,
  hide_from_search_engines BOOLEAN NOT NULL DEFAULT TRUE,
  hide_from_contacts BOOLEAN NOT NULL DEFAULT TRUE,
  id_verified_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  phone VARCHAR(16) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX otp_codes_phone_idx ON otp_codes (phone, created_at DESC);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE consents (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  matching BOOLEAN NOT NULL DEFAULT TRUE,
  family_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  product_research BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blueprints (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  money INT NOT NULL CHECK (money BETWEEN 0 AND 100),
  money_flexibility VARCHAR(5) NOT NULL DEFAULT 'open' CHECK (money_flexibility IN ('open', 'firm')),
  roots INT NOT NULL CHECK (roots BETWEEN 0 AND 100),
  roots_flexibility VARCHAR(5) NOT NULL DEFAULT 'open' CHECK (roots_flexibility IN ('open', 'firm')),
  kids INT NOT NULL CHECK (kids BETWEEN 0 AND 100),
  kids_flexibility VARCHAR(5) NOT NULL DEFAULT 'open' CHECK (kids_flexibility IN ('open', 'firm')),
  ambition INT NOT NULL CHECK (ambition BETWEEN 0 AND 100),
  ambition_flexibility VARCHAR(5) NOT NULL DEFAULT 'open' CHECK (ambition_flexibility IN ('open', 'firm')),
  summary_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key VARCHAR(200) NOT NULL,              -- original image
  blur_key VARCHAR(200) NOT NULL,                 -- server-blurred copy shown before mutual interest
  mime VARCHAR(40) NOT NULL,
  size_bytes INT NOT NULL,
  position INT NOT NULL,                          -- 0 = primary
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX photos_user_idx ON photos (user_id, position);

CREATE TABLE match_passes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, candidate_id)
);

-- Two participants per conversation, stored in a canonical order (user_a < user_b).
-- ON DELETE SET NULL keeps the other person's history after an account is erased ("Former member").
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_a UUID REFERENCES users(id) ON DELETE SET NULL,
  user_b UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_a, user_b)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

CREATE TABLE conversation_reads (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE family_links (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(60) NOT NULL,
  relation VARCHAR(30),
  phone VARCHAR(16) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'linked', 'revoked')),
  portal_token CHAR(48) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX family_links_user_idx ON family_links (user_id);

CREATE TABLE family_shares (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_link_id UUID NOT NULL REFERENCES family_links(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL,
  child_note VARCHAR(500),
  expires_at TIMESTAMPTZ,                          -- NULL = never
  status VARCHAR(16) NOT NULL DEFAULT 'awaiting' CHECK (status IN ('awaiting', 'approved', 'concern_raised')),
  feedback_note VARCHAR(500),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX family_shares_user_idx ON family_shares (user_id, created_at DESC);
CREATE INDEX family_shares_link_idx ON family_shares (family_link_id);

-- Only a non-reversible reference to the user is kept, so the audit record survives erasure
CREATE TABLE erasure_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_ref CHAR(64) NOT NULL,
  receipt_hash VARCHAR(80) NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
