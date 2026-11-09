# FUNCTIONALITY_MAPPING.md — Matrimony Application

This document maps all application features, frontend screens/components, custom hooks, backend endpoints, and data contracts to enable rapid feature discovery and safe refactoring.

---

## 1. Feature to Component & Endpoint Matrix

| Feature Area | UI Design ID | Screen / Component | Backend Endpoint | Custom Hook / Service |
| :--- | :--- | :--- | :--- | :--- |
| **Welcome Landing** | `2a` | `WelcomeScreen.jsx` | N/A | Navigation |
| **Phone Sign-In** | `2b` | `PhoneSignInScreen.jsx` | `POST /api/auth/send-otp` | `useAuth()` |
| **OTP Verification** | `2c` | `OTPVerifyScreen.jsx` | `POST /api/auth/verify-otp` | `useAuth()` |
| **DPDP Consent** | `2d` | `DPDPConsentScreen.jsx` | `POST /api/privacy/consent` | `useConsent()` |
| **Basics & Intent** | `2e` | `BasicsIntentScreen.jsx` | `PUT /api/profile/basics` | `useProfile()` |
| **Blueprint Intro** | `2f` | `BlueprintIntroScreen.jsx` | N/A | Navigation |
| **Blueprint Q&A Engine** | `2g` | `BlueprintQuestionScreen.jsx` | `POST /api/blueprint/answers` | `useBlueprint()` |
| **Blueprint Tuner** | `1a` | `BlueprintTunerScreen.jsx` | `PUT /api/blueprint/weights` | `useBlueprint()` |
| **Values & Vibes Picker** | `2h` | `ValuesVibesPickerScreen.jsx` | `POST /api/profile/vibes` | `useVibes()` |
| **Photo & ID Verification**| `2i` | `PhotoVerificationScreen.jsx` | `POST /api/profile/photos` | `usePhotos()` |
| **My Blueprint Summary** | `2j` | `MyBlueprintSummaryScreen.jsx` | `GET /api/blueprint/summary` | `useBlueprint()` |
| **Aligned Match Feed** | `1b` | `AlignedFeedScreen.jsx` | `GET /api/matches/feed` | `useMatches()` |
| **Scannable Profile List** | `3a` | `ProfileListScreen.jsx` | `GET /api/matches/list` | `useMatches()` |
| **Scoped Share Sheet** | `1c` | `ShareWithParentModal.jsx` | `POST /api/family/share` | `useFamilyShare()` |
| **Batch Send Sheet** | `3b` | `BatchSendModal.jsx` | `POST /api/family/share-batch` | `useFamilyShare()` |
| **Parent Portal (Read-Only)** | `1d` | `ParentPortalScreen.jsx` | `GET /api/family/portal/:token`<br>`POST /api/family/feedback` | `useParentPortal()` |
| **Sent & Family Feedback** | `3c` | `SentFamilyResponsesScreen.jsx` | `GET /api/family/sent` | `useFamilyShare()` |
| **Conversations List** | `2k` | `ConversationsListScreen.jsx` | `GET /api/chat/threads` | `useChat()` |
| **Blueprint Chat Thread** | `2l` | `ChatThreadScreen.jsx` | `GET /api/chat/:threadId/messages`<br>`POST /api/chat/:threadId/messages` | `useChatThread()` |
| **Link a Parent** | `2m` | `LinkParentScreen.jsx` | `POST /api/family/invite`<br>`GET /api/family/links` | `useFamilyLink()` |
| **Privacy & 72h Erasure** | `2n` | `PrivacyErasureScreen.jsx` | `GET /api/privacy/export-data`<br>`POST /api/privacy/erasure-request` | `usePrivacy()` |

---

## 2. Reusable Component Registry

| Component | Path | Description |
| :--- | :--- | :--- |
| `PillarBar` | `src/components/blueprint/PillarBar.jsx` | Visual horizontal progress bar with percentage value |
| `BlueprintSlider` | `src/components/blueprint/BlueprintSlider.jsx` | Interactive slider with dashed flexibility range bands |
| `RadialScoreGauge` | `src/components/feed/RadialScoreGauge.jsx` | Conic/radial score gauge badge (e.g., 87% Aligned) |
| `MatchCard` | `src/components/feed/MatchCard.jsx` | Full-detail card for the Aligned Feed with blurred portrait |
| `ProfileThumbnailRow`| `src/components/feed/ProfileThumbnailRow.jsx` | Horizontal photo strip scroller for candidate profiles |
| `VibeTileGrid` | `src/components/vibes/VibeTileGrid.jsx` | 3x3 selectable lifestyle tiles with image assets and active crimson fill |
| `SuggestedOpenerBanner`| `src/components/chat/SuggestedOpenerBanner.jsx`| AI/Blueprint-generated opener suggestion for chats |
| `FeedbackBadge` | `src/components/family/FeedbackBadge.jsx` | Parent approval ("AMMA APPROVED") or concern pill |
| `IOSDeviceFrame` | `src/components/common/IOSDeviceFrame.jsx` | Clean mobile viewport frame for interactive desktop preview |

---

## 3. Data Models & API Contracts (PostgreSQL `ab_matrimony`)

### PostgreSQL Connection Details
- **Connection URI**: `postgresql://postgres:Stu@123@187.127.178.200:5444/ab_matrimony`
- **Database Engine**: PostgreSQL 18.4
- **Client Pool**: `backend/src/config/db.js`
- **Store Operations**: `backend/src/store/pgStore.js`
- **Frontend Service Client**: `frontend/src/services/api.js`

### User & Profile Schema (`users` & `user_consents` tables)
```sql
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(32) UNIQUE,
  first_name VARCHAR(64) NOT NULL,
  birth_year_month VARCHAR(32),
  age INT,
  city VARCHAR(64),
  intent_timeline VARCHAR(64),
  family_involvement VARCHAR(64),
  profession VARCHAR(128),
  summary_note VARCHAR(255),
  quote TEXT,
  verified BOOLEAN DEFAULT TRUE,
  verified_date VARCHAR(64),
  photo_blurred_until_mutual BOOLEAN DEFAULT TRUE,
  hide_from_search_engines BOOLEAN DEFAULT TRUE,
  photos JSONB DEFAULT '[]'::jsonb,
  vibes JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  suggested_opener TEXT,
  is_current_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Blueprint Score Schema (`blueprints` table)
```sql
CREATE TABLE blueprints (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  money INT DEFAULT 72,
  money_flexibility VARCHAR(16) DEFAULT 'open',
  roots INT DEFAULT 31,
  roots_flexibility VARCHAR(16) DEFAULT 'firm',
  kids INT DEFAULT 58,
  kids_flexibility VARCHAR(16) DEFAULT 'open',
  ambition INT DEFAULT 84,
  ambition_flexibility VARCHAR(16) DEFAULT 'firm',
  summary_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Family Sharing Schema (`family_links` & `shared_to_family` tables)
```sql
CREATE TABLE family_links (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(32) NOT NULL, -- 'amma', 'appa'
  masked_phone VARCHAR(32) NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shared_to_family (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  candidate_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  access_rule VARCHAR(32) DEFAULT '30d',
  family_status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'approved', 'concern'
  family_note TEXT,
  shared_at TIMESTAMP DEFAULT NOW()
);
```

### Real-Time Chat Schema (`conversations` & `messages` tables)
```sql
CREATE TABLE conversations (
  id VARCHAR(64) PRIMARY KEY,
  user1_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  user2_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  last_message_text TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_suggested_opener BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Updates & Maintenance
Whenever new screens, helper functions, or state variables are introduced, update the respective rows and schemas in this document immediately.

---

## 5. Deployment & Infrastructure

| Component | Path | Purpose |
| :--- | :--- | :--- |
| **VPS Setup Script** | `backend/deploy/setup-server.sh` | One-time Hostinger VPS provisioning: Node.js 24, PM2, Nginx, Certbot, firewall, deploy user |
| **Deploy Script** | `backend/deploy/deploy.sh` | Pull code, install deps, build web app, start/restart PM2 |
| **Nginx Config** | `backend/deploy/nginx.conf` | Reverse proxy with WebSocket upgrade, SSL, security headers, gzip |
| **PM2 Config** | `backend/deploy/ecosystem.config.js` | Process management: restart policy, memory limits, logging |
| **Production Env** | `backend/.env.production` | Pre-filled production env template with TODO markers |
| **Deploy README** | `backend/deploy/README.md` | Step-by-step deployment instructions and troubleshooting |
| **Frontend Dist Package** | `frontend-dist.zip` | Production static bundle for Hostinger hPanel File Manager upload |
| **Frontend .htaccess** | `frontend/public/.htaccess` | Apache/LiteSpeed SPA rewrite rule for React Router |
