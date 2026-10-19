// Premium building blocks on mobile: upsell tags, voice notes, contact sharing, report and "more like this"
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Mic, Square, X, Play, Pause, Phone, FileDown, Sparkles } from 'lucide-react';
import { FEATURES, TIER_INFO } from '@shared/plans';
import { createVoiceRecorder, canRecordVoice, MAX_VOICE_MS } from '@shared/voice';
import { formatDuration } from '@shared/calls';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/kit';
import { Sheet } from '../details/DetailsUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;
export const hasFeature = (user, key) => Boolean(user?.planFeatures?.includes(key));

export const UpsellTag = ({ feature, label }) => {
  const { setCurrentScreen } = useApp();
  const f = FEATURES[feature];
  return (
    <TouchableOpacity onPress={() => setCurrentScreen('premium')} style={styles.upsell} accessibilityRole="button" accessibilityLabel={t('{feature} — see plans', { feature: t(f?.title || '') })}>
      <Crown size={11} color="#8A6A2E" />
      <Text style={styles.upsellText}>{label || t(TIER_INFO[f?.tier || 'premium'].name)}</Text>
    </TouchableOpacity>
  );
};

// ---------- voice notes ----------

export const VoiceRecorderButton = ({ conversationId }) => {
  const { user, sendVoice, setCurrentScreen } = useApp();
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const [, tick] = useState(0);
  const rec = useRef(null);
  useEffect(() => () => rec.current?.cancel(), []);
  useEffect(() => {
    if (state !== 'recording') return undefined;
    const timer = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, [state]);

  if (!canRecordVoice()) return null;
  if (!hasFeature(user, 'voiceNotes')) {
    return (
      <TouchableOpacity onPress={() => setCurrentScreen('premium')} style={styles.micBtn} accessibilityLabel={t('Voice notes (Premium)')}>
        <Mic size={18} color={colors.textMuted} />
      </TouchableOpacity>
    );
  }
  const send = async (result) => {
    if (!result) return setState('idle');
    setState('sending');
    const res = await sendVoice(conversationId, result.blob, result.durationMs);
    setState('idle');
    if (!res.ok) setError(res.error);
  };
  const start = async () => {
    setError(null);
    rec.current = createVoiceRecorder(); // start() resolves when recording stops (tap or one-minute limit)
    try {
      setState('recording');
      send(await rec.current.start());
    } catch (err) {
      setState('idle');
      setError(t(err.message || 'Microphone not available'));
    }
  };
  if (state === 'recording') {
    return (
      <View style={styles.recording}>
        <View style={styles.recDot} />
        <Text style={styles.recText}>{formatDuration(rec.current?.elapsed() || 0)} / {formatDuration(MAX_VOICE_MS)}</Text>
        <TouchableOpacity onPress={() => { rec.current.cancel(); setState('idle'); }} accessibilityLabel={t('Cancel recording')}><X size={18} color={colors.textSecondary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => rec.current.stop()} style={styles.stopBtn} accessibilityLabel={t('Stop and send voice note')}><Square size={14} color={colors.white} /></TouchableOpacity>
      </View>
    );
  }
  return (
    <>
      <TouchableOpacity onPress={start} disabled={state === 'sending'} style={styles.micBtn} accessibilityLabel={t('Record a voice note')}>
        <Mic size={18} color={colors.accent} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </>
  );
};

export const VoiceNote = ({ message, mine }) => {
  const { voiceBlob } = useApp();
  const [url, setUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const toggle = async () => {
    if (!url) {
      const blob = await voiceBlob(message.audioPath).catch(() => null);
      if (!blob) return;
      setUrl(URL.createObjectURL(blob));
      setTimeout(() => audio.current?.play(), 0);
      return;
    }
    if (audio.current.paused) audio.current.play();
    else audio.current.pause();
  };
  return (
    <View style={styles.voice}>
      <TouchableOpacity onPress={toggle} style={[styles.play, mine && { backgroundColor: 'rgba(255,255,255,0.9)' }]} accessibilityLabel={playing ? t('Pause voice note') : t('Play voice note')}>
        {playing ? <Pause size={15} color={colors.accent} /> : <Play size={15} color={colors.accent} />}
      </TouchableOpacity>
      <View style={[styles.wave, mine && { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
      <Text style={[styles.dur, mine && { color: colors.white }]}>{formatDuration(message.durationMs || 0)}</Text>
      {url && <audio ref={audio} src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    </View>
  );
};

// ---------- phone-number sharing ----------

export const ContactShare = ({ thread }) => {
  const { user, setContactShared } = useApp();
  const [error, setError] = useState(null);
  const c = thread.contact;
  if (!c) return null;
  const run = async (share) => {
    const res = await setContactShared(thread.id, share);
    setError(res.ok ? null : res.error);
  };
  let body;
  if (c.theirPhone) {
    body = <Text style={styles.contactText}>📞 {thread.candidateName}: <Text style={{ fontWeight: '800' }}>{c.theirPhone}</Text></Text>;
  } else if (c.iShared) {
    body = <Text style={styles.contactMuted}>{t('You offered your number — waiting for {candidateName}.', { candidateName: thread.candidateName })}</Text>;
  } else if (c.theyShared) {
    body = (
      <>
        <Text style={styles.contactText}>{t('{candidateName} offered to exchange numbers.', { candidateName: thread.candidateName })}</Text>
        <Button small variant="secondary" icon={Phone} label={t('Share mine')} onPress={() => run(true)} />
      </>
    );
  } else if (hasFeature(user, 'contactShare')) {
    body = <Button small variant="secondary" icon={Phone} label={t('Offer to exchange numbers')} onPress={() => run(true)} />;
  } else {
    body = <View style={styles.inline}><Text style={styles.contactMuted}>{t('Exchanging numbers')}</Text><UpsellTag feature="contactShare" /></View>;
  }
  return (
    <View style={styles.contact}>
      {body}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// ---------- report & similar ----------

export const ReportButton = ({ candidate }) => {
  const { user, reportLink } = useApp();
  const [busy, setBusy] = useState(false);
  if (!hasFeature(user, 'deepReport')) return <UpsellTag feature="deepReport" label={t('Compatibility PDF · Premium')} />;
  const open = async () => {
    setBusy(true);
    const res = await reportLink(candidate.id);
    setBusy(false);
    if (res.ok) window.open(res.data.url, '_blank');
  };
  return <Button small variant="secondary" icon={FileDown} label={busy ? t('Preparing…') : t('Compatibility PDF')} disabled={busy} onPress={open} />;
};

export const SimilarButton = ({ candidate, onOpen }) => {
  const { user, getSimilar } = useApp();
  const [list, setList] = useState(null);
  if (!hasFeature(user, 'extraPicks')) return null;
  const load = async () => {
    const res = await getSimilar(candidate.id);
    setList(res.ok ? res.data : []);
  };
  return (
    <>
      <Button small variant="secondary" icon={Sparkles} label={t('More like {firstName}', { firstName: candidate.firstName })} onPress={load} />
      {list && (
        <Sheet title={t('More like {firstName}', { firstName: candidate.firstName })} onClose={() => setList(null)} zIndex={85}>
          {list.length === 0 && <Text style={styles.contactMuted}>{t('No one similar right now.')}</Text>}
          {list.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => { setList(null); onOpen?.(c); }} style={styles.simRow} accessibilityRole="button">
              <Text style={[styles.contactText, { flex: 1 }]}>{c.firstName}, {c.age} · {c.city}</Text>
              <Text style={[styles.contactText, { color: colors.accent, fontWeight: '800' }]}>{c.overlapScores.overall}%</Text>
            </TouchableOpacity>
          ))}
        </Sheet>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  upsell: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, backgroundColor: colors.goldSoft, alignSelf: 'flex-start' },
  upsellText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', color: '#8A6A2E' },
  micBtn: { flexShrink: 0, width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSecondary },
  recording: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  recDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#D6334F' },
  recText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '700', color: colors.accent },
  stopBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  error: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: colors.accent },
  voice: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 170 },
  play: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  wave: { flex: 1, height: 14, borderRadius: 3, backgroundColor: 'rgba(168,30,60,0.18)' },
  dur: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
  contact: { gap: 6, alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: colors.cardSecondary, alignSelf: 'center' },
  contactText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary },
  contactMuted: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  simRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
});
