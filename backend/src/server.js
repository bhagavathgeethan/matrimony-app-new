const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
require('dotenv').config();

const { initializeDatabase } = require('./models/schema');
const pgStore = require('./store/pgStore');
const { synthesizeArchetype } = require('./services/blueprintEngine');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL Schema on start
initializeDatabase().catch((err) => {
  console.error('Failed to initialize PostgreSQL schema:', err);
});

// WebSocket for live chat & instant family review alerts
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Live connection established to PostgreSQL Matrimony Backend' }));

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type === 'CHAT_MESSAGE') {
        const { threadId, text } = data;
        const savedMsg = await pgStore.saveChatMessage(threadId, text);
        const payload = JSON.stringify({ type: 'NEW_MESSAGE', threadId, message: savedMsg });
        clients.forEach((c) => {
          if (c.readyState === 1) c.send(payload);
        });
      }
    } catch (err) {
      console.error('WS error:', err);
    }
  });

  ws.on('close', () => clients.delete(ws));
});

function broadcastEvent(type, payload) {
  const msg = JSON.stringify({ type, ...payload });
  clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

// ---------------- API ROUTES (Connected to PostgreSQL ab_matrimony) ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'PostgreSQL ab_matrimony',
    host: '187.127.178.200:5444',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints (Note: Rule 4 applies - no auto testing on signup)
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  res.json({ success: true, message: `OTP sent to ${phone}`, resendWaitSeconds: 30 });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!code || code.length !== 6) {
    return res.status(400).json({ error: 'Valid 6-digit OTP code required' });
  }
  const user = await pgStore.getCurrentUser();
  res.json({
    success: true,
    token: 'jwt-pg-token-ananya-2026',
    user
  });
});

// Profile endpoints
app.get('/api/profile/me', async (req, res) => {
  try {
    const user = await pgStore.getCurrentUser();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile/basics', async (req, res) => {
  try {
    const updated = await pgStore.updateUserBasics(req.body);
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/vibes', async (req, res) => {
  try {
    const vibes = await pgStore.updateUserVibes(req.body.vibes || []);
    res.json({ success: true, vibes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/photos', async (req, res) => {
  try {
    const user = await pgStore.updateUserPhotos(req.body);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blueprint endpoints
app.get('/api/blueprint/summary', async (req, res) => {
  try {
    const user = await pgStore.getCurrentUser();
    res.json({
      blueprint: user.blueprint,
      user,
      archetypeSummary: user.blueprint.summaryText
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/blueprint/weights', async (req, res) => {
  try {
    const blueprint = await pgStore.updateUserBlueprint(req.body);
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/blueprint/answers', async (req, res) => {
  try {
    const user = await pgStore.getCurrentUser();
    res.json({ success: true, blueprint: user.blueprint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Matches endpoints
app.get('/api/matches/feed', async (req, res) => {
  try {
    const list = await pgStore.getCandidateMatches();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/matches/list', async (req, res) => {
  try {
    const { filter } = req.query;
    const list = await pgStore.getCandidateMatches(filter);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Family Co-Pilot endpoints
app.get('/api/family/links', async (req, res) => {
  try {
    const links = await pgStore.getFamilyLinks();
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family/invite', async (req, res) => {
  try {
    const { parentName, phone } = req.body;
    const link = await pgStore.createFamilyInvite(parentName, phone);
    res.json({ success: true, link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/family/sent', async (req, res) => {
  try {
    const records = await pgStore.getSentFamilyRecords();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family/share', async (req, res) => {
  try {
    const record = await pgStore.createFamilyShare(req.body);
    broadcastEvent('PROFILE_SHARED_WITH_PARENT', { record });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family/share-batch', async (req, res) => {
  try {
    const { candidateIds, recipientParentId, expiresIn, customNote } = req.body;
    const records = [];
    for (const id of candidateIds || []) {
      const rec = await pgStore.createFamilyShare({
        candidateId: id,
        recipientParentId,
        expiresIn,
        customNote,
      });
      records.push(rec);
    }
    broadcastEvent('PROFILES_BATCH_SHARED', { count: records.length });
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent Portal (Read-Only)
app.get('/api/family/portal/:token', async (req, res) => {
  try {
    const user = await pgStore.getCurrentUser();
    const records = await pgStore.getSentFamilyRecords();
    res.json({
      childName: user.firstName,
      parentTitle: 'PARENT VIEW · READ ONLY',
      records
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family/feedback', async (req, res) => {
  try {
    const { shareId, decision, note } = req.body;
    const record = await pgStore.updateParentFeedback(shareId, decision, note);
    if (!record) return res.status(404).json({ error: 'Share record not found' });

    broadcastEvent('PARENT_FEEDBACK_RECEIVED', { record });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoints
app.get('/api/chat/threads', async (req, res) => {
  try {
    const threads = await pgStore.getConversations();
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/:threadId/messages', async (req, res) => {
  try {
    const threads = await pgStore.getConversations();
    const thread = threads.find((t) => t.id === req.params.threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { text } = req.body;
    const newMsg = await pgStore.saveChatMessage(threadId, text);
    broadcastEvent('NEW_MESSAGE', { threadId, message: newMsg });
    res.json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Privacy & DPDP compliance endpoints
app.post('/api/privacy/consent', async (req, res) => {
  try {
    const consent = await pgStore.saveDPDPConsents(req.body);
    res.json({ success: true, consent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/privacy/export-data', async (req, res) => {
  try {
    const exportPayload = await pgStore.exportDPDPData();
    res.json(exportPayload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/privacy/erasure-request', async (req, res) => {
  try {
    const response = await pgStore.createErasureRequest();
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Matrimony Backend Server running on http://localhost:${PORT} [Connected to PostgreSQL: ab_matrimony]`);
});
