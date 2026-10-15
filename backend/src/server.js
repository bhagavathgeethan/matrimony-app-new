const http = require('http');
const env = require('./config/env');
const { pool } = require('./config/db');
const { migrate } = require('./db/migrate');
const app = require('./app');
const realtime = require('./services/realtime');
const { userIdForToken } = require('./modules/auth');
const { startErasureJob } = require('./modules/privacy');
const { startJobs } = require('./modules/jobs');
const calls = require('./modules/calls');

async function start(port = env.PORT, { jobs = true } = {}) {
  // Schema must be current before the first request is served
  await migrate();
  const server = http.createServer(app);
  realtime.attach(server, { userIdForToken, onMessage: calls.handle });
  const erasureTimer = jobs ? startErasureJob() : null;
  const jobsTimer = jobs ? startJobs() : null;
  server.on('close', () => {
    if (erasureTimer) clearInterval(erasureTimer);
    if (jobsTimer) clearInterval(jobsTimer);
  });

  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`Sangam backend on http://localhost:${server.address().port} (SMS: ${env.SMS_PROVIDER}, storage: ${env.STORAGE_DRIVER})`);
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
