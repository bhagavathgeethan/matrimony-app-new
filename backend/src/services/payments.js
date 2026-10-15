// Payment gateway. The 'dummy' provider completes payments without charging (development and testing only).
// A real provider (e.g. Razorpay) implements the same interface:
//   createOrder({ paymentId, amountPaise }) -> { provider, orderRef, checkout }   (checkout = data the app needs)
//   verify({ orderRef, payload }) -> true when the payment is genuinely captured
const env = require('../config/env');
const { randomToken } = require('../lib/util');

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

const PROVIDERS = { dummy };
const provider = PROVIDERS[env.PAYMENT_PROVIDER];
if (!provider) throw new Error(`Unknown PAYMENT_PROVIDER "${env.PAYMENT_PROVIDER}"`);

module.exports = provider;
