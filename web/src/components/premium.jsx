// Premium building blocks for the web app: upsell nudges, voice notes, contact sharing, report and "more like this"
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Mic, Square, X, Play, Pause, Phone, FileDown, Sparkles } from 'lucide-react';
import { FEATURES, TIER_INFO } from '@shared/plans';
import { createVoiceRecorder, canRecordVoice, MAX_VOICE_MS } from '@shared/voice';
import { formatDuration } from '@shared/calls';
import { useStore } from '../store';
import { Button, Modal, cx } from './ui';
import { t } from '@shared/i18n';

export const hasFeature = (user, key) => Boolean(user?.planFeatures?.includes(key));

// "This needs Plus/Premium/Family" pill linking to the plans page
export function UpsellPill({ feature, children }) {
  const f = FEATURES[feature];
  return (
    <Link to="/premium" className="upsell-pill" title={t(f?.detail || '')}>
      <Crown size={12} /> {children || t('{plan} feature', { plan: t(TIER_INFO[f?.tier || 'premium'].name) })}
    </Link>
  );
}

// ---------- voice notes ----------

export function VoiceRecorderButton({ conversationId }) {
  const { user, sendVoice } = useStore();
  const [state, setState] = useState('idle'); // idle | recording | sending
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
    return <Link to="/premium" className="icon-btn" title={t('Voice notes are a Premium feature')} aria-label={t('Voice notes (Premium)')}><Mic size={17} /></Link>;
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
    rec.current = createVoiceRecorder(); // start() resolves when recording stops (by tap or at the one-minute limit)
    try {
      setState('recording');
      const result = await rec.current.start();
      if (result) send(result);
    } catch (err) {
      setState('idle');
      setError(t(err.message || 'Microphone not available'));
    }
  };

  if (state === 'recording') {
    return (
      <span className="recording">
        <span className="rec-dot" /> {formatDuration(rec.current?.elapsed() || 0)} / {formatDuration(MAX_VOICE_MS)}
        <button type="button" className="icon-btn sm" aria-label={t('Cancel recording')} onClick={() => { rec.current.cancel(); setState('idle'); }}><X size={15} /></button>
        <button type="button" className="icon-btn sm soft" aria-label={t('Stop and send voice note')} onClick={() => rec.current.stop()}><Square size={14} /></button>
      </span>
    );
  }
  return (
    <>
      <button type="button" className="icon-btn" aria-label={t('Record a voice note')} disabled={state === 'sending'} onClick={start}><Mic size={17} /></button>
      {error && <span className="tiny error-text">{error}</span>}
    </>
  );
}

export function VoiceNote({ message }) {
  const { voiceBlob } = useStore();
  const [url, setUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const toggle = async () => {
    if (!url) {
      const blob = await voiceBlob(message.audioPath).catch(() => null);
      if (!blob) return;
      const u = URL.createObjectURL(blob);
      setUrl(u);
      setTimeout(() => audio.current?.play(), 0);
      return;
    }
    if (audio.current.paused) audio.current.play();
    else audio.current.pause();
  };
  return (
    <span className="voice-note">
      <button type="button" className="voice-play" onClick={toggle} aria-label={playing ? t('Pause voice note') : t('Play voice note')}>
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <span className="voice-wave" aria-hidden="true" />
      <span className="tiny">{formatDuration(message.durationMs || 0)}</span>
      {url && <audio ref={audio} src={url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    </span>
  );
}

// ---------- phone-number sharing ----------

export function ContactShare({ thread }) {
  const { user, setContactShared } = useStore();
  const [error, setError] = useState(null);
  const c = thread.contact;
  if (!c) return null;
  const run = async (share) => {
    const res = await setContactShared(thread.id, share);
    setError(res.ok ? null : res.error);
  };
  let body;
  if (c.theirPhone) {
    body = <span className="row small" style={{ '--gap': '6px' }}><Phone size={14} /> {thread.candidateName}: <a href={`tel:${c.theirPhone}`} style={{ fontWeight: 700 }}>{c.theirPhone}</a></span>;
  } else if (c.iShared) {
    body = <span className="small muted">{t('You offered your number — waiting for {candidateName} to share theirs.', { candidateName: thread.candidateName })}{' '}<button className="link-btn small" onClick={() => run(false)}>{t('Withdraw')}</button></span>;
  } else if (c.theyShared) {
    body = <span className="row small" style={{ '--gap': '8px' }}>{t('{candidateName} offered to exchange numbers.', { candidateName: thread.candidateName })}{' '}<Button size="sm" variant="soft" icon={Phone} onClick={() => run(true)}>{t('Share mine')}</Button></span>;
  } else if (hasFeature(user, 'contactShare')) {
    body = <Button size="sm" variant="ghost" icon={Phone} onClick={() => run(true)}>{t('Offer to exchange phone numbers')}</Button>;
  } else {
    body = <span className="row tiny muted" style={{ '--gap': '6px' }}><Phone size={13} />{' '}{t('Exchanging numbers')}{' '}<UpsellPill feature="contactShare" /></span>;
  }
  return (
    <div className="contact-share">
      {body}
      {error && <span className="tiny error-text">{error}</span>}
    </div>
  );
}

// ---------- report & similar ----------

export function ReportButton({ candidate }) {
  const { user, reportLink } = useStore();
  const [busy, setBusy] = useState(false);
  if (!hasFeature(user, 'deepReport')) return <UpsellPill feature="deepReport">{t('Compatibility PDF · Premium')}</UpsellPill>;
  const open = async () => {
    setBusy(true);
    const res = await reportLink(candidate.id);
    setBusy(false);
    if (res.ok) window.open(res.data.url, '_blank', 'noopener');
  };
  return <Button size="sm" variant="secondary" icon={FileDown} loading={busy} disabled={busy} onClick={open}>{t('Compatibility PDF')}</Button>;
}

export function SimilarButton({ candidate, onOpen }) {
  const { user, getSimilar } = useStore();
  const [list, setList] = useState(null);
  if (!hasFeature(user, 'extraPicks')) return null;
  const load = async () => {
    const res = await getSimilar(candidate.id);
    setList(res.ok ? res.data : []);
  };
  return (
    <>
      <Button size="sm" variant="ghost" icon={Sparkles} onClick={load}>{t('More like {firstName}', { firstName: candidate.firstName })}</Button>
      {list && (
        <Modal title={t('More like {firstName}', { firstName: candidate.firstName })} onClose={() => setList(null)} width={560}>
          {list.length === 0 && <span className="small muted">{t('No one similar right now.')}</span>}
          {list.map((c) => (
            <button key={c.id} className="queue-item" onClick={() => { setList(null); onOpen?.(c); }}>
              <span className="queue-thumb">{c.photos?.[0] && <img src={c.photos[0]} alt="" />}</span>
              <span className="grow"><span className="h3" style={{ display: 'block' }}>{c.firstName}, {c.age}</span><span className="tiny muted">{c.city}</span></span>
              <span className="h3 accent">{c.overlapScores.overall}%</span>
            </button>
          ))}
        </Modal>
      )}
    </>
  );
}

export function TierBadge({ tier }) {
  if (!tier || tier === 'free') return null;
  return <span className={cx('mini-badge', 'gold')}><Crown size={11} /> {t(TIER_INFO[tier].name)}</span>;
}
