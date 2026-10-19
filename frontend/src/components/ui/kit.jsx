// Shared UI kit for the "Editorial Luxe" design system
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ChevronLeft } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { t } from '@shared/i18n';
import { useBackHandler } from '../../services/backButton';

const { colors, fonts, gradients, shadows, radii } = theme;

// Staggered entrance animation (CSS keyframes in index.html)
export const FadeIn = ({ delay = 0, children, style }) => (
  <div className="mx-fade" style={{ animationDelay: `${delay}ms`, ...style }}>
    {children}
  </div>
);

export const Screen = ({ children, tabBar = false, padded = true, contentStyle, background }) => (
  <ScrollView
    style={[{ flex: 1, backgroundColor: colors.bg }, background && { backgroundImage: background }]}
    contentContainerStyle={[
      padded && styles.screenPadded,
      { paddingBottom: tabBar ? 128 : 36 },
      contentStyle,
    ]}
    showsVerticalScrollIndicator={false}
  >
    {children}
  </ScrollView>
);

// Fixed-height onboarding layout: header on top, compact body, primary action pinned to the bottom
export const OnboardingScreen = ({ top, children, footer, background, dark = false }) => (
  <View
    style={[
      styles.onboarding,
      { backgroundColor: colors.bg },
      background && { backgroundImage: background },
    ]}
  >
    {top && <View style={styles.onboardingTop}>{top}</View>}
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.onboardingBody}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
    {footer && (
      <View
        style={[
          styles.onboardingFooter,
          dark ? { borderTopColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: 'rgba(251,247,241,0.94)' },
        ]}
      >
        {footer}
      </View>
    )}
  </View>
);

export const TopBar = ({ onBack, title, right, dark = false }) => {
  useBackHandler(onBack, 'screen'); // Android Back does what the arrow does
  return (
  <View style={styles.topBar}>
    {onBack ? (
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backBtn, dark && styles.backBtnDark]}
        accessibilityLabel={t('Back')}
      >
        <ChevronLeft size={20} color={dark ? colors.onDark : colors.textPrimary} />
      </TouchableOpacity>
    ) : (
      <View style={{ width: 40 }} />
    )}
    {typeof title === 'string' ? (
      <Text style={[styles.topBarTitle, dark && { color: colors.onDark }]}>{title}</Text>
    ) : (
      title || <View />
    )}
    {right || <View style={{ width: 40 }} />}
  </View>
  );
};

export const StepBar = ({ step, total, dark = false }) => (
  <View style={styles.stepBar}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepSegment,
          { backgroundColor: dark ? 'rgba(255,255,255,0.18)' : colors.cardBorder },
          i < step && (dark ? { backgroundColor: colors.gold } : { backgroundImage: gradients.primary }),
        ]}
      />
    ))}
  </View>
);

export const Eyebrow = ({ children, color = colors.accent, style }) => (
  <Text style={[styles.eyebrow, { color }, style]}>{children}</Text>
);

// Sizes are given on the old serif scale; bold sans reads larger, so scale down ~20%
export const Heading = ({ children, size = 38, color = colors.textPrimary, style }) => {
  const px = Math.round(size * 0.8);
  return <Text style={[styles.heading, { fontSize: px, lineHeight: px * 1.14, color }, style]}>{children}</Text>;
};

// Italic serif accent inside a <Heading>
export const Accent = ({ children, color = colors.accent }) => (
  <Text style={[styles.accent, { color }]}>{children}</Text>
);

export const Body = ({ children, muted = true, size = 15, style }) => (
  <Text
    style={[
      styles.body,
      { fontSize: size, lineHeight: size * 1.55, color: muted ? colors.textSecondary : colors.textPrimary },
      style,
    ]}
  >
    {children}
  </Text>
);

export const Button = ({ label, onPress, variant = 'primary', icon: Icon, disabled, style, small }) => {
  const v = BUTTON_VARIANTS[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        small && styles.buttonSmall,
        v.container,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {Icon && <Icon size={small ? 15 : 18} color={v.text.color} strokeWidth={2.2} />}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, v.text]}>{label}</Text>
    </TouchableOpacity>
  );
};

const BUTTON_VARIANTS = {
  primary: {
    container: { backgroundImage: gradients.primary, boxShadow: shadows.glow },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
    text: { color: colors.textPrimary },
  },
  dark: {
    container: { backgroundColor: colors.surfaceDark },
    text: { color: colors.onDark },
  },
  gold: {
    container: { backgroundImage: gradients.gold, boxShadow: '0 10px 26px rgba(201, 162, 92, 0.45)' },
    text: { color: colors.surfaceDark },
  },
  light: {
    container: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
    text: { color: colors.onDark },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.accent },
  },
};

export const Card = ({ children, variant = 'default', style, padding = 20 }) => (
  <View style={[styles.card, CARD_VARIANTS[variant], { padding }, style]}>{children}</View>
);

const CARD_VARIANTS = {
  default: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight, boxShadow: shadows.card },
  tinted: { backgroundColor: colors.cardSecondary, borderWidth: 1, borderColor: colors.borderLight },
  blush: { backgroundColor: colors.accentSoft },
  gold: { backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: '#EAD9B4' },
  dark: { backgroundImage: gradients.hero, boxShadow: shadows.raised },
};

export const Chip = ({ label, active, onPress, icon: Icon, dark = false }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[
      styles.chip,
      dark && styles.chipDark,
      active && (dark ? styles.chipDarkActive : styles.chipActive),
    ]}
  >
    {Icon && <Icon size={14} color={active ? colors.white : colors.textSecondary} />}
    <Text
      style={[
        styles.chipText,
        dark && { color: 'rgba(255,246,238,0.8)' },
        active && { color: dark ? colors.surfaceDark : colors.white },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const Toggle = ({ value, onChange, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    disabled={disabled}
    onPress={() => onChange && onChange(!value)}
    style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff, disabled && { opacity: 0.55 }]}
    accessibilityRole="switch"
    accessibilityState={{ checked: !!value }}
  >
    <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
  </TouchableOpacity>
);

// Conic-gradient score ring
export const ScoreRing = ({ score = 0, size = 72, dark = false, label = t('ALIGNED') }) => {
  const inner = size - Math.max(10, size * 0.14);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `conic-gradient(${colors.gold} 0%, ${colors.accent} ${score}%, ${
          dark ? 'rgba(255,255,255,0.16)' : colors.borderLight
        } ${score}% 100%)`,
        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.35)' : shadows.card,
      }}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: dark ? 'rgba(30, 12, 10, 0.82)' : colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Text style={[styles.ringScore, { fontSize: size * 0.3, color: dark ? colors.onDark : colors.textPrimary }]}>
          {score}
          <Text style={{ fontSize: size * 0.16 }}>%</Text>
        </Text>
        {size >= 64 && (
          <Text style={[styles.ringLabel, { color: dark ? colors.gold : colors.textMuted }]}>{label}</Text>
        )}
      </View>
    </View>
  );
};

export const Avatar = ({ uri, name = '?', size = 48, blurred = false, ring = false }) => (
  <View
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      },
      ring && { borderWidth: 2, borderColor: colors.gold, padding: 2, backgroundColor: colors.card },
    ]}
  >
    {uri ? (
      <Image
        source={{ uri }}
        style={{
          width: ring ? size - 8 : size,
          height: ring ? size - 8 : size,
          borderRadius: size / 2,
          filter: blurred ? 'blur(7px) saturate(0.8)' : undefined,
          transform: blurred ? [{ scale: 1.2 }] : undefined,
        }}
      />
    ) : (
      <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>{(name || '?')[0]}</Text>
    )}
  </View>
);

const BADGE_TONES = {
  accent: [colors.accentSoft, colors.accent],
  gold: [colors.goldSoft, '#8A6A2E'],
  success: [colors.successSoft, colors.success],
  warning: [colors.warningSoft, colors.warning],
  neutral: [colors.cardSecondary, colors.textSecondary],
  dark: [colors.surfaceDark, colors.onDark],
  glass: ['rgba(20,8,6,0.45)', colors.onDark],
};

export const Badge = ({ label, tone = 'accent', icon: Icon, style }) => {
  const [bg, fg] = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, tone === 'glass' && { backdropFilter: 'blur(10px)' }, style]}>
      {Icon && <Icon size={11} color={fg} strokeWidth={2.4} />}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
};

export const IconBadge = ({ icon: Icon, tone = 'accent', size = 40 }) => {
  const [bg, fg] = BADGE_TONES[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.48} color={fg} strokeWidth={2} />
    </View>
  );
};

export const SectionLabel = ({ children, right, style }) => (
  <View style={[styles.sectionLabelRow, style]}>
    <Text style={styles.sectionLabel}>{children}</Text>
    {right}
  </View>
);

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// Labelled horizontal meter with gradient fill
export const Meter = ({ label, value, dark = false, showValue = true, muted = false }) => (
  <View style={styles.meterRow}>
    <Text style={[styles.meterLabel, dark && { color: 'rgba(255,246,238,0.8)' }]}>{label}</Text>
    <View style={[styles.meterTrack, dark && { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
      <View
        style={[
          styles.meterFill,
          { width: `${Math.max(0, Math.min(100, value))}%` },
          muted ? { backgroundColor: colors.textLight } : { backgroundImage: gradients.primary },
          dark && !muted && { backgroundImage: gradients.gold },
        ]}
      />
    </View>
    {showValue && <Text style={[styles.meterValue, dark && { color: colors.onDark }]}>{value}</Text>}
  </View>
);

const styles = StyleSheet.create({
  screenPadded: {
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 18,
  },
  onboarding: {
    height: import.meta.env.DEV ? 'calc(100vh - 30px)' : '100vh',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  onboardingTop: {
    paddingHorizontal: 22,
    paddingTop: 14,
    gap: 12,
  },
  onboardingBody: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 14,
  },
  onboardingFooter: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.card,
  },
  backBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.18)',
    boxShadow: 'none',
  },
  topBarTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 6,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  accent: {
    fontFamily: fonts.sans,
    fontWeight: '800',
  },
  body: {
    fontFamily: fonts.sans,
  },
  button: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    transitionProperty: 'transform, opacity',
    transitionDuration: '150ms',
  },
  buttonSmall: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: radii.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radii.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundImage: gradients.primary,
    borderColor: 'transparent',
    boxShadow: '0 6px 16px rgba(168, 30, 60, 0.25)',
  },
  chipDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  chipDarkActive: {
    backgroundImage: gradients.gold,
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
  },
  toggleOn: {
    backgroundImage: gradients.primary,
  },
  toggleOff: {
    backgroundColor: colors.cardBorder,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    transitionProperty: 'transform',
    transitionDuration: '200ms',
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
  ringScore: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    lineHeight: undefined,
    letterSpacing: -0.4,
  },
  ringLabel: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 1.4,
    marginTop: -2,
  },
  avatarInitial: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -0.4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meterLabel: {
    width: 74,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  meterTrack: {
    flex: 1,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 7,
  },
  meterValue: {
    width: 26,
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
