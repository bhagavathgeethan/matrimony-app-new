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

  const Locked = ({ count, what }) => (
    <div className="card dark stack" style={{ '--gap': '12px', alignItems: 'flex-start', padding: 26 }}>
      <span className="row h2" style={{ color: '#fff', '--gap': '10px' }}><Lock size={20} color="var(--gold)" /> {count} {count === 1 ? 'person' : 'people'} {what}</span>
      <span style={{ color: 'rgba(255,246,238,0.8)' }}>See who they are — and reach out first — with Sangam Premium.</span>
      <Link to="/premium" className="btn btn-gold sm"><Crown size={15} /> See Premium</Link>
    </div>
  );

  const People = ({ list, empty, label }) => (list?.length
    ? (
      <div className="browse-grid">
        {list.map((c) => <ProfileTile key={`${label}-${c.id}`} c={c} onOpen={() => setOpen(c.id)} footer={c.when ? <span className="tiny muted">{label} {c.when}</span> : null} />)}
      </div>
    )
    : <Empty icon={label === 'Viewed' ? Eye : Star} title={empty} />);

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">Shortlist</span>
          <h1 className="h1">{t('People you’re considering')}</h1>
        </div>
      </div>
      <div className="tabs" role="tablist" style={{ maxWidth: 560 }}>
        {[
          ['shortlist', `My shortlist (${shortlist.length})`],
          ['views', `Viewed me (${admirers?.views.count ?? 0})`],
          ['shortlisted', `Shortlisted me (${admirers?.shortlists.count ?? 0})`],
        ].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'shortlist' && <People list={shortlist} empty="Tap the star on any profile to keep it here." label="Shortlisted" />}
      {tab === 'views' && (admirers && !admirers.premium && admirers.views.count > 0
        ? <Locked count={admirers.views.count} what="viewed your profile in the last 30 days" />
        : <People list={admirers?.views.people} empty="No profile views in the last 30 days." label="Viewed" />)}
      {tab === 'shortlisted' && (admirers && !admirers.premium && admirers.shortlists.count > 0
        ? <Locked count={admirers.shortlists.count} what="shortlisted you" />
        : <People list={admirers?.shortlists.people} empty="Nobody has shortlisted you yet." label="Shortlisted" />)}

      {current && <CandidateModal candidate={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
