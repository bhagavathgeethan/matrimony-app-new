// Sangam brand mark: two strands (two lives) flowing into one heart, with a bindu where they meet
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { APP_NAME, APP_TAGLINE, LOGO_PATHS } from '@shared/constants';
import { theme } from '../../theme/tokens';

const { colors, fonts } = theme;

export { APP_NAME, APP_TAGLINE };

const { left: LEFT, right: RIGHT } = LOGO_PATHS;

const PALETTES = {
  onDark: { left: '#FFF3E6', right: 'url(#sangam-gold)', bindu: 'url(#sangam-gold)' },
  onLight: { left: colors.accent, right: 'url(#sangam-gold)', bindu: colors.accent },
};

export const LogoMark = ({ size = 48, variant = 'onLight', badge = false, animated = false }) => {
  const p = PALETTES[variant];
  const mark = (
    <svg
      width={badge ? size * 0.68 : size}
      height={badge ? size * 0.68 : size}
      viewBox="0 0 120 120"
      className={animated ? 'mx-draw' : undefined}
      role="img"
      aria-label={`${APP_NAME} logo`}
    >
      <defs>
        <linearGradient id="sangam-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1D9A4" />
          <stop offset="55%" stopColor="#C9A25C" />
          <stop offset="100%" stopColor="#A8813F" />
        </linearGradient>
      </defs>
      <path d={RIGHT} pathLength="100" fill="none" stroke={p.right} strokeWidth="10" strokeLinecap="round" />
      <path d={LEFT} pathLength="100" fill="none" stroke={p.left} strokeWidth="10" strokeLinecap="round" />
      <circle className="mx-bindu" cx="60" cy="58" r="7.5" fill={p.bindu} />
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
        {APP_TAGLINE}
      </Text>
    )}
  </View>
);

// Mark + name side by side, for headers
export const Lockup = ({ size = 32, variant = 'onLight', color }) => (
  <View style={styles.lockup}>
    <LogoMark size={size} variant={variant} badge={variant === 'onLight'} />
    <Text style={[styles.word, { fontSize: size * 0.62, color: color || (variant === 'onDark' ? colors.onDark : colors.textPrimary) }]}>
      {APP_NAME}
    </Text>
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
