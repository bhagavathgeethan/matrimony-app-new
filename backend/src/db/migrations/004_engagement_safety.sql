-- Engagement, safety and operations:
-- interest requests, partner preferences, prompts, shortlists, profile views, daily picks, saved searches,
-- blocks and reports, ID verification, premium plans, admin roles, success stories, family votes and managers.

-- ---------- members ----------
ALTER TABLE users
  ADD COLUMN preferences JSONB NOT NULL DEFAULT '{}'::jsonb,       -- partner preferences (shared/preferences.js)
  ADD COLUMN prompts JSONB NOT NULL DEFAULT '[]'::jsonb,           -- [{ q, a }] profile prompts
  ADD COLUMN paused_at TIMESTAMPTZ,                                -- hidden from feed/search while paused
  ADD COLUMN moderation_hidden_at TIMESTAMPTZ,                     -- hidden after reports, until an admin reviews
  ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  ADD COLUMN plan VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  ADD COLUMN premium_until TIMESTAMPTZ,
  ADD COLUMN incognito BOOLEAN NOT NULL DEFAULT FALSE,             -- premium: browse without leaving profile views
  ADD COLUMN show_horoscope BOOLEAN NOT NULL DEFAULT FALSE,        -- opt-in porutham matching
  ADD COLUMN last_nudged_at TIMESTAMPTZ,
  ADD COLUMN daily_picks_notified_on DATE;

-- ---------- interest requests (a conversation starts as a request) ----------
ALTER TABLE conversations
  ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined')),
  ADD COLUMN requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN responded_at TIMESTAMPTZ;

-- Existing threads: accepted where both sides wrote, otherwise a request from whoever wrote first
UPDATE conversations c SET
  status = CASE
    WHEN EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.sender_id = c.user_a)
     AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.sender_id = c.user_b)
    THEN 'accepted' ELSE 'requested' END,
  requested_by = COALESCE(
    (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id AND m.sender_id IS NOT NULL ORDER BY m.created_at LIMIT 1),
    c.user_a),
  responded_at = NULL;

CREATE INDEX conversations_requested_by_idx ON conversations (requested_by, created_at);

-- ---------- discovery ----------
CREATE TABLE shortlists (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, candidate_id)
);
CREATE INDEX shortlists_candidate_idx ON shortlists (candidate_id);

CREATE TABLE profile_views (
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (viewer_id, viewed_id, viewed_on)
);
CREATE INDEX profile_views_viewed_idx ON profile_views (viewed_id, viewed_at DESC);

CREATE TABLE daily_picks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  candidate_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day)
);

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  filters JSONB NOT NULL,
  alerts BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_alert_at TIMESTAMPTZ
);
CREATE INDEX saved_searches_user_idx ON saved_searches (user_id);

-- ---------- safety ----------
CREATE TABLE blocks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, blocked_id)
);
CREATE INDEX blocks_blocked_idx ON blocks (blocked_id);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(40) NOT NULL,
  details VARCHAR(1000),
  status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX reports_status_idx ON reports (status, created_at);
CREATE INDEX reports_reported_idx ON reports (reported_id);

CREATE TABLE verifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selfie_key VARCHAR(200) NOT NULL,                 -- private storage, never served publicly
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX verifications_status_idx ON verifications (status, created_at);

-- ---------- premium ----------
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_code VARCHAR(20) NOT NULL,
  amount_paise INT NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_ref VARCHAR(100),
  status VARCHAR(10) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX payments_user_idx ON payments (user_id, created_at DESC);

-- ---------- success stories ----------
CREATE TABLE success_stories (
  id UUID PRIMARY KEY,
  submitted_by UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  title VARCHAR(100) NOT NULL,
  story VARCHAR(1500) NOT NULL,
  display_names VARCHAR(80) NOT NULL,               -- e.g. "Kavya & Arun"
  status VARCHAR(16) NOT NULL DEFAULT 'pending_partner'
    CHECK (status IN ('pending_partner', 'pending_review', 'published', 'rejected')),
  partner_confirmed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX success_stories_status_idx ON success_stories (status, published_at DESC);

-- ---------- family ----------
ALTER TABLE family_shares DROP CONSTRAINT family_shares_status_check;
ALTER TABLE family_shares ADD CONSTRAINT family_shares_status_check
  CHECK (status IN ('awaiting', 'approved', 'unsure', 'concern_raised'));
ALTER TABLE family_links ADD COLUMN can_manage BOOLEAN NOT NULL DEFAULT FALSE;  -- may edit personal details from the portal
