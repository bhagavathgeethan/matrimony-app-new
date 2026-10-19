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

const { tierHas, tierLimit } = require('../../../shared/plans.js');

// The tier a member is on right now: their plan while it is paid up and not paused, otherwise 'free'
function planOf(row) {
  if (!row || !row.plan || row.plan === 'free' || row.plan_paused_at) return 'free';
  return row.premium_until && new Date(row.premium_until) > new Date() ? row.plan : 'free';
}
// Any paid tier (Plus, Premium or Family)
const isPremium = (row) => planOf(row) !== 'free';
// Whether the member's current tier includes a feature (see shared/plans.js)
const has = (row, feature) => tierHas(planOf(row), feature);
const limitOf = (row, key) => tierLimit(planOf(row), key);

const PLAN_COLUMNS = 'plan, premium_until, plan_paused_at';
async function planRow(userId) {
  return (await db.query(`SELECT ${PLAN_COLUMNS} FROM users WHERE id = $1`, [userId])).rows[0];
}
async function premiumFor(userId) {
  return isPremium(await planRow(userId));
}

// Throws 403 PREMIUM_REQUIRED unless the member's tier includes the feature
function requireFeature(row, feature, message) {
  if (!has(row, feature)) {
    const { httpError } = require('./util');
    const { FEATURES, TIER_INFO } = require('../../../shared/plans.js');
    throw httpError(403, message || `${FEATURES[feature].title} is part of 3Knot ${TIER_INFO[FEATURES[feature].tier].name}`, 'PREMIUM_REQUIRED');
  }
}

// Today's date in India (YYYY-MM-DD); daily picks and limits follow the Indian day
function todayIST(now = new Date()) {
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}
const hourIST = (now = new Date()) => new Date(now.getTime() + 330 * 60000).getUTCHours();

module.exports = {
  VISIBLE_USER_SQL, notBlockedSql, isBlockedBetween, isPremium, premiumFor, planOf, has, limitOf, planRow, requireFeature, todayIST, hourIST,
};
