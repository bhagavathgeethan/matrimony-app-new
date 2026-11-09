// Entry point for hosts that load the app with require() instead of `node src/server.js`
// (Hostinger / LiteSpeed lsnode, Passenger, PM2 cluster). In those, require.main is not
// src/server.js, so its own auto-start block never runs and nothing listens -> 503.
const { start } = require('./src/server');
const { pool } = require('./src/config/db');

start().catch(async (err) => {
  console.error('Failed to start server:', err);
  await pool.end().catch(() => {});
  process.exit(1);
});
