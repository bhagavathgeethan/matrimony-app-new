// Branded loading screen: the Sangam strands draw themselves while app data loads
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';
import { LogoMark, APP_NAME, APP_TAGLINE } from './Logo';

const { colors, fonts, gradients } = theme;

export const LoadingScreen = ({ leaving = false, message = 'Aligning your matches…' }) => (
  <View style={[styles.root, leaving && styles.leaving]}>
    <View style={styles.glowTop} />
    <View style={styles.glowBottom} />

    <View style={styles.center}>
      <div className="mx-pulse" style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, background: 'radial-gradient(circle, rgba(201,162,92,0.32), rgba(201,162,92,0) 68%)' }} />
      <LogoMark size={156} variant="onDark" animated />
      <div className="mx-fade" style={{ animationDelay: '900ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <Text style={styles.name}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </div>
    </View>

    <div className="mx-fade" style={{ animationDelay: '1200ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 56 }}>
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
  name: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 44,
    letterSpacing: -1.2,
    color: colors.onDark,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: colors.gold,
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
