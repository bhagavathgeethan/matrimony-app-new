import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const BlueprintIntroScreen = () => {
  const { setCurrentScreen } = useApp();

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.stepTag}>STEP 03 / 04 · BLUEPRINT</Text>
        <Text style={styles.title}>
          Four questions that{'\n'}decide the{' '}
          <Text style={styles.titleItalic}>next 40 years</Text>
        </Text>
        <Text style={styles.subtitle}>
          Most marriages don’t strain over hobbies. They strain over money, where you live, kids, and whose career bends.
        </Text>
      </View>

      {/* 4 Pillars List */}
      <View style={styles.pillarsList}>
        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>01</Text>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarTitle}>Money philosophy</Text>
            <Text style={styles.pillarDesc}>Saving, spending, joint or separate</Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>02</Text>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarTitle}>Roots & geography</Text>
            <Text style={styles.pillarDesc}>Same city as parents, or the world</Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>03</Text>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarTitle}>Kids & parenting</Text>
            <Text style={styles.pillarDesc}>Whether, when, and who slows down</Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>04</Text>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarTitle}>Career ambition</Text>
            <Text style={styles.pillarDesc}>How much work is allowed to take</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerGroup}>
        <Text style={styles.timeNote}>About 4 minutes. You can revise any answer later.</Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setCurrentScreen('blueprint-q1')}
          style={styles.beginBtn}
        >
          <Text style={styles.beginBtnText}>Begin</Text>
        </TouchableOpacity>
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
    gap: 18,
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 34,
    color: theme.colors.textPrimary,
  },
  titleItalic: {
    fontStyle: 'italic',
    color: theme.colors.accent,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  pillarsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  pillarCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pillarNumber: {
    width: 22,
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  pillarInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  pillarTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  pillarDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
  },
  footerGroup: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  timeNote: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
    textAlign: 'center',
  },
  beginBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
