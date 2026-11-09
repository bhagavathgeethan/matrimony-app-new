// ─────────────────────────────────────────────────────────────────────────────
// PM2 Ecosystem Config — 3Knot Matrimony Backend
// Start:   pm2 start backend/deploy/ecosystem.config.js
// Restart: pm2 restart matrimony-backend --update-env
// Logs:    pm2 logs matrimony-backend
// ─────────────────────────────────────────────────────────────────────────────
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'matrimony-backend',

      // Entry point
      script: path.resolve(__dirname, '..', 'src', 'server.js'),
      cwd: path.resolve(__dirname, '..'),

      // Cluster mode: fork is safer for WebSocket apps (ws library is stateful).
      // Use 'cluster' with instances > 1 only if you switch to sticky sessions.
      exec_mode: 'fork',
      instances: 1,

      // Environment
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,        // 5s between restarts
      max_memory_restart: '512M', // Auto-restart if memory exceeds 512MB

      // Graceful shutdown: give the server 10s to finish in-flight requests
      kill_timeout: 10000,
      listen_timeout: 15000,

      // Watch mode: disabled in production (use deploy.sh to restart)
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'uploads-private', 'logs'],

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: path.resolve(__dirname, '..', 'logs', 'error.log'),
      out_file: path.resolve(__dirname, '..', 'logs', 'out.log'),
      merge_logs: true,
      log_type: 'json',

      // Source map support for stack traces
      source_map_support: true,
    },
  ],
};

