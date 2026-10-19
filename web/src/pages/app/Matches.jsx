import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles, Heart, Clock, Lock, BadgeCheck, Quote, X, Users, Lightbulb, RotateCw, ClipboardList, Images, ChevronLeft, ChevronRight,
  Ruler, Languages, GraduationCap, Briefcase, Wallet, Utensils, Home, Flower2, UserRound, ArrowRight, Undo2,
} from 'lucide-react';
import { PILLARS } from '@shared/constants';
import { FIELD_BY_KEY, isFilled } from '@shared/profileFields';
import { useStore } from '../../store';
import { Button, ScoreRing, Meter, Badge, Empty, cx } from '../../components/ui';
import { CandidateModal, InterestButton, ShortlistButton, CardBadges, PromptCards } from '../../components/candidate';
import { displayValue } from '../../components/details';
import { hasFeature } from '../../components/premium';
import { ShareModal } from '../../components/domain';
import { t } from '@shared/i18n';

const FILTERS = [
  ['Blueprint', Sparkles],
  ['Vibes', Heart],
  ['New', Clock],
];

// "At a glance" on the match card: the most asked-about details, when filled in
const GLANCE = [
  ['heightCm', Ruler],
  ['maritalStatus', UserRound],
  ['religion', Flower2],
  ['motherTongue', Languages],
  ['educationCategory', GraduationCap],
  ['profession', Briefcase],
  ['annualIncome', Wallet],
  ['eatingHabits', Utensils],
  ['familyType', Home],
];
const glanceOf = (c) => GLANCE
  .map(([key, icon]) => [FIELD_BY_KEY[key], icon, c.details?.[key]])
  .filter(([f, , v]) => f && isFilled(v))
  .slice(0, 8)
  .map(([f, icon, v]) => ({ key: f.key, icon, label: t(f.label), value: displayValue(f, v, c.details) }));

export function MatchesPage() {
  const { user, candidates, conversations, dataLoading, loadError, loadAppData, passCandidate, refreshFeed, rewind } = useStore();
  const [canUndo, setCanUndo] = useState(false);
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('Blueprint');
  const [index, setIndex] = useState(0);
  const [sharing, setSharing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [hidePrompt, setHidePrompt] = useState(() => { try { return sessionStorage.getItem('sangam.hideCompletion') === '1'; } catch { return false; } });
  const percent = user?.profileStrength ?? 0;

  // Same feed orderings as the mobile app
  const feed = useMemo(() => {
    if (filter === 'Vibes') {
      const mine = new Set(user?.vibes || []);
      const shared = (c) => (c.vibes || []).filter((v) => mine.has(v)).length;
      return [...candidates].sort((a, b) => shared(b) - shared(a));
    }
    if (filter === 'New') {
      const talkedTo = new Set(conversations.map((conv) => conv.candidateId));
      return candidates.filter((c) => !talkedTo.has(c.id));
    }
    return candidates;
  }, [filter, candidates, conversations, user?.vibes]);

  // /matches?focus=<id> (from Browse) jumps to that person
  // (search can surface someone who joined after the feed loaded: refresh once, then look again)
  const focus = params.get('focus');
  const refreshedFor = useRef(null);
  useEffect(() => {
    if (!focus) return;
    const i = feed.findIndex((c) => c.id === focus);
    if (i >= 0) setIndex(i);
    else if (filter !== 'Blueprint') setFilter('Blueprint');
    else if (refreshedFor.current !== focus) {
      refreshedFor.current = focus;
      refreshFeed();
    }
  }, [focus, feed, filter, refreshFeed]);

  const safe = feed.length ? index % feed.length : 0;
  const current = feed[safe];
  // The people after this one, in order
  const queue = feed.length > 1 ? [...feed.slice(safe + 1), ...feed.slice(0, safe)].slice(0, 6) : [];
  const glance = current ? glanceOf(current) : [];
  const sharedVibes = current ? (current.vibes || []).filter((v) => (user?.vibes || []).includes(v)) : [];

  const select = (id) => {
    setIndex(feed.findIndex((c) => c.id === id));
    setParams({}, { replace: true });
  };
  const step = (by) => {
    if (feed.length < 2) return;
    setIndex((safe + by + feed.length) % feed.length);
    setParams({}, { replace: true });
  };
  const pass = async () => {
    setBusy('pass');
    await passCandidate(current.id);
    setBusy(null);
    setCanUndo(true);
    setIndex((i) => (feed.length > 1 ? i % (feed.length - 1) : 0));
    setParams({}, { replace: true });
  };
  const openProfile = (tab) => setViewing({ candidate: current, tab });

  // ← / → move between matches (not while typing or with a dialog open)
  useEffect(() => {
    const onKey = (e) => {
      if (viewing || sharing || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"], .modal, .photo-viewer')) return;
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="page matches-page">
      <header className="mx-head">
        <div className="stack" style={{ '--gap': '4px' }}>
          <span className="eyebrow">{t('Hi {name} · today’s matches', { name: user?.firstName || '' })}</span>
          <h1 className="h1">{t('Aligned')}</h1>
        </div>
        <div className="row wrap" style={{ '--gap': '10px' }}>
          {canUndo && hasFeature(user, 'rewind') && (
            <button className="chip" onClick={async () => { const res = await rewind(); if (res.ok) { setCanUndo(false); setParams({ focus: res.data.candidate.id }); } }}>
              <Undo2 size={14} />{' '}{t('Undo pass')}
            </button>
          )}
          <div className="mx-segmented" role="group">
            {FILTERS.map(([key, Icon]) => (
              <button key={key} type="button" aria-pressed={filter === key} className={cx(filter === key && 'active')} onClick={() => { setFilter(key); setIndex(0); }}>
                <Icon size={14} /> {t(key)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {percent < 100 && !hidePrompt && (
        <div className="mx-banner fade-in">
          <ScoreRing score={percent} size={40} label="" />
          <div className="grow mx-banner-text">
            <span className="mx-banner-title">{t('Your profile is {n}% complete', { n: percent })}</span>
            <span className="small muted">{t('Add family, education and hobbies so matches know you better.')}</span>
          </div>
          <Link to={user?.profileCompletion?.nextSection ? `/profile/details?edit=${user.profileCompletion.nextSection}` : '/profile/details'} className="btn btn-primary sm">{t('Complete profile')}</Link>
          <button className="icon-btn sm" aria-label={t('Hide for now')} onClick={() => { setHidePrompt(true); try { sessionStorage.setItem('sangam.hideCompletion', '1'); } catch { /* ignore */ } }}><X size={15} /></button>
        </div>
      )}

      {!current ? (
        <Empty icon={Sparkles} title={dataLoading ? t('Loading your aligned matches…') : t('No matches yet')}>
          {!dataLoading && (
            <>
              <p className="small">
                {loadError || (filter === 'New'
                  ? t('You’ve started a conversation with everyone here.')
                  : t('As more people complete their blueprint, they’ll appear here.'))}
              </p>
              <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => (filter === 'Blueprint' ? loadAppData() : setFilter('Blueprint'))}>
                {filter === 'Blueprint' ? t('Refresh') : t('Show all matches')}
              </Button>
            </>
          )}
        </Empty>
      ) : (
        <div className="match-layout">
          <article className="card match-card fade-in" key={current.id}>
            {/* Photo and name open their full profile */}
            <div
              className="match-photo clickable"
              role="button"
              tabIndex={0}
              aria-label={t('Full profile')}
              onClick={() => openProfile('about')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfile('about'); } }}
            >
              {current.photos?.[0] && <img src={current.photos[0]} alt="" className={cx(current.photoBlurred && 'blurred')} />}
              <div className="mx-photo-top">
                {current.photos?.length > 1 && <span className="badge glass"><Images size={12} />{' '}{t('{n} photos', { n: current.photos.length })}</span>}
                {current.photoBlurred && <span className="badge glass"><Lock size={11} />{' '}{t('Photo reveals after mutual interest')}</span>}
              </div>
              <div className="mx-identity">
                <div className="mx-name">
                  <span>{current.firstName}, {current.age}</span>
                  {current.verified && <BadgeCheck size={22} color="var(--gold)" aria-label={t('Verified')} />}
                </div>
                {(current.city || current.profession) && <div className="mx-sub">{[current.city, current.profession].filter(Boolean).join(' · ')}</div>}
                <CardBadges c={{ ...current, verified: false }} dark />
              </div>
            </div>

            <div className="match-body">
              <div className="mx-scroll">
                <div className="mx-score">
                  <ScoreRing score={current.overlapScores.overall} size={68} />
                  <div className="grow stack" style={{ '--gap': '3px', minWidth: 0 }}>
                    <span className="h3">{t('{overall}% aligned overall', { overall: current.overlapScores.overall })}</span>
                    <span className="small muted">
                      {current.fitsMyPreferences?.total > 0
                        ? t('Fits {met} of your {total} preferences', { met: current.fitsMyPreferences.met, total: current.fitsMyPreferences.total })
                        : t(current.verifiedDate)}
                    </span>
                  </div>
                </div>

                <div className="mx-pillars">
                  {PILLARS.map((p) => <Meter key={p.key} label={t(p.label)} value={current.overlapScores[p.key]} />)}
                </div>

                {glance.length > 0 && (
                  <section className="stack" style={{ '--gap': '10px' }}>
                    <span className="label">{t('At a glance')}</span>
                    <div className="mx-glance">
                      {glance.map(({ key, icon: Icon, label, value }) => (
                        <div key={key} className="mx-fact">
                          <span className="mx-fact-ico"><Icon size={15} /></span>
                          <span className="mx-fact-text">
                            <span className="tiny muted">{label}</span>
                            <span className="mx-fact-value">{value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {current.quote && (
                  <div className="quote"><Quote size={16} color="var(--gold)" style={{ flexShrink: 0 }} />{current.quote}</div>
                )}
                <PromptCards prompts={current.prompts?.slice(0, 1)} />
                {current.suggestedOpener && (
                  <div className="opener">
                    <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} />{' '}{t('Suggested opener')}</span>
                    <span style={{ fontWeight: 650 }}>{t(current.suggestedOpener)}</span>
                  </div>
                )}
                {sharedVibes.length > 0 && (
                  <div className="row wrap" style={{ '--gap': '6px' }}>
                    {sharedVibes.map((v) => <Badge key={v} tone="accent"><Heart size={11} />{' '}{t(v)}</Badge>)}
                  </div>
                )}
              </div>

              <footer className="mx-actions">
                {/* The main action gets the full width, so its label always fits (any language, any state) */}
                <InterestButton candidate={current} className="mx-interest" />
                <div className="mx-secondary">
                  <Button variant="secondary" icon={X} loading={busy === 'pass'} disabled={!!busy} onClick={pass} title={t('Pass')}><span className="btn-label">{t('Pass')}</span></Button>
                  <Button variant="secondary" icon={Users} onClick={() => setSharing([current])} title={t('Share with family')}><span className="btn-label">{t('Share with family')}</span></Button>
                  <ShortlistButton candidate={current} label />
                </div>
                <div className="mx-links">
                  <button type="button" onClick={() => openProfile('about')}><UserRound size={15} />{t('Full profile')}</button>
                  <button type="button" onClick={() => openProfile('why')}><ClipboardList size={15} />{t('Why we matched')}</button>
                </div>
              </footer>
            </div>
          </article>

          <aside className="card match-queue">
            <div className="queue-head">
              <span className="h3">{t('Up next')}</span>
              <div className="mx-stepper">
                <button type="button" className="icon-btn sm" onClick={() => step(-1)} disabled={feed.length < 2} aria-label={t('Previous match')}><ChevronLeft size={16} /></button>
                <span className="tiny muted">{t('{n} of {total}', { n: safe + 1, total: feed.length })}</span>
                <button type="button" className="icon-btn sm" onClick={() => step(1)} disabled={feed.length < 2} aria-label={t('Next match')}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="mx-queue-list">
              {queue.length === 0 && <span className="small muted">{t('No one else right now.')}</span>}
              {queue.map((c) => (
                <button key={c.id} className="queue-item" onClick={() => select(c.id)}>
                  <span className="queue-thumb">{c.photos?.[0] && <img src={c.photos[0]} alt="" />}</span>
                  <span className="grow mx-q-text">
                    <span className="mx-q-name">{c.firstName}, {c.age}</span>
                    <span className="tiny muted mx-q-sub">{[c.city, c.profession].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="mx-q-score">{c.overlapScores.overall}%</span>
                </button>
              ))}
            </div>
            <Link to="/today" className="mx-today">
              <Sparkles size={16} />
              <span className="grow">{t('Today’s picks')}</span>
              <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      )}

      {viewing && <CandidateModal candidate={candidates.find((c) => c.id === viewing.candidate.id) || viewing.candidate} initialTab={viewing.tab} onClose={() => setViewing(null)} />}

      {sharing && <ShareModal candidates={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}
