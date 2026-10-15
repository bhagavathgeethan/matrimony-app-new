// Design tokens — "Editorial Luxe": wine & ivory with a champagne-gold accent
export const theme = {
  colors: {
    accent: '#A81E3C', // Signature crimson
    primary: '#A81E3C',
    accentDeep: '#6E1028', // Wine, for gradients and dark surfaces
    accentSoft: '#F6E3E6', // Blush tint behind crimson elements
    gold: '#C9A25C', // Champagne gold highlight
    goldSoft: '#F4EAD5',
    bg: '#FBF7F1', // Warm ivory canvas
    bgDeep: '#F3EDE3',
    card: '#FFFFFF',
    cardSecondary: '#F8F3EC',
    cardBorder: '#EDE3D6',
    borderLight: '#F2EBE1',
    textPrimary: '#23140F',
    textSecondary: '#6F5E55',
    textMuted: '#8E7B70',
    textSubtle: '#A39083',
    textLight: '#B9A899',
    textDisabled: '#CDBFB2',
    surfaceDark: '#2B1714', // Espresso
    white: '#FFFFFF',
    onDark: '#FFF6EE',
    success: '#2E7D63',
    successSoft: '#E3F2EC',
    warning: '#C2551F',
    warningSoft: '#FBEADF',
    overlay: 'rgba(35, 20, 15, 0.45)',
  },
  gradients: {
    hero: 'linear-gradient(160deg, #3A0B18 0%, #6E1028 42%, #A81E3C 100%)',
    primary: 'linear-gradient(135deg, #B8243F 0%, #8E1832 100%)',
    gold: 'linear-gradient(135deg, #E3C68A 0%, #C9A25C 55%, #A8813F 100%)',
    blush: 'linear-gradient(180deg, #FFFFFF 0%, #FBF1EC 100%)',
    photoFade: 'linear-gradient(180deg, rgba(20,8,6,0) 35%, rgba(20,8,6,0.55) 68%, rgba(20,8,6,0.92) 100%)',
    ivory: 'linear-gradient(180deg, #FBF7F1 0%, #F6EEE4 100%)',
  },
  // One typeface for the whole app (bundled, so it also works offline in the APK)
  fonts: {
    sans: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    full: 9999,
  },
  shadows: {
    card: '0 1px 2px rgba(60, 30, 20, 0.04), 0 8px 24px rgba(60, 30, 20, 0.07)',
    raised: '0 2px 4px rgba(60, 30, 20, 0.05), 0 18px 40px rgba(60, 30, 20, 0.14)',
    glow: '0 10px 30px rgba(168, 30, 60, 0.35)',
    modal: '0 -24px 60px rgba(35, 20, 15, 0.22)',
    floatingBar: '0 12px 32px rgba(35, 20, 15, 0.22)',
  },
};
