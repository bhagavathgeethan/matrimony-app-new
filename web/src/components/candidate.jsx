// Everything about acting on another member: interest, shortlist, full profile ("why we matched"), block and report
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Star, MessageCircle, Clock, Ban, Flag, Crown, BadgeCheck, Users, Check, X, Sparkles, Moon, Send, ShieldAlert, Circle,
} from 'lucide-react';
import { PILLARS } from '@shared/constants';
import { REPORT_REASONS } from '@shared/engagement';
import { PREFERENCE_FIELDS, describePreference, preferenceWanted } from '@shared/preferences';
import { translatePorutham } from '@shared/porutham';
import { useStore } from '../store';
import { Button, Modal, Badge, cx } from './ui';
import { DetailsSections } from './details';
import { PhotoGallery } from './gallery';
import { ReportButton, SimilarButton, hasFeature, UpsellPill } from './premium';
import { TIER_INFO } from '@shared/plans';
import { t } from '@shared/i18n';

// ---------- small pieces ----------

const flexLabel = (f) => t(f === 'firm' ? 'Firm' : 'Open');
// The question half of a suggested opener ("You’re aligned on money — ask how …")
const openerQuestion = (opener) => {
  const parts = t(opener).split(' — ');
  return parts[1] || t('Say hello');
};

export function CardBadges({ c, dark = false }) {
  return (
    <span className="row wrap" style={{ '--gap': '6px' }}>
      {c.spotlight && <span className="mini-badge spotlight"><Sparkles size={11} />{' '}{t('Spotlight')}</span>}
      {c.premium && <span className={cx('mini-badge', 'gold')}><Crown size={11} /> {t(TIER_INFO[c.tier]?.name || 'Premium')}</span>}
      {c.verified && <span className="mini-badge success"><BadgeCheck size={11} />{' '}{t('Verified')}</span>}
      {c.managedByFamily && <span className="mini-badge neutral"><Users size={11} />{' '}{t('Family-managed')}</span>}
      {c.activity && <span className={cx('mini-badge', dark ? 'glass' : 'neutral')}><Circle size={8} fill={c.activity === 'Active now' ? 'var(--success)' : 'currentColor'} /> {t(c.activity)}</span>}
    </span>
  );
}

export function PromptCards({ prompts }) {
  if (!prompts?.length) return null;
  return (
    <div className="stack" style={{ '--gap': '10px' }}>
      {prompts.map((p) => (
        <div key={p.q} className="prompt-card">
          <span className="tiny muted" style={{ fontWeight: 700 }}>{t(p.q)}</span>
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
      aria-label={on ? t('Remove {firstName} from shortlist', { firstName: candidate.firstName }) : t('Shortlist {firstName}', { firstName: candidate.firstName })}
      onClick={(e) => { e.stopPropagation(); toggleShortlist(candidate); }}
    >
      <Star size={17} fill={on ? 'var(--gold)' : 'none'} color={on ? 'var(--gold)' : 'currentColor'} />
      {label && <span className="btn-label">{t(on ? 'Shortlisted' : 'Shortlist')}</span>}
    </button>
  );
}

// ---------- interest ----------

export function InterestModal({ candidate, onClose }) {
  const { expressInterest, interestLimits, user } = useStore();
  const [message, setMessage] = useState('');
  const [isSuper, setIsSuper] = useState(false);
  const superLeft = interestLimits?.superInterestsLeft ?? 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [limited, setLimited] = useState(false);
  const left = interestLimits?.interestsLeftToday;

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await expressInterest(candidate.id, message.trim() || undefined, isSuper);
    setBusy(false);
    if (res.ok) return onClose();
    if (res.code === 'INTEREST_LIMIT') setLimited(true);
    setError(res.error);
  };

  return (
    <Modal title={t('Express interest in {firstName}', { firstName: candidate.firstName })} onClose={onClose} width={520}>
      <form className="stack" onSubmit={send}>
        <p className="small muted" style={{ margin: 0 }}>
          {t('{firstName} can accept or decline. Once accepted you can chat, see each other’s photos and video call.', { firstName: candidate.firstName })}
        </p>
        <label className="field">
          <span className="label">{t('Add a note (optional)')}</span>
          <textarea className="input" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={candidate.suggestedOpener ? t('e.g. {opener}', { opener: openerQuestion(candidate.suggestedOpener) }) : t('Say hello')} />
        </label>
        {hasFeature(user, 'superInterest') ? (
          <label className={cx('radio-row', isSuper && 'on')}>
            <input type="checkbox" checked={isSuper} disabled={!isSuper && superLeft === 0} onChange={(e) => setIsSuper(e.target.checked)} />
            <span className="grow">{t('⭐ Send as a super interest')}{' '}<span className="tiny muted">{t('— highlighted and pinned at the top of their requests ({superLeft} left this week)', { superLeft })}</span></span>
          </label>
        ) : <span className="row tiny muted" style={{ '--gap': '6px' }}>{t('⭐ Super interests')}{' '}<UpsellPill feature="superInterest" /></span>}
        {left != null && <span className="tiny muted">{t(left === 1 ? '1 interest left today on the free plan.' : '{left} interests left today on the free plan.', { left })}</span>}
        {error && <span className="error-text">{error}</span>}
        {limited && <Link to="/premium" className="btn btn-gold sm" onClick={onClose}><Crown size={15} />{' '}{t('See plans')}</Link>}
        <div className="row between">
          <Button type="button" variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
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
    <Modal title={t('Report {firstName}', { firstName: member.firstName })} onClose={onClose} width={520}>
      <form className="stack" onSubmit={submit}>
        <p className="small muted" style={{ margin: 0 }}>{t('Reports are confidential. We’ll also block {firstName} for you.', { firstName: member.firstName })}</p>
        <div className="stack" style={{ '--gap': '6px' }} role="radiogroup" aria-label={t('Reason')}>
          {REPORT_REASONS.map(([key, label]) => (
            <label key={key} className={cx('radio-row', reason === key && 'on')}>
              <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              {t(label)}
            </label>
          ))}
        </div>
        <textarea className="input" rows={3} maxLength={1000} placeholder={t('Anything else we should know (optional)')} value={details} onChange={(e) => setDetails(e.target.value)} />
        {error && <span className="error-text">{error}</span>}
        <div className="row between">
          <Button type="button" variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
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
        <Modal title={t('Block {firstName}?', { firstName: member.firstName })} onClose={() => setConfirmBlock(false)} width={460}>
          <p className="small muted" style={{ margin: 0 }}>{t('You won’t see each other anywhere on 3Knot and they can’t message you. They aren’t told. You can unblock from Safety.')}</p>
          <div className="row between">
            <Button variant="ghost" onClick={() => setConfirmBlock(false)}>{t('Cancel')}</Button>
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
        <span className="h3">{t(pillar.title)}</span>
        <Badge tone={tone}>{t(label)}</Badge>
      </div>
      <div className="compare-bar" aria-label={t('{title}: you {mine}, {name} {theirs}', { title: pillar.title, mine: p.mine, name, theirs: p.theirs })}>
        <span className="compare-gap" style={{ left: `${Math.min(p.mine, p.theirs)}%`, width: `${p.gap}%` }} />
        <span className="compare-dot me" style={{ left: `${p.mine}%` }} title={`${t('You')} · ${flexLabel(p.myFlexibility)}`} />
        <span className="compare-dot them" style={{ left: `${p.theirs}%` }} title={`${name} · ${flexLabel(p.theirFlexibility)}`} />
      </div>
      <div className="row between tiny muted"><span>{t(pillar.low)}</span><span>{t(pillar.high)}</span></div>
      <span className="tiny muted">
        {t('You')}{' '}{p.myFlexibility === 'firm' ? t('(firm)') : t('(open)')} · {name} {p.theirFlexibility === 'firm' ? t('(firm)') : t('(open)')}{' '}{t('· {score}% on this pillar', { score: p.score })}
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
        <span className="small muted">{t('{met} of {total}', { met: match.met, total: match.total })}</span>
      </div>
      {match.items.map((i) => (
        <div key={i.key} className="row small" style={{ '--gap': '8px' }}>
          {i.met === true ? <Check size={15} color="var(--success)" /> : i.met === false ? <X size={15} color="var(--accent)" /> : <Circle size={13} color="var(--text-light)" />}
          <span className="grow">{t(i.label)}</span>
          <span className="muted">{preferenceWanted(i)}</span>
        </div>
      ))}
    </div>
  );
}

// Another member's full profile. Opens on their personal details and loads the latest full profile, so it
// works from anywhere that only knows who they are (search results, chats).
export function CandidateModal({ candidate: initial, onClose, initialTab = 'about' }) {
  const { compareMatch, getCandidate } = useStore();
  const [candidate, setCandidate] = useState(initial);
  const [tab, setTab] = useState(initialTab);
  const [cmp, setCmp] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ loading: true, error: null });
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
  useEffect(() => {
    let live = true;
    setProfile({ loading: true, error: null });
    getCandidate(candidate.id).then((res) => {
      if (!live) return;
      if (res.ok) setCandidate((prev) => ({ ...prev, ...res.data }));
      setProfile({ loading: false, error: res.ok ? null : res.error });
    });
    return () => { live = false; };
  }, [candidate.id, getCandidate]);
  useEffect(() => setCandidate((prev) => (prev.id === initial.id ? { ...prev, ...initial } : initial)), [initial]);

  const looking = PREFERENCE_FIELDS.filter((f) => candidate.lookingFor?.[f.key]);
  const horoscope = translatePorutham(cmp?.horoscope);

  if (gone) {
    return (
      <Modal title={gone === 'reported' ? t('Thanks for reporting') : t('Blocked')} onClose={onClose} width={440}>
        <p className="small muted" style={{ margin: 0 }}>{t('{firstName} won’t appear for you any more.', { firstName: candidate.firstName })}</p>
        <Button onClick={onClose}>{t('Done')}</Button>
      </Modal>
    );
  }

  return (
    <Modal title={candidate.age != null ? `${candidate.firstName}, ${candidate.age}` : candidate.firstName} onClose={onClose} width={680}>
      <CardBadges c={candidate} />
      <div className="tabs" role="tablist">
        {[['about', 'About'], ['why', 'Why we matched'], ['looking', 'Looking for']].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{t(label)}</button>
        ))}
      </div>

      {tab === 'why' && (
        <div className="stack" style={{ '--gap': '18px' }}>
          {error && <span className="error-text">{error}</span>}
          {!cmp && !error && <span className="small muted">{t('Comparing your blueprints…')}</span>}
          {cmp && (
            <>
              <div className="row" style={{ '--gap': '10px' }}>
                <Sparkles size={18} color="var(--gold)" />
                <span className="h3">{t('{overall}% aligned overall', { overall: cmp.overall })}</span>
                <span className="row tiny muted" style={{ '--gap': '10px', marginLeft: 'auto' }}>
                  <span className="row" style={{ '--gap': '4px' }}><span className="compare-dot me static" />{' '}{t('You')}</span>
                  <span className="row" style={{ '--gap': '4px' }}><span className="compare-dot them static" /> {candidate.firstName}</span>
                </span>
              </div>
              {cmp.pillars.map((p) => <PillarCompare key={p.key} p={p} name={candidate.firstName} />)}
              {cmp.topics && (
                <div className="opener">
                  <span className="label" style={{ color: 'var(--gold-ink)' }}>{t('Worth talking about')}</span>
                  {cmp.topics.map((tp) => <span key={tp} className="small" style={{ fontWeight: 600 }}>• {t(tp)}</span>)}
                </div>
              )}
              <div className="row wrap" style={{ '--gap': '8px' }}>
                <ReportButton candidate={candidate} />
                <SimilarButton candidate={candidate} onOpen={(c) => { setCmp(null); setTab('why'); setCandidate(c); }} />
              </div>
              {cmp.sharedVibes.length > 0 && (
                <div className="row wrap" style={{ '--gap': '6px' }}>
                  <span className="small muted">{t('You both like')}</span>
                  {cmp.sharedVibes.map((v) => <span key={v} className="chip sm">{t(v)}</span>)}
                </div>
              )}
              <PreferenceList title={t('{firstName} and your preferences', { firstName: candidate.firstName })} match={cmp.fitsMyPreferences} />
              <PreferenceList title={t('You and {firstName}’s preferences', { firstName: candidate.firstName })} match={cmp.iFitTheirPreferences} />
              <div className="card tinted stack" style={{ '--gap': '8px' }}>
                <span className="row h3" style={{ '--gap': '8px' }}><Moon size={16} color="var(--gold)" /> {t('Horoscope match')}</span>
                {horoscope?.items ? (
                  <>
                    <span className="h3">{horoscope.summary}</span>
                    <div className="porutham-grid">
                      {horoscope.items.map((i) => (
                        <span key={i.name} className={cx('porutham', i.result.replace(' ', '-'))} title={i.note}>{i.label}</span>
                      ))}
                    </div>
                    <span className="tiny muted">{horoscope.disclaimer}</span>
                  </>
                ) : horoscope?.unavailable ? (
                  <span className="small muted">{horoscope.unavailable}</span>
                ) : (
                  <span className="small muted">
                    {!cmp.horoscopeOptIn.me
                      ? <>{t('Optional and off. Turn on “Horoscope matching” in')}{' '}<Link to="/settings">{t('Settings')}</Link>{' '}{t('to compare stars.')}</>
                      : t('{firstName} hasn’t turned on horoscope matching.', { firstName: candidate.firstName })}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="stack">
          <PhotoGallery candidate={candidate} />
          <PromptCards prompts={candidate.prompts} />
          {Object.keys(candidate.details || {}).some((k) => !['firstName', 'city', 'profession'].includes(k))
            ? <DetailsSections person={candidate} />
            : profile.loading ? <span className="small muted">{t('Loading…')}</span>
              : profile.error ? <span className="error-text">{profile.error}</span>
                : <span className="small muted">{t('{firstName} hasn’t added personal details yet.', { firstName: candidate.firstName })}</span>}
        </div>
      )}

      {tab === 'looking' && (
        <div className="stack" style={{ '--gap': '10px' }}>
          {looking.length === 0 && <span className="small muted">{t('{firstName} hasn’t set partner preferences.', { firstName: candidate.firstName })}</span>}
          {looking.map((f) => (
            <div key={f.key} className="row between small"><span className="muted">{t(f.label)}</span><span style={{ fontWeight: 650, textAlign: 'right' }}>{describePreference(f, candidate.lookingFor[f.key])}</span></div>
          ))}
          {candidate.iFitTheirPreferences?.total > 0 && (
            <Badge tone="gold">{t('You match {met} of {total}', { met: candidate.iFitTheirPreferences.met, total: candidate.iFitTheirPreferences.total })}</Badge>
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
    return <span className="row small" style={{ '--gap': '6px' }}><Send size={14} color="var(--gold)" />{' '}{t('Interest sent — you can write more once {candidateName} accepts.', { candidateName: thread.candidateName })}</span>;
  }
  if (thread.status === 'declined') {
    return <span className="row small" style={{ '--gap': '6px' }}><ShieldAlert size={14} />{' '}{t('{candidateName} isn’t available right now.', { candidateName: thread.candidateName })}</span>;
  }
  return null;
}
