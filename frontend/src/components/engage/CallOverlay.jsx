// Incoming-call banner and full-screen call on mobile, driven by the shared call manager (AppContext.calls)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { CALL_END_TEXT, formatDuration } from '@shared/calls';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/kit';

const { colors, fonts, gradients, shadows } = theme;

// Plain DOM <video>: the app runs in a WebView, so WebRTC streams attach directly
const VideoEl = ({ stream, muted, style }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} style={style} />;
};

const Timer = ({ since }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return <Text style={styles.status}>{formatDuration(Date.now() - since)}</Text>;
};

const CallButton = ({ onPress, label, bg, children }) => (
  <TouchableOpacity onPress={onPress} style={[styles.callBtn, { backgroundColor: bg }]} accessibilityRole="button" accessibilityLabel={label}>
    {children}
  </TouchableOpacity>
);

export const CallOverlay = () => {
  const { call, calls } = useApp();
  if (!call || call.status === 'idle') return null;
  const video = call.kind === 'video';
  const name = call.peer?.name || 'Your match';

  if (call.status === 'incoming') {
    return (
      <View style={styles.incoming} accessibilityRole="alert" accessibilityLabel={`Incoming ${video ? 'video' : 'voice'} call from ${name}`}>
        <Avatar name={name} size={48} ring />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>Incoming {video ? 'video' : 'voice'} call…</Text>
        </View>
        <CallButton onPress={() => calls.decline()} label="Decline call" bg="#D6334F"><PhoneOff size={20} color={colors.white} /></CallButton>
        <CallButton onPress={() => calls.accept()} label="Accept call" bg={colors.success}>
          {video ? <Video size={20} color={colors.white} /> : <Phone size={20} color={colors.white} />}
        </CallButton>
      </View>
    );
  }

  const status = call.status === 'active' && call.startedAt
    ? <Timer since={call.startedAt} />
    : <Text style={styles.status}>{{ outgoing: 'Ringing…', connecting: 'Connecting…', active: 'Connected', ended: call.error || CALL_END_TEXT[call.endReason] || 'Call ended' }[call.status]}</Text>;

  return (
    <View style={styles.screen} accessibilityLabel={`Call with ${name}`}>
      {video && call.remoteStream && call.status === 'active'
        ? <VideoEl stream={call.remoteStream} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <View style={styles.placeholder}><Avatar name={name} size={110} ring /></View>}
      {!video && call.remoteStream && <VideoEl stream={call.remoteStream} style={{ display: 'none' }} />}
      {video && call.localStream && !call.cameraOff && (
        <VideoEl stream={call.localStream} muted style={{ position: 'absolute', right: 16, bottom: 130, width: 104, height: 140, objectFit: 'cover', borderRadius: 16, border: '2px solid rgba(255,255,255,0.6)', transform: 'scaleX(-1)', zIndex: 2 }} />
      )}
      <View style={styles.top}>
        <Text style={styles.bigName}>{name}</Text>
        {status}
      </View>
      {call.status !== 'ended' && (
        <View style={styles.controls}>
          <CallButton onPress={() => calls.toggleMute()} label={call.muted ? 'Unmute' : 'Mute'} bg="rgba(255,255,255,0.16)">
            {call.muted ? <MicOff size={20} color={colors.white} /> : <Mic size={20} color={colors.white} />}
          </CallButton>
          {video && (
            <CallButton onPress={() => calls.toggleCamera()} label={call.cameraOff ? 'Turn camera on' : 'Turn camera off'} bg="rgba(255,255,255,0.16)">
              {call.cameraOff ? <VideoOff size={20} color={colors.white} /> : <Video size={20} color={colors.white} />}
            </CallButton>
          )}
          <CallButton onPress={() => calls.hangup()} label="End call" bg="#D6334F"><PhoneOff size={20} color={colors.white} /></CallButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  incoming: {
    position: 'fixed', top: 14, left: 12, right: 12, zIndex: 90, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 22, backgroundImage: gradients.hero, boxShadow: shadows.raised, maxWidth: 440, alignSelf: 'center', marginHorizontal: 'auto',
  },
  name: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '800', color: colors.white },
  bigName: { fontFamily: fonts.sans, fontSize: 26, fontWeight: '800', color: colors.white, textAlign: 'center' },
  status: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(255,246,238,0.8)', textAlign: 'center' },
  screen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 95, backgroundColor: '#140806', alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', top: 48, left: 0, right: 0, gap: 4, zIndex: 2 },
  controls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 18, zIndex: 2 },
  callBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
