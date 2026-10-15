// Video/voice calls between two members with accepted interest (WebRTC, peer-to-peer).
// Framework-free: both apps create one manager and render its state. Signalling goes through the
// store's live connection (sendRealtime); the backend only relays it (backend/src/modules/calls.js).
//
// States: idle → outgoing (ringing them) | incoming (ringing me) → connecting → active → ended → idle

const newCallId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export function createCallManager({ send, getConfig, onChange }) {
  let state = { status: 'idle' };
  let pc = null;
  let localStream = null;
  let remoteStream = null;
  let pendingIce = [];
  let ringTimer = null;
  let config = null;

  const emit = (patch) => {
    state = { ...state, ...patch };
    onChange?.(state);
  };
  const getState = () => state;

  async function loadConfig() {
    if (!config) {
      try {
        config = await getConfig();
      } catch {
        config = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }], ringSeconds: 30 };
      }
    }
    return config;
  }

  async function getMedia(kind) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This device can’t make calls');
    return navigator.mediaDevices.getUserMedia({ audio: true, video: kind === 'video' ? { facingMode: 'user' } : false });
  }

  function cleanup() {
    clearTimeout(ringTimer);
    ringTimer = null;
    pc?.close();
    pc = null;
    localStream?.getTracks().forEach((t) => t.stop());
    localStream = null;
    remoteStream = null;
    pendingIce = [];
  }

  function finish(reason) {
    cleanup();
    emit({ status: 'ended', endReason: reason, localStream: null, remoteStream: null });
    // Leave the "call ended" state on screen briefly, then go idle
    setTimeout(() => {
      if (state.status === 'ended') emit({ status: 'idle', callId: null, conversationId: null, peer: null, endReason: null, startedAt: null });
    }, 1800);
  }

  const signal = (type, extra = {}) => send({ type, conversationId: state.conversationId, callId: state.callId, ...extra });

  async function createPeer() {
    const { iceServers } = await loadConfig();
    pc = new RTCPeerConnection({ iceServers });
    remoteStream = new MediaStream();
    localStream?.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
      emit({ remoteStream });
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) signal('call:ice', { candidate: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (pc.connectionState === 'connected' && state.status !== 'active') emit({ status: 'active', startedAt: Date.now() });
      if (['failed', 'closed'].includes(pc.connectionState) && state.status !== 'ended' && state.status !== 'idle') {
        signal('call:end', { reason: 'failed' });
        finish('failed');
      }
    };
  }

  async function flushIce() {
    for (const c of pendingIce.splice(0)) await pc.addIceCandidate(c).catch(() => {});
  }

  // ---------- caller ----------

  async function start({ conversationId, peer, kind = 'video' }) {
    if (state.status !== 'idle' && state.status !== 'ended') return { ok: false, error: 'You’re already in a call' };
    cleanup();
    emit({ status: 'outgoing', callId: newCallId(), conversationId, peer, kind, muted: false, cameraOff: kind === 'audio', endReason: null, startedAt: null });
    try {
      localStream = await getMedia(kind);
    } catch (err) {
      finish('no-media');
      return { ok: false, error: err.message || 'Camera or microphone not available' };
    }
    emit({ localStream });
    if (!signal('call:invite', { kind })) {
      finish('offline');
      return { ok: false, error: 'You’re offline' };
    }
    const { ringSeconds } = await loadConfig();
    ringTimer = setTimeout(() => {
      if (state.status === 'outgoing') {
        signal('call:end', { reason: 'missed', kind });
        finish('no-answer');
      }
    }, (ringSeconds || 30) * 1000);
    return { ok: true };
  }

  // ---------- callee ----------

  async function accept() {
    if (state.status !== 'incoming') return { ok: false };
    try {
      localStream = await getMedia(state.kind);
    } catch (err) {
      signal('call:decline', { reason: 'no-media' });
      finish('no-media');
      return { ok: false, error: err.message || 'Camera or microphone not available' };
    }
    emit({ status: 'connecting', localStream });
    await createPeer();
    signal('call:accept');
    return { ok: true };
  }

  function decline() {
    if (state.status !== 'incoming') return;
    signal('call:decline');
    finish('declined');
  }

  function hangup() {
    if (state.status === 'idle' || state.status === 'ended') return;
    const missed = state.status === 'outgoing';
    signal('call:end', { reason: missed ? 'missed' : 'hangup', kind: state.kind });
    finish(missed ? 'cancelled' : 'hangup');
  }

  function toggleMute() {
    const muted = !state.muted;
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
    emit({ muted });
  }

  function toggleCamera() {
    const cameraOff = !state.cameraOff;
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !cameraOff; });
    emit({ cameraOff });
  }

  // ---------- signalling from the other side ----------

  async function handleEvent(event) {
    const sameCall = event.callId && event.callId === state.callId;
    switch (event.type) {
      case 'call:incoming':
        if (state.status !== 'idle' && state.status !== 'ended') {
          send({ type: 'call:decline', conversationId: event.conversationId, callId: event.callId, reason: 'busy' });
          return;
        }
        cleanup();
        emit({
          status: 'incoming', callId: event.callId, conversationId: event.conversationId, peer: event.from,
          kind: event.kind || 'video', muted: false, cameraOff: event.kind === 'audio', endReason: null, startedAt: null,
        });
        return;
      case 'call:accept':
        if (!sameCall || state.status !== 'outgoing') return;
        clearTimeout(ringTimer);
        emit({ status: 'connecting' });
        await createPeer();
        await pc.setLocalDescription(await pc.createOffer());
        signal('call:offer', { sdp: pc.localDescription.toJSON() });
        return;
      case 'call:offer':
        if (!sameCall || !pc) return;
        await pc.setRemoteDescription(event.sdp);
        await flushIce();
        await pc.setLocalDescription(await pc.createAnswer());
        signal('call:answer', { sdp: pc.localDescription.toJSON() });
        return;
      case 'call:answer':
        if (!sameCall || !pc) return;
        await pc.setRemoteDescription(event.sdp);
        await flushIce();
        return;
      case 'call:ice':
        if (!sameCall || !event.candidate) return;
        if (pc?.remoteDescription) await pc.addIceCandidate(event.candidate).catch(() => {});
        else pendingIce.push(event.candidate);
        return;
      case 'call:decline':
        if (sameCall && state.status !== 'idle') finish(event.reason === 'busy' ? 'busy' : 'declined');
        return;
      case 'call:end':
        if (sameCall && state.status !== 'idle' && state.status !== 'ended') finish(state.status === 'incoming' ? 'missed' : 'remote-hangup');
        return;
      case 'call:error':
        if (state.status !== 'idle' && state.status !== 'ended') {
          cleanup();
          emit({ status: 'ended', endReason: 'error', error: event.error });
          setTimeout(() => state.status === 'ended' && emit({ status: 'idle', error: null }), 2500);
        }
        return;
      default:
    }
  }

  return { getState, start, accept, decline, hangup, toggleMute, toggleCamera, handleEvent };
}

export const CALL_END_TEXT = {
  hangup: 'Call ended',
  'remote-hangup': 'Call ended',
  declined: 'Call declined',
  busy: 'They’re on another call',
  'no-answer': 'No answer',
  cancelled: 'Call cancelled',
  missed: 'Missed call',
  failed: 'Call dropped — check your connection',
  'no-media': 'Camera or microphone not available',
  offline: 'You’re offline',
  error: 'Call not available',
};

export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
