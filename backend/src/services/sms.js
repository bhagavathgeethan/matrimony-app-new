// SMS gateway. Only a dummy provider exists for now; the real provider will implement the same interface:
//   sendOtp(phone, code) and sendFamilyInvite(phone, { childName, parentName, portalUrl })
const env = require('../config/env');

const dummyProvider = {
  name: 'dummy',
  sent: [], // kept in memory so tests and local debugging can inspect what would have been sent

  async sendOtp(phone, code) {
    const text = `${code} is your 3Knot Matrimony verification code. It expires in ${Math.round(env.OTP_TTL_SECONDS / 60)} minutes.`;
    this.sent.push({ to: phone, type: 'otp', text, at: new Date() });
    console.log(`[sms:dummy] OTP to ${phone}: ${code}`);
    return { delivered: true };
  },

  async sendFamilyInvite(phone, { childName, parentName, portalUrl }) {
    const text = `${parentName}, ${childName} has invited you to 3Knot Matrimony to view profiles they share with you: ${portalUrl}`;
    this.sent.push({ to: phone, type: 'family_invite', text, at: new Date() });
    console.log(`[sms:dummy] Family invite to ${phone}: ${portalUrl}`);
    return { delivered: true };
  },
};

const PROVIDERS = { dummy: dummyProvider };

const provider = PROVIDERS[env.SMS_PROVIDER];
if (!provider) throw new Error(`Unknown SMS_PROVIDER "${env.SMS_PROVIDER}"`);

module.exports = provider;
