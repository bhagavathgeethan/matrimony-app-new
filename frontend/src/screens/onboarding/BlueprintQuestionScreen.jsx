import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ChevronLeft } from 'lucide-react';

export const BlueprintQuestionScreen = () => {
  const { setCurrentScreen, updateBlueprint } = useApp();

  const [selectedOption, setSelectedOption] = useState(0);
  const [dealbreakerAcceptsDiff, setDealbreakerAcceptsDiff] = useState('yes');

  const options = [
    {
      title: 'Straight into investments',
      desc: 'The plan doesn’t change for a windfall',
      score: 72,
    },
    {
      title: 'Split it — half saved, half enjoyed',
      desc: 'A trip, and the rest to the fund',
      score: 55,
    },
    {
      title: 'Family first — parents, siblings',
      desc: 'Obligations before personal goals',
      score: 65,
    },
    {
      title: 'Spend it on living well now',
      desc: 'Life is short and money returns',
      score: 30,
    },
  ];

  const handleNext = () => {
    updateBlueprint({
      money: options[selectedOption].score,
      moneyFlexibility: dealbreakerAcceptsDiff === 'yes' ? 'open' : 'firm',
    });
    // Navigate to Blueprint Tuner
    setCurrentScreen('blueprint-tuner');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Top Header with Progress Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('blueprint-intro')}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
        <Text style={styles.progressCounter}>1/4</Text>
      </View>

      {/* Question Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.pillarTag}>MONEY PHILOSOPHY</Text>
        <Text style={styles.questionTitle}>
          A ₹3 lakh bonus lands. What actually happens?
        </Text>
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        {options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.88}
              onPress={() => setSelectedOption(idx)}
              style={[
                styles.optionCard,
                isSelected ? styles.optionCardActive : styles.optionCardInactive,
              ]}
            >
              <View
                style={[
                  styles.radioDot,
                  isSelected ? styles.radioDotActive : styles.radioDotInactive,
                ]}
              />
              <View style={styles.optionDetails}>
                <Text
                  style={[
                    styles.optionTitle,
                    isSelected ? styles.optionTitleActive : styles.optionTitleInactive,
                  ]}
                >
                  {opt.title}
                </Text>
                <Text
                  style={[
                    styles.optionDesc,
                    isSelected ? styles.optionDescActive : styles.optionDescInactive,
                  ]}
                >
                  {opt.desc}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dealbreaker Card */}
      <View style={styles.dealbreakerCard}>
        <Text style={styles.dealbreakerText}>
          Could you live with someone who answered differently?
        </Text>
        <View style={styles.dealbreakerButtons}>
          <TouchableOpacity
            onPress={() => setDealbreakerAcceptsDiff('yes')}
            style={[
              styles.dealbreakerBtn,
              dealbreakerAcceptsDiff === 'yes'
                ? styles.dealbreakerBtnActive
                : styles.dealbreakerBtnInactive,
            ]}
          >
            <Text
              style={[
                styles.dealbreakerBtnText,
                dealbreakerAcceptsDiff === 'yes'
                  ? styles.dealbreakerBtnTextActive
                  : styles.dealbreakerBtnTextInactive,
              ]}
            >
              Yes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDealbreakerAcceptsDiff('no')}
            style={[
              styles.dealbreakerBtn,
              dealbreakerAcceptsDiff === 'no'
                ? styles.dealbreakerBtnActive
                : styles.dealbreakerBtnInactive,
            ]}
          >
            <Text
              style={[
                styles.dealbreakerBtnText,
                dealbreakerAcceptsDiff === 'no'
                  ? styles.dealbreakerBtnTextActive
                  : styles.dealbreakerBtnTextInactive,
              ]}
            >
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleNext}
        style={styles.nextBtn}
      >
        <Text style={styles.nextBtnText}>Next question</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  topBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#EFE4D4',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '25%',
    backgroundColor: theme.colors.accent,
    borderRadius: 99,
  },
  progressCounter: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    color: '#96806F',
    fontWeight: '500',
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pillarTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  questionTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 29,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  optionCard: {
    borderRadius: 16,
    padding: 15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  optionCardActive: {
    backgroundColor: theme.colors.accent,
  },
  optionCardInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 99,
  },
  radioDotActive: {
    borderWidth: 2,
    borderColor: theme.colors.white,
    backgroundColor: theme.colors.white,
  },
  radioDotInactive: {
    borderWidth: 2,
    borderColor: '#DDCDB9',
  },
  optionDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  optionTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTitleActive: {
    color: theme.colors.white,
  },
  optionTitleInactive: {
    color: theme.colors.textPrimary,
  },
  optionDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  optionDescActive: {
    color: 'rgba(255, 248, 242, 0.85)',
  },
  optionDescInactive: {
    color: '#96806F',
  },
  dealbreakerCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    padding: 13,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dealbreakerText: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B3833',
    lineHeight: 17,
  },
  dealbreakerButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
  },
  dealbreakerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  dealbreakerBtnActive: {
    backgroundColor: theme.colors.accent,
  },
  dealbreakerBtnInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  dealbreakerBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
  },
  dealbreakerBtnTextActive: {
    color: theme.colors.white,
  },
  dealbreakerBtnTextInactive: {
    color: theme.colors.textSecondary,
  },
  nextBtn: {
    marginTop: 'auto',
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
