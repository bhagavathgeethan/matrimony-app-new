import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FIELD_BY_KEY, ONBOARDING_DETAIL_KEYS, ONBOARDING_REQUIRED_KEYS, isFilled } from '@shared/profileFields';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Button, Card } from '../../components/ui/kit';
import { FieldControl, changedValues, useDetailsDraft, valuesOf } from '../../components/details/DetailsUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;
const FIELDS = ONBOARDING_DETAIL_KEYS.map((k) => FIELD_BY_KEY[k]);

// Short "about you" step; the full profile is completed after sign-up from Me → Personal details
export const PersonalOnboardingScreen = () => {
  const { setCurrentScreen, user, updateDetails } = useApp();
  const original = valuesOf(user);
  const [draft, set] = useDetailsDraft(FIELDS, original);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const complete = ONBOARDING_REQUIRED_KEYS.every((k) => isFilled(draft[k]));

  const handleNext = async () => {
    if (!complete || saving) return;
    const changes = changedValues(FIELDS, draft, original);
    if (Object.keys(changes).length) {
      setSaving(true);
      setError(null);
      const res = await updateDetails(changes);
      setSaving(false);
      if (!res.ok) return setError(res.error);
    }
    setCurrentScreen(user?.onboarding?.completed ? 'personal-details' : 'blueprint-intro');
  };

  return (
    <OnboardingScreen
      top={<StepBar step={3} total={5} />}
      footer={
        <>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.notice}>{t('Religion has “Prefer not to say”. Education and occupation are optional.')}</Text>
          )}
          <Button label={saving ? t('Saving…') : t('Next — the blueprint')} disabled={!complete || saving} onPress={handleNext} />
        </>
      }
    >
      <FadeIn>
        <View style={{ gap: 8 }}>
          <Eyebrow>{t('Step 03 / 05 · About you')}</Eyebrow>
          <Heading size={32}>
            {t('A little')}{' '}<Accent>{t('about you')}</Accent>
          </Heading>
        </View>
      </FadeIn>
      <FadeIn delay={80}>
        <Card style={styles.grid} padding={16}>
          {FIELDS.map((f) => (
            <View key={f.key} style={styles.cell}>
              <FieldControl field={f} draft={draft} set={set} />
            </View>
          ))}
        </Card>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  notice: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
});
