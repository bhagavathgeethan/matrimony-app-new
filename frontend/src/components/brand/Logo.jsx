// 3Knot brand mark: a pure-gold Tamil thaali; its three beads stand for the three knots (moondru mudichu)
import React, { useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APP_NAME, APP_FULL_NAME, APP_NAME_SUFFIX, APP_TAGLINE, LOGO_PATHS as L } from '@shared/constants';
import { theme } from '../../theme/tokens';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

export { APP_NAME, APP_FULL_NAME, APP_NAME_SUFFIX, APP_TAGLINE };

// animated: the gold outline draws, the pendant fills and its bail drops on, the three beads are set one by
// one, then a glint runs across it (CSS in index.html, classes tk-*)
// Gradient and clip ids must be unique per mark on the page
const useMarkIds = () => {
  const id = useId().replace(/:/g, '');
  return { gold: `tk-gold-${id}`, shine: `tk-shine-${id}`, band: `tk-band-${id}`, clip: `tk-clip-${id}` };
};

export const LogoMark = ({ size = 48, variant = 'onLight', badge = false, animated = false }) => {
  const ids = useMarkIds();
  const px = badge ? size * 0.74 : size;
  const mark = (
    <svg width={px} height={px} viewBox={L.viewBox} className={animated ? 'tk-tie' : undefined} role="img" aria-label={`${APP_FULL_NAME} logo`}>
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

  if (!badge) return mark;
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size * 0.3 },
      ]}
    >
      {mark}
    </View>
  );
};

export const Wordmark = ({ size = 22, color = colors.textPrimary, tagline = false, taglineColor }) => (
  <View style={{ gap: size * 0.12 }}>
    <Text style={[styles.word, { fontSize: size, color }]}>{APP_NAME}</Text>
    {tagline && (
      <Text style={[styles.tagline, { fontSize: Math.max(10, size * 0.36), color: taglineColor || color }]}>
        {t(APP_TAGLINE)}
      </Text>
    )}
  </View>
);

// Mark + name side by side, for headers; the name is lettered in gold (deeper gold on light backgrounds)
export const Lockup = ({ size = 32, variant = 'onLight', color }) => (
  <View style={styles.lockup}>
    <LogoMark size={size} variant={variant} badge={variant === 'onLight'} />
    <span
      className={color ? undefined : variant === 'onDark' ? 'tk-gold-text' : 'tk-gold-text-deep'}
      style={{ fontFamily: fonts.sans, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.2, fontSize: size * 0.62, color }}
    >
      {APP_NAME}
    </span>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'linear-gradient(150deg, #4A0C1C 0%, #8E1832 100%)',
    boxShadow: '0 8px 20px rgba(110, 16, 40, 0.35)',
  },
  word: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
