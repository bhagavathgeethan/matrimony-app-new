// Everything about acting on another member: interest, shortlist, full profile ("why we matched"), block and report
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Star, MessageCircle, Clock, Ban, Flag, Crown, BadgeCheck, Users, Check, X, Sparkles, Moon, Send, ShieldAlert, Circle,
} from 'lucide-react';
import { PILLARS } from '@shared/constants';
import { REPORT_REASONS } from '@shared/engagement';
import { PREFERENCE_FIELDS, describePreference } from '@shared/preferences';
import { useStore } from '../store';
import { Button, Modal, Badge, cx } from './ui';
import { DetailsSections } from './details';
import { t } from '@shared/i18n';

// ---------- small pieces ----------

export function CardBadges({ c, dark = false }) {
  return (
    <span className="row wrap" style={{ '--gap': '6px' }}>
      {c.premium && <span className={cx('mini-badge', 'gold')}><Crown size={11} /> Premium</span>}
      {c.verified && <span className="mini-badge success"><BadgeCheck size={11} /> Verified</span>}
      {c.managedByFamily && <span className="mini-badge neutral"><Users size={11} /> Family-managed</span>}
      {c.activity && <span className={cx('mini-badge', dark ? 'glass' : 'neutral')}><Circle size={8} fill={c.activity === 'Active now' ? 'var(--success)' : 'currentColor'} /> {c.activity}</span>}
    </span>
  );
}

export function PromptCards({ prompts }) {
  if (!prompts?.length) return null;
  return (
    <div className="stack" style={{ '--gap': '10px' }}>
      {prompts.map((p) => (
        <div key={p.q} className="prompt-card">
          <span className="tiny muted" style={{ fontWeight: 700 }}>{p.q}</span>
          <span style={{ fontWeight: 650 }}>{p.a}</span>
        </div>
      ))}
    </div>
  );
}

export function ShortlistButton({ candidate, label = false }) {
  const { toggleShortlist } = useStore();
  const on = Boolean(candidate.shortlisted);
  return (
    <button
      type="button"
      className={cx(label ? 'btn btn-secondary' : 'icon-btn', on && 'starred')}
      aria-pressed={on}
      aria-label={on ? `Remove ${candidate.firstName} from shortlist` : `Shortlist ${candidate.firstName}`}
      onClick={(e) => { e.stopPropagation(); toggleShortlist(candidate); }}
    >
      <Star size={17} fill={on ? 'var(--gold)' : 'none'} color={on ? 'var(--gold)' : 'currentColor'} />
      {label && t(on ? 'Shortlisted' : 'Shortlist')}
    </button>
  );
}

// ---------- interest ----------

export function InterestModal({ candidate, onClose }) {
  const { expressInterest, interestLimits } = useStore();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [limited, setLimited] = useState(false);
  const left = interestLimits?.interestsLeftToday;

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await expressInterest(candidate.id, message.trim() || undefined);
    setBusy(false);
    if (res.ok) return onClose();
    if (res.code === 'INTEREST_LIMIT') setLimited(true);
    setError(res.error);
  };

  return (
    <Modal title={`Express interest in ${candidate.firstName}`} onClose={onClose} width={520}>
      <form className="stack" onSubmit={send}>
        <p className="small muted" style={{ margin: 0 }}>
          {candidate.firstName} can accept or decline. Once accepted you can chat, see each other’s photos and video call.
        </p>
        <label className="field">
          <span className="label">Add a note (optional)</span>
          <textarea className="input" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={candidate.suggestedOpener ? `e.g. ${candidate.suggestedOpener.split(' — ')[1] || 'Say hello'}` : 'Say hello'} />
        </label>
        {left != null && <span className="tiny muted">{left} interest{left === 1 ? '' : 's'} left today on the free plan.</span>}
        {error && <span className="error-text">{error}</span>}
        {limited && <Link to="/premium" className="btn btn-gold sm" onClick={onClose}><Crown size={15} /> See Premium</Link>}
        <div className="row between">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Heart} loading={busy} disabled={busy}>{t('Send interest')}</Button>
        </div>
      </form>
    </Modal>
  );
}

// The main action on a card, depending on where the two of you are
export function InterestButton({ candidate, className, size }) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const i = candidate.interest;
  const go = () => navigate(`/messages/${i.conversationId}`);
  let button;
  if (!i) button = <Button className={className} size={size} icon={Heart} onClick={() => setAsking(true)}>{t('Express interest')}</Button>;
  else if (i.status === 'accepted') button = <Button className={className} size={size} icon={MessageCircle} onClick={go}>{t('Chat')}</Button>;
  else if (i.status === 'requested' && !i.byMe) button = <Button className={className} size={size} variant="gold" icon={Heart} onClick={go}>{t('Respond to interest')}</Button>;
  else if (i.status === 'requested') button = <Button className={className} size={size} variant="secondary" icon={Clock} onClick={go}>{t('Interest sent')}</Button>;
  else button = <Button className={className} size={size} variant="secondary" disabled>{t('Not available')}</Button>;
  return (
    <>
      {button}
      {asking && <InterestModal candidate={candidate} onClose={() => setAsking(false)} />}
    </>
  );
}

// ---------- block & report ----------

export function ReportModal({ member, onClose, onDone }) {
  const { reportMember } = useStore();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await reportMember(member.id, reason, details.trim() || undefined);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone?.('reported');
    onClose();
  };
  return (
    <Modal title={`Report ${member.firstName}`} onClose={onClose} width={520}>
      <form className="stack" onSubmit={submit}>
        <p className="small muted" style={{ margin: 0 }}>Reports are confidential. We’ll also block {member.firstName} for you.</p>
        <div className="stack" style={{ '--gap': '6px' }} role="radiogroup" aria-label="Reason">
          {REPORT_REASONS.map(([key, label]) => (
            <label key={key} className={cx('radio-row', reason === key && 'on')}>
              <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              {label}
            </label>
          ))}
        </div>
        <textarea className="input" rows={3} maxLength={1000} placeholder="Anything else we should know (optional)" value={details} onChange={(e) => setDetails(e.target.value)} />
        {error && <span className="error-text">{error}</span>}
        <div className="row between">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Flag} loading={busy} disabled={!reason || busy}>{t('Report and block')}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function SafetyActions({ member, onDone }) {
  const { blockMember } = useStore();
  const [reporting, setReporting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  return (
    <>
      <div className="row" style={{ '--gap': '8px' }}>
        <Button variant="ghost" size="sm" icon={Ban} onClick={() => setConfirmBlock(true)}>{t('Block')}</Button>
        <Button variant="ghost" size="sm" icon={Flag} onClick={() => setReporting(true)}>{t('Report')}</Button>
      </div>
      {confirmBlock && (
        <Modal title={`Block ${member.firstName}?`} onClose={() => setConfirmBlock(false)} width={460}>
          <p className="small muted" style={{ margin: 0 }}>You won’t see each other anywhere on Sangam and they can’t message you. They aren’t told. You can unblock from Safety.</p>
          <div className="row between">
            <Button variant="ghost" onClick={() => setConfirmBlock(false)}>Cancel</Button>
            <Button icon={Ban} onClick={async () => { const res = await blockMember(member.id); setConfirmBlock(false); if (res.ok) onDone?.('blocked'); }}>{t('Block')}</Button>
          </div>
        </Modal>
      )}
      {reporting && <ReportModal member={member} onClose={() => setReporting(false)} onDone={onDone} />}
    </>
  );
}

// ---------- full profile ----------

const VERDICT = {
  aligned: ['Aligned', 'success'],
  close: ['Close enough', 'gold'],
  talk: ['Worth a talk', 'neutral'],
  dealbreaker: ['Possible dealbreaker', 'accent'],
};

function PillarCompare({ p, name }) {
  const pillar = PILLARS.find((x) => x.key === p.key);
  const [label, tone] = VERDICT[p.verdict];
  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <div className="row between">
        <span className="h3">{pillar.title}</span>
        <Badge tone={tone}>{label}</Badge>
      </div>
      <div className="compare-bar" aria-label={`${pillar.title}: you ${p.mine}, ${name} ${p.theirs}`}>
        <span className="compare-gap" style={{ left: `${Math.min(p.mine, p.theirs)}%`, width: `${p.gap}%` }} />
        <span className="compare-dot me" style={{ left: `${p.mine}%` }} title={`You · ${p.myFlexibility}`} />
        <span className="compare-dot them" style={{ left: `${p.theirs}%` }} title={`${name} · ${p.theirFlexibility}`} />
      </div>
      <div className="row between tiny muted"><span>{pillar.low}</span><span>{pillar.high}</span></div>
      <span className="tiny muted">
        You {p.myFlexibility === 'firm' ? '(firm)' : '(open)'} · {name} {p.theirFlexibility === 'firm' ? '(firm)' : '(open)'} · {p.score}% on this pillar
      </span>
    </div>
  );
}

function PreferenceList({ title, match }) {
  if (!match || match.total === 0) return null;
  return (
    <div className="stack" style={{ '--gap': '8px' }}>
      <div className="row between">
        <span className="h3">{title}</span>
        <span className="small muted">{match.met} of {match.total}</span>
      </div>
      {match.items.map((i) => (
        <div key={i.key} className="row small" style={{ '--gap': '8px' }}>
          {i.met === true ? <Check size={15} color="var(--success)" /> : i.met === false ? <X size={15} color="var(--accent)" /> : <Circle size={13} color="var(--text-light)" />}
          <span className="grow">{i.label}</span>
          <span className="muted">{i.wanted}</span>
        </div>
      ))}
    </div>
  );
}

export function CandidateModal({ candidate, onClose, initialTab = 'why' }) {
  const { compareMatch } = useStore();
  const [tab, setTab] = useState(initialTab);
  const [cmp, setCmp] = useState(null);
  const [error, setError] = useState(null);
  const [gone, setGone] = useState(null);

  useEffect(() => {
    let live = true;
    compareMatch(candidate.id).then((res) => {
      if (!live) return;
      if (res.ok) setCmp(res.data);
      else setError(res.error);
    });
    return () => { live = false; };
  }, [candidate.id, compareMatch]);

  const looking = PREFERENCE_FIELDS.filter((f) => candidate.lookingFor?.[f.key]);

  if (gone) {
    return (
      <Modal title={gone === 'reported' ? 'Thanks for reporting' : 'Blocked'} onClose={onClose} width={440}>
        <p className="small muted" style={{ margin: 0 }}>{candidate.firstName} won’t appear for you any more.</p>
        <Button onClick={onClose}>Done</Button>
      </Modal>
    );
  }

  return (
    <Modal title={`${candidate.firstName}, ${candidate.age}`} onClose={onClose} width={680}>
      <CardBadges c={candidate} />
      <div className="tabs" role="tablist">
        {[['why', 'Why we matched'], ['about', 'About'], ['looking', 'Looking for']].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{t(label)}</button>
        ))}
      </div>

      {tab === 'why' && (
        <div className="stack" style={{ '--gap': '18px' }}>
          {error && <span className="error-text">{error}</span>}
          {!cmp && !error && <span className="small muted">Comparing your blueprints…</span>}
          {cmp && (
            <>
              <div className="row" style={{ '--gap': '10px' }}>
                <Sparkles size={18} color="var(--gold)" />
                <span className="h3">{cmp.overall}% aligned overall</span>
                <span className="row tiny muted" style={{ '--gap': '10px', marginLeft: 'auto' }}>
                  <span className="row" style={{ '--gap': '4px' }}><span className="compare-dot me static" /> You</span>
                  <span className="row" style={{ '--gap': '4px' }}><span className="compare-dot them static" /> {candidate.firstName}</span>
                </span>
              </div>
              {cmp.pillars.map((p) => <PillarCompare key={p.key} p={p} name={candidate.firstName} />)}
              {cmp.sharedVibes.length > 0 && (
                <div className="row wrap" style={{ '--gap': '6px' }}>
                  <span className="small muted">You both like</span>
                  {cmp.sharedVibes.map((v) => <span key={v} className="chip sm">{v}</span>)}
                </div>
              )}
              <PreferenceList title={`${candidate.firstName} and your preferences`} match={cmp.fitsMyPreferences} />
              <PreferenceList title={`You and ${candidate.firstName}’s preferences`} match={cmp.iFitTheirPreferences} />
              <div className="card tinted stack" style={{ '--gap': '8px' }}>
                <span className="row h3" style={{ '--gap': '8px' }}><Moon size={16} color="var(--gold)" /> {t('Horoscope match')}</span>
                {cmp.horoscope?.items ? (
                  <>
                    <span className="h3">{cmp.horoscope.summary}</span>
                    <div className="porutham-grid">
                      {cmp.horoscope.items.map((i) => (
                        <span key={i.name} className={cx('porutham', i.result.replace(' ', '-'))} title={i.note}>{i.name}</span>
                      ))}
                    </div>
                    <span className="tiny muted">{cmp.horoscope.disclaimer}</span>
                  </>
                ) : cmp.horoscope?.unavailable ? (
                  <span className="small muted">{cmp.horoscope.unavailable}</span>
                ) : (
                  <span className="small muted">
                    {!cmp.horoscopeOptIn.me
                      ? <>Optional and off. Turn on “Horoscope matching” in <Link to="/settings">Settings</Link> to compare stars.</>
                      : `${candidate.firstName} hasn’t turned on horoscope matching.`}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="stack">
          <PromptCards prompts={candidate.prompts} />
          {Object.keys(candidate.details || {}).some((k) => !['firstName', 'city', 'profession'].includes(k))
            ? <DetailsSections person={candidate} />
            : <span className="small muted">{candidate.firstName} hasn’t added personal details yet.</span>}
        </div>
      )}

      {tab === 'looking' && (
        <div className="stack" style={{ '--gap': '10px' }}>
          {looking.length === 0 && <span className="small muted">{candidate.firstName} hasn’t set partner preferences.</span>}
          {looking.map((f) => (
            <div key={f.key} className="row between small"><span className="muted">{f.label}</span><span style={{ fontWeight: 650, textAlign: 'right' }}>{describePreference(f, candidate.lookingFor[f.key])}</span></div>
          ))}
          {candidate.iFitTheirPreferences?.total > 0 && (
            <Badge tone="gold">You match {candidate.iFitTheirPreferences.met} of {candidate.iFitTheirPreferences.total}</Badge>
          )}
        </div>
      )}

      <div className="row wrap modal-actions" style={{ '--gap': '8px' }}>
        <InterestButton candidate={candidate} className="grow" />
        <ShortlistButton candidate={candidate} label />
        <SafetyActions member={candidate} onDone={setGone} />
      </div>
    </Modal>
  );
}

export function InterestStatusNote({ thread }) {
  if (thread.status === 'requested' && thread.requestedByMe) {
    return <span className="row small" style={{ '--gap': '6px' }}><Send size={14} color="var(--gold)" /> Interest sent — you can write more once {thread.candidateName} accepts.</span>;
  }
  if (thread.status === 'declined') {
    return <span className="row small" style={{ '--gap': '6px' }}><ShieldAlert size={14} /> {thread.candidateName} isn’t available right now.</span>;
  }
  return null;
}
