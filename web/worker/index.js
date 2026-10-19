// 3Knot web on Cloudflare Workers. The built app (dist/) is served as static assets; requests for the API,
// uploaded photos and the live-updates WebSocket are forwarded to the backend at BACKEND_URL, so the browser keeps
// talking to one address (same as when the backend serves the web app itself).
// Only /api/*, /uploads/* and /ws reach this code — wrangler.jsonc sends everything else straight to the assets.

const BACKEND_PATH = /^\/(api\/|uploads\/|ws$)/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!BACKEND_PATH.test(url.pathname)) return env.ASSETS.fetch(request);

    if (!env.BACKEND_URL) {
      return Response.json({ error: 'Backend is not configured (set BACKEND_URL on this Worker)' }, { status: 502 });
    }
    const target = new URL(url.pathname + url.search, env.BACKEND_URL);
    const forwarded = new Request(target, request);
    forwarded.headers.set('X-Forwarded-Host', url.host);
    forwarded.headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
    try {
      // Also carries WebSocket upgrades (/ws) through to the backend
      return await fetch(forwarded);
    } catch {
      return Response.json({ error: 'Can’t reach the server right now. Please try again.' }, { status: 502 });
    }
  },
};
