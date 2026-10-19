// Match feed and discovery: scored cards, daily picks, shortlist, profile views and "why we matched"
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const realtime = require('../services/realtime');
const { computeMatchScore, calculatePillarOverlap } = require('../services/blueprintEngine');
const { blueprintFromRow, detailValues } = require('./profile');
const { httpError, ageFrom, relativeTime } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route } = require('../lib/http');
const { VISIBLE_USER_SQL, notBlockedSql, isPremium, planOf, has, limitOf, requireFeature, todayIST } = require('../lib/members');
const { preferenceMatch } = require('../../../shared/preferences.js');
const { activityLabel, PICK_REASONS, CONVERSATION_PROMPTS } = require('../../../shared/engagement.js');
const { porutham } = require('../../../shared/porutham.js');

const router = express.Router();
const PILLARS = ['money', 'roots', 'kids', 'ambition'];

const OPENERS = {
  money: 'You’re closely aligned on money — ask how they’d handle an unexpected windfall.',
  roots: 'You see home the same way — ask where they actually picture living at 40.',
  kids: 'Your plans for kids line up — ask what being a hands-on parent looks like to them.',
  ambition: 'Similar ambition — ask how they protect evenings when work gets intense.',
};

const bestPillar = (scores) => [...PILLARS].sort((a, b) => scores[b] - scores[a])[0];
const suggestedOpener = (scores) => OPENERS[bestPillar(scores)];

function summaryNote(bp) {
  if (!bp) return null;
  return [bp.money > 60 ? 'saver' : 'spender', bp.roots < 45 ? 'open to moving' : 'rooted', bp.kids > 50 ? 'kids soon' : 'kids later']
    .join(' · ');
}

// Interest state between the viewer and each candidate: candidateId -> { conversationId, status, byMe }
async function relationsFor(viewerId, candidateIds) {
  const map = new Map();
  if (!candidateIds.length) return map;
  const res = await db.query(
    `SELECT c.id, c.status, c.requested_by, CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS other_id
     FROM conversations c
     WHERE (c.user_a = $1 AND c.user_b = ANY($2::uuid[])) OR (c.user_b = $1 AND c.user_a = ANY($2::uuid[]))`,
    [viewerId, candidateIds]
  );
  for (const r of res.rows) map.set(r.other_id, { conversationId: r.id, status: r.status, byMe: r.requested_by === viewerId });
  return map;
}

// Accepted interest = mutual (photos unblur, chat and calls unlock)
async function mutualSet(viewerId, candidateIds) {
  const rel = await relationsFor(viewerId, candidateIds);
  return new Set([...rel].filter(([, r]) => r.status === 'accepted').map(([id]) => id));
}

async function photosByUser(userIds) {
  if (!userIds.length) return new Map();
  const res = await db.query('SELECT * FROM photos WHERE user_id = ANY($1::uuid[]) ORDER BY position', [userIds]);
  const map = new Map();
  for (const p of res.rows) {
    if (!map.has(p.user_id)) map.set(p.user_id, []);
    map.get(p.user_id).push(p);
  }
  return map;
}

// Photos as seen by someone else. Premium owners choose who sees them clearly (photo_visibility); otherwise
// photos are blurred until mutual interest if the owner asked for that.
function photosClearFor(owner, { isMutual = false, viewerVerified = false, score = 0 } = {}) {
  if (isMutual) return true;
  const rule = has(owner, 'photoPrivacy') ? owner.photo_visibility : null;
  if (rule === 'everyone') return true;
  if (rule === 'verified') return viewerVerified;
  if (rule === 'aligned') return score >= 80;
  if (rule === 'accepted') return false;
  return !owner.photo_blurred_until_mutual;
}

function visiblePhotos(owner, photos, ctx) {
  const context = typeof ctx === 'boolean' ? { isMutual: ctx } : ctx || {};
  const blurred = !photosClearFor(owner, context);
  return {
    photos: (photos || []).map((p) => storage.url(blurred ? p.blur_key : p.storage_key)),
    photoBlurred: blurred,
  };
}

// Personal details someone else sees: only the fields that are filled in
function filledDetails(row) {
  return Object.fromEntries(Object.entries(detailValues(row)).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && !v.length)));
}

const personOf = (row) => ({ age: ageFrom(row.birth_year, row.birth_month), details: detailValues(row) });

// A premium member's visibility rules can hide them from some viewers (by city or age)
function visibleTo(row, viewer) {
  const rules = has(row, 'visibilityRules') ? row.visibility_rules || {} : {};
  const city = (viewer.city || '').trim().toLowerCase();
  if (city && (rules.hideCities || []).some((c) => c.trim().toLowerCase() === city)) return false;
  const age = ageFrom(viewer.birth_year, viewer.birth_month);
  if (rules.ageMin && age < rules.ageMin) return false;
  if (rules.ageMax && age > rules.ageMax) return false;
  return true;
}

function toCard(row, viewer, { photos, relation = null, shortlisted = false, spotlight = false }) {
  const bp = blueprintFromRow(row.bp);
  const overlapScores = computeMatchScore(viewer.blueprint, bp);
  const mine = new Set(viewer.vibes || []);
  const sharedVibes = (row.vibes || []).filter((v) => mine.has(v));
  const isMutual = relation?.status === 'accepted';
  const details = filledDetails(row);
  return {
    id: row.id,
    firstName: row.first_name,
    age: ageFrom(row.birth_year, row.birth_month),
    city: row.city,
    profession: row.profession,
    quote: row.quote,
    verified: Boolean(row.id_verified_at),
    verifiedDate: row.id_verified_at ? `ID verified ${relativeTime(row.id_verified_at).toLowerCase()}` : 'Phone verified',
    // Plan badge (members on Plus and above may hide it)
    premium: isPremium(row) && (row.show_premium_badge !== false || !has(row, 'badgeChoice')),
    tier: isPremium(row) && (row.show_premium_badge !== false || !has(row, 'badgeChoice')) ? planOf(row) : null,
    spotlight,
    ...(row.hide_activity && has(row, 'hideActivity')
      ? { activity: null, activeRecently: false }
      : {
          activity: activityLabel(row.last_active_at, realtime.isOnline(row.id)),
          activeRecently: Date.now() - new Date(row.last_active_at).getTime() < 24 * 3600 * 1000,
        }),
    managedByFamily: Boolean(details.profileCreatedBy && details.profileCreatedBy !== 'Self'),
    vibes: row.vibes || [],
    tags: sharedVibes.slice(0, 3).map((v) => `Both: ${v}`),
    summaryNote: summaryNote(bp),
    suggestedOpener: suggestedOpener(overlapScores),
    overlapScores,
    details,
    prompts: row.prompts || [],
    lookingFor: row.preferences || {},
    // How they fit what you want, and how you fit what they want
    fitsMyPreferences: preferenceMatch(viewer.preferences, { age: ageFrom(row.birth_year, row.birth_month), details }),
    iFitTheirPreferences: preferenceMatch(row.preferences, personOf(viewer)),
    interest: relation ? { status: relation.status, byMe: relation.byMe, conversationId: relation.conversationId } : null,
    shortlisted,
    ...visiblePhotos(row, photos, { isMutual, viewerVerified: Boolean(viewer.id_verified_at), score: overlapScores.overall }),
  };
}

// Members whose spotlight is on right now
async function spotlightSet(ids) {
  if (!ids.length) return new Set();
  const res = await db.query('SELECT DISTINCT user_id FROM spotlights WHERE ends_at > NOW() AND user_id = ANY($1::uuid[])', [ids]);
  return new Set(res.rows.map((r) => r.user_id));
}

// Cards for many rows at once (photos, interest state and shortlist looked up in bulk)
async function buildCards(viewer, rows) {
  const ids = rows.map((r) => r.id);
  const [photos, relations, shortlist, spot] = await Promise.all([
    photosByUser(ids),
    relationsFor(viewer.id, ids),
    ids.length
      ? db.query('SELECT candidate_id FROM shortlists WHERE user_id = $1 AND candidate_id = ANY($2::uuid[])', [viewer.id, ids])
      : { rows: [] },
    spotlightSet(ids),
  ]);
  const listed = new Set(shortlist.rows.map((r) => r.candidate_id));
  return rows.map((row) => toCard(row, viewer, {
    photos: photos.get(row.id), relation: relations.get(row.id), shortlisted: listed.has(row.id), spotlight: spot.has(row.id),
  }));
}

async function loadViewer(userId) {
  const res = await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp FROM users u LEFT JOIN blueprints b ON b.user_id = u.id WHERE u.id = $1`,
    [userId]
  );
  const viewer = res.rows[0];
  if (!viewer) throw httpError(404, 'Account not found');
  if (!viewer.bp) throw httpError(400, 'Save your blueprint first', 'NO_BLUEPRINT');
  return { ...viewer, blueprint: blueprintFromRow(viewer.bp) };
}

// Everyone the viewer may see: visible, other gender, not passed, not blocked either way
async function poolRows(viewer, { extraWhere = '', params = [] } = {}) {
  const res = await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp
     FROM users u JOIN blueprints b ON b.user_id = u.id
     WHERE u.id <> $1 AND ${VISIBLE_USER_SQL}
       AND ($2::text IS NULL OR u.gender <> $2)
       AND NOT EXISTS (SELECT 1 FROM match_passes p WHERE p.user_id = $1 AND p.candidate_id = u.id)
       AND ${notBlockedSql('$1')}
       ${extraWhere}`,
    [viewer.id, viewer.gender, ...params]
  );
  return res.rows.filter((row) => visibleTo(row, viewer));
}

async function getFeed(userId, filter) {
  const viewer = await loadViewer(userId);
  let cards = await buildCards(viewer, await poolRows(viewer));
  if (filter === '80+') cards = cards.filter((c) => c.overlapScores.overall >= 80);
  if (filter === 'verified') cards = cards.filter((c) => c.verified);
  // Spotlighted members who align strongly (80%+) with the viewer come first
  const lit = (c) => (c.spotlight && c.overlapScores.overall >= 80 ? 1 : 0);
  cards.sort((a, b) => lit(b) - lit(a) || b.overlapScores.overall - a.overlapScores.overall);
  return cards;
}

// One candidate as seen by the viewer; null if they are not (or no longer) visible to them
async function getCandidate(viewerId, candidateId, { requireVisible = true } = {}) {
  const viewer = await loadViewer(viewerId);
  const res = await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp FROM users u JOIN blueprints b ON b.user_id = u.id
     WHERE u.id = $2 AND u.id <> $1 AND ${notBlockedSql('$1')} ${requireVisible ? `AND ${VISIBLE_USER_SQL}` : ''}`,
    [viewerId, candidateId]
  );
  const row = res.rows[0];
  if (!row || (requireVisible && !visibleTo(row, viewer))) return null;
  return (await buildCards(viewer, [row]))[0];
}

// ---------- daily picks ----------

function pickReason(card, viewer) {
  const parts = [PICK_REASONS[bestPillar(card.overlapScores)]];
  const shared = (card.vibes || []).filter((v) => (viewer.vibes || []).includes(v));
  if (shared.length) parts.push(`both into ${shared[0].toLowerCase()}`);
  if (card.fitsMyPreferences.total > 0 && card.fitsMyPreferences.items.every((i) => i.met !== false)) parts.push('fits your preferences');
  return parts.join(' · ');
}

// People chosen once per (Indian) day: best fit among people you haven't contacted, preferring anyone not picked in
// the last week. 5 a day (10 on Premium); strongly aligned Premium members get a small boost ("featured").
async function choosePicks(viewer, day, kept, count) {
  const rows = await poolRows(viewer, {
    extraWhere: `AND NOT EXISTS (SELECT 1 FROM conversations c
                   WHERE (c.user_a = $1 AND c.user_b = u.id) OR (c.user_b = $1 AND c.user_a = u.id))`,
  });
  const recent = new Set((await db.query(
    `SELECT unnest(candidate_ids) AS id FROM daily_picks WHERE user_id = $1 AND day >= $2::date - 7 AND day < $2::date`,
    [viewer.id, day]
  )).rows.map((r) => r.id));
  return rows
    .filter((row) => !kept.includes(row.id))
    .map((row) => {
      const score = computeMatchScore(viewer.blueprint, blueprintFromRow(row.bp)).overall;
      const featured = has(row, 'featuredPicks') && score >= 80 ? 3 : 0;
      return { id: row.id, score: score + featured, seen: recent.has(row.id) };
    })
    .sort((a, b) => a.seen - b.seen || b.score - a.score)
    .slice(0, Math.max(0, count - kept.length))
    .map((x) => x.id);
}

async function dailyPicks(userId) {
  const viewer = await loadViewer(userId);
  const day = todayIST();
  const want = has(viewer, 'extraPicks') ? env.DAILY_PICKS_COUNT * 2 : env.DAILY_PICKS_COUNT;
  const saved = (await db.query('SELECT candidate_ids FROM daily_picks WHERE user_id = $1 AND day = $2', [userId, day])).rows[0];
  let ids = saved?.candidate_ids;
  if (!saved) {
    ids = await choosePicks(viewer, day, [], want);
    await db.query(
      `INSERT INTO daily_picks (user_id, day, candidate_ids) VALUES ($1, $2, $3::uuid[]) ON CONFLICT (user_id, day) DO NOTHING`,
      [userId, day, ids]
    );
    ids = (await db.query('SELECT candidate_ids FROM daily_picks WHERE user_id = $1 AND day = $2', [userId, day])).rows[0].candidate_ids;
  } else if (ids.length < want) {
    // Upgraded during the day: top today's picks up to the new size
    const extra = await choosePicks(viewer, day, ids, want);
    if (extra.length) {
      ids = [...ids, ...extra];
      await db.query('UPDATE daily_picks SET candidate_ids = $3::uuid[] WHERE user_id = $1 AND day = $2', [userId, day, ids]);
    }
  }
  if (!ids.length) return { day, picks: [] };
  const rows = await poolRows(viewer, { extraWhere: 'AND u.id = ANY($3::uuid[])', params: [ids] });
  const cards = await buildCards(viewer, rows);
  const byId = new Map(cards.map((c) => [c.id, c]));
  const picks = ids.map((id) => byId.get(id)).filter(Boolean).map((c) => ({ ...c, pickReason: pickReason(c, viewer) }));
  return { day, picks };
}

// ---------- shortlist ----------

async function shortlistAdd(userId, candidateId) {
  if (!(await getCandidate(userId, candidateId))) throw httpError(404, 'Profile not found');
  await db.query('INSERT INTO shortlists (user_id, candidate_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, candidateId]);
  return { shortlisted: true };
}

async function shortlistRemove(userId, candidateId) {
  await db.query('DELETE FROM shortlists WHERE user_id = $1 AND candidate_id = $2', [userId, candidateId]);
  return { shortlisted: false };
}

async function shortlist(userId) {
  const viewer = await loadViewer(userId);
  const rows = await poolRows(viewer, {
    extraWhere: 'AND EXISTS (SELECT 1 FROM shortlists s WHERE s.user_id = $1 AND s.candidate_id = u.id)',
  });
  const added = new Map((await db.query('SELECT candidate_id, created_at FROM shortlists WHERE user_id = $1', [userId])).rows
    .map((r) => [r.candidate_id, r.created_at]));
  const cards = await buildCards(viewer, rows);
  return cards
    .map((c) => ({ ...c, shortlistedAt: added.get(c.id) }))
    .sort((a, b) => new Date(b.shortlistedAt) - new Date(a.shortlistedAt));
}

// ---------- profile views ----------

// Records that the viewer opened a full profile (once per day per pair). Incognito premium members leave no trace.
async function recordView(viewerId, candidateId) {
  const card = await getCandidate(viewerId, candidateId);
  if (!card) throw httpError(404, 'Profile not found');
  const viewer = (await db.query('SELECT incognito, plan, premium_until, plan_paused_at FROM users WHERE id = $1', [viewerId])).rows[0];
  if (viewer.incognito && has(viewer, 'incognito')) return { recorded: false };
  await db.query(
    `INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)
     ON CONFLICT (viewer_id, viewed_id, viewed_on) DO UPDATE SET viewed_at = NOW()`,
    [viewerId, candidateId]
  );
  return { recorded: true };
}

// Who viewed / shortlisted me: everyone sees the counts, premium members see the people
async function admirers(userId) {
  const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
  const premium = has(me, 'admirers');
  const [views, lists] = await Promise.all([
    db.query(
      `SELECT pv.viewer_id AS id, MAX(pv.viewed_at) AS at FROM profile_views pv
       WHERE pv.viewed_id = $1 AND pv.viewed_at > NOW() - INTERVAL '30 days' AND ${notBlockedSql('$1', 'pv.viewer_id')}
       GROUP BY pv.viewer_id ORDER BY at DESC`,
      [userId]
    ),
    db.query(
      `SELECT s.user_id AS id, s.created_at AS at FROM shortlists s
       WHERE s.candidate_id = $1 AND ${notBlockedSql('$1', 's.user_id')} ORDER BY s.created_at DESC`,
      [userId]
    ),
  ]);
  const people = async (rows) => {
    if (!premium || !rows.length) return null;
    let viewer;
    try { viewer = await loadViewer(userId); } catch { return []; }
    const visible = await poolRows(viewer, { extraWhere: 'AND u.id = ANY($3::uuid[])', params: [rows.map((r) => r.id)] });
    const cards = new Map((await buildCards(viewer, visible)).map((c) => [c.id, c]));
    return rows.filter((r) => cards.has(r.id)).map((r) => ({ ...cards.get(r.id), at: r.at, when: relativeTime(r.at) }));
  };
  return {
    premium,
    views: { count: views.rows.length, people: await people(views.rows) },
    shortlists: { count: lists.rows.length, people: await people(lists.rows) },
  };
}

// ---------- why we matched ----------

function pillarVerdict(score, firmClash) {
  if (firmClash) return 'dealbreaker';
  if (score >= 85) return 'aligned';
  if (score >= 70) return 'close';
  return 'talk';
}

async function compare(userId, candidateId) {
  const card = await getCandidate(userId, candidateId);
  if (!card) throw httpError(404, 'Profile not found');
  const viewer = await loadViewer(userId);
  const other = (await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp FROM users u JOIN blueprints b ON b.user_id = u.id WHERE u.id = $1`,
    [candidateId]
  )).rows[0];
  const mine = viewer.blueprint;
  const theirs = blueprintFromRow(other.bp);
  const pillars = PILLARS.map((key) => {
    const gap = Math.abs(mine[key] - theirs[key]);
    const myFlex = mine[`${key}Flexibility`];
    const theirFlex = theirs[`${key}Flexibility`];
    const firmClash = gap > 25 && (myFlex === 'firm' || theirFlex === 'firm');
    const score = calculatePillarOverlap(mine[key], theirs[key], myFlex);
    return { key, mine: mine[key], theirs: theirs[key], myFlexibility: myFlex, theirFlexibility: theirFlex, gap, score, verdict: pillarVerdict(score, firmClash) };
  });

  // Horoscope only when both members opted in; the bride's star is counted first
  let horoscope = null;
  if (viewer.show_horoscope && other.show_horoscope) {
    const a = viewer.details || {};
    const b = other.details || {};
    const [bride, groom] = viewer.gender === 'woman' ? [a, b] : [b, a];
    horoscope = porutham(bride, groom) || { unavailable: 'Both of you need a star and raasi in your religious information.' };
  }
  await recordView(userId, candidateId).catch(() => {});
  // Premium: conversation topics for where you differ most, and the shareable PDF report
  const deep = has(viewer, 'deepReport');
  const byGap = [...pillars].sort((a, b) => b.gap - a.gap);
  return {
    candidateId,
    deepReport: deep,
    topics: deep ? [...CONVERSATION_PROMPTS[byGap[0].key], ...CONVERSATION_PROMPTS[byGap[1].key]] : null,
    overall: card.overlapScores.overall,
    pillars,
    sharedVibes: (card.vibes || []).filter((v) => (viewer.vibes || []).includes(v)),
    fitsMyPreferences: card.fitsMyPreferences,
    iFitTheirPreferences: card.iFitTheirPreferences,
    horoscope,
    horoscopeOptIn: { me: viewer.show_horoscope, them: other.show_horoscope },
  };
}

// ---------- more like this, rewind ----------

// Premium: people whose blueprint is closest to a given candidate's
async function similar(userId, candidateId) {
  const viewer = await loadViewer(userId);
  requireFeature(viewer, 'extraPicks');
  const target = (await db.query('SELECT row_to_json(b.*) AS bp FROM blueprints b WHERE user_id = $1', [candidateId])).rows[0];
  if (!target || !(await getCandidate(userId, candidateId))) throw httpError(404, 'Profile not found');
  const tb = blueprintFromRow(target.bp);
  const rows = (await poolRows(viewer, { extraWhere: 'AND u.id <> $3', params: [candidateId] }))
    .map((row) => ({ row, distance: computeMatchScore(tb, blueprintFromRow(row.bp)).overall }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 10)
    .map((x) => x.row);
  return buildCards(viewer, rows);
}

// Plus: undo the most recent pass
async function rewind(userId) {
  const viewer = await loadViewer(userId);
  requireFeature(viewer, 'rewind');
  const last = (await db.query('DELETE FROM match_passes WHERE (user_id, candidate_id) = (SELECT user_id, candidate_id FROM match_passes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1) RETURNING candidate_id', [userId])).rows[0];
  if (!last) throw httpError(404, 'There’s nothing to undo');
  return { candidate: await getCandidate(userId, last.candidate_id) };
}

// ---------- alerts for newcomers ----------

// When someone finishes onboarding, tell existing members who align strongly with them
async function alertNewMember(newUserId) {
  const { notify } = require('./notifications');
  const res = await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp FROM users u JOIN blueprints b ON b.user_id = u.id WHERE u.id = $1`,
    [newUserId]
  );
  const newcomer = res.rows[0];
  if (!newcomer) return 0;
  const newcomerBp = blueprintFromRow(newcomer.bp);
  const others = await db.query(
    `SELECT u.id, row_to_json(b.*) AS bp
     FROM users u JOIN blueprints b ON b.user_id = u.id
     WHERE u.id <> $1 AND ${VISIBLE_USER_SQL} AND ($2::text IS NULL OR u.gender IS DISTINCT FROM $2) AND ${notBlockedSql('$1')}`,
    [newUserId, newcomer.gender]
  );
  let sent = 0;
  for (const other of others.rows) {
    const score = computeMatchScore(blueprintFromRow(other.bp), newcomerBp).overall;
    if (score < env.MATCH_ALERT_THRESHOLD) continue;
    await notify(other.id, {
      type: 'match',
      title: tx('New aligned match'),
      body: tx('{name}, {age} · {score}% aligned with you', { name: newcomer.first_name, age: ageFrom(newcomer.birth_year, newcomer.birth_month), score }),
      data: { candidateId: newUserId },
    });
    sent += 1;
  }
  return sent;
}

async function pass(userId, candidateId) {
  const candidate = await getCandidate(userId, candidateId);
  if (!candidate) throw httpError(404, 'Profile not found');
  await db.query(
    'INSERT INTO match_passes (user_id, candidate_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, candidateId]
  );
  return { success: true };
}

router.get('/', route(async (req, res) => res.json(await getFeed(req.userId, req.query.filter || null))));
router.get('/daily', route(async (req, res) => res.json(await dailyPicks(req.userId))));
router.get('/shortlist', route(async (req, res) => res.json(await shortlist(req.userId))));
router.get('/admirers', route(async (req, res) => res.json(await admirers(req.userId))));
router.post('/rewind', route(async (req, res) => res.json(await rewind(req.userId))));
router.get('/:id', route(async (req, res) => {
  const card = await getCandidate(req.userId, req.params.id);
  if (!card) throw httpError(404, 'Profile not found');
  res.json(card);
}));
router.get('/:id/compare', route(async (req, res) => res.json(await compare(req.userId, req.params.id))));
router.post('/:id/view', route(async (req, res) => res.json(await recordView(req.userId, req.params.id))));
router.get('/:id/similar', route(async (req, res) => res.json(await similar(req.userId, req.params.id))));
router.post('/:id/pass', route(async (req, res) => res.json(await pass(req.userId, req.params.id))));
router.post('/:id/shortlist', route(async (req, res) => res.json(await shortlistAdd(req.userId, req.params.id))));
router.delete('/:id/shortlist', route(async (req, res) => res.json(await shortlistRemove(req.userId, req.params.id))));

module.exports = {
  router, alertNewMember, toCard, buildCards, poolRows, getFeed, getCandidate, loadViewer, relationsFor, mutualSet,
  photosByUser, visiblePhotos, visibleTo, dailyPicks, admirers, compare, VISIBLE_USER_SQL,
};
