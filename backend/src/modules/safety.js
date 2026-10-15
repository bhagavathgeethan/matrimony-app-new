// Safety: blocking and reporting members. Reporting also blocks; enough distinct reports hide a profile
// until an admin reviews it. Blocked members are never told.
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const realtime = require('../services/realtime');
const { httpError, newId, ageFrom } = require('../lib/util');
const { route, optionalString } = require('../lib/http');
const { REPORT_REASONS } = require('../../../shared/engagement.js');

const router = express.Router();
const REASON_KEYS = REPORT_REASONS.map(([k]) => k);

async function memberExists(id) {
  if (typeof id !== 'string') return false;
  const res = await db.query('SELECT 1 FROM users WHERE id = $1', [id]).catch(() => ({ rows: [] }));
  return res.rows.length > 0;
}

async function block(userId, otherId) {
  if (otherId === userId) throw httpError(400, 'You can’t block yourself');
  if (!(await memberExists(otherId))) throw httpError(404, 'Member not found');
  await db.query('INSERT INTO blocks (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, otherId]);
  // Shortlists between the two go; the blocker's apps refresh to drop the member everywhere
  await db.query('DELETE FROM shortlists WHERE (user_id = $1 AND candidate_id = $2) OR (user_id = $2 AND candidate_id = $1)', [userId, otherId]);
  realtime.notify(userId, 'safety:blocked', { userId: otherId });
  return { blocked: true };
}

async function unblock(userId, otherId) {
  await db.query('DELETE FROM blocks WHERE user_id = $1 AND blocked_id = $2', [userId, otherId]);
  return { blocked: false };
}

async function listBlocks(userId) {
  const res = await db.query(
    `SELECT b.blocked_id, b.created_at, u.first_name, u.birth_year, u.birth_month, u.city
     FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId]
  );
  return res.rows.map((r) => ({
    userId: r.blocked_id, firstName: r.first_name, age: ageFrom(r.birth_year, r.birth_month), city: r.city, blockedAt: r.created_at,
  }));
}

async function report(userId, body) {
  const reportedId = body.userId;
  if (reportedId === userId) throw httpError(400, 'You can’t report yourself');
  if (!(await memberExists(reportedId))) throw httpError(404, 'Member not found');
  if (!REASON_KEYS.includes(body.reason)) throw httpError(400, 'Choose a reason from the list');
  const details = optionalString(body, 'details', { max: 1000, allowEmpty: true }) || null;

  // One open report per reporter per member; a repeat updates it
  const existing = (await db.query(
    `SELECT id FROM reports WHERE reporter_id = $1 AND reported_id = $2 AND status = 'open'`,
    [userId, reportedId]
  )).rows[0];
  if (existing) {
    await db.query('UPDATE reports SET reason = $2, details = COALESCE($3, details) WHERE id = $1', [existing.id, body.reason, details]);
  } else {
    await db.query(
      'INSERT INTO reports (id, reporter_id, reported_id, reason, details) VALUES ($1, $2, $3, $4, $5)',
      [newId(), userId, reportedId, body.reason, details]
    );
  }
  await block(userId, reportedId);

  // Enough independent reports hide the profile until an admin has looked
  const open = (await db.query(
    `SELECT COUNT(DISTINCT reporter_id)::int AS n FROM reports WHERE reported_id = $1 AND status = 'open'`,
    [reportedId]
  )).rows[0].n;
  let hidden = false;
  if (open >= env.REPORT_HIDE_THRESHOLD) {
    const res = await db.query(
      'UPDATE users SET moderation_hidden_at = NOW() WHERE id = $1 AND moderation_hidden_at IS NULL RETURNING id',
      [reportedId]
    );
    hidden = res.rows.length > 0;
  }
  return { reported: true, blocked: true, hidden };
}

router.get('/blocks', route(async (req, res) => res.json(await listBlocks(req.userId))));
router.post('/blocks', route(async (req, res) => res.json(await block(req.userId, req.body?.userId))));
router.delete('/blocks/:userId', route(async (req, res) => res.json(await unblock(req.userId, req.params.userId))));
router.post('/reports', route(async (req, res) => res.status(201).json(await report(req.userId, req.body || {}))));

module.exports = { router };
