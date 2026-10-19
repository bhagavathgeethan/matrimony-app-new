-- Premium tiers (Plus / Premium / Family), trials, pausing, gifts, spotlights, super interests, voice notes,
-- contact sharing, privacy controls, family-assisted interests and the assisted (relationship manager) service.
-- What each tier includes lives in shared/plans.js.

ALTER TABLE users DROP CONSTRAINT users_plan_check;
ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'plus', 'premium', 'family'));

ALTER TABLE users
  ADD COLUMN trial_used_at TIMESTAMPTZ,
  ADD COLUMN plan_paused_at TIMESTAMPTZ,                -- paid time is frozen while paused
  ADD COLUMN paused_remaining_seconds INT,
  ADD COLUMN show_premium_badge BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN hide_activity BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN photo_visibility VARCHAR(10) CHECK (photo_visibility IN ('everyone', 'verified', 'aligned', 'accepted')),
  ADD COLUMN visibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { hideCities: [], ageMin, ageMax }
  ADD COLUMN spotlight_credits INT NOT NULL DEFAULT 0,
  ADD COLUMN assisted_until TIMESTAMPTZ;

ALTER TABLE conversations ADD COLUMN is_super BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE messages
  ADD COLUMN kind VARCHAR(8) NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'voice')),
  ADD COLUMN media_key VARCHAR(200),
  ADD COLUMN duration_ms INT;

ALTER TABLE saved_searches ADD COLUMN pending_count INT NOT NULL DEFAULT 0;   -- for the daily digest

ALTER TABLE payments
  ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'plan',          -- plan | spotlight | assisted
  ADD COLUMN beneficiary_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN gifted_by_link UUID REFERENCES family_links(id) ON DELETE SET NULL;

CREATE TABLE spotlights (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  source VARCHAR(10) NOT NULL CHECK (source IN ('plan', 'credit'))
);
CREATE INDEX spotlights_active_idx ON spotlights (ends_at, user_id);

CREATE TABLE contact_shares (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE interest_proposals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,          -- the member
  family_link_id UUID REFERENCES family_links(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note VARCHAR(500),
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX interest_proposals_user_idx ON interest_proposals (user_id, status);

CREATE TABLE assisted_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes VARCHAR(1000),
  call_time VARCHAR(60),
  status VARCHAR(10) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'active', 'closed')),
  manager_note VARCHAR(1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assisted_recommendations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note VARCHAR(500),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, candidate_id)
);
