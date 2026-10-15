import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { FadeIn, Heading, Accent, Body, Button, ScoreRing } from '../../components/ui/kit';
import { LogoMark, APP_NAME, APP_TAGLINE } from '../../components/brand/Logo';

const { colors, fonts, gradients } = theme;

const PORTRAIT_LEFT = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
const PORTRAIT_RIGHT = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';

const PROMISES = [
  [Sparkles, 'Matched on values'],
  [ShieldCheck, 'DPDP private'],
  [Users, 'Family, on your terms'],
];

export const WelcomeScreen = () => {
  const { setCurrentScreen } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <FadeIn>
        <View style={styles.brandRow}>
          <LogoMark size={40} variant="onDark" />
          <View style={{ gap: 1 }}>
            <Text style={styles.brandName}>{APP_NAME}</Text>
            <Text style={styles.brandTag}>{APP_TAGLINE}</Text>
          </View>
        </View>
      </FadeIn>

      {/* Portrait collage with a live score ring between the two */}
      <FadeIn delay={120}>
        <View style={styles.collage}>
          <View style={[styles.portrait, styles.portraitLeft]}>
            <Image source={{ uri: PORTRAIT_LEFT }} style={styles.portraitImg} />
          </View>
          <View style={[styles.portrait, styles.portraitRight]}>
            <Image source={{ uri: PORTRAIT_RIGHT }} style={styles.portraitImg} />
          </View>
          <div className="mx-pulse" style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, marginLeft: -75, marginTop: -60, borderRadius: 75, backgroundImage: 'radial-gradient(circle, rgba(201,162,92,0.45), rgba(201,162,92,0) 70%)' }} />
          <View style={styles.ringWrap}>
            <ScoreRing score={92} size={92} dark />
          </View>
          <View style={[styles.floatTag, { left: 0, bottom: 6 }]}>
            <Text style={styles.floatTagText}>Money · 96</Text>
          </View>
          <View style={[styles.floatTag, { right: 0, top: 18 }]}>
            <Text style={styles.floatTagText}>Kids · 94</Text>
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={240}>
        <View style={styles.copy}>
          <Heading size={46} color={colors.onDark}>
            Marriage isn’t a{'\n'}
            <Accent color={colors.gold}>résumé match.</Accent>
          </Heading>
          <Body size={16} style={{ color: 'rgba(255,246,238,0.78)' }}>
            We match on the life you want to build — money, roots, kids, ambition. Caste and salary never move your score.
          </Body>
          <View style={styles.promises}>
            {PROMISES.map(([Icon, label]) => (
              <View key={label} style={styles.promise}>
                <Icon size={13} color={colors.gold} />
                <Text style={styles.promiseText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={360}>
        <View style={styles.actions}>
          <Button label="Create my blueprint" variant="gold" onPress={() => setCurrentScreen('phone')} />
          <Button label="I already have an account" variant="light" onPress={() => setCurrentScreen('phone')} />
          <Text style={styles.legal}>
            By continuing you agree to our Terms and DPDP-compliant Privacy Notice.
          </Text>
        </View>
      </FadeIn>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: import.meta.env.DEV ? 'calc(100vh - 30px)' : '100vh',
    backgroundImage: gradients.hero,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: 'space-between',
    gap: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundImage: 'radial-gradient(circle, rgba(210, 71, 95, 0.55), rgba(210, 71, 95, 0) 70%)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundImage: 'radial-gradient(circle, rgba(201, 162, 92, 0.22), rgba(201, 162, 92, 0) 70%)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.onDark,
  },
  brandTag: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  collage: {
    height: 300,
    position: 'relative',
    marginHorizontal: 8,
  },
  portrait: {
    position: 'absolute',
    width: '52%',
    height: 250,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,246,238,0.9)',
    boxShadow: '0 24px 50px rgba(0,0,0,0.45)',
  },
  portraitLeft: {
    left: 0,
    top: 0,
    transform: [{ rotate: '-6deg' }],
  },
  portraitRight: {
    right: 0,
    top: 44,
    transform: [{ rotate: '5deg' }],
  },
  portraitImg: {
    width: '100%',
    height: '100%',
  },
  ringWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -46,
    marginTop: -36,
  },
  floatTag: {
    position: 'absolute',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(12px)',
  },
  floatTagText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.onDark,
    letterSpacing: 0.6,
  },
  copy: {
    gap: 14,
  },
  promises: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  promise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  promiseText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,246,238,0.85)',
  },
  actions: {
    gap: 12,
  },
  legal: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255,246,238,0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
});
