// "Get it on Google Play" / "Download on the App Store" badges, and a compact version for the app sidebar.
// A store without a listing yet shows "Coming soon" and isn't clickable.
import React from 'react';
import { STORE_LINKS } from '@shared/constants';
import { cx } from './ui';
import { t } from '@shared/i18n';

export const STORE_URLS = {
  android: import.meta.env.VITE_PLAY_STORE_URL || STORE_LINKS.android,
  ios: import.meta.env.VITE_APP_STORE_URL || STORE_LINKS.ios,
};

// Store marks (monochrome, 24×24)
const PlayIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
  </svg>
);
const AppleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);

const STORES = [
  { key: 'android', Icon: PlayIcon, top: 'Get it on', name: 'Google Play' },
  { key: 'ios', Icon: AppleIcon, top: 'Download on the', name: 'App Store' },
];

function Badge({ store, light }) {
  const url = STORE_URLS[store.key];
  const content = (
    <>
      <store.Icon size={store.key === 'ios' ? 25 : 22} />
      <span className="store-badge-text">
        <span className="store-badge-top">{url ? t(store.top) : t('Coming soon')}</span>
        <span className="store-badge-name">{store.name}</span>
      </span>
    </>
  );
  const className = cx('store-badge', light && 'light', !url && 'soon');
  return url
    ? <a className={className} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${t(store.top)} ${store.name}`}>{content}</a>
    : <span className={className} aria-label={`${store.name} · ${t('Coming soon')}`}>{content}</span>;
}

// Full badges side by side. light: white badges for dark backgrounds.
export function StoreBadges({ light = false, className }) {
  return (
    <div className={cx('store-badges', className)}>
      {STORES.map((s) => <Badge key={s.key} store={s} light={light} />)}
    </div>
  );
}

// Compact "Get the app" row for the app sidebar
export function StoreBadgesCompact() {
  return (
    <div className="store-compact">
      <span className="tiny muted">{t('Get the app')}</span>
      <div className="row" style={{ '--gap': '6px' }}>
        {STORES.map(({ key, Icon, name }) => {
          const url = STORE_URLS[key];
          return url
            ? <a key={key} className="icon-btn sm store-compact-btn" href={url} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}><Icon size={16} /></a>
            : <span key={key} className="icon-btn sm store-compact-btn soon" aria-label={`${name} · ${t('Coming soon')}`} title={`${name} · ${t('Coming soon')}`}><Icon size={16} /></span>;
        })}
      </div>
    </div>
  );
}
