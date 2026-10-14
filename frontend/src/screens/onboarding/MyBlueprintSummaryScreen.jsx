import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { PillarBar } from '../../components/blueprint/PillarBar';

export const MyBlueprintSummaryScreen = () => {
  const { setCurrentScreen, user } = useApp();

  const bp = user?.blueprint || {
    money: 72,
    roots: 31,
    kids: 58,
    ambition: 84,
    summaryText:
      'In short: a saver who’d move cities for the right role, wants kids within a few years, and won’t apologise for ambition.',
    profileStrength: 86,
  };

  const photo =
    user?.photos?.[0] ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={styles.title}>My blueprint</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('blueprint-tuner')}>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <View style={styles.mainCard}>
        {/* User Info Header */}
        <View style={styles.userRow}>
          <Image source={{ uri: photo }} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.firstName || 'Ananya'}, {user?.age || 29}
            </Text>
            <Text style={styles.userSub}>
              {user?.city || 'Bengaluru'} · verified · blueprint complete
            </Text>
          </View>
        </View>

        {/* 4 Pillars Bars */}
        <View style={styles.pillarsGrid}>
          <PillarBar label="Money" value={bp.money} showValue={false} />
          <PillarBar label="Roots" value={bp.roots} showValue={false} />
          <PillarBar label="Kids" value={bp.kids} showValue={false} />
          <PillarBar label="Ambition" value={bp.ambition} showValue={false} />
        </View>

        {/* Synthesis Quote Card */}
        <View style={styles.archetypeCard}>
          <Text style={styles.archetypeText}>
            In short:{' '}
            <Text style={styles.archetypeBold}>
              a saver who’d move cities for the right role, wants kids within a few years, and won’t apologise for ambition.
            </Text>
          </Text>
        </View>
      </View>

      {/* Your Vibes Section */}
      <View style={styles.vibesSection}>
        <Text style={styles.vibesHeader}>YOUR VIBES</Text>
        <View style={styles.vibesPillsRow}>
          {(user?.vibes || [
            'Temple mornings',
            'Cooking together',
            'Quiet weekends',
            'Dogs everywhere',
          ]).map((vibe, idx) => (
            <View key={idx} style={styles.vibePill}>
              <Text style={styles.vibePillText}>{vibe}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Profile Strength Card */}
      <View style={styles.strengthCard}>
        <View style={styles.strengthInfo}>
          <Text style={styles.strengthTitle}>Profile strength</Text>
          <Text style={styles.strengthDesc}>Add one more photo to reach 100%</Text>
        </View>
        <Text style={styles.strengthScore}>{bp.profileStrength || 86}%</Text>
      </View>

      {/* See Matches Action */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setCurrentScreen('feed')}
        style={styles.feedBtn}
      >
        <Text style={styles.feedBtnText}>Explore Aligned Matches</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  topHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    color: theme.colors.textPrimary,
  },
  editBtn: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  mainCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 20,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  userRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userAvatar: {
    width: 62,
    height: 62,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E7DACA',
  },
  userDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  userName: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  userSub: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  pillarsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  archetypeCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderRadius: 13,
    padding: 13,
  },
  archetypeText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4B3833',
  },
  archetypeBold: {
    fontWeight: '700',
  },
  vibesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  vibesHeader: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  vibesPillsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  vibePill: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 99,
  },
  vibePillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: '#4B3833',
  },
  strengthCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    padding: 15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  strengthTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  strengthDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
  },
  strengthScore: {
    fontFamily: theme.fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  feedBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  feedBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
