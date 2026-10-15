// Member search: values-led filters only (no caste / religion / income), over the same pool as the feed.
// Also saved searches, which alert their owner when a newcomer fits.
const express = require('express');
const db = require('../config/db');
const { computeMatchScore } = require('../services/blueprintEngine');
const { blueprintFromRow, VIBES } = require('./profile');
const { loadViewer, buildCards, VISIBLE_USER_SQL } = require('./matches');
const { notBlockedSql, isPremium } = require('../lib/members');
const { httpError, ageFrom, newId } = require('../lib/util');
const { route } = require('../lib/http');

const router = express.Router();

const PILLARS = ['money', 'roots', 'kids', 'ambition'];
const TIMELINES = ['Marriage this year', 'Marriage in 1–2 years', 'Open, no timeline'];
const SORTS = ['fit', 'active', 'newest', 'age_asc', 'age_desc'];
const STRONG_PILLAR = 80; // "strong on <pillar>" means at least this pillar score
const PAGE_SIZE = 20;
const PREMIUM_BOOST = 3; // premium members rank a little higher in "best fit"
const MAX_SAVED = 10;
const FILTER_KEYS = ['q', 'ageMin', 'ageMax', 'minScore', 'city', 'timelines', 'strongOn', 'vibes', 'verified', 'notContacted', 'matchesPreferences', 'sort'];

const list = (v) => (v === undefined || v === '' ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean));

function int(query, key, { min, max }) {
  if (query[key] === undefined || query[key] === '') return undefined;
  const n = Number(query[key]);
  if (!Number.isInteger(n) || n < min || n > max) throw httpError(400, `${key} must be a whole number between ${min} and ${max}`);
  return n;
}

// Parses and validates query-string filters
function parseFilters(query) {
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
  const ageMin = int(query, 'ageMin', { min: 18, max: 80 });
  const ageMax = int(query, 'ageMax', { min: 18, max: 80 });
  if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) throw httpError(400, 'ageMin cannot be more than ageMax');
  const minScore = int(query, 'minScore', { min: 0, max: 100 });
  const city = typeof query.city === 'string' ? query.city.trim().slice(0, 80) : '';
  const timelines = list(query.timelines);
  if (timelines.some((t) => !TIMELINES.includes(t))) throw httpError(400, 'Unknown timeline');
  const strongOn = list(query.strongOn);
  if (strongOn.some((p) => !PILLARS.includes(p))) throw httpError(400, 'strongOn must list money, roots, kids or ambition');
  const vibes = list(query.vibes);
  if (vibes.some((v) => !VIBES.includes(v))) throw httpError(400, 'Unknown vibe');
  const sort = query.sort || 'fit';
  if (!SORTS.includes(sort)) throw httpError(400, `sort must be one of: ${SORTS.join(', ')}`);
  const offset = int(query, 'offset', { min: 0, max: 100000 }) || 0;
  const limit = int(query, 'limit', { min: 1, max: 50 }) || PAGE_SIZE;
  return {
    q, ageMin, ageMax, minScore, city, timelines, strongOn, vibes, sort, offset, limit,
    verified: query.verified === 'true' || query.verified === true,
    notContacted: query.notContacted === 'true' || query.notContacted === true,
    matchesPreferences: query.matchesPreferences === 'true' || query.matchesPreferences === true,
  };
}

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// Runs a search. onlyIds narrows the pool (used to check a newcomer against saved searches).
async function search(userId, rawQuery, { onlyIds = null } = {}) {
  const f = parseFilters(rawQuery);
  const viewer = await loadViewer(userId);

  // Narrow in SQL (visibility, blocks, text, city, timeline, verified); score in JS
  const params = [userId, viewer.gender];
  const where = [
    'u.id <> $1',
    VISIBLE_USER_SQL,
    '($2::text IS NULL OR u.gender <> $2)',
    'NOT EXISTS (SELECT 1 FROM match_passes p WHERE p.user_id = $1 AND p.candidate_id = u.id)',
    notBlockedSql('$1'),
  ];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace(/\?/g, `$${params.length}`));
  };
  if (onlyIds) add('u.id = ANY(?::uuid[])', onlyIds);
  if (f.q) {
    add(
      `(u.first_name ILIKE ? OR u.city ILIKE ? OR u.profession ILIKE ? OR u.quote ILIKE ?
        OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(u.vibes) v WHERE v ILIKE ?))`,
      `%${escapeLike(f.q)}%`
    );
  }
  if (f.city) add('u.city ILIKE ?', `%${escapeLike(f.city)}%`);
  if (f.timelines.length) add('u.intent_timeline = ANY(?::text[])', f.timelines);
  if (f.verified) where.push('u.id_verified_at IS NOT NULL');
  if (f.notContacted) {
    where.push(`NOT EXISTS (SELECT 1 FROM conversations c
                WHERE (c.user_a = $1 AND c.user_b = u.id) OR (c.user_b = $1 AND c.user_a = u.id))`);
  }
  // Function form: the ?| operator would clash with the placeholder syntax above
  if (f.vibes.length) add('jsonb_exists_any(u.vibes, ?::text[])', f.vibes);

  const res = await db.query(
    `SELECT u.*, row_to_json(b.*) AS bp FROM users u JOIN blueprints b ON b.user_id = u.id
     WHERE ${where.join(' AND ')}`,
    params
  );

  let rows = res.rows.map((row) => ({
    row,
    age: ageFrom(row.birth_year, row.birth_month),
    scores: computeMatchScore(viewer.blueprint, blueprintFromRow(row.bp)),
    boost: isPremium(row) ? PREMIUM_BOOST : 0,
  }));
  rows = rows.filter(({ age, scores }) =>
    (f.ageMin === undefined || age >= f.ageMin)
    && (f.ageMax === undefined || age <= f.ageMax)
    && (f.minScore === undefined || scores.overall >= f.minScore)
    && f.strongOn.every((p) => scores[p] >= STRONG_PILLAR));

  let cards = null;
  if (f.matchesPreferences) {
    // Needs the card's preference check; anything explicitly not met is dropped (unknowns stay)
    cards = await buildCards(viewer, rows.map((r) => r.row));
    const keep = new Set(cards.filter((c) => c.fitsMyPreferences.items.every((i) => i.met !== false)).map((c) => c.id));
    rows = rows.filter((r) => keep.has(r.row.id));
  }

  // City suggestions from everything that matched, before paging
  const cityCounts = new Map();
  for (const { row } of rows) {
    if (row.city) cityCounts.set(row.city, (cityCounts.get(row.city) || 0) + 1);
  }

  const sorters = {
    fit: (a, b) => (b.scores.overall + b.boost) - (a.scores.overall + a.boost),
    active: (a, b) => new Date(b.row.last_active_at) - new Date(a.row.last_active_at),
    newest: (a, b) => new Date(b.row.onboarding_completed_at) - new Date(a.row.onboarding_completed_at),
    age_asc: (a, b) => a.age - b.age || b.scores.overall - a.scores.overall,
    age_desc: (a, b) => b.age - a.age || b.scores.overall - a.scores.overall,
  };
  rows.sort(sorters[f.sort]);

  const page = rows.slice(f.offset, f.offset + f.limit);
  const pageCards = cards
    ? page.map(({ row }) => cards.find((c) => c.id === row.id))
    : await buildCards(viewer, page.map(({ row }) => row));

  return {
    results: pageCards,
    total: rows.length,
    nextOffset: f.offset + f.limit < rows.length ? f.offset + f.limit : null,
    facets: {
      cities: [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count })),
    },
  };
}

// ---------- saved searches ----------

// Only the filter keys are stored (no paging), already validated
function cleanFilters(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'filters must be an object');
  const picked = Object.fromEntries(Object.entries(input).filter(([k, v]) => FILTER_KEYS.includes(k) && v !== undefined && v !== null && v !== ''));
  parseFilters(picked); // throws 400 on anything invalid
  return picked;
}

const toSaved = (r) => ({ id: r.id, name: r.name, filters: r.filters, alerts: r.alerts, createdAt: r.created_at, lastAlertAt: r.last_alert_at });

async function listSaved(userId) {
  const res = await db.query('SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return res.rows.map(toSaved);
}

async function createSaved(userId, body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 80) throw httpError(400, 'Give the search a name (up to 80 characters)');
  const filters = cleanFilters(body.filters);
  const count = (await db.query('SELECT COUNT(*)::int AS n FROM saved_searches WHERE user_id = $1', [userId])).rows[0].n;
  if (count >= MAX_SAVED) throw httpError(400, `You can save up to ${MAX_SAVED} searches`);
  const row = (await db.query(
    'INSERT INTO saved_searches (id, user_id, name, filters, alerts) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [newId(), userId, name, JSON.stringify(filters), body.alerts !== false]
  )).rows[0];
  return toSaved(row);
}

async function updateSaved(userId, id, body) {
  const sets = [];
  const params = [id, userId];
  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 80) throw httpError(400, 'Give the search a name (up to 80 characters)');
    params.push(name);
    sets.push(`name = $${params.length}`);
  }
  if (body.alerts !== undefined) {
    if (typeof body.alerts !== 'boolean') throw httpError(400, 'alerts must be true or false');
    params.push(body.alerts);
    sets.push(`alerts = $${params.length}`);
  }
  if (body.filters !== undefined) {
    params.push(JSON.stringify(cleanFilters(body.filters)));
    sets.push(`filters = $${params.length}`);
  }
  if (!sets.length) throw httpError(400, 'Nothing to update');
  const row = (await db.query(`UPDATE saved_searches SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`, params)).rows[0];
  if (!row) throw httpError(404, 'Saved search not found');
  return toSaved(row);
}

async function deleteSaved(userId, id) {
  const res = await db.query('DELETE FROM saved_searches WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!res.rowCount) throw httpError(404, 'Saved search not found');
  return { success: true };
}

// A newcomer finished onboarding: alert owners of saved searches the newcomer fits (at most once an hour per search)
async function alertSavedSearches(newUserId) {
  const { notify } = require('./notifications');
  const saved = await db.query(
    `SELECT s.* FROM saved_searches s
     WHERE s.alerts AND s.user_id <> $1 AND (s.last_alert_at IS NULL OR s.last_alert_at < NOW() - INTERVAL '1 hour')`,
    [newUserId]
  );
  const newcomer = (await db.query('SELECT first_name, birth_year, birth_month, city FROM users WHERE id = $1', [newUserId])).rows[0];
  let sent = 0;
  for (const s of saved.rows) {
    let hit;
    try {
      hit = (await search(s.user_id, { ...s.filters, limit: 1 }, { onlyIds: [newUserId] })).total > 0;
    } catch {
      continue; // owner without a blueprint, or filters no longer valid
    }
    if (!hit) continue;
    await notify(s.user_id, {
      type: 'saved_search',
      title: `New match for “${s.name}”`,
      body: `${newcomer.first_name}, ${ageFrom(newcomer.birth_year, newcomer.birth_month)} · ${newcomer.city} fits your saved search`,
      data: { savedSearchId: s.id, candidateId: newUserId },
      groupKey: `saved:${s.id}`,
    });
    await db.query('UPDATE saved_searches SET last_alert_at = NOW() WHERE id = $1', [s.id]);
    sent += 1;
  }
  return sent;
}

router.get('/', route(async (req, res) => res.json(await search(req.userId, req.query))));
router.get('/saved', route(async (req, res) => res.json(await listSaved(req.userId))));
router.post('/saved', route(async (req, res) => res.status(201).json(await createSaved(req.userId, req.body || {}))));
router.put('/saved/:id', route(async (req, res) => res.json(await updateSaved(req.userId, req.params.id, req.body || {}))));
router.delete('/saved/:id', route(async (req, res) => res.json(await deleteSaved(req.userId, req.params.id))));

module.exports = { router, search, parseFilters, alertSavedSearches };
