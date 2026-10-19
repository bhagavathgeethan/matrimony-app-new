import React, { useEffect, useState } from 'react';
import { Sun, RotateCw } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Empty } from '../../components/ui';
import { ProfileTile } from '../../components/tiles';
import { CandidateModal, InterestButton } from '../../components/candidate';
import { t, formatDate } from '@shared/i18n';

// Today's picks: a short, curated list chosen once a day
export function TodayPage() {
  const { dailyPicks, loadDailyPicks } = useStore();
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadDailyPicks();
  }, [loadDailyPicks]);

  const picks = dailyPicks.picks || [];
  const current = open && picks.find((p) => p.id === open);
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">{t('Today · {date}', { date: formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }) })}</span>
          <h1 className="h1">{t('Your picks for today')}</h1>
          <span className="small muted">{t('Chosen each morning for how closely your blueprints align. New picks tomorrow.')}</span>
        </div>
      </div>
      {dailyPicks.status === 'loading' && picks.length === 0 && <span className="small muted">{t('Choosing your picks…')}</span>}
      {dailyPicks.status === 'error' && (
        <Empty icon={RotateCw} title={t('Couldn’t load today’s picks')}><Button size="sm" variant="soft" onClick={loadDailyPicks}>{t('Try again')}</Button></Empty>
      )}
      {dailyPicks.status === 'ready' && picks.length === 0 && (
        <Empty icon={Sun} title={t('No new picks today')}>
          <span className="small">{t('You’ve reached out to everyone who fits right now. As more people join, they’ll show up here.')}</span>
        </Empty>
      )}
      <div className="browse-grid">
        {picks.map((c) => (
          <ProfileTile
            key={c.id}
            c={c}
            onOpen={() => setOpen(c.id)}
            footer={(
              <div className="stack" style={{ '--gap': '8px', marginTop: 6 }}>
                <span className="pick-reason">{t(c.pickReason)}</span>
                <div onClick={(e) => e.stopPropagation()} role="presentation"><InterestButton candidate={c} size="sm" className="block" /></div>
              </div>
            )}
          />
        ))}
      </div>
      {current && <CandidateModal candidate={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
