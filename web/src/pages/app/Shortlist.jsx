import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, Crown, Lock } from 'lucide-react';
import { useStore } from '../../store';
import { Empty, cx } from '../../components/ui';
import { ProfileTile } from '../../components/tiles';
import { CandidateModal } from '../../components/candidate';
import { t } from '@shared/i18n';

// My shortlist, plus who viewed and shortlisted me (people visible with Premium)
export function ShortlistPage() {
  const { shortlist, loadShortlist, admirers, loadAdmirers } = useStore();
  const [tab, setTab] = useState('shortlist');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadShortlist();
    loadAdmirers();
  }, [loadShortlist, loadAdmirers]);

  const all = [...shortlist, ...(admirers?.views.people || []), ...(admirers?.shortlists.people || [])];
  const current = open && all.find((c) => c.id === open);

  const Locked = ({ text }) => (
    <div className="card dark stack" style={{ '--gap': '12px', alignItems: 'flex-start', padding: 26 }}>
      <span className="row h2" style={{ color: '#fff', '--gap': '10px' }}><Lock size={20} color="var(--gold)" /> {text}</span>
      <span style={{ color: 'rgba(255,246,238,0.8)' }}>{t('See who they are — and reach out first — with 3Knot Premium.')}</span>
      <Link to="/premium" className="btn btn-gold sm"><Crown size={15} />{' '}{t('See Premium')}</Link>
    </div>
  );

  // kind: 'viewed' or 'shortlisted' (when they did it shows under each card)
  const People = ({ list, empty, kind }) => (list?.length
    ? (
      <div className="browse-grid">
        {list.map((c) => (
          <ProfileTile key={`${kind}-${c.id}`} c={c} onOpen={() => setOpen(c.id)}
            footer={c.when ? <span className="tiny muted">{t(kind === 'viewed' ? 'Viewed {when}' : 'Shortlisted {when}', { when: t(c.when) })}</span> : null} />
        ))}
      </div>
    )
    : <Empty icon={kind === 'viewed' ? Eye : Star} title={empty} />);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">{t('Shortlist')}</span>
          <h1 className="h1">{t('People you’re considering')}</h1>
        </div>
      </div>
      <div className="tabs" role="tablist" style={{ maxWidth: 560 }}>
        {[
          ['shortlist', t('My shortlist ({n})', { n: shortlist.length })],
          ['views', t('Viewed me ({n})', { n: admirers?.views.count ?? 0 })],
          ['shortlisted', t('Shortlisted me ({n})', { n: admirers?.shortlists.count ?? 0 })],
        ].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'shortlist' && <People list={shortlist} empty={t('Tap the star on any profile to keep it here.')} kind="shortlisted" />}
      {tab === 'views' && (admirers && !admirers.premium && admirers.views.count > 0
        ? <Locked text={t(admirers.views.count === 1 ? '1 person viewed your profile in the last 30 days' : '{n} people viewed your profile in the last 30 days', { n: admirers.views.count })} />
        : <People list={admirers?.views.people} empty={t('No profile views in the last 30 days.')} kind="viewed" />)}
      {tab === 'shortlisted' && (admirers && !admirers.premium && admirers.shortlists.count > 0
        ? <Locked text={t(admirers.shortlists.count === 1 ? '1 person shortlisted you' : '{n} people shortlisted you', { n: admirers.shortlists.count })} />
        : <People list={admirers?.shortlists.people} empty={t('Nobody has shortlisted you yet.')} kind="shortlisted" />)}

      {current && <CandidateModal candidate={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
