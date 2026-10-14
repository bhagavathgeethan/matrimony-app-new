import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Sparkles, HeartHandshake } from 'lucide-react';

export const WelcomeScreen = () => {
  const { setCurrentScreen } = useApp();

  return (
    <View style={styles.container}>
      {/* Top Brand Mono Tag */}
      <Text style={styles.brandTag}>MATRIMONY</Text>

      {/* Hero Art Container */}
      <View style={styles.heroBox}>
        <View style={styles.heroCircle}>
          <HeartHandshake size={54} color={theme.colors.accent} strokeWidth={1.5} />
        </View>
        <Text style={styles.heroLabel}>HERO ILLUSTRATION · LIFE OVER RESUME</Text>
      </View>

      {/* Headline & Editorial Copy */}
      <View style={styles.copyGroup}>
        <Text style={styles.headline}>
          Marriage isn’t a{'\n'}
          <Text style={styles.headlineItalic}>résumé match.</Text>
        </Text>
        <Text style={styles.description}>
          We match on the life you want to build — money, roots, kids, ambition. No caste column. No salary slabs.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setCurrentScreen('phone')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Create my blueprint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setCurrentScreen('phone')}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={styles.dpdpNotice}>
          By continuing you agree to our Terms and DPDP-compliant Privacy Notice.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  brandTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
    color: theme.colors.accent,
  },
  heroBox: {
    height: 230,
    borderRadius: 24,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroCircle: {
    width: 90,
    height: 90,
    borderRadius: 99,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#E7DACA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1,
    color: '#A8927F',
  },
  copyGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  headline: {
    fontFamily: theme.fonts.serif,
    fontSize: 38,
    lineHeight: 40,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headlineItalic: {
    fontStyle: 'italic',
    color: theme.colors.accent,
  },
  description: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  bottomActions: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A3C2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  primaryBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
  secondaryBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  dpdpNotice: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.textSubtle,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
