// Paid tiers and add-ons: checkout through the payment provider, trial, pause/resume, spotlights, gifts from
// family, and the assisted (relationship manager) service. What each tier includes lives in shared/plans.js and is
// enforced where each feature lives.
const express = require('express');
const db = require('../config/db');
const payments = require('../services/payments');
const { httpError, newId } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route, optionalString } = require('../lib/http');
const { planOf, has, limitOf } = require('../lib/members');
const {
  TIERS, TIER_INFO, FEATURES, PLAN_CATALOG, ADDONS, TRIAL_DAYS, TRIAL_TIER, SPOTLIGHT_HOURS, featuresOf, priceText,
} = require('../../../shared/plans.js');

const router = express.Router();
const PRODUCTS = [...PLAN_CATALOG.map((p) => ({ ...p, kind: 'plan' })), ...ADDONS];
const productFor = (code) => PRODUCTS.find((p) => p.code === code);

const USER_COLS = 'id, first_name, plan, premium_until, plan_paused_at, paused_remaining_seconds, trial_used_at, spotlight_credits, assisted_until, onboarding_completed_at';
const loadUser = async (userId) => (await db.query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [userId])).rows[0];

// Start of the current week (Monday, India time) for weekly allowances
// Monday 00:00 IST of this week. AT TIME ZONE keeps it right whatever the database session's time zone is.
const WEEK_START_SQL = `(date_trunc('week', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`;

async function activeSpotlight(userId) {
  return (await db.query('SELECT * FROM spotlights WHERE user_id = $1 AND ends_at > NOW() ORDER BY ends_at DESC LIMIT 1', [userId])).rows[0] || null;
}

async function spotlightState(u) {
  const usedThisWeek = (await db.query(
    `SELECT COUNT(*)::int AS n FROM spotlights WHERE user_id = $1 AND source = 'plan' AND starts_at >= ${WEEK_START_SQL}`,
    [u.id]
  )).rows[0].n;
  const active = await activeSpotlight(u.id);
  const weekly = limitOf(u, 'spotlightsPerWeek');
  return {
    active: active ? { endsAt: active.ends_at } : null,
    weeklyLeft: Math.max(0, weekly - usedThisWeek),
    credits: u.spotlight_credits,
  };
}

async function overview(userId) {
  const u = await loadUser(userId);
  const tier = planOf(u);
  const assistedActive = Boolean(u.assisted_until && new Date(u.assisted_until) > new Date());
  const superUsed = (await db.query(
    `SELECT COUNT(*)::int AS n FROM conversations WHERE requested_by = $1 AND is_super AND created_at >= ${WEEK_START_SQL}`,
    [userId]
  )).rows[0].n;
  return {
    tier,
    tierName: TIER_INFO[tier].name,
    premium: tier !== 'free',
    premiumUntil: tier !== 'free' ? u.premium_until : null,
    paused: u.plan_paused_at ? { since: u.plan_paused_at, remainingDays: Math.ceil((u.paused_remaining_seconds || 0) / 86400), tier: u.plan } : null,
    trialAvailable: !u.trial_used_at && tier === 'free' && !u.plan_paused_at && Boolean(u.onboarding_completed_at),
    trialDays: TRIAL_DAYS,
    provider: payments.name,
    tiers: TIERS.filter((t) => t !== 'free').map((t) => ({
      tier: t,
      ...TIER_INFO[t],
      plans: PLAN_CATALOG.filter((p) => p.tier === t).map((p) => ({ ...p, price: priceText(p.pricePaise), perMonth: priceText(Math.round(p.pricePaise / p.months)) })),
      features: featuresOf(t).map((k) => ({ key: k, ...FEATURES[k] })),
    })),
    addons: ADDONS.map((a) => ({ ...a, price: priceText(a.pricePaise) })),
    features: featuresOf(tier),
    spotlight: await spotlightState(u),
    superInterestsLeft: Math.max(0, limitOf(u, 'superInterestsPerWeek') - superUsed),
    assisted: { active: assistedActive, until: assistedActive ? u.assisted_until : null },
  };
}

// Applies a paid product to a member
async function applyProduct(userId, product) {
  if (product.kind === 'plan') {
    const u = await loadUser(userId);
    const current = planOf(u);
    // Same tier extends; another tier switches now and keeps the remaining paid time
    // A paused plan resumes with its frozen time; otherwise extend from the later of now and the current expiry
    await db.query(
      `UPDATE users SET
         premium_until = CASE WHEN plan_paused_at IS NOT NULL
                              THEN NOW() + make_interval(secs => COALESCE(paused_remaining_seconds, 0))
                              ELSE GREATEST(COALESCE(premium_until, NOW()), NOW()) END + ($3 || ' months')::interval,
         plan = $2, plan_paused_at = NULL, paused_remaining_seconds = NULL
       WHERE id = $1`,
      [userId, product.tier, String(product.months)]
    );
    return `${TIER_INFO[product.tier].name} · ${product.months} month${product.months > 1 ? 's' : ''}${current !== 'free' && current !== product.tier ? ` (switched from ${TIER_INFO[current].name})` : ''}`;
  }
  if (product.kind === 'spotlight') {
    await db.query('UPDATE users SET spotlight_credits = spotlight_credits + 1 WHERE id = $1', [userId]);
    return product.name;
  }
  await db.query(
    `UPDATE users SET assisted_until = GREATEST(COALESCE(assisted_until, NOW()), NOW()) + ($2 || ' months')::interval WHERE id = $1`,
    [userId, String(product.months)]
  );
  return product.name;
}

async function createPayment({ product, payerId, beneficiaryId, giftedByLink = null }) {
  const id = newId();
  const order = await payments.createOrder({ paymentId: id, amountPaise: product.pricePaise });
  await db.query(
    `INSERT INTO payments (id, user_id, plan_code, amount_paise, provider, provider_ref, kind, beneficiary_id, gifted_by_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, payerId, product.code, product.pricePaise, order.provider, order.orderRef, product.kind, beneficiaryId, giftedByLink]
  );
  return { paymentId: id, product: { ...product, price: priceText(product.pricePaise) }, plan: product, provider: order.provider, checkout: order.checkout };
}

async function checkout(userId, code) {
  const product = productFor(code);
  if (!product) throw httpError(400, 'Choose a plan');
  return createPayment({ product, payerId: userId, beneficiaryId: userId });
}

// Verifies with the provider and applies the product once
async function settle(payment, payload) {
  if (payment.status === 'paid') return { already: true };
  const ok = await payments.verify({ orderRef: payment.provider_ref, payload: payload || {} });
  if (!ok) {
    await db.query(`UPDATE payments SET status = 'failed' WHERE id = $1`, [payment.id]);
    throw httpError(402, 'Payment was not completed', 'PAYMENT_FAILED');
  }
  const claimed = await db.query(`UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = $1 AND status <> 'paid' RETURNING id`, [payment.id]);
  if (!claimed.rows.length) return { already: true };
  const label = await applyProduct(payment.beneficiary_id || payment.user_id, productFor(payment.plan_code));
  return { label };
}

async function confirm(userId, body) {
  const payment = (await db.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [body.paymentId, userId]).catch(() => ({ rows: [] }))).rows[0];
  if (!payment) throw httpError(404, 'Payment not found');
  const { label } = await settle(payment, body.payload);
  if (label) {
    const { notify } = require('./notifications');
    await notify(userId, { type: 'account', title: tx('Payment received'), body: tx('{plan} is active.', { plan: label }), data: { target: 'premium' } });
  }
  return overview(userId);
}

async function history(userId) {
  const res = await db.query(
    `SELECT id, plan_code, amount_paise, provider, status, kind, gifted_by_link, created_at, paid_at FROM payments
     WHERE user_id = $1 OR beneficiary_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows.map((r) => {
    const p = productFor(r.plan_code);
    return {
      id: r.id,
      plan: p ? (p.kind === 'plan' ? `${TIER_INFO[p.tier].name} · ${p.months} month${p.months > 1 ? 's' : ''}` : p.name) : r.plan_code,
      amount: priceText(r.amount_paise), provider: r.provider, status: r.status, gift: Boolean(r.gifted_by_link), createdAt: r.created_at, paidAt: r.paid_at,
    };
  });
}

// ---------- trial, pause ----------

async function startTrial(userId) {
  const u = await loadUser(userId);
  if (!u.onboarding_completed_at) throw httpError(400, 'Finish your profile first');
  if (u.trial_used_at) throw httpError(409, 'You’ve already used your free trial');
  if (planOf(u) !== 'free' || u.plan_paused_at) throw httpError(409, 'You already have a plan');
  await db.query(
    `UPDATE users SET plan = $2, premium_until = NOW() + make_interval(days => $3), trial_used_at = NOW() WHERE id = $1`,
    [userId, TRIAL_TIER, TRIAL_DAYS]
  );
  return overview(userId);
}

// Pausing freezes the remaining paid time (e.g. while engaged); resuming adds it back
async function pause(userId) {
  const u = await loadUser(userId);
  if (planOf(u) === 'free') throw httpError(400, 'There’s no active plan to pause');
  const remaining = Math.max(0, Math.round((new Date(u.premium_until) - Date.now()) / 1000));
  await db.query('UPDATE users SET plan_paused_at = NOW(), paused_remaining_seconds = $2 WHERE id = $1', [userId, remaining]);
  return overview(userId);
}

async function resume(userId) {
  const u = await loadUser(userId);
  if (!u.plan_paused_at) throw httpError(400, 'Your plan isn’t paused');
  await db.query(
    `UPDATE users SET premium_until = NOW() + make_interval(secs => $2), plan_paused_at = NULL, paused_remaining_seconds = NULL WHERE id = $1`,
    [userId, u.paused_remaining_seconds || 0]
  );
  return overview(userId);
}

// ---------- spotlight ----------

async function startSpotlight(userId) {
  const u = await loadUser(userId);
  if (!u.onboarding_completed_at) throw httpError(400, 'Finish your profile first');
  if (await activeSpotlight(userId)) throw httpError(409, 'Your spotlight is already on');
  const state = await spotlightState(u);
  let source;
  if (has(u, 'spotlight') && state.weeklyLeft > 0) source = 'plan';
  else if (u.spotlight_credits > 0) source = 'credit';
  else throw httpError(403, 'No spotlights left — your weekly one is used. Buy an extra spotlight.', 'PREMIUM_REQUIRED');
  if (source === 'credit') await db.query('UPDATE users SET spotlight_credits = spotlight_credits - 1 WHERE id = $1 AND spotlight_credits > 0', [userId]);
  await db.query(
    `INSERT INTO spotlights (id, user_id, ends_at, source) VALUES ($1, $2, NOW() + make_interval(hours => $3), $4)`,
    [newId(), userId, SPOTLIGHT_HOURS, source]
  );
  return overview(userId);
}

// ---------- gifts from family (parent portal) ----------

async function giftCheckout(link, code) {
  const product = productFor(code);
  if (!product || product.kind !== 'plan') throw httpError(400, 'Choose a plan to gift');
  return createPayment({ product, payerId: null, beneficiaryId: link.user_id, giftedByLink: link.id });
}

async function giftConfirm(link, body) {
  const payment = (await db.query('SELECT * FROM payments WHERE id = $1 AND gifted_by_link = $2', [body.paymentId, link.id]).catch(() => ({ rows: [] }))).rows[0];
  if (!payment) throw httpError(404, 'Payment not found');
  const { label } = await settle(payment, body.payload);
  if (label) {
    const { notify } = require('./notifications');
    await notify(link.user_id, { type: 'account', title: tx('{name} gifted you 3Knot {plan}', { name: link.name, plan: label.split(' · ')[0] }), body: tx('{plan} is active — a gift from {name}.', { plan: label, name: link.name }), data: { target: 'premium' } });
  }
  return { gifted: true, label: label || null };
}

// ---------- assisted service ----------

async function assistedOverview(userId) {
  const u = await loadUser(userId);
  const active = Boolean(u.assisted_until && new Date(u.assisted_until) > new Date());
  const request = (await db.query('SELECT * FROM assisted_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId])).rows[0] || null;
  const recs = await db.query('SELECT candidate_id, note, created_at FROM assisted_recommendations WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  let recommendations = [];
  if (recs.rows.length) {
    const { loadViewer, poolRows, buildCards } = require('./matches');
    try {
      const viewer = await loadViewer(userId);
      const rows = await poolRows(viewer, { extraWhere: 'AND u.id = ANY($3::uuid[])', params: [recs.rows.map((r) => r.candidate_id)] });
      const cards = new Map((await buildCards(viewer, rows)).map((c) => [c.id, c]));
      recommendations = recs.rows.filter((r) => cards.has(r.candidate_id)).map((r) => ({ ...cards.get(r.candidate_id), managerNote: r.note, recommendedAt: r.created_at }));
    } catch {
      recommendations = [];
    }
  }
  return {
    active,
    until: active ? u.assisted_until : null,
    request: request ? { id: request.id, notes: request.notes, callTime: request.call_time, status: request.status, managerNote: request.manager_note, createdAt: request.created_at } : null,
    recommendations,
  };
}

async function requestAssisted(userId, body) {
  const u = await loadUser(userId);
  if (!(u.assisted_until && new Date(u.assisted_until) > new Date())) throw httpError(403, 'Assisted service isn’t active on your account', 'PREMIUM_REQUIRED');
  const notes = optionalString(body, 'notes', { max: 1000, allowEmpty: true }) || null;
  const callTime = optionalString(body, 'callTime', { max: 60, allowEmpty: true }) || null;
  const open = (await db.query(`SELECT id FROM assisted_requests WHERE user_id = $1 AND status <> 'closed'`, [userId])).rows[0];
  if (open) {
    await db.query('UPDATE assisted_requests SET notes = $2, call_time = $3, updated_at = NOW() WHERE id = $1', [open.id, notes, callTime]);
  } else {
    await db.query('INSERT INTO assisted_requests (id, user_id, notes, call_time) VALUES ($1, $2, $3, $4)', [newId(), userId, notes, callTime]);
  }
  return assistedOverview(userId);
}

router.get('/', route(async (req, res) => res.json(await overview(req.userId))));
router.post('/checkout', route(async (req, res) => res.status(201).json(await checkout(req.userId, req.body?.plan))));
router.post('/confirm', route(async (req, res) => res.json(await confirm(req.userId, req.body || {}))));
router.get('/payments', route(async (req, res) => res.json(await history(req.userId))));
router.post('/trial', route(async (req, res) => res.json(await startTrial(req.userId))));
router.post('/pause', route(async (req, res) => res.json(await pause(req.userId))));
router.post('/resume', route(async (req, res) => res.json(await resume(req.userId))));
router.post('/spotlight', route(async (req, res) => res.json(await startSpotlight(req.userId))));
router.get('/assisted', route(async (req, res) => res.json(await assistedOverview(req.userId))));
router.post('/assisted', route(async (req, res) => res.json(await requestAssisted(req.userId, req.body || {}))));

module.exports = { router, PLANS: PLAN_CATALOG, giftCheckout, giftConfirm, assistedOverview, activeSpotlight };
