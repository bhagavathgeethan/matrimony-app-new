// Notifications: one notify() entry point stores the inbox item, pushes it live to open apps,
// and falls back to device push when the user has no live connection.
const express = require('express');
const db = require('../config/db');
const realtime = require('../services/realtime');
const push = require('../services/push');
const { httpError, newId, relativeTime } = require('../lib/util');
const { route, oneOf } = require('../lib/http');
const { isTx, render } = require('../lib/i18n');

const router = express.Router();

// Which preference switch controls each type ('security' cannot be turned off)
const CATEGORY = {
  message: 'messages',
  mutual: 'messages',
  interest_request: 'messages',
  interest_accepted: 'messages',
  call: 'messages',
  match: 'matches',
  saved_search: 'matches',
  daily_picks: 'matches',
  family_feedback: 'family',
  family_linked: 'family',
  family_edit: 'family',
  family_proposal: 'family',
  profile_nudge: 'tips',
  // Account events (verification, premium, success stories, moderation) and security alerts are always sent
  account: 'security',
  security: 'security',
};
const PREF_KEYS = ['messages', 'matches', 'family', 'tips', 'push'];
const DEFAULT_PREFS = { messages: true, matches: true, family: true, tips: true, push: true };

// title/body are stored in English; data.i18n keeps the template so each app shows them in its own language
function toDto(n, lang = 'en') {
  const sender = n.data?.senderName;
  const data = n.data || {};
  const i18n = { ...(data.i18n || {}) };
  if (n.type === 'message' && n.count > 1 && sender) i18n.title = { key: '{n} new messages from {name}', vars: { n: n.count, name: sender } };
  return {
    id: n.id,
    type: n.type,
    title: i18n.title ? render(lang, i18n.title) : n.title,
    body: i18n.body ? render(lang, i18n.body) : n.body,
    data: Object.keys(i18n).length ? { ...data, i18n } : data,
    count: n.count,
    read: Boolean(n.read_at),
    createdAt: n.updated_at,
    time: relativeTime(n.updated_at),
  };
}

async function unreadCount(userId) {
  const res = await db.query('SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [userId]);
  return res.rows[0].n;
}

async function getPrefs(userId) {
  const res = await db.query('SELECT notification_prefs FROM users WHERE id = $1', [userId]);
  return { ...DEFAULT_PREFS, ...(res.rows[0]?.notification_prefs || {}) };
}

async function languageOf(userId) {
  const res = await db.query('SELECT ui_language FROM users WHERE id = $1', [userId]);
  return res.rows[0]?.ui_language || 'en';
}

/**
 * Creates (or, for a matching unread groupKey, bumps) a notification for userId.
 * title/body are plain text or tx() templates (lib/i18n.js), which are translated per reader.
 * Returns the stored notification DTO, or null when the user has switched that category off.
 */
async function notify(userId, { type, title: titleIn, body: bodyIn, data: dataIn = {}, groupKey = null }) {
  if (!userId || !CATEGORY[type]) return null;
  const prefs = await getPrefs(userId);
  const category = CATEGORY[type];
  if (category !== 'security' && prefs[category] === false) return null;

  const i18n = {};
  if (isTx(titleIn)) i18n.title = titleIn;
  if (isTx(bodyIn)) i18n.body = bodyIn;
  const data = Object.keys(i18n).length ? { ...dataIn, i18n } : dataIn;
  const title = render('en', titleIn);
  const body = render('en', bodyIn);
  const clippedBody = String(body || '').slice(0, 300);
  let row;
  if (groupKey) {
    row = (await db.query(
      `UPDATE notifications SET count = count + 1, title = $3, body = $4, data = $5, updated_at = NOW()
       WHERE user_id = $1 AND group_key = $2 AND read_at IS NULL RETURNING *`,
      [userId, groupKey, title, clippedBody, JSON.stringify(data)]
    )).rows[0];
  }
  if (!row) {
    row = (await db.query(
      `INSERT INTO notifications (id, user_id, type, title, body, data, group_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, group_key) WHERE read_at IS NULL AND group_key IS NOT NULL
       DO UPDATE SET count = notifications.count + 1, title = EXCLUDED.title, body = EXCLUDED.body,
                     data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [newId(), userId, type, title, clippedBody, JSON.stringify(data), groupKey]
    )).rows[0];
  }

  const dto = toDto(row);
  if (realtime.isOnline(userId)) {
    realtime.notify(userId, 'notification:new', { notification: dto, unreadCount: await unreadCount(userId) });
  } else if (prefs.push !== false) {
    const tokens = (await db.query('SELECT platform, token FROM push_tokens WHERE user_id = $1', [userId])).rows;
    if (tokens.length) {
      // The phone shows push text as sent, so write it in the member's language
      const lang = await languageOf(userId);
      const shown = toDto(row, lang);
      const result = await push.send({ tokens, title: shown.title, body: shown.body, data: { ...dto.data, type, notificationId: dto.id } });
      if (result.failedTokens?.length) {
        await db.query('DELETE FROM push_tokens WHERE token = ANY($1)', [result.failedTokens]);
      }
    }
  }
  return dto;
}

// Marks notifications read: by ids, by group (e.g. when a conversation is opened), or all
async function markRead(userId, { ids, groupKey, all } = {}) {
  if (all) {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [userId]);
  } else if (groupKey) {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND group_key = $2 AND read_at IS NULL', [userId, groupKey]);
  } else if (Array.isArray(ids) && ids.length) {
    await db.query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read_at IS NULL', [userId, ids]);
  } else {
    throw httpError(400, 'Pass ids, or all: true');
  }
  const count = await unreadCount(userId);
  realtime.notify(userId, 'notification:read', { unreadCount: count, ids: ids || null, groupKey: groupKey || null, all: Boolean(all) });
  return { unreadCount: count };
}

async function list(userId, { before, limit = 30 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const res = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND ($2::timestamptz IS NULL OR updated_at < $2)
     ORDER BY updated_at DESC LIMIT $3`,
    [userId, before || null, lim + 1]
  );
  const rows = res.rows.slice(0, lim);
  return {
    items: rows.map((r) => toDto(r)),
    unreadCount: await unreadCount(userId),
    nextCursor: res.rows.length > lim ? rows[rows.length - 1].updated_at : null,
  };
}

async function updatePrefs(userId, body) {
  const current = await getPrefs(userId);
  for (const key of PREF_KEYS) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'boolean') throw httpError(400, `${key} must be true or false`);
      current[key] = body[key];
    }
  }
  await db.query('UPDATE users SET notification_prefs = $2 WHERE id = $1', [userId, JSON.stringify(current)]);
  return current;
}

async function registerToken(userId, body) {
  const platform = oneOf(body, 'platform', ['android', 'ios', 'web']);
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!platform || !token || token.length > 512) throw httpError(400, 'platform and token are required');
  // A device token belongs to whoever signed in on it most recently
  await db.query(
    `INSERT INTO push_tokens (id, user_id, platform, token) VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO UPDATE SET user_id = $2, platform = $3, last_seen_at = NOW()`,
    [newId(), userId, platform, token]
  );
  return { success: true };
}

async function removeToken(userId, token) {
  await db.query('DELETE FROM push_tokens WHERE user_id = $1 AND token = $2', [userId, token]);
  return { success: true };
}

// Routes (auth required; mounted at /api/notifications)
router.get('/', route(async (req, res) => res.json(await list(req.userId, req.query))));
router.post('/read', route(async (req, res) => {
  const { ids, all } = req.body || {};
  res.json(await markRead(req.userId, { ids, all: all === true }));
}));
router.get('/preferences', route(async (req, res) => res.json(await getPrefs(req.userId))));
router.put('/preferences', route(async (req, res) => res.json(await updatePrefs(req.userId, req.body || {}))));
router.post('/push-tokens', route(async (req, res) => res.status(201).json(await registerToken(req.userId, req.body || {}))));
router.delete('/push-tokens', route(async (req, res) => res.json(await removeToken(req.userId, req.body?.token))));

module.exports = { router, notify, markRead, getPrefs, unreadCount };
