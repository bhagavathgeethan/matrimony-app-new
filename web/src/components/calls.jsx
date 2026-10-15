// Call layer: incoming-call prompt and the full-screen call (video or voice). Driven by the shared call manager.
import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { CALL_END_TEXT, formatDuration } from '@shared/calls';
import { calls, useCall } from '../store';
import { Avatar } from './ui';

function VideoEl({ stream, muted, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);
  return <video ref={ref} className={className} autoPlay playsInline muted={muted} />;
}

function Timer({ since }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{formatDuration(Date.now() - since)}</span>;
}

export function CallLayer() {
  const call = useCall();
  if (call.status === 'idle') return null;
  const video = call.kind === 'video';
  const name = call.peer?.name || 'Your match';

  if (call.status === 'incoming') {
    return (
      <div className="call-incoming fade-in" role="alertdialog" aria-label={`Incoming ${video ? 'video' : 'voice'} call from ${name}`}>
        <Avatar name={name} size={52} ring />
        <div className="grow">
          <div className="h3" style={{ color: '#fff' }}>{name}</div>
          <div className="small" style={{ color: 'rgba(255,246,238,0.75)' }}>Incoming {video ? 'video' : 'voice'} call…</div>
        </div>
        <button className="call-btn decline" onClick={() => calls.decline()} aria-label="Decline call"><PhoneOff size={20} /></button>
        <button className="call-btn accept" onClick={() => calls.accept()} aria-label="Accept call">{video ? <Video size={20} /> : <Phone size={20} />}</button>
      </div>
    );
  }

  const statusText = {
    outgoing: 'Ringing…',
    connecting: 'Connecting…',
    active: call.startedAt ? <Timer since={call.startedAt} /> : 'Connected',
    ended: call.error || CALL_END_TEXT[call.endReason] || 'Call ended',
  }[call.status];

  return (
    <div className="call-screen" role="dialog" aria-label={`Call with ${name}`}>
      {video && call.remoteStream && call.status === 'active'
        ? <VideoEl stream={call.remoteStream} className="call-remote" />
        : (
          <div className="call-placeholder">
            <Avatar name={name} size={110} ring />
          </div>
        )}
      {!video && call.remoteStream && <VideoEl stream={call.remoteStream} className="hidden-audio" />}
      {video && call.localStream && !call.cameraOff && <VideoEl stream={call.localStream} muted className="call-local" />}
      <div className="call-top">
        <div className="h2" style={{ color: '#fff' }}>{name}</div>
        <div className="small call-status" style={{ color: 'rgba(255,246,238,0.8)' }}>{statusText}</div>
      </div>
      {call.status !== 'ended' && (
        <div className="call-controls">
          <button className="call-btn ghost" onClick={() => calls.toggleMute()} aria-label={call.muted ? 'Unmute' : 'Mute'}>
            {call.muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          {video && (
            <button className="call-btn ghost" onClick={() => calls.toggleCamera()} aria-label={call.cameraOff ? 'Turn camera on' : 'Turn camera off'}>
              {call.cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}
          <button className="call-btn decline" onClick={() => calls.hangup()} aria-label="End call"><PhoneOff size={20} /></button>
        </div>
      )}
    </div>
  );
}
