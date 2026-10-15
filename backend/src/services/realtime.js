// Authenticated WebSocket push: clients connect to /ws?token=<session token>
// and only receive events addressed to their own user id.
const { WebSocketServer } = require('ws');

const socketsByUser = new Map();

// onMessage(userId, message) handles messages sent by clients (call signalling); it may return an error string
function attach(server, { userIdForToken, onMessage = null }) {
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });

  wss.on('connection', async (ws, req) => {
    // Messages can arrive before the token check finishes: queue them until we know who this is
    let userId = null;
    const early = [];
    const handle = async (raw) => {
      if (!onMessage) return;
      let msg;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      try {
        const error = await onMessage(userId, msg);
        if (error && ws.readyState === 1) ws.send(JSON.stringify({ type: 'call:error', callId: msg?.callId, error }));
      } catch (err) {
        console.error('Realtime message failed:', err.message);
      }
    };
    ws.on('message', (raw) => (userId ? handle(raw) : early.push(raw)));

    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    userId = await userIdForToken(token).catch(() => null);
    if (!userId) {
      ws.close(4401, 'Unauthenticated');
      return;
    }
    if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
    socketsByUser.get(userId).add(ws);
    ws.send(JSON.stringify({ type: 'connected' }));
    for (const raw of early.splice(0)) handle(raw);

    ws.on('close', () => {
      const set = socketsByUser.get(userId);
      if (!set) return;
      set.delete(ws);
      if (set.size === 0) socketsByUser.delete(userId);
    });
  });

  return wss;
}

const isOnline = (userId) => (socketsByUser.get(userId)?.size || 0) > 0;

function notify(userIds, type, payload = {}) {
  const message = JSON.stringify({ type, ...payload });
  for (const userId of [].concat(userIds).filter(Boolean)) {
    for (const ws of socketsByUser.get(userId) || []) {
      if (ws.readyState === 1) ws.send(message);
    }
  }
}

module.exports = { attach, notify, isOnline };
