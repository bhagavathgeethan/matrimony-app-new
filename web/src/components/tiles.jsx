// Grid tile for a member (search, today's picks, shortlist, admirers)
import React from 'react';
import { BadgeCheck, Check, Lock, Crown } from 'lucide-react';
import { cx } from './ui';
import { ShortlistButton } from './candidate';
import { t } from '@shared/i18n';
import { summaryNote } from '@shared/constants';

export function ProfileTile({ c, onOpen, selected, onToggleSelect, footer, star = true }) {
  const score = c.overlapScores?.overall ?? 0;
  return (
    <div
      role="button"
      tabIndex={0}
      className={cx('card profile-tile fade-in', selected && 'selected')}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}
      aria-label={`${c.firstName}, ${c.age}`}
    >
      <div className="tile-photo">
        {c.photos?.[0] && <img src={c.photos[0]} alt="" />}
        {c.photoBlurred && <span className="tile-lock"><Lock size={16} /></span>}
        {onToggleSelect && (
          <button
            className={cx('tile-select', selected && 'on')}
            aria-label={selected ? t('Deselect {firstName}', { firstName: c.firstName }) : t('Select {firstName}', { firstName: c.firstName })}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          >
            {selected && <Check size={14} strokeWidth={3} />}
          </button>
        )}
        {star && <span className="tile-star"><ShortlistButton candidate={c} /></span>}
        <span className={cx('tile-score', score >= 90 && 'top')}>{score}%</span>
      </div>
      <div className="tile-info">
        <span className="row" style={{ '--gap': '5px' }}>
          <span className="h3">{c.firstName}, {c.age}</span>
          {c.verified && <BadgeCheck size={14} color="var(--gold)" />}
          {c.premium && <Crown size={13} color="var(--gold)" />}
          {c.activeRecently && <span className="active-dot" title={t('Active today')} aria-label={t('Active today')} />}
        </span>
        <span className="small" style={{ fontWeight: 600, color: 'var(--text-2)' }}>{c.city}</span>
        {c.summaryNote && <span className="tiny muted">{summaryNote(c.summaryNote)}</span>}
        {footer}
      </div>
    </div>
  );
}
