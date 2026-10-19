// Interest requests and one-to-one conversations.
// A conversation starts as an interest request (optionally with one intro message). The recipient accepts —
// explicitly or by replying — or declines. Accepted interest is "mutual": photos unblur and chat and calls unlock.
const express = require('express');
const multer = require('multer');
const env = require('../config/env');
const storage = require('../services/storage');
const db = require('../config/db');
const realtime = require('../services/realtime');
const notifications = require('./notifications');
const { computeMatchScore } = require('../services/blueprintEngine');
const { blueprintFromRow } = require('./profile');
const { getCandidate, photosByUser, visiblePhotos } = require('./matches');
const { isBlockedBetween, isPremium, has, limitOf, requireFeature, notBlockedSql, todayIST } = require('../lib/members');
const { httpError, newId, ageFrom, relativeTime } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route } = require('../lib/http');
const { CONVERSATION_PROMPTS } = require('../../../shared/engagement.js');

const router = express.Router();
const MAX_MESSAGE_LENGTH = 2000;
const MAX_VOICE_MS = 60000;
const VOICE_TYPES = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/aac': 'aac', 'audio/x-m4a': 'm4a' };
const voiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1.5 * 1024 * 1024, files: 1 } });
const WEEK_START_SQL = `date_trunc('week', NOW() + INTERVAL '330 minutes') - INTERVAL '330 minutes'`;

const ordered = (x, y) => (x < y ? [x, y] : [y, x]);

function matchedLabel(createdAt) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days <= 0) return 'MATCHED TODAY';
  if (days === 1) return 'MATCHED YESTERDAY';
  return `MATCHED ${days} DAYS AGO`;
}

// receipts: whether the viewer may see read receipts (premium); seenUntil: when the other person last read
function toMessage(m, viewerId, { receipts = false, seenUntil = null } = {}) {
  const mine = m.sender_id === viewerId;
  return {
    id: m.id,
    sender: mine ? 'me' : m.sender_id ? 'them' : 'former',
    text: m.body,
    kind: m.kind || 'text',
    ...(m.kind === 'voice' ? { durationMs: m.duration_ms, audioPath: `/conversations/${m.conversation_id}/voice/${m.id}` } : {}),
    timestamp: new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    createdAt: m.created_at,
    // Read receipts are a premium feature: null when not available
    seen: mine && receipts ? Boolean(seenUntil) && new Date(m.created_at) <= new Date(seenUntil) : undefined,
  };
}

// Builds the thread summaries the app shows, from the viewer's perspective.
// Requests the viewer declined, and threads with blocked members, are hidden.
async function listConversations(userId, onlyId = null) {
  const res = await db.query(
    `SELECT c.id, c.created_at, c.status, c.requested_by, c.responded_at, c.is_super,
            EXISTS (SELECT 1 FROM contact_shares cs WHERE cs.conversation_id = c.id AND cs.user_id = $1) AS i_shared,
            EXISTS (SELECT 1 FROM contact_shares cs WHERE cs.conversation_id = c.id
                    AND cs.user_id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END) AS they_shared,
            CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS other_id,
            (SELECT row_to_json(m.*) FROM messages m WHERE m.conversation_id = c.id
               ORDER BY m.created_at DESC LIMIT 1) AS last_message,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id IS DISTINCT FROM $1
               AND m.created_at > COALESCE((SELECT r.last_read_at FROM conversation_reads r
                                             WHERE r.conversation_id = c.id AND r.user_id = $1), 'epoch'))::int AS unread_count,
            (SELECT r.last_read_at FROM conversation_reads r
              WHERE r.conversation_id = c.id AND r.user_id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END) AS other_read_at
     FROM conversations c
     WHERE (c.user_a = $1 OR c.user_b = $1) AND ($2::uuid IS NULL OR c.id = $2)
       AND NOT (c.status = 'declined' AND c.requested_by IS DISTINCT FROM $1)
       AND ${notBlockedSql('$1', 'CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END')}
     ORDER BY COALESCE((SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id), c.created_at) DESC`,
    [userId, onlyId]
  );
  const otherIds = res.rows.map((r) => r.other_id).filter(Boolean);
  const [others, me, photos, shares] = await Promise.all([
    otherIds.length
      ? db.query(
          `SELECT u.*, row_to_json(b.*) AS bp FROM users u LEFT JOIN blueprints b ON b.user_id = u.id
           WHERE u.id = ANY($1::uuid[])`,
          [otherIds]
        )
      : { rows: [] },
    db.query('SELECT u.plan, u.premium_until, u.plan_paused_at, row_to_json(b.*) AS bp FROM users u LEFT JOIN blueprints b ON b.user_id = u.id WHERE u.id = $1', [userId]),
    photosByUser(otherIds),
    db.query(
      `SELECT DISTINCT ON (s.candidate_id) s.candidate_id, s.status, s.responded_at, l.name
       FROM family_shares s JOIN family_links l ON l.id = s.family_link_id
       WHERE s.user_id = $1 AND s.status <> 'awaiting'
       ORDER BY s.candidate_id, s.responded_at DESC`,
      [userId]
    ),
  ]);
  const othersById = new Map(others.rows.map((o) => [o.id, o]));
  const myBp = blueprintFromRow(me.rows[0]?.bp);
  const premium = has(me.rows[0], 'readReceipts');
  const shareByCandidate = new Map(shares.rows.map((s) => [s.candidate_id, s]));
  const SHARE_WORDS = { approved: 'approved', unsure: 'is unsure', concern_raised: 'raised a concern' };

  const list = res.rows.map((r) => {
    const other = othersById.get(r.other_id);
    const otherBp = blueprintFromRow(other?.bp);
    const score = myBp && otherBp ? computeMatchScore(myBp, otherBp).overall : null;
    const share = shareByCandidate.get(r.other_id);
    const accepted = r.status === 'accepted';
    const pics = other ? visiblePhotos(other, photos.get(other.id), { isMutual: accepted, score: score || 0 }) : { photos: [], photoBlurred: true };
    // Requests from Plus and above sort above free members' (super interests first)
    const fromPaid = Boolean(other) && r.requested_by === other.id && has(other, 'priorityRequests');
    const byMe = r.requested_by === userId;
    return {
      id: r.id,
      candidateId: other?.id || null,
      candidateName: other?.first_name || 'Former member',
      candidateAge: other ? ageFrom(other.birth_year, other.birth_month) : null,
      candidateCity: other?.city || null,
      candidatePhoto: pics.photos[0] || null,
      isBlurred: pics.photoBlurred,
      isFormerMember: !other,
      overlapScore: score,
      // 'requested' (by me: waiting; by them: needs my answer) | 'accepted' | 'declined' (only the sender sees this)
      status: r.status,
      requestedByMe: byMe,
      needsMyResponse: r.status === 'requested' && !byMe,
      canMessage: Boolean(other) && (accepted || (r.status === 'requested' && !byMe)),
      lastMessage: r.last_message?.body || null,
      lastMessageTime: r.last_message ? relativeTime(r.last_message.created_at) : relativeTime(r.created_at),
      unread: r.unread_count > 0,
      unreadCount: r.unread_count,
      matchedDaysAgo: matchedLabel(r.created_at),
      isSuper: r.is_super,
      priority: r.status === 'requested' && r.requested_by !== userId ? (r.is_super ? 2 : fromPaid ? 1 : 0) : 0,
      // Phone numbers are exchanged only when both have chosen to share
      contact: accepted && other ? {
        iShared: r.i_shared,
        theyShared: r.they_shared,
        theirPhone: r.i_shared && r.they_shared ? other.phone : null,
      } : null,
      readReceipts: premium,
      otherReadAt: premium ? r.other_read_at : null,
      sharedWithParentStatus: share
        ? `${share.name} ${SHARE_WORDS[share.status] || share.status} · ${relativeTime(share.responded_at)}`
        : null,
    };
  });
  // Requests needing an answer: super interests, then paid members', keeping recency within each group
  return list.map((t, i) => ({ t, i })).sort((a, b) => {
    if (a.t.needsMyResponse && b.t.needsMyResponse) return b.t.priority - a.t.priority || a.i - b.i;
    return a.i - b.i;
  }).map(({ t }) => t);
}

// Starters for where the two blueprints differ most
async function conversationPrompts(userId, otherId) {
  if (!otherId) return [];
  const res = await db.query(
    'SELECT user_id, row_to_json(b.*) AS bp FROM blueprints b WHERE user_id = ANY($1::uuid[])',
    [[userId, otherId]]
  );
  const mine = blueprintFromRow(res.rows.find((r) => r.user_id === userId)?.bp);
  const theirs = blueprintFromRow(res.rows.find((r) => r.user_id === otherId)?.bp);
  if (!mine || !theirs) return CONVERSATION_PROMPTS.general;
  const byGap = ['money', 'roots', 'kids', 'ambition'].sort((a, b) => Math.abs(theirs[b] - mine[b]) - Math.abs(theirs[a] - mine[a]));
  return [CONVERSATION_PROMPTS[byGap[0]][0], CONVERSATION_PROMPTS[byGap[1]][0], CONVERSATION_PROMPTS[byGap[0]][1]];
}

async function getConversation(userId, conversationId) {
  const [summary] = await listConversations(userId, conversationId);
  if (!summary) throw httpError(404, 'Conversation not found');
  const msgs = await db.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);
  return {
    ...summary,
    messages: msgs.rows.map((m) => toMessage(m, userId, { receipts: summary.readReceipts, seenUntil: summary.otherReadAt })),
    conversationPrompts: await conversationPrompts(userId, summary.candidateId),
  };
}

async function interestsSentToday(userId) {
  const res = await db.query(
    `SELECT COUNT(*)::int AS n FROM conversations
     WHERE requested_by = $1 AND (created_at + INTERVAL '330 minutes')::date = $2::date`,
    [userId, todayIST()]
  );
  return res.rows[0].n;
}

async function senderName(userId) {
  return (await db.query('SELECT first_name FROM users WHERE id = $1', [userId])).rows[0]?.first_name || 'Your match';
}

function announce(conversationId, ...userIds) {
  realtime.notify(userIds, 'conversation:updated', { conversationId });
}

// Accepts a pending request addressed to userId (explicitly, or by replying)
async function acceptRequest(userId, conversationId, { quiet = false } = {}) {
  const c = (await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId])).rows[0];
  if (!c || (c.user_a !== userId && c.user_b !== userId)) throw httpError(404, 'Conversation not found');
  if (c.status === 'accepted') return c;
  if (c.requested_by === userId) throw httpError(403, 'Waiting for them to respond', 'AWAITING_RESPONSE');
  const updated = (await db.query(
    `UPDATE conversations SET status = 'accepted', responded_at = NOW() WHERE id = $1 RETURNING *`,
    [conversationId]
  )).rows[0];
  await notifications.markRead(userId, { groupKey: `interest:${conversationId}` });
  if (c.requested_by && !quiet) {
    const name = await senderName(userId);
    await notifications.notify(c.requested_by, {
      type: 'interest_accepted',
      title: tx('{name} accepted your interest', { name }),
      body: tx('You can now chat, see each other’s photos and video call.'),
      data: { conversationId, senderName: name },
    });
  }
  announce(conversationId, c.user_a, c.user_b);
  return updated;
}

// Expressing interest: opens (or returns) the thread with a candidate, as a request
async function openConversation(userId, candidateId, { message, isSuper = false } = {}) {
  if (!candidateId) throw httpError(400, 'candidateId is required');
  const candidate = await getCandidate(userId, candidateId);
  if (!candidate) throw httpError(404, 'Profile not found');
  const [a, b] = ordered(userId, candidateId);
  const existing = (await db.query('SELECT * FROM conversations WHERE user_a = $1 AND user_b = $2', [a, b])).rows[0];
  if (existing) {
    if (existing.status === 'declined' && existing.requested_by === userId) {
      throw httpError(409, 'This member isn’t available right now', 'INTEREST_DECLINED');
    }
    // They had already sent you interest (or you had declined it): opening it now means yes
    if (existing.status !== 'accepted' && existing.requested_by !== userId) {
      await acceptRequest(userId, existing.id);
    }
    if (message) await sendMessage(userId, existing.id, message);
    return { conversation: await getConversation(userId, existing.id), created: false };
  }

  const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
  if (!has(me, 'unlimitedInterests') && (await interestsSentToday(userId)) >= env.INTEREST_DAILY_LIMIT) {
    throw httpError(429, `You can send ${env.INTEREST_DAILY_LIMIT} interests a day on the free plan. Plus removes the limit.`, 'INTEREST_LIMIT');
  }
  if (isSuper) {
    requireFeature(me, 'superInterest');
    const used = (await db.query(
      `SELECT COUNT(*)::int AS n FROM conversations WHERE requested_by = $1 AND is_super AND created_at >= ${WEEK_START_SQL}`,
      [userId]
    )).rows[0].n;
    if (used >= limitOf(me, 'superInterestsPerWeek')) {
      throw httpError(429, 'You’ve used this week’s super interests. They refresh on Monday.', 'SUPER_LIMIT');
    }
  }

  const id = newId();
  await db.query(
    `INSERT INTO conversations (id, user_a, user_b, status, requested_by, is_super) VALUES ($1, $2, $3, 'requested', $4, $5)
     ON CONFLICT (user_a, user_b) DO NOTHING`,
    [id, a, b, userId, Boolean(isSuper)]
  );
  const row = (await db.query('SELECT id FROM conversations WHERE user_a = $1 AND user_b = $2', [a, b])).rows[0];
  const created = row.id === id;
  if (created) {
    const name = await senderName(userId);
    if (message) await sendMessage(userId, row.id, message, { silent: true });
    await notifications.notify(candidateId, {
      type: 'interest_request',
      title: tx(isSuper ? '⭐ {name} sent you a super interest' : '{name} is interested in you', { name }),
      body: message ? String(message).trim().slice(0, 200) : tx('Accept to start chatting and see each other’s photos.'),
      data: { conversationId: row.id, senderName: name, candidateId: userId },
      groupKey: `interest:${row.id}`,
    });
    announce(row.id, candidateId);
  }
  return { conversation: await getConversation(userId, row.id), created };
}

async function declineRequest(userId, conversationId) {
  const c = (await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId])).rows[0];
  if (!c || (c.user_a !== userId && c.user_b !== userId)) throw httpError(404, 'Conversation not found');
  if (c.status !== 'requested' || c.requested_by === userId) throw httpError(400, 'Only a pending request sent to you can be declined');
  await db.query(`UPDATE conversations SET status = 'declined', responded_at = NOW() WHERE id = $1`, [conversationId]);
  await notifications.markRead(userId, { groupKey: `interest:${conversationId}` });
  // The sender is not notified; their request simply shows as not available
  announce(conversationId, c.user_a, c.user_b);
  return { id: conversationId, status: 'declined' };
}

async function threadFor(conversationId, userId) {
  const c = (await db.query('SELECT * FROM conversations WHERE id = $1', [conversationId])).rows[0];
  if (!c || (c.user_a !== userId && c.user_b !== userId)) throw httpError(404, 'Conversation not found');
  return { ...c, other: c.user_a === userId ? c.user_b : c.user_a };
}

async function sendMessage(userId, conversationId, text, { silent = false } = {}) {
  const body = typeof text === 'string' ? text.trim() : '';
  if (!body) throw httpError(400, 'Message text is required');
  if (body.length > MAX_MESSAGE_LENGTH) throw httpError(400, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
  let c = await threadFor(conversationId, userId);
  if (!c.other) throw httpError(410, 'This member has left 3Knot');
  // Blocked threads look like they don't exist, so a block is never revealed
  if (await isBlockedBetween(userId, c.other)) throw httpError(404, 'Conversation not found');
  if (c.status === 'declined') throw httpError(403, 'This member isn’t available right now', 'INTEREST_DECLINED');

  let acceptedNow = false;
  if (c.status === 'requested') {
    if (c.requested_by === userId) {
      // The sender may include an intro with the request: one message, or three on Premium
      const sent = (await db.query('SELECT COUNT(*)::int AS n FROM messages WHERE conversation_id = $1 AND sender_id = $2', [conversationId, userId])).rows[0].n;
      const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
      if (sent >= limitOf(me, 'introMessages')) throw httpError(403, 'You can send more once they accept your interest', 'AWAITING_RESPONSE');
    } else {
      // Replying to a request accepts it
      c = { ...c, ...(await acceptRequest(userId, conversationId, { quiet: true })) };
      acceptedNow = true;
    }
  }

  const row = (await db.query(
    'INSERT INTO messages (id, conversation_id, sender_id, body) VALUES ($1, $2, $3, $4) RETURNING *',
    [newId(), conversationId, userId, body]
  )).rows[0];
  await markRead(userId, conversationId);

  realtime.notify(c.other, 'message:new', { conversationId, message: toMessage(row, c.other) });
  realtime.notify(userId, 'message:new', { conversationId, message: toMessage(row, userId) });

  if (silent) return toMessage(row, userId);
  const name = await senderName(userId);
  if (acceptedNow) {
    await notifications.notify(c.other, {
      type: 'interest_accepted',
      title: tx('{name} accepted your interest', { name }),
      body,
      data: { conversationId, senderName: name },
    });
  } else {
    const firstMessage = (await db.query('SELECT COUNT(*)::int AS n FROM messages WHERE conversation_id = $1', [conversationId])).rows[0].n === 1;
    await notifications.notify(c.other, {
      type: 'message',
      title: firstMessage ? tx('{name} started a conversation', { name }) : name,
      body,
      data: { conversationId, senderName: name },
      groupKey: `conversation:${conversationId}`,
    });
  }
  return toMessage(row, userId);
}

async function markRead(userId, conversationId) {
  const c = await threadFor(conversationId, userId);
  await db.query(
    `INSERT INTO conversation_reads (conversation_id, user_id, last_read_at) VALUES ($1, $2, NOW())
     ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_read_at = NOW()`,
    [conversationId, userId]
  );
  // Reading a conversation clears its notifications, and lets a premium sender see "Seen"
  await notifications.markRead(userId, { groupKey: `conversation:${conversationId}` });
  await notifications.markRead(userId, { groupKey: `interest:${conversationId}` });
  if (c.other) realtime.notify(c.other, 'conversation:read', { conversationId, readAt: new Date().toISOString() });
  return { id: conversationId, unread: false };
}

// For video calls: both people must be in an accepted conversation and not blocked
async function canCall(userId, conversationId) {
  const c = await threadFor(conversationId, userId).catch(() => null);
  if (!c || !c.other || c.status !== 'accepted') return null;
  if (await isBlockedBetween(userId, c.other)) return null;
  return c.other;
}

router.get('/', route(async (req, res) => res.json(await listConversations(req.userId))));
router.post('/', route(async (req, res) => {
  const { conversation, created } = await openConversation(req.userId, req.body?.candidateId, { message: req.body?.message, isSuper: req.body?.super === true });
  res.status(created ? 201 : 200).json(conversation);
}));
router.get('/limits', route(async (req, res) => {
  const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [req.userId])).rows[0];
  const unlimited = has(me, 'unlimitedInterests');
  const used = await interestsSentToday(req.userId);
  const superUsed = (await db.query(
    `SELECT COUNT(*)::int AS n FROM conversations WHERE requested_by = $1 AND is_super AND created_at >= ${WEEK_START_SQL}`,
    [req.userId]
  )).rows[0].n;
  res.json({
    premium: isPremium(me),
    interestsUsedToday: used,
    interestsLeftToday: unlimited ? null : Math.max(0, env.INTEREST_DAILY_LIMIT - used),
    dailyLimit: env.INTEREST_DAILY_LIMIT,
    superInterestsLeft: Math.max(0, limitOf(me, 'superInterestsPerWeek') - superUsed),
    introMessages: limitOf(me, 'introMessages'),
  });
}));
router.get('/:id', route(async (req, res) => res.json(await getConversation(req.userId, req.params.id))));
router.post('/:id/accept', route(async (req, res) => {
  await acceptRequest(req.userId, req.params.id);
  res.json(await getConversation(req.userId, req.params.id));
}));
router.post('/:id/decline', route(async (req, res) => res.json(await declineRequest(req.userId, req.params.id))));
router.post('/:id/messages', route(async (req, res) => {
  res.status(201).json({ message: await sendMessage(req.userId, req.params.id, req.body?.text) });
}));
router.put('/:id/read', route(async (req, res) => res.json(await markRead(req.userId, req.params.id))));

// ---------- voice notes (Premium to send; anyone in the thread can listen) ----------

async function sendVoice(userId, conversationId, file, durationMs) {
  if (!file) throw httpError(400, 'Attach the recording in the "audio" field');
  const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
  requireFeature(me, 'voiceNotes');
  const c = await threadFor(conversationId, userId);
  if (!c.other || c.status !== 'accepted') throw httpError(403, 'Voice notes work once you have both accepted interest');
  if (await isBlockedBetween(userId, c.other)) throw httpError(404, 'Conversation not found');
  const type = String(file.mimetype || '').split(';')[0];
  const ext = VOICE_TYPES[type];
  if (!ext) throw httpError(400, 'Unsupported audio format');
  const duration = Math.round(Number(durationMs) || 0);
  if (duration <= 0 || duration > MAX_VOICE_MS) throw httpError(400, 'Voice notes can be up to one minute');
  const id = newId();
  const key = `voice/${conversationId}/${id}.${ext}`;
  await storage.private.put(key, file.buffer);
  const row = (await db.query(
    `INSERT INTO messages (id, conversation_id, sender_id, body, kind, media_key, duration_ms)
     VALUES ($1, $2, $3, $4, 'voice', $5, $6) RETURNING *`,
    [id, conversationId, userId, '🎤 Voice note', key, duration]
  )).rows[0];
  await markRead(userId, conversationId);
  realtime.notify(c.other, 'message:new', { conversationId, message: toMessage(row, c.other) });
  realtime.notify(userId, 'message:new', { conversationId, message: toMessage(row, userId) });
  const name = await senderName(userId);
  await notifications.notify(c.other, {
    type: 'message', title: name, body: tx('🎤 Voice note'), data: { conversationId, senderName: name }, groupKey: `conversation:${conversationId}`,
  });
  return toMessage(row, userId);
}

async function voiceFile(userId, conversationId, messageId) {
  await threadFor(conversationId, userId);
  const m = (await db.query(`SELECT media_key FROM messages WHERE id = $1 AND conversation_id = $2 AND kind = 'voice'`, [messageId, conversationId])).rows[0];
  if (!m) throw httpError(404, 'Not found');
  const ext = m.media_key.split('.').pop();
  const mime = Object.entries(VOICE_TYPES).find(([, e]) => e === ext)?.[0] || 'application/octet-stream';
  return { buffer: await storage.private.read(m.media_key), mime };
}

router.post('/:id/voice', voiceUpload.single('audio'), route(async (req, res) => {
  res.status(201).json({ message: await sendVoice(req.userId, req.params.id, req.file, req.body?.durationMs) });
}));
router.get('/:id/voice/:messageId', route(async (req, res) => {
  const { buffer, mime } = await voiceFile(req.userId, req.params.id, req.params.messageId);
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(buffer);
}));

// ---------- phone-number sharing (Premium to offer first; either can accept) ----------

async function shareContact(userId, conversationId, share) {
  const c = await threadFor(conversationId, userId);
  if (!c.other || c.status !== 'accepted') throw httpError(403, 'Numbers can be shared once you have both accepted interest');
  if (await isBlockedBetween(userId, c.other)) throw httpError(404, 'Conversation not found');
  if (share) {
    const theyShared = (await db.query('SELECT 1 FROM contact_shares WHERE conversation_id = $1 AND user_id = $2', [conversationId, c.other])).rows.length > 0;
    if (!theyShared) {
      const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
      requireFeature(me, 'contactShare', 'Offering your number first is a Premium feature — you can always accept when they offer theirs');
    }
    await db.query('INSERT INTO contact_shares (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [conversationId, userId]);
    const name = await senderName(userId);
    await notifications.notify(c.other, {
      type: 'message',
      title: tx(theyShared ? '{name} shared their number too' : '{name} offered to exchange phone numbers', { name }),
      body: tx(theyShared ? 'You can now see each other’s numbers in the chat.' : 'Share yours back to see each other’s numbers.'),
      data: { conversationId, senderName: name },
    });
  } else {
    await db.query('DELETE FROM contact_shares WHERE conversation_id = $1 AND user_id = $2', [conversationId, userId]);
  }
  announce(conversationId, c.user_a, c.user_b);
  return getConversation(userId, conversationId);
}

router.post('/:id/contact', route(async (req, res) => res.json(await shareContact(req.userId, req.params.id, true))));
router.delete('/:id/contact', route(async (req, res) => res.json(await shareContact(req.userId, req.params.id, false))));

module.exports = { router, listConversations, canCall, openConversation };
