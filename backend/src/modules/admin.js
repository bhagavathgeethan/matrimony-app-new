// Admin console API: stats, reports queue, ID verifications, success stories and member moderation.
// Admins are members whose phone is listed in ADMIN_PHONES (granted at sign-in).
const express = require('express');
const db = require('../config/db');
const storage = require('../services/storage');
const verification = require('./verification');
const stories = require('./stories');
const { httpError, ageFrom, maskPhone, newId } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route } = require('../lib/http');
const { REPORT_REASONS } = require('../../../shared/engagement.js');

const router = express.Router();
const REASON_LABEL = Object.fromEntries(REPORT_REASONS);

const requireAdmin = route(async (req, res, next) => {
  const u = (await db.query('SELECT role FROM users WHERE id = $1', [req.userId])).rows[0];
  if (u?.role !== 'admin') throw httpError(403, 'Admins only', 'FORBIDDEN');
  next();
});
router.use(requireAdmin);

const memberSummary = (u) => (u ? {
  id: u.id, firstName: u.first_name, age: ageFrom(u.birth_year, u.birth_month), city: u.city, phone: maskPhone(u.phone),
  verified: Boolean(u.id_verified_at), hidden: Boolean(u.moderation_hidden_at), paused: Boolean(u.paused_at),
  joinedAt: u.created_at, lastActiveAt: u.last_active_at,
} : null);

async function stats() {
  const one = async (sql) => (await db.query(sql)).rows[0].n;
  const [members, onboarded, active7d, premium, conversations, accepted, openReports, pendingVerifications, pendingStories, hidden] = await Promise.all([
    one('SELECT COUNT(*)::int AS n FROM users'),
    one('SELECT COUNT(*)::int AS n FROM users WHERE onboarding_completed_at IS NOT NULL'),
    one(`SELECT COUNT(*)::int AS n FROM users WHERE last_active_at > NOW() - INTERVAL '7 days'`),
    one(`SELECT COUNT(*)::int AS n FROM users WHERE plan <> 'free' AND premium_until > NOW() AND plan_paused_at IS NULL`),
    one('SELECT COUNT(*)::int AS n FROM conversations'),
    one(`SELECT COUNT(*)::int AS n FROM conversations WHERE status = 'accepted'`),
    one(`SELECT COUNT(*)::int AS n FROM reports WHERE status = 'open'`),
    one(`SELECT COUNT(*)::int AS n FROM verifications WHERE status = 'pending'`),
    one(`SELECT COUNT(*)::int AS n FROM success_stories WHERE status = 'pending_review'`),
    one('SELECT COUNT(*)::int AS n FROM users WHERE moderation_hidden_at IS NOT NULL'),
  ]);
  const signups = (await db.query(
    `SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(u.id)::int AS n
     FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, INTERVAL '1 day') d
     LEFT JOIN users u ON u.created_at::date = d::date
     GROUP BY d ORDER BY d`
  )).rows;
  return {
    members, onboarded, active7d, premium, conversations, accepted, openReports, pendingVerifications, pendingStories, hidden,
    signups: signups.map((r) => ({ day: r.day, count: r.n })),
  };
}

async function listReports(status = 'open') {
  const res = await db.query(
    `SELECT r.*, row_to_json(rep.*) AS reporter, row_to_json(tgt.*) AS reported,
            (SELECT COUNT(DISTINCT x.reporter_id)::int FROM reports x WHERE x.reported_id = r.reported_id AND x.status = 'open') AS open_against
     FROM reports r
     LEFT JOIN users rep ON rep.id = r.reporter_id
     LEFT JOIN users tgt ON tgt.id = r.reported_id
     WHERE r.status = $1 ORDER BY r.created_at DESC LIMIT 200`,
    [status]
  );
  return res.rows.map((r) => ({
    id: r.id, reason: r.reason, reasonLabel: REASON_LABEL[r.reason] || r.reason, details: r.details, status: r.status,
    createdAt: r.created_at, reporter: memberSummary(r.reporter), reported: memberSummary(r.reported), openReportsAgainst: r.open_against,
  }));
}

// dismiss: report was unfounded; hide: hide the member; resolving the last open report of a hidden member with
// 'dismiss' also brings them back
async function resolveReport(adminId, id, action) {
  if (!['dismiss', 'hide'].includes(action)) throw httpError(400, 'action must be dismiss or hide');
  const r = (await db.query('SELECT * FROM reports WHERE id = $1', [id])).rows[0];
  if (!r) throw httpError(404, 'Report not found');
  if (action === 'hide') {
    await db.query('UPDATE users SET moderation_hidden_at = COALESCE(moderation_hidden_at, NOW()) WHERE id = $1', [r.reported_id]);
    await db.query(
      `UPDATE reports SET status = 'actioned', resolved_at = NOW(), resolved_by = $2 WHERE reported_id = $1 AND status = 'open'`,
      [r.reported_id, adminId]
    );
  } else {
    await db.query(`UPDATE reports SET status = 'dismissed', resolved_at = NOW(), resolved_by = $2 WHERE id = $1`, [id, adminId]);
    const remaining = (await db.query(`SELECT COUNT(*)::int AS n FROM reports WHERE reported_id = $1 AND status = 'open'`, [r.reported_id])).rows[0].n;
    if (!remaining) await db.query('UPDATE users SET moderation_hidden_at = NULL WHERE id = $1', [r.reported_id]);
  }
  return { id, action };
}

async function setHidden(userId, hidden) {
  const res = await db.query(
    `UPDATE users SET moderation_hidden_at = CASE WHEN $2 THEN COALESCE(moderation_hidden_at, NOW()) ELSE NULL END WHERE id = $1 RETURNING *`,
    [userId, hidden]
  ).catch(() => ({ rows: [] }));
  if (!res.rows[0]) throw httpError(404, 'Member not found');
  return memberSummary(res.rows[0]);
}

async function members(q) {
  const term = typeof q === 'string' ? q.trim().slice(0, 60) : '';
  const res = await db.query(
    `SELECT * FROM users
     WHERE $1 = '' OR first_name ILIKE '%' || $1 || '%' OR city ILIKE '%' || $1 || '%' OR phone LIKE '%' || $1 || '%'
     ORDER BY created_at DESC LIMIT 50`,
    [term]
  );
  return res.rows.map(memberSummary);
}

async function listVerifications() {
  const res = await db.query(
    `SELECT v.*, row_to_json(u.*) AS member,
            (SELECT storage_key FROM photos p WHERE p.user_id = v.user_id ORDER BY position LIMIT 1) AS photo_key
     FROM verifications v JOIN users u ON u.id = v.user_id
     WHERE v.status = 'pending' ORDER BY v.created_at`
  );
  return res.rows.map((v) => ({
    id: v.id, submittedAt: v.created_at, member: memberSummary(v.member),
    profilePhoto: v.photo_key ? storage.url(v.photo_key) : null,
    selfieUrl: `/api/admin/verifications/${v.id}/selfie`,
  }));
}

async function selfie(id) {
  const v = (await db.query('SELECT selfie_key FROM verifications WHERE id = $1 AND status = $2', [id, 'pending'])).rows[0];
  if (!v) throw httpError(404, 'Not found');
  return storage.private.read(v.selfie_key);
}

// ---------- assisted service ----------

async function assistedQueue() {
  const res = await db.query(
    `SELECT u.*, r.id AS request_id, r.notes, r.call_time, r.status AS request_status, r.manager_note, r.created_at AS requested_at,
            (SELECT COUNT(*)::int FROM assisted_recommendations ar WHERE ar.user_id = u.id) AS recommended
     FROM users u
     LEFT JOIN LATERAL (SELECT * FROM assisted_requests x WHERE x.user_id = u.id ORDER BY x.created_at DESC LIMIT 1) r ON TRUE
     WHERE u.assisted_until > NOW() OR r.id IS NOT NULL
     ORDER BY (r.status = 'new') DESC NULLS LAST, r.created_at DESC NULLS LAST`
  );
  return res.rows.map((u) => ({
    member: memberSummary(u),
    assistedUntil: u.assisted_until,
    request: u.request_id ? { id: u.request_id, notes: u.notes, callTime: u.call_time, status: u.request_status, managerNote: u.manager_note, createdAt: u.requested_at } : null,
    recommended: u.recommended,
  }));
}

async function updateAssistedRequest(id, body) {
  const status = body.status;
  if (status !== undefined && !['new', 'active', 'closed'].includes(status)) throw httpError(400, 'status must be new, active or closed');
  const note = typeof body.managerNote === 'string' ? body.managerNote.trim().slice(0, 1000) : undefined;
  const res = await db.query(
    `UPDATE assisted_requests SET status = COALESCE($2, status), manager_note = COALESCE($3, manager_note), updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [id, status ?? null, note ?? null]
  ).catch(() => ({ rows: [] }));
  if (!res.rows.length) throw httpError(404, 'Request not found');
  return { id, status };
}

// The relationship manager hand-picks a member for someone on the assisted service
async function recommend(adminId, userId, body) {
  const member = (await db.query('SELECT assisted_until FROM users WHERE id = $1', [userId]).catch(() => ({ rows: [] }))).rows[0];
  if (!member) throw httpError(404, 'Member not found');
  if (!(member.assisted_until && new Date(member.assisted_until) > new Date())) throw httpError(400, 'Assisted service isn’t active for this member');
  const { getCandidate } = require('./matches');
  const card = await getCandidate(userId, body.candidateId).catch(() => null);
  if (!card) throw httpError(400, 'That profile isn’t available to this member');
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) || null : null;
  await db.query(
    `INSERT INTO assisted_recommendations (id, user_id, candidate_id, note, created_by) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, candidate_id) DO UPDATE SET note = EXCLUDED.note, created_at = NOW()`,
    [newId(), userId, body.candidateId, note, adminId]
  );
  const { notify } = require('./notifications');
  await notify(userId, {
    type: 'account',
    title: tx('Your relationship manager suggests {name}', { name: card.firstName }),
    body: note || tx('{name}, {age} · {score}% aligned — hand-picked for you.', { name: card.firstName, age: card.age, score: card.overlapScores.overall }),
    data: { target: 'assisted', candidateId: card.id },
  });
  return { recommended: true, candidate: { id: card.id, firstName: card.firstName, score: card.overlapScores.overall } };
}

// Profiles that suit an assisted member, best fit first (for the manager to choose from)
async function assistedCandidates(userId) {
  const { getFeed } = require('./matches');
  const cards = await getFeed(userId, null).catch(() => []);
  return cards.slice(0, 30).map((c) => ({ id: c.id, firstName: c.firstName, age: c.age, city: c.city, score: c.overlapScores.overall, photo: c.photos?.[0] || null }));
}

async function listStories() {
  const res = await db.query(`SELECT * FROM success_stories WHERE status = 'pending_review' ORDER BY created_at`);
  return res.rows.map((r) => ({ id: r.id, title: r.title, story: r.story, names: r.display_names, createdAt: r.created_at }));
}

router.get('/stats', route(async (req, res) => res.json(await stats())));
router.get('/reports', route(async (req, res) => res.json(await listReports(req.query.status || 'open'))));
router.post('/reports/:id/resolve', route(async (req, res) => res.json(await resolveReport(req.userId, req.params.id, req.body?.action))));
router.get('/members', route(async (req, res) => res.json(await members(req.query.q))));
router.post('/members/:id/hide', route(async (req, res) => res.json(await setHidden(req.params.id, true))));
router.post('/members/:id/unhide', route(async (req, res) => res.json(await setHidden(req.params.id, false))));
router.get('/verifications', route(async (req, res) => res.json(await listVerifications())));
router.get('/verifications/:id/selfie', route(async (req, res) => {
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.send(await selfie(req.params.id));
}));
router.post('/verifications/:id', route(async (req, res) => {
  res.json(await verification.review(req.userId, req.params.id, req.body?.decision, req.body?.note));
}));
router.get('/stories', route(async (req, res) => res.json(await listStories())));
router.get('/assisted', route(async (req, res) => res.json(await assistedQueue())));
router.put('/assisted/requests/:id', route(async (req, res) => res.json(await updateAssistedRequest(req.params.id, req.body || {}))));
router.get('/assisted/:userId/candidates', route(async (req, res) => res.json(await assistedCandidates(req.params.userId))));
router.post('/assisted/:userId/recommend', route(async (req, res) => res.json(await recommend(req.userId, req.params.userId, req.body || {}))));
router.post('/stories/:id', route(async (req, res) => res.json(await stories.review(req.params.id, req.body?.decision))));

module.exports = { router };
