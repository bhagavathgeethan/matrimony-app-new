import React, { useEffect } from 'react';
import { ShieldCheck, Ban } from 'lucide-react';
import { SAFETY_TIPS } from '@shared/engagement';
import { useStore } from '../../store';
import { Button, IconBadge } from '../../components/ui';
import { t } from '@shared/i18n';

export function SafetyPage() {
  const { blocks, loadBlocks, unblockMember } = useStore();
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('Safety centre')}</span>
        <h1 className="h1">{t('Stay safe while you meet')}</h1>
      </div>
      <div className="card flush">
        {SAFETY_TIPS.map(([title, body], i) => (
          <React.Fragment key={title}>
            {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
            <div className="setting-row" style={{ alignItems: 'flex-start' }}>
              <IconBadge icon={ShieldCheck} size={38} />
              <span className="grow"><span className="h3" style={{ display: 'block' }}>{t(title)}</span><span className="small muted">{t(body)}</span></span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="card stack">
        <span className="label">{t('Blocked members')}</span>
        {blocks.length === 0 && <span className="small muted">{t('You haven’t blocked anyone. Block or report from any profile or chat.')}</span>}
        {blocks.map((b) => (
          <div key={b.userId} className="row between">
            <span className="row" style={{ '--gap': '10px' }}><Ban size={16} color="var(--text-muted)" /> <span className="h3">{b.firstName}{b.age ? `, ${b.age}` : ''}</span> <span className="small muted">{b.city}</span></span>
            <Button size="sm" variant="secondary" onClick={() => unblockMember(b.userId)}>{t('Unblock')}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
