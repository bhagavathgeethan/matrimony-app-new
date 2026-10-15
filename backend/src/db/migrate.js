// Applies db/migrations/*.sql in order, once each, tracked in schema_migrations
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Tables created by the old single-user demo (users.is_current_user etc.)
const LEGACY_TABLES = [
  'messages', 'conversations', 'shared_to_family', 'family_links',
  'user_consents', 'blueprints', 'privacy_logs', 'users',
];

async function hasLegacySchema(client) {
  const res = await client.query(`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'is_current_user'
  `);
  return res.rows.length > 0;
}

async function migrate({ log = console.log, dropLegacy = process.env.MIGRATE_DROP_LEGACY === 'true' } = {}) {
  const client = await pool.connect();
  try {
    // Serialise concurrent starts (e.g. several server instances) on one advisory lock
    await client.query('SELECT pg_advisory_lock(726354)');

    if (await hasLegacySchema(client)) {
      if (!dropLegacy) {
        throw new Error(
          'The database still has the old demo tables (users.is_current_user). ' +
          'They are replaced by the new schema and their demo rows will be deleted. ' +
          'Start once with MIGRATE_DROP_LEGACY=true to remove them.'
        );
      }
      log('Dropping legacy demo tables…');
      await client.query('BEGIN');
      for (const table of LEGACY_TABLES) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }
      await client.query('COMMIT');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const applied = new Set((await client.query('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      log(`Applying migration ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(726354)').catch(() => {});
    client.release();
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migrations complete');
      return pool.end();
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
