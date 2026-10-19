import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { FadeIn, Heading, Accent, Body, Button, ScoreRing } from '../../components/ui/kit';
import { LogoMark, APP_NAME, APP_TAGLINE } from '../../components/brand/Logo';
import { Capacitor } from '@capacitor/core';
import { t } from '@shared/i18n';
import { LanguagePicker } from '../../components/common/LanguagePicker';

const { colors, fonts, gradients } = theme;
const isNativeApp = Capacitor.isNativePlatform();

const PORTRAIT_LEFT = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
const PORTRAIT_RIGHT = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';

const PROMISES = [
  [Sparkles, 'Matched on values'],
  [ShieldCheck, 'DPDP private'],
  [Users, 'Family, on your terms'],
];

export const WelcomeScreen = () => {
  const { setCurrentScreen } = useApp();
  // Short phones: a smaller headline and collage so everything still fits on one screen
  const { height } = useWindowDimensions();
  const compact = height < 820;
  // Very short screens: the photo collage is decoration, so it gives way entirely
  const showCollage = height >= 700;

  return (
    <View style={styles.frame}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.container}>

      <FadeIn>
        <View style={styles.brandRow}>
          <LogoMark size={40} variant="onDark" />
          <View style={{ gap: 1 }}>
            <span className="tk-gold-text" style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 22, letterSpacing: -0.6, lineHeight: 1.2 }}>{APP_NAME}</span>
            <Text style={styles.brandTag}>{t(APP_TAGLINE)}</Text>
          </View>
        </View>
      </FadeIn>

      {/* Portrait collage with a live score ring between the two */}
      {showCollage ? (
      <FadeIn delay={120} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <View style={[styles.collage, compact && { minHeight: 130 }]}>
          <View style={[styles.portrait, styles.portraitLeft]}>
            <Image source={{ uri: PORTRAIT_LEFT }} style={styles.portraitImg} />
          </View>
          <View style={[styles.portrait, styles.portraitRight]}>
            <Image source={{ uri: PORTRAIT_RIGHT }} style={styles.portraitImg} />
          </View>
          <div className="mx-pulse" style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, marginLeft: -75, marginTop: -60, borderRadius: 75, backgroundImage: 'radial-gradient(circle, rgba(201,162,92,0.45), rgba(201,162,92,0) 70%)' }} />
          <View style={[styles.ringWrap, compact && { marginLeft: -32, marginTop: -32 }]}>
            <ScoreRing score={92} size={compact ? 64 : 92} dark />
          </View>
          {!compact && (
            <>
              <View style={[styles.floatTag, { left: 0, bottom: 6 }]}>
                <Text style={styles.floatTagText}>{t('Money · 96')}</Text>
              </View>
              <View style={[styles.floatTag, { right: 0, top: 18 }]}>
                <Text style={styles.floatTagText}>{t('Kids · 94')}</Text>
              </View>
            </>
          )}
        </View>
      </FadeIn>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <FadeIn delay={240}>
        <View style={styles.copy}>
          <Heading size={compact ? 34 : 46} color={colors.onDark}>
            {t('Marriage isn’t a')}{'\n'}
            <Accent color={colors.gold}>{t('résumé match.')}</Accent>
          </Heading>
          <Body size={compact ? 14 : 16} style={{ color: 'rgba(255,246,238,0.78)' }}>
            {t('We match on the life you want to build — money, roots, kids, ambition. Caste and salary never move your score.')}
          </Body>
          <View style={styles.promises}>
            {PROMISES.map(([Icon, label]) => (
              <View key={label} style={styles.promise}>
                <Icon size={13} color={colors.gold} />
                <Text style={styles.promiseText}>{t(label)}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={360}>
        <View style={styles.actions}>
          <LanguagePicker dark style={{ alignSelf: 'center', minWidth: 170 }} />
          <Button label={t('Create my blueprint')} variant="gold" onPress={() => setCurrentScreen('phone')} />
          <Button label={t('I already have an account')} variant="light" onPress={() => setCurrentScreen('phone')} />
          <TouchableOpacity onPress={() => setCurrentScreen('family-signin')} style={styles.familyLink} accessibilityRole="button">
            <Users size={15} color={colors.gold} />
            <Text style={styles.familyLinkText}>{t('I’m a family member')}</Text>
          </TouchableOpacity>
          <Text style={styles.legal}>
            {t('By continuing you agree to our Terms and DPDP-compliant Privacy Notice.')}
          </Text>
        </View>
      </FadeIn>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  familyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 8,
  },
  familyLinkText: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.gold,
  },
  // Exactly one screen tall: the photo collage takes whatever room the text and buttons leave, so nothing
  // needs scrolling. Only a very small screen that can't fit even that scrolls, inside this view.
  // Pinned to the visible screen (not 100vh, which some Android WebViews make taller than the screen).
  // The frame holds the background and glows and never scrolls; inside the dev preview it sits under the
  // 30px screen switcher.
  frame: {
    position: 'fixed',
    top: import.meta.env.DEV ? 30 : 0,
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: isNativeApp ? '100%' : 440,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
  },
  // The content fills the frame; only a very small screen that can't fit it scrolls, here
  container: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: 'space-between',
    gap: 16,
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
  brandTag: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  collage: {
    flex: 1,
    minHeight: 120,
    maxHeight: 440,
    position: 'relative',
    marginHorizontal: 8,
  },
  portrait: {
    position: 'absolute',
    width: '52%',
    height: '84%',
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
    top: '14%',
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
