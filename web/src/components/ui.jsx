// Web UI primitives (DOM + CSS classes from styles/global.css)
import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { APP_NAME, APP_FULL_NAME, APP_NAME_SUFFIX, APP_TAGLINE, LOGO_PATHS } from '@shared/constants';
import { t } from '@shared/i18n';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

// 3Knot mark: a pure-gold Tamil thaali; its three beads stand for the three knots (moondru mudichu).
// animated: the outline draws, the pendant fills, the beads are set one by one, then a glint (.tk-* in global.css)
// Gradient and clip ids must be unique per mark on the page
const useMarkIds = () => {
  const id = useId().replace(/:/g, '');
  return { gold: `tk-gold-${id}`, shine: `tk-shine-${id}`, band: `tk-band-${id}`, clip: `tk-clip-${id}` };
};

export function LogoMark({ size = 40, animated = false }) {
  const ids = useMarkIds();
  const L = LOGO_PATHS;
  return (
    <svg width={size} height={size} viewBox={L.viewBox} className={animated ? 'tk-tie' : undefined} role="img" aria-label={`${APP_FULL_NAME} logo`}>
      <defs>
        <linearGradient id={ids.gold} x1="0.15" y1="0" x2="0.85" y2="1">
          {L.gold.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </linearGradient>
        <radialGradient id={ids.shine} cx="0.38" cy="0.32" r="0.75">
          {L.shine.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
        </radialGradient>
        <linearGradient id={ids.band} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.clip}><path d={L.body} /></clipPath>
      </defs>
      <g className="tk-bail">
        <rect {...L.bail} fill={`url(#${ids.gold})`} stroke={L.edge} strokeWidth="1.2" />
        <path d={L.bailRidges} stroke={L.edge} strokeWidth="0.9" strokeOpacity="0.7" />
      </g>
      <path className="tk-body" d={L.body} pathLength="100" fill={`url(#${ids.gold})`} stroke={L.edge} strokeWidth="1.6" strokeLinejoin="round" />
      <g className="tk-detail">
        <path d={L.inner} fill="none" stroke={L.edge} strokeWidth="1.1" strokeOpacity="0.55" />
        <ellipse {...L.boss} fill={`url(#${ids.shine})`} stroke={L.edge} strokeWidth="1" />
        <path d={L.drop} fill={`url(#${ids.shine})`} stroke={L.edge} strokeWidth="0.8" />
      </g>
      {L.beads.map(([cx, cy], i) => (
        <circle key={cx} className={`tk-bead tk-bead-${i + 1}`} style={{ transformOrigin: `${cx}px ${cy}px` }} cx={cx} cy={cy} r={L.beadR} fill={`url(#${ids.shine})`} stroke={L.edge} strokeWidth="0.8" />
      ))}
      {animated && (
        <g clipPath={`url(#${ids.clip})`}>
          <g transform="skewX(-18)"><rect className="tk-glint" x="-40" y="0" width="34" height="120" fill={`url(#${ids.band})`} /></g>
        </g>
      )}
    </svg>
  );
}

export function Brand({ dark = false, tagline = true, size = 36 }) {
  return (
    <span className="brand">
      <LogoMark size={size} variant={dark ? 'onDark' : 'onLight'} />
      <span className="stack" style={{ '--gap': '1px' }}>
        <span className={cx('brand-name', dark ? 'tk-gold-text' : 'tk-gold-text-deep')}>{APP_NAME}</span>
        {tagline && <span className="brand-tag">{t(APP_TAGLINE)}</span>}
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

export function ScoreRing({ score = 0, size = 72, dark = false, label = t('ALIGNED') }) {
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
          <button className="icon-btn" onClick={onClose} aria-label={t('Close')}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoadingScreen({ leaving = false, message = t('Aligning your matches…') }) {
  return (
    <div className={cx('splash', leaving && 'leaving')} aria-busy="true">
      <LogoMark size={150} variant="onDark" animated />
      <div className="stack fade-in" style={{ '--gap': '8px', alignItems: 'center', animationDelay: '900ms' }}>
        <div className="splash-name tk-gold-text">{APP_NAME}</div>
        <div className="splash-suffix tk-gold-text">{APP_NAME_SUFFIX}</div>
        <div className="brand-tag tk-gold-text" style={{ fontSize: 12 }}>{t(APP_TAGLINE)}</div>
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
