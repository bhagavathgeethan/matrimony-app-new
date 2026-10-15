// Sangam-specific web components: blueprint slider, vibe grid, family share modal
import React, { useState } from 'react';
import { Check, Lock, Gauge, MapPin, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  VIBE_ART, ALL_VIBES, FLEX_BAND, SHARE_EXPIRY_OPTIONS, DEFAULT_SHARE_PERMISSIONS,
} from '@shared/constants';
import { Button, Toggle, IconBadge, Badge, Modal, cx } from './ui';
import { useStore } from '../store';

export function BlueprintSlider({ pillar, icon: Icon, value, flexibility = 'open', onChange, onFlexibility }) {
  const band = FLEX_BAND[flexibility];
  const bandLeft = Math.max(0, Math.min(100 - band, value - band / 2));
  return (
    <div className="card slider-card">
      <div className="row">
        <IconBadge icon={Icon} size={32} />
        <span className="h3 grow">{pillar.title}</span>
        <div className="segment" role="radiogroup" aria-label={`${pillar.title} flexibility`}>
          {['open', 'firm'].map((f) => (
            <button key={f} type="button" className={cx(flexibility === f && 'active')} onClick={() => onFlexibility(f)}>
              {f === 'open' ? 'Open' : 'Firm'}
            </button>
          ))}
        </div>
        <span className="value-pill">{value}</span>
      </div>
      <div className="slider-track">
        <span className="slider-rail" />
        <span className="slider-fill" style={{ width: `${value}%` }} />
        <span className="slider-band" style={{ left: `${bandLeft}%`, width: `${band}%` }} />
        <input
          className="range"
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={pillar.title}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <div className="row between tiny muted">
        <span>{pillar.low}</span>
        <span>{pillar.high}</span>
      </div>
    </div>
  );
}

export function VibeGrid({ selected = [], onToggle }) {
  return (
    <div className="vibe-grid">
      {ALL_VIBES.map((vibe) => {
        const [emoji, from, to] = VIBE_ART[vibe];
        const on = selected.includes(vibe);
        return (
          <button
            key={vibe}
            type="button"
            aria-pressed={on}
            className={cx('vibe', on && 'selected')}
            style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
            onClick={() => onToggle(vibe)}
          >
            <span className="vibe-emoji">{emoji}</span>
            <span className="vibe-label">{vibe}</span>
            <span className="vibe-check">{on && <Check size={12} strokeWidth={3} />}</span>
          </button>
        );
      })}
    </div>
  );
}

const STATUS_NOTE = {
  linked: ['linked', 'Read-only card, approve or flag'],
  invited: ['invite sent', 'They’ll see it once they open your invite link'],
};

// Share one or more candidates with a family member, with scoped permissions and expiry
export function ShareModal({ candidates, onClose, onShared }) {
  const { familyLinks, shareWithFamily } = useStore();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState((familyLinks.find((l) => l.status === 'linked') || familyLinks[0])?.id || null);
  const [expiresIn, setExpiresIn] = useState('30d');
  const [note, setNote] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_SHARE_PERMISSIONS);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const single = candidates.length === 1 ? candidates[0] : null;

  const perms = [
    ['showBlueprintScore', Gauge, 'Blueprint score & pillars', candidates.map((c) => `${c.overlapScores?.overall ?? '—'}%`).join(' · ')],
    ['showFirstNameCity', MapPin, 'First name & city', single ? `${single.firstName} · ${single.city}` : candidates.map((c) => c.firstName).join(', ')],
    ['showPhoto', ImageIcon, 'Photo', permissions.showPhoto ? 'Visible to them' : 'Blurred until you allow it'],
  ];

  const send = async () => {
    setSending(true);
    setError(null);
    const res = await shareWithFamily({ candidateIds: candidates.map((c) => c.id), familyLinkId: recipient, expiresIn, note, permissions });
    setSending(false);
    if (!res.ok) return setError(res.error);
    onShared?.(res.data);
    onClose();
  };

  return (
    <Modal
      title={<>Share {single ? single.firstName : `${candidates.length} profiles`} with <span className="accent">your family?</span></>}
      onClose={onClose}
    >
      <p className="lede" style={{ fontSize: 14.5 }}>They get a read-only card. You stay in control of everything below.</p>

      <div className="label">Send to</div>
      <div className="stack" style={{ '--gap': '8px' }}>
        {familyLinks.map((link) => {
          const [status, sub] = STATUS_NOTE[link.status] || STATUS_NOTE.invited;
          const active = recipient === link.id;
          return (
            <button key={link.id} type="button" className={cx('recipient', active && 'active')} onClick={() => setRecipient(link.id)}>
              <span className="avatar" style={{ width: 40, height: 40, background: active ? 'var(--g-primary)' : undefined, color: active ? '#fff' : undefined }}>{link.avatarChar}</span>
              <span className="grow">
                <span className="h3" style={{ display: 'block' }}>{link.name} · {status}</span>
                <span className="small muted">{sub}</span>
              </span>
              <span className={cx('checkbox', active && 'on')}>{active && <Check size={13} strokeWidth={3} />}</span>
            </button>
          );
        })}
        {familyLinks.length === 0 && (
          <div className="card tinted stack" style={{ '--gap': '10px' }}>
            <span className="small">Add a family member first — they’ll get a private link by SMS.</span>
            <Button variant="secondary" size="sm" onClick={() => { onClose(); navigate('/family'); }}>Add family member</Button>
          </div>
        )}
      </div>

      <div className="label">What they can see</div>
      <div className="card flush">
        {perms.map(([key, Icon, title, desc], i) => (
          <React.Fragment key={key}>
            {i > 0 && <div className="divider" style={{ margin: '0 14px' }} />}
            <div className="setting-row">
              <IconBadge icon={Icon} size={34} tone={permissions[key] ? undefined : 'neutral'} />
              <span className="grow">
                <span className="h3" style={{ display: 'block', fontSize: 14.5 }}>{title}</span>
                <span className="tiny muted">{desc}</span>
              </span>
              <Toggle label={title} value={permissions[key]} onChange={() => setPermissions((p) => ({ ...p, [key]: !p[key] }))} />
            </div>
          </React.Fragment>
        ))}
        <div className="divider" style={{ margin: '0 14px' }} />
        <div className="setting-row">
          <IconBadge icon={Lock} size={34} tone="neutral" />
          <span className="grow">
            <span className="h3 muted" style={{ display: 'block', fontSize: 14.5 }}>Phone, email, chats</span>
            <span className="tiny muted">Never shareable</span>
          </span>
          <Badge tone="neutral" icon={Lock}>Locked</Badge>
        </div>
      </div>

      <label className="field">
        <span className="label">Add a note (optional)</span>
        <textarea className="input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Why this one feels right…" />
      </label>

      <div className="row between">
        <span className="h3">Access expires in</span>
        <div className="segment">
          {SHARE_EXPIRY_OPTIONS.map(([value, label]) => (
            <button key={value} type="button" className={cx(expiresIn === value && 'active')} onClick={() => setExpiresIn(value)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div className="error-text center">{error}</div>}
      <Button block loading={sending} disabled={sending || !recipient} onClick={send}>Forward to family</Button>
    </Modal>
  );
}
