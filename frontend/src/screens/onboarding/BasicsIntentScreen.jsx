import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ban } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Button, Card, Chip } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, radii } = theme;

const GENDERS = [['woman', 'Woman'], ['man', 'Man']];
const TIMELINES = [['Marriage this year', 'This year'], ['Marriage in 1–2 years', 'In 1–2 years'], ['Open, no timeline', 'Open']];
const INVOLVEMENT = ['I decide alone', 'I consult my parents', 'Parents lead'];

const Field = ({ label, value, onChangeText, placeholder, style }) => (
  <View style={[{ gap: 6 }, style]}>
    <Text style={styles.label}>{t(label)}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      style={styles.input}
    />
  </View>
);

const ChipGroup = ({ label, options, value, onChange }) => (
  <View style={{ gap: 8 }}>
    <Text style={styles.label}>{t(label)}</Text>
    <View style={styles.chips}>
      {options.map(([key, text]) => (
        <Chip key={key} label={t(text)} active={value === key} onPress={() => onChange(key)} />
      ))}
    </View>
  </View>
);

export const BasicsIntentScreen = () => {
  const { setCurrentScreen, user, updateBasics } = useApp();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [gender, setGender] = useState(user?.gender || null);
  const [born, setBorn] = useState(user?.birthYearMonth || '');
  const [city, setCity] = useState(user?.city || '');
  const [timeline, setTimeline] = useState(user?.intentTimeline || TIMELINES[1][0]);
  const [familyInvolvement, setFamilyInvolvement] = useState(user?.familyInvolvement || INVOLVEMENT[1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const complete = firstName.trim() && gender && born.trim() && city.trim();

  const handleNext = async () => {
    if (!complete || saving) return;
    setSaving(true);
    setError(null);
    const res = await updateBasics({
      firstName: firstName.trim(),
      gender,
      birthYearMonth: born.trim(),
      city: city.trim(),
      intentTimeline: timeline,
      familyInvolvement,
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setCurrentScreen(user?.onboarding?.completed ? 'blueprint-summary' : 'personal');
  };

  return (
    <OnboardingScreen
      top={<StepBar step={2} total={5} />}
      footer={
        <>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.notice}>
              <Ban size={13} color={colors.accent} />
              <Text style={styles.noticeText}>{t('No complexion fields. Matching scores use values only.')}</Text>
            </View>
          )}
          <Button label={saving ? t('Saving…') : t('Next — about you')} disabled={!complete || saving} onPress={handleNext} />
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Step 02 / 05 · Basics')}</Eyebrow>
          <Heading size={34}>
            {t('The short version')}{' '}<Accent>{t('of you')}</Accent>
          </Heading>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card style={{ gap: 12 }} padding={16}>
          <Field label={t('First name')} value={firstName} onChangeText={setFirstName} placeholder={t('Your first name')} />
          <View style={styles.twoCol}>
            <Field label={t('Born')} value={born} onChangeText={setBorn} placeholder={t('e.g. Mar 1997')} style={{ flex: 1 }} />
            <Field label={t('Lives in')} value={city} onChangeText={setCity} placeholder={t('e.g. Bengaluru')} style={{ flex: 1 }} />
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <ChipGroup label={t('I am')} options={GENDERS} value={gender} onChange={setGender} />
      </FadeIn>
      <FadeIn delay={180}>
        <ChipGroup label={t('Hoping to marry')} options={TIMELINES} value={timeline} onChange={setTimeline} />
      </FadeIn>
      <FadeIn delay={220}>
        <ChipGroup
          label={t('Family involvement')}
          options={INVOLVEMENT.map((v) => [v, v])}
          value={familyInvolvement}
          onChange={setFamilyInvolvement}
        />
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  label: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: fonts.sans,
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  noticeText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
});
