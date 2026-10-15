import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, TrendingUp, Plane, Home, Sparkles } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, TopBar, StepBar, FadeIn, Eyebrow, Heading, Button } from '../../components/ui/kit';

const { colors, fonts, gradients, radii } = theme;

const OPTIONS = [
  { title: 'Straight into investments', desc: 'The plan doesn’t change for a windfall', score: 72, icon: TrendingUp },
  { title: 'Split it — half saved, half enjoyed', desc: 'A trip, and the rest to the fund', score: 55, icon: Plane },
  { title: 'Family first — parents, siblings', desc: 'Obligations before personal goals', score: 65, icon: Home },
  { title: 'Spend it on living well now', desc: 'Life is short and money returns', score: 30, icon: Sparkles },
];

export const BlueprintQuestionScreen = () => {
  const { setCurrentScreen, updateBlueprint } = useApp();
  const [selectedOption, setSelectedOption] = useState(0);
  const [dealbreakerAcceptsDiff, setDealbreakerAcceptsDiff] = useState('yes');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    const res = await updateBlueprint({
      money: OPTIONS[selectedOption].score,
      moneyFlexibility: dealbreakerAcceptsDiff === 'yes' ? 'open' : 'firm',
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setCurrentScreen('blueprint-tuner');
  };

  return (
    <OnboardingScreen
      top={
        <>
          <TopBar
            onBack={() => setCurrentScreen('blueprint-intro')}
            title={<View style={{ flex: 1, marginHorizontal: 14 }}><StepBar step={1} total={4} /></View>}
            right={<Text style={styles.counter}>1 / 4</Text>}
          />
        </>
      }
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={saving ? 'Saving…' : 'Next question'} disabled={saving} onPress={handleNext} />
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>Money philosophy</Eyebrow>
          <Heading size={32}>A ₹3 lakh bonus lands. What actually happens?</Heading>
        </View>
      </FadeIn>

      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt, idx) => {
          const selected = selectedOption === idx;
          const Icon = opt.icon;
          return (
            <FadeIn key={opt.title} delay={60 + idx * 50}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedOption(idx)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  <Icon size={17} color={selected ? colors.white : colors.accent} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[styles.optionTitle, selected && { color: colors.white }]}>{opt.title}</Text>
                  <Text style={[styles.optionDesc, selected && { color: 'rgba(255,255,255,0.75)' }]}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <Check size={12} color={colors.accent} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </FadeIn>
          );
        })}
      </View>

      <FadeIn delay={300}>
        <View style={styles.deal}>
          <Text style={styles.dealQ}>Could you live with someone who answered differently?</Text>
          <View style={styles.segment}>
            {[['yes', 'Yes'], ['no', 'No']].map(([key, label]) => {
              const active = dealbreakerAcceptsDiff === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDealbreakerAcceptsDiff(key)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  counter: {
    width: 40,
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: colors.textMuted,
  },
  header: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionSelected: {
    backgroundImage: gradients.primary,
    borderColor: 'transparent',
    boxShadow: '0 12px 26px rgba(168, 30, 60, 0.28)',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  optionTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionDesc: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  deal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
  },
  dealQ: {
    flex: 1,
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceDark,
  },
  segmentText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.onDark,
  },
});
