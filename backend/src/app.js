// Express application: API routes and error handling only (the web app is deployed separately) (no listening here — see server.js)
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/db');
const storage = require('./services/storage');
const auth = require('./modules/auth');
const profile = require('./modules/profile');
const matches = require('./modules/matches');
const chat = require('./modules/chat');
const family = require('./modules/family');
const privacy = require('./modules/privacy');
const notifications = require('./modules/notifications');
const search = require('./modules/search');
const safety = require('./modules/safety');
const verification = require('./modules/verification');
const premium = require('./modules/premium');
const stories = require('./modules/stories');
const admin = require('./modules/admin');
const calls = require('./modules/calls');
const report = require('./modules/report');
const uploads = require('./modules/uploads');
const media = require('./modules/media');
const { route } = require('./lib/http');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS }));
app.use(express.json({ limit: '100kb' }));

// Storage is checked at most once a minute (it's another service; the health check shouldn't hammer it)
let storageHealth = { at: 0, ok: false };
app.get('/api/health', route(async (req, res) => {
  await db.query('SELECT 1');
  if (Date.now() - storageHealth.at > 60000) storageHealth = { at: Date.now(), ok: (await storage.check()).ok };
  res.json({
    status: 'healthy', database: 'connected', storage: storageHealth.ok ? 'connected' : 'unavailable', timestamp: new Date().toISOString(),
  });
}));

// Public
app.use('/api/auth', auth.router);
app.use('/api/portal', family.portalRouter);
app.use('/api/public/stories', stories.publicRouter);
app.use('/api/public/report', report.publicRouter);
app.use('/api/public/payments', premium.webhookRouter);
// Private photo links carry their own signature (img tags can't send the session header)
app.use('/api/media', media.router);

// Signed-in user only
app.use('/api/me/verification', auth.requireAuth, verification.router);
app.use('/api/me/uploads', auth.requireAuth, uploads.router);
app.use('/api/me', auth.requireAuth, profile.router, privacy.router);
app.use('/api/matches', auth.requireAuth, matches.router, report.router);
app.use('/api/conversations', auth.requireAuth, chat.router);
app.use('/api/family', auth.requireAuth, family.router);
app.use('/api/notifications', auth.requireAuth, notifications.router);
app.use('/api/search', auth.requireAuth, search.router);
app.use('/api/safety', auth.requireAuth, safety.router);
app.use('/api/premium', auth.requireAuth, premium.router);
app.use('/api/stories', auth.requireAuth, stories.router);
app.use('/api/admin', auth.requireAuth, admin.router);
app.use('/api/calls', auth.requireAuth, calls.router);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Errors: known validation errors keep their status; anything else is a logged 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  // Storage failures are ours, not the client's: never pass Depot's status (e.g. 401) through
  if (err instanceof storage.StorageError) {
    console.error(`Storage error: ${err.message} [${err.status} ${err.code}]`);
    return res.status(502).json({ error: 'File storage is unavailable. Please try again.' });
  }
  // Malformed ids (e.g. not a UUID) mean the thing doesn't exist
  if (err.code === '22P02') return res.status(404).json({ error: 'Not found' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Something went wrong. Please try again.',
    ...(err.code && err.status ? { code: err.code } : {}),
  });
});

module.exports = app;
