// Branded loading screen: the thaali thread is tied with its three knots while app data loads
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';
import { LogoMark, APP_NAME, APP_NAME_SUFFIX, APP_TAGLINE } from './Logo';
import { t } from '@shared/i18n';

const { fonts, gradients } = theme;

// Gold-lettered lines under the name (gradient text via .tk-gold-text in index.html)
const goldLine = (fontSize, letterSpacing, fontWeight) => ({
  fontFamily: fonts.sans,
  fontSize,
  fontWeight,
  letterSpacing,
  textTransform: 'uppercase',
  paddingLeft: letterSpacing,
});

export const LoadingScreen = ({ leaving = false, message = t('Aligning your matches…') }) => (
  <View style={[styles.root, leaving && styles.leaving]}>
    <View style={styles.glowTop} />
    <View style={styles.glowBottom} />

    <View style={styles.center}>
      <div className="mx-pulse" style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, background: 'radial-gradient(circle, rgba(249,200,60,0.3), rgba(249,200,60,0) 68%)' }} />
      <LogoMark size={156} variant="onDark" animated />
      <div className="mx-fade" style={{ animationDelay: '1100ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 18 }}>
        <div className="tk-gold-text" style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 44, letterSpacing: -1.2, lineHeight: 1.15 }}>{APP_NAME}</div>
        <div className="tk-gold-text" style={goldLine(13, 5.5, '700')}>{APP_NAME_SUFFIX}</div>
        <div className="tk-gold-text" style={goldLine(12, 3.2, '600')}>{t(APP_TAGLINE)}</div>
      </div>
    </View>

    <div className="mx-fade" style={{ animationDelay: '1400ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 56 }}>
      <View style={styles.track}>
        <div className="mx-shimmer" />
      </View>
      <Text style={styles.message}>{message}</Text>
    </div>
  </View>
);

const styles = StyleSheet.create({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    backgroundImage: gradients.hero,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    transitionProperty: 'opacity, transform',
    transitionDuration: '450ms',
  },
  leaving: {
    opacity: 0,
    transform: [{ scale: 1.04 }],
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundImage: 'radial-gradient(circle, rgba(210, 71, 95, 0.5), rgba(210, 71, 95, 0) 70%)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -140,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundImage: 'radial-gradient(circle, rgba(201, 162, 92, 0.2), rgba(201, 162, 92, 0) 70%)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: 140,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  message: {
    fontFamily: fonts.sans,
    fontWeight: '500',
    fontSize: 13,
    color: 'rgba(255,246,238,0.6)',
  },
});
