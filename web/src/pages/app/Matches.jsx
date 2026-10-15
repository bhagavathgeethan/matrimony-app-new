import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Heart, Clock, Lock, BadgeCheck, Quote, X, MessageCircle, Users, Lightbulb, RotateCw, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PILLARS } from '@shared/constants';
import { useStore } from '../../store';
import { Button, ScoreRing, Meter, Badge, Empty, Modal, cx } from '../../components/ui';
import { CandidateModal, InterestButton, ShortlistButton, CardBadges, PromptCards } from '../../components/candidate';
import { ShareModal } from '../../components/domain';
import { t } from '@shared/i18n';

const FILTERS = [
  ['Blueprint', Sparkles],
  ['Vibes', Heart],
  ['New', Clock],
];

export function MatchesPage() {
  const { user, candidates, conversations, dataLoading, loadError, loadAppData, passCandidate, refreshFeed } = useStore();
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
      const talkedTo = new Set(conversations.map((t) => t.candidateId));
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
  const queue = feed.filter((c) => c.id !== current?.id).slice(0, 6);

  const select = (id) => {
    setIndex(feed.findIndex((c) => c.id === id));
    setParams({}, { replace: true });
  };
  const pass = async () => {
    setBusy('pass');
    await passCandidate(current.id);
    setBusy(null);
    setIndex((i) => (feed.length > 1 ? i % (feed.length - 1) : 0));
    setParams({}, { replace: true });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">Hi {user?.firstName} · today’s matches</span>
          <h1 className="h1">Aligned</h1>
        </div>
        <div className="row wrap" style={{ '--gap': '8px' }}>
          {FILTERS.map(([key, Icon]) => (
            <button key={key} className={cx('chip', filter === key && 'active')} onClick={() => { setFilter(key); setIndex(0); }}>
              <Icon size={14} /> {key}
            </button>
          ))}
        </div>
      </div>

      {percent < 100 && !hidePrompt && (
        <div className="completion-banner fade-in">
          <ScoreRing score={percent} size={52} label="" />
          <div className="grow">
            <div className="h3">{t('Your profile is {n}% complete', { n: percent })}</div>
            <div className="small muted">Add family, education and hobbies so matches know you better.</div>
          </div>
          <Link to={user?.profileCompletion?.nextSection ? `/profile/details?edit=${user.profileCompletion.nextSection}` : '/profile/details'} className="btn btn-primary sm">{t('Complete profile')}</Link>
          <button className="icon-btn sm" aria-label="Hide for now" onClick={() => { setHidePrompt(true); try { sessionStorage.setItem('sangam.hideCompletion', '1'); } catch { /* ignore */ } }}><X size={15} /></button>
        </div>
      )}

      {!current ? (
        <Empty icon={Sparkles} title={dataLoading ? 'Loading your aligned matches…' : 'No matches yet'}>
          {!dataLoading && (
            <>
              <p className="small">
                {loadError || (filter === 'New'
                  ? 'You’ve started a conversation with everyone here.'
                  : 'As more people complete their blueprint, they’ll appear here.')}
              </p>
              <Button variant="secondary" size="sm" icon={RotateCw} onClick={() => (filter === 'Blueprint' ? loadAppData() : setFilter('Blueprint'))}>
                {filter === 'Blueprint' ? 'Refresh' : 'Show all matches'}
              </Button>
            </>
          )}
        </Empty>
      ) : (
        <div className="match-layout">
          <article className="card match-card fade-in" key={current.id}>
            <div className="match-photo">
              {current.photos?.[0] && <img src={current.photos[0]} alt="" className={cx(current.photoBlurred && 'blurred')} />}
              <div className="match-photo-top"><ScoreRing score={current.overlapScores.overall} size={84} dark /></div>
              <div className="match-identity">
                {current.photoBlurred && <span className="badge glass" style={{ alignSelf: 'flex-start' }}><Lock size={11} /> Photo reveals after mutual interest</span>}
                <div className="match-name">{current.firstName}, {current.age}</div>
                <div className="row" style={{ '--gap': '6px', fontWeight: 600, color: 'rgba(255,246,238,0.85)' }}>
                  {current.verified && <BadgeCheck size={15} color="var(--gold)" />}
                  {current.city}{current.profession ? ` · ${current.profession}` : ''}
                </div>
                <CardBadges c={{ ...current, verified: false }} dark />
              </div>
            </div>

            <div className="match-body">
              <div className="row between">
                <span className="label">Blueprint overlap</span>
                <span className="tiny muted">{current.verifiedDate}</span>
              </div>
              <div className="stack" style={{ '--gap': '11px' }}>
                {PILLARS.map((p) => <Meter key={p.key} label={p.label} value={current.overlapScores[p.key]} />)}
              </div>
              {current.quote && (
                <div className="quote"><Quote size={16} color="var(--gold)" style={{ flexShrink: 0 }} />{current.quote}</div>
              )}
              {current.suggestedOpener && (
                <div className="opener">
                  <span className="row label" style={{ '--gap': '6px', color: 'var(--gold-ink)' }}><Lightbulb size={13} /> Suggested opener</span>
                  <span style={{ fontWeight: 650 }}>{current.suggestedOpener}</span>
                </div>
              )}
              {current.tags?.length > 0 && (
                <div className="row wrap" style={{ '--gap': '8px' }}>
                  {current.tags.map((t) => <Badge key={t} tone="accent">{t}</Badge>)}
                </div>
              )}
              <PromptCards prompts={current.prompts?.slice(0, 1)} />
              {current.fitsMyPreferences?.total > 0 && (
                <span className="small muted">Fits {current.fitsMyPreferences.met} of your {current.fitsMyPreferences.total} preferences</span>
              )}
              <div className="row" style={{ marginTop: 'auto' }}>
                <Button variant="secondary" icon={X} loading={busy === 'pass'} disabled={!!busy} onClick={pass}>{t('Pass')}</Button>
                <InterestButton candidate={current} className="grow" />
                <ShortlistButton candidate={current} />
              </div>
              <div className="row">
                <Button className="grow" variant="secondary" icon={ClipboardList} onClick={() => setViewing(current)}>{t('Why we matched · full profile')}</Button>
                <Button className="grow" variant="soft" icon={Users} onClick={() => setSharing([current])}>{t('Share with family')}</Button>
              </div>
            </div>
          </article>

          <aside className="card stack" style={{ '--gap': '8px' }}>
            <div className="row between">
              <span className="h3">Up next</span>
              <span className="tiny muted">{safe + 1} of {feed.length}</span>
            </div>
            {queue.length === 0 && <span className="small muted">No one else right now.</span>}
            {queue.map((c) => (
              <button key={c.id} className="queue-item" onClick={() => select(c.id)}>
                <span className="queue-thumb">{c.photos?.[0] && <img src={c.photos[0]} alt="" />}</span>
                <span className="grow">
                  <span className="h3" style={{ display: 'block' }}>{c.firstName}, {c.age}</span>
                  <span className="tiny muted">{c.city}</span>
                </span>
                <span className="h3 accent">{c.overlapScores.overall}%</span>
              </button>
            ))}
          </aside>
        </div>
      )}

      {viewing && <CandidateModal candidate={candidates.find((c) => c.id === viewing.id) || viewing} onClose={() => setViewing(null)} />}

      {sharing && <ShareModal candidates={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}
