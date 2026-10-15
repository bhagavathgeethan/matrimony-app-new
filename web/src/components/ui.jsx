// Web UI primitives (DOM + CSS classes from styles/global.css)
import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, LOGO_PATHS } from '@shared/constants';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

export function LogoMark({ size = 40, variant = 'onLight', animated = false }) {
  const gradId = useId().replace(/:/g, '');
  const palette = variant === 'onDark'
    ? { left: '#FFF3E6', right: `url(#${gradId})`, bindu: `url(#${gradId})` }
    : { left: 'var(--accent)', right: `url(#${gradId})`, bindu: 'var(--accent)' };
  return (
    <svg width={size} height={size} viewBox={LOGO_PATHS.viewBox} className={animated ? 'logo-draw' : undefined} role="img" aria-label={`${APP_NAME} logo`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          {LOGO_PATHS.gold.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </linearGradient>
      </defs>
      <path d={LOGO_PATHS.right} pathLength="100" fill="none" stroke={palette.right} strokeWidth="10" strokeLinecap="round" />
      <path d={LOGO_PATHS.left} pathLength="100" fill="none" stroke={palette.left} strokeWidth="10" strokeLinecap="round" />
      <circle cx={LOGO_PATHS.bindu.cx} cy={LOGO_PATHS.bindu.cy} r={LOGO_PATHS.bindu.r} fill={palette.bindu} />
    </svg>
  );
}

export function Brand({ dark = false, tagline = true, size = 36 }) {
  return (
    <span className="brand">
      <LogoMark size={size} variant={dark ? 'onDark' : 'onLight'} />
      <span className="stack" style={{ '--gap': '1px' }}>
        <span className="brand-name" style={{ color: dark ? 'var(--on-dark)' : 'var(--text)' }}>{APP_NAME}</span>
        {tagline && <span className="brand-tag">{APP_TAGLINE}</span>}
      </span>
    </span>
  );
}

export function Button({ variant = 'primary', size, block, icon: Icon, children, className, loading, ...props }) {
  return (
    <button className={cx('btn', `btn-${variant}`, size === 'sm' && 'sm', block && 'block', className)} {...props}>
      {loading ? <span className={cx('spinner', ['primary', 'dark', 'success'].includes(variant) && 'light')} /> : Icon && <Icon size={size === 'sm' ? 15 : 18} />}
      {children}
    </button>
  );
}

export function Toggle({ value, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      aria-label={label}
      disabled={disabled}
      className={cx('toggle', value && 'on')}
      onClick={() => onChange?.(!value)}
    >
      <span />
    </button>
  );
}

export function ScoreRing({ score = 0, size = 72, dark = false, label = 'ALIGNED' }) {
  const inner = size - Math.max(10, size * 0.14);
  return (
    <span
      className={cx('ring', dark && 'dark')}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--gold) 0%, var(--accent) ${score}%, ${dark ? 'rgba(255,255,255,0.16)' : 'var(--border-light)'} ${score}% 100%)`,
      }}
    >
      <span className="ring-inner" style={{ width: inner, height: inner }}>
        <span className="ring-score" style={{ fontSize: size * 0.28 }}>
          {score}
          <span style={{ fontSize: size * 0.15 }}>%</span>
        </span>
        {size >= 64 && <span className="ring-label">{label}</span>}
      </span>
    </span>
  );
}

export function Meter({ label, value = 0, dark = false }) {
  return (
    <div className={cx('meter', dark && 'dark')}>
      <span className="meter-label">{label}</span>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, display: 'block' }} />
      </span>
      <span className="meter-value">{value}</span>
    </div>
  );
}

export function Avatar({ src, name = '?', size = 44, ring = false }) {
  return (
    <span className={cx('avatar', ring && 'ring-gold')} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt="" /> : (name || '?')[0].toUpperCase()}
    </span>
  );
}

export const Badge = ({ tone = 'accent', icon: Icon, children }) => (
  <span className={cx('badge', tone)}>
    {Icon && <Icon size={11} strokeWidth={2.4} />}
    {children}
  </span>
);

export const IconBadge = ({ icon: Icon, tone, size = 40 }) => (
  <span className={cx('icon-badge', tone)} style={{ width: size, height: size }}>
    <Icon size={size * 0.48} />
  </span>
);

export function Modal({ title, onClose, children, width }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} style={width ? { maxWidth: width } : undefined}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="h1 grow" style={{ fontSize: 26 }}>{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoadingScreen({ leaving = false, message = 'Aligning your matches…' }) {
  return (
    <div className={cx('splash', leaving && 'leaving')} aria-busy="true">
      <LogoMark size={150} variant="onDark" animated />
      <div className="stack fade-in" style={{ '--gap': '8px', alignItems: 'center', animationDelay: '900ms' }}>
        <div className="splash-name">{APP_NAME}</div>
        <div className="brand-tag" style={{ fontSize: 12 }}>{APP_TAGLINE}</div>
      </div>
      <div className="splash-bar"><span /></div>
      <div className="small" style={{ color: 'rgba(255,246,238,0.6)' }}>{message}</div>
    </div>
  );
}

export const Empty = ({ icon: Icon, title, children }) => (
  <div className="card tinted empty">
    {Icon && <Icon size={30} color="var(--gold)" />}
    {title && <div className="h3">{title}</div>}
    {children}
  </div>
);
