// Shared rules about members: who is visible, who has blocked whom, and premium entitlements
const db = require('../config/db');

// Users who can appear to others: onboarded, consenting to matching, not paused, not hidden by moderation,
// not on the way out. Expects the users table aliased as `u`.
const VISIBLE_USER_SQL = `
  u.onboarding_completed_at IS NOT NULL
  AND u.paused_at IS NULL
  AND u.moderation_hidden_at IS NULL
  AND EXISTS (SELECT 1 FROM consents c WHERE c.user_id = u.id AND c.matching)
  AND NOT EXISTS (
    SELECT 1 FROM erasure_requests e
    WHERE e.user_id = u.id AND e.completed_at IS NULL AND e.cancelled_at IS NULL
  )
`;

// Neither side has blocked the other. `viewer` is a SQL expression (usually a $n placeholder), `other` a column.
const notBlockedSql = (viewer, other = 'u.id') => `NOT EXISTS (
  SELECT 1 FROM blocks bl
  WHERE (bl.user_id = ${viewer} AND bl.blocked_id = ${other}) OR (bl.user_id = ${other} AND bl.blocked_id = ${viewer})
)`;

async function isBlockedBetween(a, b) {
  const res = await db.query(
    'SELECT 1 FROM blocks WHERE (user_id = $1 AND blocked_id = $2) OR (user_id = $2 AND blocked_id = $1) LIMIT 1',
    [a, b]
  );
  return res.rows.length > 0;
}

const isPremium = (row) => row?.plan === 'premium' && Boolean(row.premium_until) && new Date(row.premium_until) > new Date();

async function premiumFor(userId) {
  const res = await db.query('SELECT plan, premium_until FROM users WHERE id = $1', [userId]);
  return isPremium(res.rows[0]);
}

// Today's date in India (YYYY-MM-DD); daily picks and limits follow the Indian day
function todayIST(now = new Date()) {
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}
const hourIST = (now = new Date()) => new Date(now.getTime() + 330 * 60000).getUTCHours();

module.exports = { VISIBLE_USER_SQL, notBlockedSql, isBlockedBetween, isPremium, premiumFor, todayIST, hourIST };
