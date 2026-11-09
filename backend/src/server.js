const http = require('http');
const fs = require('fs');
const path = require('path');
const env = require('./config/env');
const { pool } = require('./config/db');
const { migrate } = require('./db/migrate');
const app = require('./app');
const realtime = require('./services/realtime');
const { userIdForToken } = require('./modules/auth');
const { startErasureJob } = require('./modules/privacy');
const { startJobs } = require('./modules/jobs');
const calls = require('./modules/calls');
const storage = require('./services/storage');

async function start(port = env.PORT, { jobs = true } = {}) {
  // Schema must be current before the first request is served
  await migrate();
  // Names, notes and messages contain emoji and Indian scripts: the database must be UTF8
  const enc = (await pool.query("SELECT pg_encoding_to_char(encoding) AS e FROM pg_database WHERE datname = current_database()")).rows[0]?.e;
  if (enc && enc !== 'UTF8') console.warn(`WARNING: database encoding is ${enc}; emoji and Tamil text will fail. Recreate the database with UTF8.`);
  // Storage: confirm the API key works and both buckets exist. A failure is logged loudly but doesn't stop the
  // server (everything except uploads and private files keeps working).
  const store = await storage.check();
  if (store.ok) console.log(`Storage: Depot app "${store.app.slug}" at ${env.STORAGE_URL}, bucket "${env.STORAGE_BUCKET}"`);
  if (store.ok && store.bucketPublic) console.warn(`WARNING: bucket "${env.STORAGE_BUCKET}" is PUBLIC. Original photos, selfies and voice notes must be private: make it private in Depot.`);
  if (!store.ok) console.error(`STORAGE ERROR: Depot at ${env.STORAGE_URL} is not usable (${store.error}). Check STORAGE_URL and STORAGE_API_KEY. Uploads will fail.`);
  if (env.isProduction && !process.env.MEDIA_URL_SECRET) console.warn('WARNING: MEDIA_URL_SECRET is not set; photo links break on every restart.');
  const server = http.createServer(app);
  realtime.attach(server, { userIdForToken, onMessage: calls.handle });
  const erasureTimer = jobs ? startErasureJob() : null;
  const jobsTimer = jobs ? startJobs() : null;
  server.on('close', () => {
    if (erasureTimer) clearInterval(erasureTimer);
    if (jobsTimer) clearInterval(jobsTimer);
  });

  await new Promise((resolve) => server.listen(port, resolve));
  const webAppReady = fs.existsSync(path.join(env.WEB_DIST_DIR, 'index.html'));
  console.log(`3Knot backend on http://localhost:${server.address().port} (SMS: ${env.SMS_PROVIDER}, storage: ${store.ok ? 'depot' : 'UNAVAILABLE'})`);
  console.log(`Frontend SPA serving from "${env.WEB_DIST_DIR}": ${webAppReady ? 'READY' : 'NOT FOUND'}`);
  return server;
}

if (require.main === module) {
  start().catch(async (err) => {
    console.error('Failed to start server:', err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });
}

module.exports = { start, app };
