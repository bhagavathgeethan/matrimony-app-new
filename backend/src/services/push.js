// Push gateway for when a user has no live connection. Only a dummy provider exists for now;
// a Firebase Cloud Messaging (Android/web) provider will implement the same interface:
//   send({ tokens: [{ platform, token }], title, body, data }) -> { delivered, failedTokens }
const env = require('../config/env');

const dummyProvider = {
  name: 'dummy',
  sent: [], // kept in memory so tests and local debugging can inspect what would have been pushed

  async send({ tokens, title, body, data }) {
    this.sent.push({ tokens, title, body, data, at: new Date() });
    console.log(`[push:dummy] to ${tokens.length} device(s): ${title} — ${body}`);
    return { delivered: tokens.length, failedTokens: [] };
  },
};

const PROVIDERS = { dummy: dummyProvider };

const provider = PROVIDERS[env.PUSH_PROVIDER];
if (!provider) throw new Error(`Unknown PUSH_PROVIDER "${env.PUSH_PROVIDER}"`);

module.exports = provider;
