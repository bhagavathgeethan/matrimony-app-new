// Grid tile for a member (search, today's picks, shortlist, admirers)
import React from 'react';
import { BadgeCheck, Check, Lock, Crown } from 'lucide-react';
import { cx } from './ui';
import { ShortlistButton } from './candidate';

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
            aria-label={selected ? `Deselect ${c.firstName}` : `Select ${c.firstName}`}
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
          {c.activeRecently && <span className="active-dot" title="Active today" aria-label="Active today" />}
        </span>
        <span className="small" style={{ fontWeight: 600, color: 'var(--text-2)' }}>{c.city}</span>
        {c.summaryNote && <span className="tiny muted">{c.summaryNote}</span>}
        {footer}
      </div>
    </div>
  );
}
