// Entry point for hosts that load the app with require() instead of `node src/server.js`
// (Hostinger / LiteSpeed lsnode, Passenger, PM2 cluster). In those, require.main is not
// src/server.js, so its own auto-start block never runs and nothing listens -> 503.
//
// If startup fails (missing env var, database unreachable, a module that won't load), the process
// doesn't exit: a minimal fallback server answers every request with the error as JSON, so
// /api/health shows what went wrong instead of the host's generic 503 page.
const http = require('http');

function serveStartupError(err) {
  const port = Number(process.env.PORT || 5000);
  const body = JSON.stringify({
    status: 'startup_failed',
    error: String((err && err.message) || err),
    code: err && err.code,
    hint: 'Check the Hostinger environment variables (DATABASE_URL etc.) and redeploy.',
    timestamp: new Date().toISOString(),
  });
  http
    .createServer((req, res) => {
      res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
    })
    .listen(port, () => console.error(`Startup failed; serving the error on port ${port}`));
}

try {
  const { start } = require('./src/server');
  start().catch((err) => {
    console.error('Failed to start server:', err);
    serveStartupError(err);
  });
} catch (err) {
  // Thrown while loading modules, e.g. a missing required environment variable
  console.error('Failed to load server:', err);
  serveStartupError(err);
}
