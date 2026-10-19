// Video/voice call signalling over the existing WebSocket. Media flows peer-to-peer (WebRTC);
// the server only relays call set-up messages between the two members of an accepted conversation.
//
// Client → server messages: { type, conversationId, callId, ... }
//   call:invite { kind: 'video' | 'audio' }   call:accept   call:decline   call:end { reason }
//   call:offer { sdp }   call:answer { sdp }   call:ice { candidate }
// Server → other member: the same message, plus `from: { id, name }` (call:invite arrives as call:incoming).
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const realtime = require('../services/realtime');
const { canCall } = require('./chat');
const { notify } = require('./notifications');
const { route } = require('../lib/http');
const { tx } = require('../lib/i18n');

const router = express.Router();
const RELAYED = new Set(['call:invite', 'call:accept', 'call:decline', 'call:end', 'call:offer', 'call:answer', 'call:ice']);
const MAX_SDP = 20000;

// STUN is enough on most home/mobile networks; a TURN server (TURN_URL/TURN_USERNAME/TURN_CREDENTIAL) makes calls
// work behind strict NATs and corporate firewalls.
function iceServers() {
  const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (process.env.TURN_URL) {
    servers.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  }
  return servers;
}

async function nameOf(userId) {
  return (await db.query('SELECT first_name FROM users WHERE id = $1', [userId])).rows[0]?.first_name || 'Your match';
}

// Handles one signalling message from userId; returns an error string to send back, or null
async function handle(userId, msg) {
  if (!msg || !RELAYED.has(msg.type)) return null;
  if (typeof msg.conversationId !== 'string' || typeof msg.callId !== 'string' || msg.callId.length > 64) return 'Invalid call message';
  if (msg.sdp && (typeof msg.sdp !== 'object' || JSON.stringify(msg.sdp).length > MAX_SDP)) return 'Invalid session description';
  const other = await canCall(userId, msg.conversationId);
  if (!other) return 'Calls are available once you have both accepted interest';

  const from = { id: userId, name: await nameOf(userId) };
  const payload = {
    conversationId: msg.conversationId,
    callId: msg.callId,
    from,
    ...(msg.kind ? { kind: msg.kind === 'audio' ? 'audio' : 'video' } : {}),
    ...(msg.sdp ? { sdp: msg.sdp } : {}),
    ...(msg.candidate ? { candidate: msg.candidate } : {}),
    ...(msg.reason ? { reason: String(msg.reason).slice(0, 40) } : {}),
  };

  if (msg.type === 'call:invite') {
    realtime.notify(other, 'call:incoming', payload);
    if (!realtime.isOnline(other)) {
      await notify(other, {
        type: 'call',
        title: tx('{name} is calling you', { name: from.name }),
        body: tx(payload.kind === 'audio' ? 'Voice call on 3Knot' : 'Video call on 3Knot'),
        data: { conversationId: msg.conversationId, callId: msg.callId, senderName: from.name },
      });
    }
    return null;
  }
  if (msg.type === 'call:end' && msg.reason === 'missed') {
    await notify(other, {
      type: 'call',
      title: tx(payload.kind === 'audio' ? 'Missed voice call from {name}' : 'Missed video call from {name}', { name: from.name }),
      body: tx('Call them back from your chat.'),
      data: { conversationId: msg.conversationId, senderName: from.name },
      groupKey: `call:${msg.conversationId}`,
    });
  }
  realtime.notify(other, msg.type, payload);
  return null;
}

router.get('/config', route(async (req, res) => res.json({ iceServers: iceServers(), ringSeconds: env.CALL_RING_SECONDS || 30 })));

module.exports = { router, handle };
