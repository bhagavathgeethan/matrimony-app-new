import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Check, TrendingUp, Plane, Home, Sparkles, MapPin, Compass, Globe, Baby, Heart, Smile, Users, Rocket, Briefcase, Coffee, Sunrise,
} from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, TopBar, StepBar, FadeIn, Eyebrow, Heading, Button } from '../../components/ui/kit';
import { BLUEPRINT_QUESTIONS } from '@shared/constants';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

const ICONS = {
  TrendingUp,
  Plane,
  Home,
  Sparkles,
  MapPin,
  Compass,
  Globe,
  Baby,
  Heart,
  Smile,
  Users,
  Rocket,
  Briefcase,
  Coffee,
  Sunrise,
};

export const BlueprintQuestionScreen = () => {
  const { setCurrentScreen, user, updateBlueprint } = useApp();
  const bp = user?.blueprint || {};

  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({
    money: bp.money !== undefined ? BLUEPRINT_QUESTIONS[0].options.findIndex((o) => Math.abs(o.score - bp.money) < 15) : 0,
    roots: bp.roots !== undefined ? BLUEPRINT_QUESTIONS[1].options.findIndex((o) => Math.abs(o.score - bp.roots) < 15) : 0,
    kids: bp.kids !== undefined ? BLUEPRINT_QUESTIONS[2].options.findIndex((o) => Math.abs(o.score - bp.kids) < 15) : 0,
    ambition: bp.ambition !== undefined ? BLUEPRINT_QUESTIONS[3].options.findIndex((o) => Math.abs(o.score - bp.ambition) < 15) : 0,
  }));
  const [flexibility, setFlexibility] = useState(() => ({
    money: bp.moneyFlexibility || 'open',
    roots: bp.rootsFlexibility || 'open',
    kids: bp.kidsFlexibility || 'open',
    ambition: bp.ambitionFlexibility || 'open',
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const currentQ = BLUEPRINT_QUESTIONS[qIndex];
  const selectedOptionIdx = Math.max(0, answers[currentQ.pillar] ?? 0);
  const dealbreakerAcceptsDiff = flexibility[currentQ.pillar] === 'firm' ? 'no' : 'yes';

  const selectOption = (optIdx) => {
    setAnswers((prev) => ({ ...prev, [currentQ.pillar]: optIdx }));
  };

  const setDealbreaker = (ans) => {
    setFlexibility((prev) => ({ ...prev, [currentQ.pillar]: ans === 'yes' ? 'open' : 'firm' }));
  };

  const handleBack = () => {
    if (qIndex > 0) {
      setQIndex(qIndex - 1);
    } else {
      setCurrentScreen('blueprint-intro');
    }
  };

  const handleNext = async () => {
    if (qIndex < BLUEPRINT_QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
      return;
    }

    setSaving(true);
    setError(null);
    const payload = {};
    for (const q of BLUEPRINT_QUESTIONS) {
      const optIdx = Math.max(0, answers[q.pillar] ?? 0);
      const chosenOpt = q.options[optIdx] || q.options[0];
      payload[q.pillar] = chosenOpt.score;
      payload[`${q.pillar}Flexibility`] = flexibility[q.pillar] || 'open';
    }

    const res = await updateBlueprint(payload);
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setCurrentScreen('blueprint-tuner');
  };

  const isLastQuestion = qIndex === BLUEPRINT_QUESTIONS.length - 1;

  return (
    <OnboardingScreen
      top={
        <>
          <TopBar
            onBack={handleBack}
            title={
              <View style={{ flex: 1, marginHorizontal: 14 }}>
                <StepBar
                  step={qIndex + 1}
                  total={4}
                  onStepPress={(targetQ) => targetQ <= qIndex + 1 && setQIndex(targetQ - 1)}
                  onBack={handleBack}
                />
              </View>
            }
            right={<Text style={styles.counter}>{qIndex + 1} / 4</Text>}
          />
        </>
      }
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label={saving ? t('Saving…') : isLastQuestion ? t('Save & tune blueprint') : t('Next question')}
            disabled={saving}
            onPress={handleNext}
          />
        </>
      }
    >
      <FadeIn key={`head-${currentQ.pillar}`}>
        <View style={styles.header}>
          <Eyebrow>{t(currentQ.eyebrow)}</Eyebrow>
          <Heading size={30}>{t(currentQ.title)}</Heading>
        </View>
      </FadeIn>

      <View style={{ gap: 8 }}>
        {currentQ.options.map((opt, idx) => {
          const selected = selectedOptionIdx === idx;
          const Icon = ICONS[opt.icon] || Sparkles;
          return (
            <FadeIn key={`opt-${currentQ.pillar}-${opt.key}`} delay={60 + idx * 50}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => selectOption(idx)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  <Icon size={17} color={selected ? colors.white : colors.accent} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={[styles.optionTitle, selected && { color: colors.white }]}>{t(opt.title)}</Text>
                  <Text style={[styles.optionDesc, selected && { color: 'rgba(255,255,255,0.75)' }]}>{t(opt.desc)}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <Check size={12} color={colors.accent} strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </FadeIn>
          );
        })}
      </View>

      <FadeIn key={`deal-${currentQ.pillar}`} delay={260}>
        <View style={styles.deal}>
          <Text style={styles.dealQ}>{t(currentQ.dealbreakerLabel || 'Could you live with someone who answered differently?')}</Text>
          <View style={styles.segment}>
            {[['yes', 'Yes'], ['no', 'No']].map(([key, label]) => {
              const active = dealbreakerAcceptsDiff === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDealbreaker(key)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(label)}</Text>
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
