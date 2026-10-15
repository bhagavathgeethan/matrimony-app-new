// The signed-in user's own profile: basics, consent, privacy, blueprint, vibes, photos, onboarding
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const { synthesizeArchetype } = require('../services/blueprintEngine');
const {
  httpError, newId, parseBirthYearMonth, formatBirthYearMonth, ageFrom,
} = require('../lib/util');
const { route, optionalString, optionalBoolean, oneOf } = require('../lib/http');
const { validatePreferences } = require('../../../shared/preferences.js');
const { validatePrompts } = require('../../../shared/engagement.js');
const { isPremium } = require('../lib/members');
const {
  FIELD_BY_KEY, ONBOARDING_REQUIRED_KEYS, isFilled, validateDetails, crossFieldErrors, profileCompletion,
} = require('../../../shared/profileFields.js');

const router = express.Router();

const PILLARS = ['money', 'roots', 'kids', 'ambition'];
const FLEXIBILITY = ['open', 'firm'];
const TIMELINES = ['Marriage this year', 'Marriage in 1–2 years', 'Open, no timeline'];
const INVOLVEMENT = ['I decide alone', 'I consult my parents', 'Parents lead'];
const VIBES = [
  'Temple mornings', 'Trekking', 'Cooking together', 'Big joint family', 'Quiet weekends', 'Nightlife',
  'Dogs everywhere', 'Festivals, loud', 'Vegetarian home', 'Filter coffee & book', 'Early gym sessions', 'Art & theater',
];
const MAX_VIBES = 6;

// ---------- reading ----------

function blueprintFromRow(bp) {
  if (!bp) return null;
  return {
    money: bp.money,
    moneyFlexibility: bp.money_flexibility,
    roots: bp.roots,
    rootsFlexibility: bp.roots_flexibility,
    kids: bp.kids,
    kidsFlexibility: bp.kids_flexibility,
    ambition: bp.ambition,
    ambitionFlexibility: bp.ambition_flexibility,
    summaryText: bp.summary_text,
  };
}

const photoUrls = (p) => ({ id: p.id, url: storage.url(p.storage_key), blurUrl: storage.url(p.blur_key), position: p.position });

// Column-backed personal fields, by the key the apps use
const DETAIL_COLUMNS = { firstName: 'first_name', city: 'city', profession: 'profession' };

// All personal-detail values for a user row: the JSONB details plus the column-backed fields
function detailValues(u) {
  const values = { ...(u.details || {}) };
  for (const [key, col] of Object.entries(DETAIL_COLUMNS)) values[key] = u[col] ?? null;
  return values;
}

function onboardingState(u, { hasConsent, blueprint, photoCount }) {
  const details = detailValues(u);
  const steps = {
    consent: hasConsent,
    basics: Boolean(u.first_name && u.gender && u.birth_year && u.city),
    personal: ONBOARDING_REQUIRED_KEYS.every((k) => isFilled(details[k])),
    blueprint: Boolean(blueprint),
    vibes: (u.vibes || []).length > 0,
    photos: photoCount > 0,
  };
  // Vibes are optional; everything else is required before matching.
  // Accounts that finished onboarding before the personal step existed are not sent back to it.
  const order = [['consent', 'consent'], ['basics', 'basics'], ['personal', 'personal'], ['blueprint', 'blueprint-intro'], ['photos', 'photos']];
  const missing = order.find(([key]) => !steps[key]);
  return {
    ...steps,
    completed: Boolean(u.onboarding_completed_at),
    canComplete: !missing,
    nextScreen: u.onboarding_completed_at ? 'feed' : missing ? missing[1] : 'blueprint-summary',
  };
}

function completionFor(u, blueprint, photoCount) {
  return profileCompletion(detailValues(u), {
    hasBlueprint: Boolean(blueprint),
    photoCount,
    vibeCount: (u.vibes || []).length,
    hasQuote: Boolean(u.quote),
    hasPreferences: Object.values(u.preferences || {}).some((v) => v !== null),
    promptCount: (u.prompts || []).length,
  });
}

async function getProfile(userId) {
  const u = (await db.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
  if (!u) throw httpError(404, 'Account not found', 'NO_ACCOUNT');
  const [bpRes, consentRes, photoRes, erasureRes] = await Promise.all([
    db.query('SELECT * FROM blueprints WHERE user_id = $1', [userId]),
    db.query('SELECT * FROM consents WHERE user_id = $1', [userId]),
    db.query('SELECT * FROM photos WHERE user_id = $1 ORDER BY position', [userId]),
    db.query(
      'SELECT scheduled_for FROM erasure_requests WHERE user_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL',
      [userId]
    ),
  ]);
  const blueprint = blueprintFromRow(bpRes.rows[0]);
  const c = consentRes.rows[0];
  const photos = photoRes.rows.map(photoUrls);
  const completion = completionFor(u, blueprint, photos.length);

  return {
    id: u.id,
    phone: u.phone,
    firstName: u.first_name,
    gender: u.gender,
    birthYearMonth: formatBirthYearMonth(u.birth_year, u.birth_month),
    age: ageFrom(u.birth_year, u.birth_month),
    city: u.city,
    intentTimeline: u.intent_timeline,
    familyInvolvement: u.family_involvement,
    profession: u.profession,
    quote: u.quote,
    vibes: u.vibes || [],
    photos,
    verified: Boolean(u.id_verified_at),
    photoBlurredUntilMutual: u.photo_blurred_until_mutual,
    hideFromSearchEngines: u.hide_from_search_engines,
    hideFromContacts: u.hide_from_contacts,
    incognito: u.incognito,
    showHoroscope: u.show_horoscope,
    paused: Boolean(u.paused_at),
    hiddenByModeration: Boolean(u.moderation_hidden_at),
    role: u.role,
    plan: isPremium(u) ? 'premium' : 'free',
    premiumUntil: isPremium(u) ? u.premium_until : null,
    preferences: u.preferences || {},
    prompts: u.prompts || [],
    blueprint,
    details: detailValues(u),
    profileCompletion: completion,
    profileStrength: completion.percent,
    consent: c
      ? {
          matching: c.matching,
          familySharing: c.family_sharing,
          productResearch: c.product_research,
          marketing: c.marketing,
          updatedAt: c.updated_at,
        }
      : null,
    onboarding: onboardingState(u, { hasConsent: Boolean(c), blueprint, photoCount: photos.length }),
    notificationPrefs: { messages: true, matches: true, family: true, tips: true, push: true, ...(u.notification_prefs || {}) },
    erasureScheduledFor: erasureRes.rows[0]?.scheduled_for || null,
    createdAt: u.created_at,
  };
}

// ---------- writing ----------

async function updateBasics(userId, body) {
  const firstName = optionalString(body, 'firstName', { max: 60 });
  const city = optionalString(body, 'city', { max: 80 });
  const profession = optionalString(body, 'profession', { max: 100, allowEmpty: true });
  const quote = optionalString(body, 'quote', { max: 280, allowEmpty: true });
  const gender = oneOf(body, 'gender', ['woman', 'man']);
  const intentTimeline = oneOf(body, 'intentTimeline', TIMELINES);
  const familyInvolvement = oneOf(body, 'familyInvolvement', INVOLVEMENT);

  let birth;
  if (body.birthYearMonth !== undefined) {
    birth = parseBirthYearMonth(body.birthYearMonth);
    if (!birth) throw httpError(400, 'Enter your birth month and year like "Mar 1997"');
    const age = ageFrom(birth.year, birth.month);
    if (age < 18) throw httpError(400, 'You must be at least 18 to use Sangam');
    if (age > 80) throw httpError(400, 'Please check your birth year');
  }

  await db.query(
    `UPDATE users SET
       first_name = COALESCE($2, first_name),
       city = COALESCE($3, city),
       gender = COALESCE($4, gender),
       birth_year = COALESCE($5, birth_year),
       birth_month = COALESCE($6, birth_month),
       intent_timeline = COALESCE($7, intent_timeline),
       family_involvement = COALESCE($8, family_involvement),
       profession = CASE WHEN $9::boolean THEN NULLIF($10, '') ELSE profession END,
       quote = CASE WHEN $11::boolean THEN NULLIF($12, '') ELSE quote END,
       updated_at = NOW()
     WHERE id = $1`,
    [
      userId, firstName, city, gender, birth?.year, birth?.month, intentTimeline, familyInvolvement,
      profession !== undefined, profession ?? null, quote !== undefined, quote ?? null,
    ]
  );
  return getProfile(userId);
}

// Partial update of personal details; null or '' clears a field
async function updateDetails(userId, body) {
  const { values, errors } = validateDetails(body);
  if (errors.length) throw httpError(400, errors[0], 'INVALID_DETAILS');
  if (!Object.keys(values).length) throw httpError(400, 'Nothing to update');

  const u = (await db.query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
  if (!u) throw httpError(404, 'Account not found', 'NO_ACCOUNT');
  const merged = { ...detailValues(u), ...values };
  // Clearing siblings also clears how many of them are married
  for (const [count, married] of [['brothers', 'brothersMarried'], ['sisters', 'sistersMarried']]) {
    if (!isFilled(merged[count])) {
      merged[married] = null;
      values[married] = null;
    }
  }
  const crossErrors = crossFieldErrors(merged);
  if (crossErrors.length) throw httpError(400, crossErrors[0], 'INVALID_DETAILS');

  const details = { ...(u.details || {}) };
  const columns = {};
  for (const [key, value] of Object.entries(values)) {
    if (FIELD_BY_KEY[key].column) columns[DETAIL_COLUMNS[key]] = value;
    else if (value === null) delete details[key];
    else details[key] = value;
  }
  const sets = ['details = $2', 'updated_at = NOW()'];
  const params = [userId, JSON.stringify(details)];
  for (const [col, value] of Object.entries(columns)) {
    params.push(value);
    sets.push(`${col} = $${params.length}`);
  }
  await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, params);
  return getProfile(userId);
}

async function updateConsent(userId, body) {
  const matching = optionalBoolean(body, 'matching');
  const familySharing = optionalBoolean(body, 'familySharing');
  const productResearch = optionalBoolean(body, 'productResearch');
  const marketing = optionalBoolean(body, 'marketing');
  if (matching === false) {
    throw httpError(400, 'Matching consent is required to use Sangam. To withdraw it, request account erasure.');
  }
  await db.query(
    `INSERT INTO consents (user_id, matching, family_sharing, product_research, marketing, updated_at)
     VALUES ($1, TRUE, COALESCE($2, FALSE), COALESCE($3, FALSE), COALESCE($4, FALSE), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       family_sharing = COALESCE($2, consents.family_sharing),
       product_research = COALESCE($3, consents.product_research),
       marketing = COALESCE($4, consents.marketing),
       updated_at = NOW()`,
    [userId, familySharing, productResearch, marketing]
  );
  return (await getProfile(userId)).consent;
}

async function updatePrivacy(userId, body) {
  const blur = optionalBoolean(body, 'photoBlurredUntilMutual');
  const hideSearch = optionalBoolean(body, 'hideFromSearchEngines');
  const hideContacts = optionalBoolean(body, 'hideFromContacts');
  const incognito = optionalBoolean(body, 'incognito');
  const showHoroscope = optionalBoolean(body, 'showHoroscope');
  if (incognito) {
    const u = (await db.query('SELECT plan, premium_until FROM users WHERE id = $1', [userId])).rows[0];
    if (!isPremium(u)) throw httpError(403, 'Incognito browsing is a Premium feature', 'PREMIUM_REQUIRED');
  }
  await db.query(
    `UPDATE users SET
       photo_blurred_until_mutual = COALESCE($2, photo_blurred_until_mutual),
       hide_from_search_engines = COALESCE($3, hide_from_search_engines),
       hide_from_contacts = COALESCE($4, hide_from_contacts),
       incognito = COALESCE($5, incognito),
       show_horoscope = COALESCE($6, show_horoscope),
       updated_at = NOW()
     WHERE id = $1`,
    [userId, blur, hideSearch, hideContacts, incognito, showHoroscope]
  );
  return getProfile(userId);
}

// Partner preferences (partial; null clears one)
async function updatePreferences(userId, body) {
  const { values, errors } = validatePreferences(body);
  if (errors.length) throw httpError(400, errors[0], 'INVALID_PREFERENCES');
  const current = (await db.query('SELECT preferences FROM users WHERE id = $1', [userId])).rows[0]?.preferences || {};
  const merged = { ...current };
  for (const [k, v] of Object.entries(values)) {
    if (v === null) delete merged[k];
    else merged[k] = v;
  }
  await db.query('UPDATE users SET preferences = $2, updated_at = NOW() WHERE id = $1', [userId, JSON.stringify(merged)]);
  return getProfile(userId);
}

async function updatePrompts(userId, prompts) {
  const { values, error } = validatePrompts(prompts);
  if (error) throw httpError(400, error);
  await db.query('UPDATE users SET prompts = $2, updated_at = NOW() WHERE id = $1', [userId, JSON.stringify(values)]);
  return getProfile(userId);
}

// Pause hides you from the feed and search; existing conversations carry on
async function updateStatus(userId, body) {
  const paused = optionalBoolean(body, 'paused');
  if (paused === undefined) throw httpError(400, 'paused must be true or false');
  await db.query('UPDATE users SET paused_at = CASE WHEN $2 THEN COALESCE(paused_at, NOW()) ELSE NULL END WHERE id = $1', [userId, paused]);
  return getProfile(userId);
}

async function updateVibes(userId, vibes) {
  if (!Array.isArray(vibes) || vibes.some((v) => !VIBES.includes(v))) {
    throw httpError(400, 'Pick vibes from the list');
  }
  const unique = [...new Set(vibes)];
  if (unique.length > MAX_VIBES) throw httpError(400, `Pick at most ${MAX_VIBES} vibes`);
  await db.query('UPDATE users SET vibes = $2, updated_at = NOW() WHERE id = $1', [userId, JSON.stringify(unique)]);
  return unique;
}

// Partial updates merge with the saved blueprint; the first save needs all four pillars
async function updateBlueprint(userId, body) {
  for (const pillar of PILLARS) {
    const value = body[pillar];
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) {
      throw httpError(400, `${pillar} must be a number between 0 and 100`);
    }
    oneOf(body, `${pillar}Flexibility`, FLEXIBILITY);
  }
  const current = blueprintFromRow((await db.query('SELECT * FROM blueprints WHERE user_id = $1', [userId])).rows[0]);
  const merged = { ...(current || {}) };
  for (const pillar of PILLARS) {
    if (body[pillar] !== undefined) merged[pillar] = Math.round(body[pillar]);
    if (body[`${pillar}Flexibility`] !== undefined) merged[`${pillar}Flexibility`] = body[`${pillar}Flexibility`];
    if (merged[`${pillar}Flexibility`] === undefined) merged[`${pillar}Flexibility`] = 'open';
  }
  const missing = PILLARS.filter((p) => merged[p] === undefined);
  if (missing.length) {
    // The money question comes first; the other pillars default to the middle until the tuner is saved
    for (const p of missing) merged[p] = 50;
  }
  merged.summaryText = synthesizeArchetype(merged);

  await db.query(
    `INSERT INTO blueprints (user_id, money, money_flexibility, roots, roots_flexibility, kids, kids_flexibility,
                             ambition, ambition_flexibility, summary_text, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       money = $2, money_flexibility = $3, roots = $4, roots_flexibility = $5, kids = $6, kids_flexibility = $7,
       ambition = $8, ambition_flexibility = $9, summary_text = $10, updated_at = NOW()`,
    [
      userId, merged.money, merged.moneyFlexibility, merged.roots, merged.rootsFlexibility, merged.kids,
      merged.kidsFlexibility, merged.ambition, merged.ambitionFlexibility, merged.summaryText,
    ]
  );
  return merged;
}

// ---------- photos ----------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
});

async function addPhoto(userId, file) {
  if (!file) throw httpError(400, 'Attach a photo in the "photo" field');
  const count = Number((await db.query('SELECT COUNT(*) FROM photos WHERE user_id = $1', [userId])).rows[0].count);
  if (count >= env.MAX_PHOTOS) throw httpError(400, `You can add up to ${env.MAX_PHOTOS} photos`);

  // Trust the decoded image, not the client's content-type
  let meta;
  try {
    meta = await sharp(file.buffer).metadata();
  } catch {
    throw httpError(400, 'That file is not a supported image');
  }
  if (!['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) {
    throw httpError(400, 'Use a JPG, PNG, WEBP or HEIC photo');
  }

  // Normalise: auto-rotate, cap size, re-encode as JPEG and drop EXIF (location etc.)
  const original = await sharp(file.buffer).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  const blurred = await sharp(original).resize({ width: 480, withoutEnlargement: true }).blur(28)
    .jpeg({ quality: 70 }).toBuffer();

  const id = newId();
  const storageKey = `users/${userId}/${id}.jpg`;
  const blurKey = `users/${userId}/${id}-blur.jpg`;
  await storage.put(storageKey, original, 'image/jpeg');
  await storage.put(blurKey, blurred, 'image/jpeg');

  try {
    await db.query(
      `INSERT INTO photos (id, user_id, storage_key, blur_key, mime, size_bytes, position)
       VALUES ($1, $2, $3, $4, 'image/jpeg', $5,
               (SELECT COALESCE(MAX(position) + 1, 0) FROM photos WHERE user_id = $2))`,
      [id, userId, storageKey, blurKey, original.length]
    );
  } catch (err) {
    await storage.remove(storageKey);
    await storage.remove(blurKey);
    throw err;
  }
  return getProfile(userId);
}

async function deletePhoto(userId, photoId) {
  const res = await db.query('DELETE FROM photos WHERE id = $1 AND user_id = $2 RETURNING *', [photoId, userId]);
  const photo = res.rows[0];
  if (!photo) throw httpError(404, 'Photo not found');
  await storage.remove(photo.storage_key);
  await storage.remove(photo.blur_key);
  await renumberPhotos(userId);
  return getProfile(userId);
}

async function renumberPhotos(userId, firstId) {
  const rows = (await db.query('SELECT id FROM photos WHERE user_id = $1 ORDER BY position', [userId])).rows;
  const ordered = firstId ? [firstId, ...rows.map((r) => r.id).filter((id) => id !== firstId)] : rows.map((r) => r.id);
  for (const [i, id] of ordered.entries()) {
    await db.query('UPDATE photos SET position = $1 WHERE id = $2', [i, id]);
  }
}

async function makePrimary(userId, photoId) {
  const exists = await db.query('SELECT 1 FROM photos WHERE id = $1 AND user_id = $2', [photoId, userId]);
  if (!exists.rows.length) throw httpError(404, 'Photo not found');
  await renumberPhotos(userId, photoId);
  return getProfile(userId);
}

async function completeOnboarding(userId) {
  const profile = await getProfile(userId);
  if (!profile.onboarding.canComplete) {
    throw httpError(400, `Finish your ${profile.onboarding.nextScreen.replace('-intro', '')} step first`, 'ONBOARDING_INCOMPLETE');
  }
  const res = await db.query(
    'UPDATE users SET onboarding_completed_at = NOW() WHERE id = $1 AND onboarding_completed_at IS NULL RETURNING id',
    [userId]
  );
  if (res.rows.length) {
    // First completion only. Lazy require: matches.js depends on this module.
    await require('./matches').alertNewMember(userId);
    await require('./search').alertSavedSearches(userId);
  }
  return getProfile(userId);
}

// ---------- routes (all require auth; mounted at /api/me) ----------

router.get('/', route(async (req, res) => res.json(await getProfile(req.userId))));
router.put('/basics', route(async (req, res) => res.json(await updateBasics(req.userId, req.body || {}))));
router.put('/preferences', route(async (req, res) => res.json(await updatePreferences(req.userId, req.body || {}))));
router.put('/prompts', route(async (req, res) => res.json(await updatePrompts(req.userId, req.body?.prompts))));
router.put('/status', route(async (req, res) => res.json(await updateStatus(req.userId, req.body || {}))));
router.put('/details', route(async (req, res) => res.json(await updateDetails(req.userId, req.body || {}))));
router.put('/consent', route(async (req, res) => res.json({ consent: await updateConsent(req.userId, req.body || {}) })));
router.put('/privacy', route(async (req, res) => res.json(await updatePrivacy(req.userId, req.body || {}))));
router.put('/vibes', route(async (req, res) => res.json({ vibes: await updateVibes(req.userId, req.body?.vibes) })));
router.put('/blueprint', route(async (req, res) => res.json({ blueprint: await updateBlueprint(req.userId, req.body || {}) })));
router.post('/photos', upload.single('photo'), route(async (req, res) => res.status(201).json(await addPhoto(req.userId, req.file))));
router.delete('/photos/:id', route(async (req, res) => res.json(await deletePhoto(req.userId, req.params.id))));
router.put('/photos/:id/primary', route(async (req, res) => res.json(await makePrimary(req.userId, req.params.id))));
router.post('/onboarding/complete', route(async (req, res) => res.json(await completeOnboarding(req.userId))));

module.exports = { router, getProfile, blueprintFromRow, detailValues, updateDetails, VIBES };
