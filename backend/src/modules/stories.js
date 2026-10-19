// Success stories: one partner submits, the other confirms, an admin publishes. Either partner can withdraw.
const express = require('express');
const db = require('../config/db');
const { httpError, newId } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route, optionalString } = require('../lib/http');

const router = express.Router();
const publicRouter = express.Router();

const toDto = (r, viewerId) => ({
  id: r.id,
  title: r.title,
  story: r.story,
  names: r.display_names,
  status: r.status,
  submittedByMe: r.submitted_by === viewerId,
  needsMyConfirmation: r.status === 'pending_partner' && r.partner_id === viewerId,
  createdAt: r.created_at,
  publishedAt: r.published_at,
});

async function mine(userId) {
  const res = await db.query(
    'SELECT * FROM success_stories WHERE submitted_by = $1 OR partner_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows.map((r) => toDto(r, userId));
}

async function submit(userId, body) {
  const title = optionalString(body, 'title', { max: 100 });
  const story = optionalString(body, 'story', { max: 1500 });
  if (!title || !story) throw httpError(400, 'Add a title and your story');
  const c = (await db.query('SELECT * FROM conversations WHERE id = $1', [body.conversationId]).catch(() => ({ rows: [] }))).rows[0];
  if (!c || (c.user_a !== userId && c.user_b !== userId)) throw httpError(404, 'Conversation not found');
  if (c.status !== 'accepted') throw httpError(400, 'Stories can be shared once you have both accepted interest');
  const partnerId = c.user_a === userId ? c.user_b : c.user_a;
  if (!partnerId) throw httpError(410, 'Your partner has left 3Knot');
  const open = await db.query(
    `SELECT 1 FROM success_stories WHERE conversation_id = $1 AND status IN ('pending_partner', 'pending_review', 'published')`,
    [c.id]
  );
  if (open.rows.length) throw httpError(409, 'A story for the two of you is already shared');

  const names = (await db.query('SELECT id, first_name FROM users WHERE id = ANY($1::uuid[])', [[userId, partnerId]])).rows;
  const nameOf = (id) => names.find((n) => n.id === id)?.first_name || 'Member';
  const row = (await db.query(
    `INSERT INTO success_stories (id, submitted_by, partner_id, conversation_id, title, story, display_names)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [newId(), userId, partnerId, c.id, title, story, `${nameOf(userId)} & ${nameOf(partnerId)}`]
  )).rows[0];
  const { notify } = require('./notifications');
  await notify(partnerId, {
    type: 'account',
    title: tx('{name} wants to share your story', { name: nameOf(userId) }),
    body: tx('Confirm to let the 3Knot team publish it — or decline, no questions asked.'),
    data: { target: 'stories', storyId: row.id },
  });
  return toDto(row, userId);
}

async function respond(userId, id, accept) {
  const r = (await db.query('SELECT * FROM success_stories WHERE id = $1', [id]).catch(() => ({ rows: [] }))).rows[0];
  if (!r || r.partner_id !== userId) throw httpError(404, 'Story not found');
  if (r.status !== 'pending_partner') throw httpError(409, 'Already answered');
  const updated = (await db.query(
    `UPDATE success_stories SET status = $2, partner_confirmed_at = CASE WHEN $3 THEN NOW() ELSE NULL END WHERE id = $1 RETURNING *`,
    [id, accept ? 'pending_review' : 'rejected', accept]
  )).rows[0];
  return toDto(updated, userId);
}

async function withdraw(userId, id) {
  const res = await db.query('DELETE FROM success_stories WHERE id = $1 AND (submitted_by = $2 OR partner_id = $2)', [id, userId])
    .catch(() => ({ rowCount: 0 }));
  if (!res.rowCount) throw httpError(404, 'Story not found');
  return { success: true };
}

// Admin decision (called from the admin module)
async function review(id, decision) {
  if (!['published', 'rejected'].includes(decision)) throw httpError(400, 'decision must be published or rejected');
  const r = (await db.query('SELECT * FROM success_stories WHERE id = $1', [id])).rows[0];
  if (!r) throw httpError(404, 'Story not found');
  if (r.status !== 'pending_review') throw httpError(409, 'Only stories confirmed by both partners can be reviewed');
  await db.query('UPDATE success_stories SET status = $2, published_at = $3 WHERE id = $1', [id, decision, decision === 'published' ? new Date() : null]);
  if (decision === 'published') {
    const { notify } = require('./notifications');
    for (const uid of [r.submitted_by, r.partner_id]) {
      await notify(uid, { type: 'account', title: tx('Your story is live'), body: tx('Thank you for sharing it with the 3Knot community.'), data: { target: 'stories' } });
    }
  }
  return { id, status: decision };
}

async function published(limit = 12) {
  const res = await db.query(
    `SELECT id, title, story, display_names, published_at FROM success_stories
     WHERE status = 'published' ORDER BY published_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows.map((r) => ({
    id: r.id, title: r.title, story: r.story, names: r.display_names,
    month: new Date(r.published_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
  }));
}

router.get('/', route(async (req, res) => res.json(await mine(req.userId))));
router.post('/', route(async (req, res) => res.status(201).json(await submit(req.userId, req.body || {}))));
router.post('/:id/confirm', route(async (req, res) => res.json(await respond(req.userId, req.params.id, true))));
router.post('/:id/decline', route(async (req, res) => res.json(await respond(req.userId, req.params.id, false))));
router.delete('/:id', route(async (req, res) => res.json(await withdraw(req.userId, req.params.id))));
publicRouter.get('/', route(async (req, res) => res.json(await published())));

module.exports = { router, publicRouter, review };
