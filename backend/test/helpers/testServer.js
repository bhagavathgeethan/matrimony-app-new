// Boots a throwaway real PostgreSQL (embedded-postgres) and the 3Knot server against it.
// Must be required before any src module so env.js picks up the test configuration.
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function startTestStack() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sangam-test-'));
  const port = 50000 + crypto.randomInt(0, 9000);
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(tmp, 'pgdata'),
    user: 'postgres',
    password: 'test',
    port,
    persistent: false,
    // UTF8 like production (the Windows default code page can't store emoji)
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('sangam_test');

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `postgresql://postgres:test@localhost:${port}/sangam_test`;
  process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
  process.env.OTP_DEV_ECHO = 'true';
  process.env.OTP_RESEND_SECONDS = '0';
  process.env.OTP_MAX_PER_HOUR = '50';
  process.env.WEB_DIST_DIR = path.join(tmp, 'no-web');
  process.env.PRIVATE_UPLOAD_DIR = path.join(tmp, 'private');
  process.env.ADMIN_PHONES = '+919999999999';
  process.env.INTEREST_DAILY_LIMIT = '3';
  process.env.REPORT_HIDE_THRESHOLD = '2';
  process.env.NUDGE_AFTER_HOURS = '0';

  const origLog = console.log;
  console.log = () => {};
  const { start } = require('../../src/server');
  const server = await start(0, { jobs: false });
  console.log = origLog;
  const base = `http://localhost:${server.address().port}`;
  process.env.PUBLIC_BASE_URL = base;

  async function stop() {
    await new Promise((resolve) => server.close(resolve));
    await require('../../src/config/db').pool.end();
    await pg.stop();
    // Windows can hold the data folder briefly after Postgres stops
    try {
      fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      // left in the temp folder; the OS cleans it up
    }
  }

  return { base, stop, uploadDir: process.env.UPLOAD_DIR, privateDir: process.env.PRIVATE_UPLOAD_DIR, pgUrl: process.env.DATABASE_URL };
}

module.exports = { startTestStack };
