import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { VibeTileGrid } from '../../components/vibes/VibeTileGrid';
import { OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Body, Button } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, gradients } = theme;

export const ValuesVibesPickerScreen = () => {
  const { setCurrentScreen, user, toggleVibe } = useApp();
  const selectedCount = user?.vibes?.length ?? 0;

  return (
    <OnboardingScreen
      top={<StepBar step={5} total={5} />}
      footer={
        <View style={styles.actions}>
          <Button label={t('Skip')} variant="secondary" style={{ flex: 1 }} onPress={() => setCurrentScreen('photos')} />
          <Button
            label={user?.onboarding?.completed ? t('Done') : t('Next · photos')}
            style={{ flex: 2 }}
            onPress={() => setCurrentScreen(user?.onboarding?.completed ? 'blueprint-summary' : 'photos')}
          />
        </View>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Step 05 / 05 · Vibes')}</Eyebrow>
          <Heading size={32}>
            {t('Six that feel like your')}{' '}<Accent>{t('Sunday')}</Accent>
          </Heading>
          <Body size={13.5}>{t('Visual, not verbal — the texture of daily life.')}</Body>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{t('Chosen {selectedCount} of 6', { selectedCount })}</Text>
          <View style={styles.dots}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.dot, i < selectedCount && styles.dotOn]} />
            ))}
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <VibeTileGrid selectedVibes={user?.vibes || []} onToggleVibe={toggleVibe} />
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 16,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
  },
  dotOn: {
    backgroundImage: gradients.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
