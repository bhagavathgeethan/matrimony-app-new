// Premium plans: checkout through the payment provider, then premium_until is extended.
// What premium unlocks is enforced where each feature lives (interest limit, admirers, read receipts, search boost, incognito).
const express = require('express');
const db = require('../config/db');
const payments = require('../services/payments');
const { httpError, newId } = require('../lib/util');
const { route } = require('../lib/http');
const { isPremium } = require('../lib/members');
const { PREMIUM_FEATURES } = require('../../../shared/engagement.js');

const router = express.Router();

// Prices in paise (₹1 = 100 paise)
const PLANS = [
  { code: 'premium_1m', name: '1 month', months: 1, pricePaise: 49900 },
  { code: 'premium_3m', name: '3 months', months: 3, pricePaise: 119900, badge: 'Popular' },
  { code: 'premium_6m', name: '6 months', months: 6, pricePaise: 199900, badge: 'Best value' },
];

async function overview(userId) {
  const u = (await db.query('SELECT plan, premium_until FROM users WHERE id = $1', [userId])).rows[0];
  return {
    premium: isPremium(u),
    premiumUntil: isPremium(u) ? u.premium_until : null,
    provider: payments.name,
    plans: PLANS.map((p) => ({ ...p, price: `₹${(p.pricePaise / 100).toLocaleString('en-IN')}` })),
    features: PREMIUM_FEATURES.map(([title, detail]) => ({ title, detail })),
  };
}

async function checkout(userId, planCode) {
  const plan = PLANS.find((p) => p.code === planCode);
  if (!plan) throw httpError(400, 'Choose a plan');
  const id = newId();
  const order = await payments.createOrder({ paymentId: id, amountPaise: plan.pricePaise });
  await db.query(
    `INSERT INTO payments (id, user_id, plan_code, amount_paise, provider, provider_ref) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, plan.code, plan.pricePaise, order.provider, order.orderRef]
  );
  return { paymentId: id, plan, provider: order.provider, checkout: order.checkout };
}

async function confirm(userId, body) {
  const payment = (await db.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [body.paymentId, userId]).catch(() => ({ rows: [] }))).rows[0];
  if (!payment) throw httpError(404, 'Payment not found');
  if (payment.status === 'paid') return overview(userId);
  const ok = await payments.verify({ orderRef: payment.provider_ref, payload: body.payload || {} });
  if (!ok) {
    await db.query(`UPDATE payments SET status = 'failed' WHERE id = $1`, [payment.id]);
    throw httpError(402, 'Payment was not completed', 'PAYMENT_FAILED');
  }
  const plan = PLANS.find((p) => p.code === payment.plan_code);
  // Extends from the current expiry if still premium, otherwise from now
  await db.query(
    `UPDATE users SET plan = 'premium',
       premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + ($2 || ' months')::interval
     WHERE id = $1`,
    [userId, String(plan.months)]
  );
  await db.query(`UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = $1`, [payment.id]);
  const { notify } = require('./notifications');
  await notify(userId, {
    type: 'account',
    title: 'Welcome to Sangam Premium',
    body: `Your ${plan.name} plan is active.`,
    data: { target: 'premium' },
  });
  return overview(userId);
}

async function history(userId) {
  const res = await db.query(
    `SELECT id, plan_code, amount_paise, provider, status, created_at, paid_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows.map((r) => ({
    id: r.id, plan: PLANS.find((p) => p.code === r.plan_code)?.name || r.plan_code,
    amount: `₹${(r.amount_paise / 100).toLocaleString('en-IN')}`, provider: r.provider, status: r.status, createdAt: r.created_at, paidAt: r.paid_at,
  }));
}

router.get('/', route(async (req, res) => res.json(await overview(req.userId))));
router.post('/checkout', route(async (req, res) => res.status(201).json(await checkout(req.userId, req.body?.plan))));
router.post('/confirm', route(async (req, res) => res.json(await confirm(req.userId, req.body || {}))));
router.get('/payments', route(async (req, res) => res.json(await history(req.userId))));

module.exports = { router, PLANS };
