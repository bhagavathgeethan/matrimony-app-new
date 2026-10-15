// Express application: routes, static files, error handling (no listening here — see server.js)
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const env = require('./config/env');
const db = require('./config/db');
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
const { route } = require('./lib/http');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', route(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
}));

// Public
app.use('/api/auth', auth.router);
app.use('/api/portal', family.portalRouter);
app.use('/api/public/stories', stories.publicRouter);

// Signed-in user only
app.use('/api/me/verification', auth.requireAuth, verification.router);
app.use('/api/me', auth.requireAuth, profile.router, privacy.router);
app.use('/api/matches', auth.requireAuth, matches.router);
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

// Uploaded files (local storage driver; R2 will serve its own URLs)
if (env.STORAGE_DRIVER === 'local') {
  app.use('/uploads', express.static(env.UPLOAD_DIR, { maxAge: '7d', fallthrough: false }));
}

// The built web app; any other GET returns index.html so client-side routes (/matches, /portal/<token>, …) work
if (fs.existsSync(path.join(env.WEB_DIST_DIR, 'index.html'))) {
  app.use(express.static(env.WEB_DIST_DIR, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api\/|uploads\/|ws$).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(env.WEB_DIST_DIR, 'index.html'));
  });
}

// Errors: known validation errors keep their status; anything else is a logged 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `Photo must be under ${Math.round(env.MAX_UPLOAD_BYTES / 1024 / 1024)} MB`
      : err.message;
    return res.status(status).json({ error: message });
  }
  // Malformed ids (e.g. not a UUID) mean the thing doesn't exist
  if (err.code === '22P02') return res.status(404).json({ error: 'Not found' });
  if (err.status === 404 && req.path.startsWith('/uploads')) return res.status(404).end();
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'Something went wrong. Please try again.',
    ...(err.code && err.status ? { code: err.code } : {}),
  });
});

module.exports = app;
