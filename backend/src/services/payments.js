// Payment gateway: 'razorpay' for live/test transactions and 'dummy' for local offline testing.
// A payment provider implements the common interface:
//   createOrder({ paymentId, amountPaise }) -> { provider, orderRef, checkout }
//   verify({ orderRef, payload }) -> true when payment is verified
const crypto = require('crypto');
const env = require('../config/env');
const { randomToken } = require('../lib/util');

function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const dummy = {
  name: 'dummy',
  async createOrder({ amountPaise }) {
    return { provider: 'dummy', orderRef: `dummy_${randomToken(8)}`, checkout: { mode: 'dummy', amountPaise } };
  },
  async verify({ payload }) {
    // Never accept dummy payments in production
    return !env.isProduction && payload?.dummyConfirm === true;
  },
};

const razorpay = {
  name: 'razorpay',
  async createOrder({ paymentId, amountPaise }) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    const authHeader = 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const receipt = String(paymentId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amountPaise),
        currency: 'INR',
        receipt: receipt || `rcpt_${randomToken(8)}`,
        notes: {
          paymentId: String(paymentId),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err?.error?.description || `Razorpay order creation failed: ${res.statusText}`;
      console.error('[Razorpay createOrder error]', err);
      throw new Error(message);
    }

    const order = await res.json();
    return {
      provider: 'razorpay',
      orderRef: order.id,
      checkout: {
        key: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: '3Knot Matrimony',
      },
    };
  },

  async verify({ orderRef, payload }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    if (orderRef && orderRef !== razorpay_order_id) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!timingSafeMatch(expectedSignature, razorpay_signature)) {
      return false;
    }

    // Optional status verification with Razorpay API
    try {
      const authHeader = 'Basic ' + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpay_payment_id)}`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const payment = await res.json();
        return payment.status === 'captured' || payment.status === 'authorized';
      }
    } catch {
      // If network fails during verification check, signature match is authoritative
    }

    return true;
  },

  verifyWebhookSignature(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');
    return timingSafeMatch(expected, signature);
  },
};

const PROVIDERS = { dummy, razorpay };
const provider = PROVIDERS[env.PAYMENT_PROVIDER];
if (!provider) throw new Error(`Unknown PAYMENT_PROVIDER "${env.PAYMENT_PROVIDER}"`);

module.exports = provider;
