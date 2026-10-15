// DPDP rights: export everything we hold, and erase the account after a 72-hour grace period
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const { getProfile } = require('./profile');
const { listConversations } = require('./chat');
const { listLinks, listShares } = require('./family');
const { httpError, newId, sha256, randomToken } = require('../lib/util');
const { route } = require('../lib/http');

const router = express.Router();

async function exportData(userId) {
  const [profile, conversations, links, shares, sent, sessions] = await Promise.all([
    getProfile(userId),
    listConversations(userId),
    listLinks(userId),
    listShares(userId),
    db.query(
      'SELECT conversation_id, body, created_at FROM messages WHERE sender_id = $1 ORDER BY created_at',
      [userId]
    ),
    db.query('SELECT created_at, last_used_at, expires_at, revoked_at FROM sessions WHERE user_id = $1', [userId]),
  ]);
  const own = (sql) => db.query(sql, [userId]).then((r) => r.rows);
  const [shortlisted, savedSearches, blocks, reportsFiled, payments, stories, verifications] = await Promise.all([
    own('SELECT candidate_id, created_at FROM shortlists WHERE user_id = $1'),
    own('SELECT name, filters, alerts, created_at FROM saved_searches WHERE user_id = $1'),
    own('SELECT blocked_id, created_at FROM blocks WHERE user_id = $1'),
    own('SELECT reported_id, reason, details, status, created_at FROM reports WHERE reporter_id = $1'),
    own('SELECT plan_code, amount_paise, provider, status, created_at, paid_at FROM payments WHERE user_id = $1'),
    own('SELECT title, story, display_names, status, created_at, published_at FROM success_stories WHERE submitted_by = $1 OR partner_id = $1'),
    own('SELECT status, note, created_at, reviewed_at FROM verifications WHERE user_id = $1'),
  ]);
  return {
    exportDate: new Date().toISOString(),
    legalNotice: 'Digital Personal Data Protection (DPDP) Act, 2023 — export of all personal data held by Sangam',
    profile,
    familyLinks: links.map(({ portalToken, portalUrl, ...rest }) => rest),
    familyShares: shares,
    conversations,
    messagesSent: sent.rows,
    sessions: sessions.rows,
    shortlisted,
    savedSearches,
    blocks,
    reportsFiled,
    payments,
    successStories: stories,
    verifications,
  };
}

async function requestErasure(userId) {
  const pending = await db.query(
    'SELECT * FROM erasure_requests WHERE user_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL',
    [userId]
  );
  if (pending.rows[0]) throw httpError(409, 'Erasure is already scheduled', 'ERASURE_PENDING');

  const receipt = `DPDP-DEL-${randomToken(16).toUpperCase()}`;
  const row = (await db.query(
    `INSERT INTO erasure_requests (id, user_id, user_ref, receipt_hash, scheduled_for)
     VALUES ($1, $2, $3, $4, NOW() + make_interval(hours => $5)) RETURNING *`,
    [newId(), userId, sha256(`user:${userId}`), receipt, env.ERASURE_DELAY_HOURS]
  )).rows[0];
  return {
    success: true,
    message: `Your account is hidden from matches now and will be permanently erased within ${env.ERASURE_DELAY_HOURS} hours.`,
    auditReceiptHash: receipt,
    scheduledCompletion: row.scheduled_for,
    retentionDetails: 'Only a hashed record of the deletion request is retained, for audit.',
  };
}

async function cancelErasure(userId) {
  const res = await db.query(
    `UPDATE erasure_requests SET cancelled_at = NOW()
     WHERE user_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL RETURNING id`,
    [userId]
  );
  if (!res.rows.length) throw httpError(404, 'No erasure is scheduled');
  return { success: true };
}

// Erases one account: files first, then the user row (cascades to everything they own;
// their messages stay in the other person's history with no sender — "Former member")
async function eraseUser(userId) {
  const photos = await db.query('SELECT storage_key, blur_key FROM photos WHERE user_id = $1', [userId]);
  for (const p of photos.rows) {
    await storage.remove(p.storage_key);
    await storage.remove(p.blur_key);
  }
  await db.transaction(async (client) => {
    await client.query(
      'UPDATE erasure_requests SET completed_at = NOW(), user_id = NULL WHERE user_id = $1 AND completed_at IS NULL AND cancelled_at IS NULL',
      [userId]
    );
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  });
}

async function runErasureSweep({ log = console.log } = {}) {
  const due = await db.query(
    `SELECT user_id FROM erasure_requests
     WHERE completed_at IS NULL AND cancelled_at IS NULL AND scheduled_for <= NOW() AND user_id IS NOT NULL`
  );
  for (const { user_id: userId } of due.rows) {
    try {
      await eraseUser(userId);
      log(`[erasure] account erased (${sha256(`user:${userId}`).slice(0, 12)})`);
    } catch (err) {
      console.error('[erasure] failed', err);
    }
  }
  return due.rows.length;
}

function startErasureJob() {
  const tick = () => runErasureSweep().catch((err) => console.error('[erasure] sweep failed', err));
  tick();
  const timer = setInterval(tick, env.ERASURE_SWEEP_MINUTES * 60 * 1000);
  timer.unref();
  return timer;
}

router.get('/export', route(async (req, res) => res.json(await exportData(req.userId))));
router.post('/erasure', route(async (req, res) => res.status(201).json(await requestErasure(req.userId))));
router.delete('/erasure', route(async (req, res) => res.json(await cancelErasure(req.userId))));

module.exports = { router, runErasureSweep, startErasureJob, eraseUser };
