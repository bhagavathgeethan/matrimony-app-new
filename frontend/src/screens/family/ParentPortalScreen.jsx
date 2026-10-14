import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Shield, Lock, Check, AlertCircle } from 'lucide-react';

export const ParentPortalScreen = () => {
  const { sentRecords, recordParentFeedback, user } = useApp();

  const handleApprove = (shareId) => {
    recordParentFeedback(shareId, 'approved', '“Sensible about money. Ask about his posting in Pune.”');
  };

  const handleRaiseConcern = (shareId) => {
    recordParentFeedback(shareId, 'concern_raised', '“He wants to move abroad. Are you sure?”');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Top Read-Only Crimson Banner */}
      <View style={styles.topBanner}>
        <Text style={styles.bannerTag}>PARENT VIEW · READ ONLY</Text>
        <Text style={styles.bannerSub}>Shared by {user?.firstName || 'Ananya'}</Text>
      </View>

      {/* Headline & Explanation */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Two profiles await{'\n'}your view</Text>
        <Text style={styles.subtitle}>
          Your daughter chose to show you these. You can note approval or raise a concern — she decides what happens next.
        </Text>
      </View>

      {/* Forwarded Profile Cards */}
      <View style={styles.cardsList}>
        {sentRecords.map((record) => (
          <View key={record.id} style={styles.parentCard}>
            {/* Header row: blurred portrait, name, score */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.blurredAvatar}>
                <Text style={styles.blurredText}>BLURRED</Text>
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardName}>
                  {record.candidateName}, {record.candidateAge}
                </Text>
                <Text style={styles.cardMeta}>{record.candidateCity} · ID verified</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreNum}>{record.overlapScore}%</Text>
                <Text style={styles.scoreLabel}>ALIGNED</Text>
              </View>
            </View>

            {/* 4 Pillars Assessment breakdown */}
            <View style={styles.pillarsBreakdown}>
              <View style={styles.pillarRow}>
                <Text style={styles.pillarName}>Money philosophy</Text>
                <Text style={styles.pillarMatchCrimson}>Strong match</Text>
              </View>
              <View style={styles.pillarRow}>
                <Text style={styles.pillarName}>Roots & geography</Text>
                <Text style={styles.pillarMatchCrimson}>Strong match</Text>
              </View>
              <View style={styles.pillarRow}>
                <Text style={styles.pillarName}>Kids & parenting</Text>
                <Text style={styles.pillarMatchSand}>Close enough</Text>
              </View>
              <View style={styles.pillarRow}>
                <Text style={styles.pillarName}>Career ambition</Text>
                <Text style={styles.pillarMatchMuted}>Worth a talk</Text>
              </View>
            </View>

            {/* Masked Contact Notice */}
            <View style={styles.maskedNotice}>
              <Lock size={12} color="#5E5E5E" />
              <Text style={styles.maskedText}>
                Phone, email and chats are hidden from this view.
              </Text>
            </View>

            {/* Parent Feedback State or Interactive Buttons */}
            {record.status === 'approved' ? (
              <View style={styles.approvedPillBox}>
                <View style={styles.approvedPill}>
                  <Text style={styles.approvedPillText}>You approved</Text>
                </View>
                <Text style={styles.approvedTimestamp}>2 days ago · awaiting {user?.firstName || 'Ananya'}</Text>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => handleRaiseConcern(record.id)}
                  style={styles.concernBtn}
                >
                  <Text style={styles.concernBtnText}>Raise a concern</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleApprove(record.id)}
                  style={styles.approveBtn}
                >
                  <Text style={styles.approveBtnText}>I approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Parental Sandbox Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          Parents cannot search, message, or browse other profiles. Access ends when {user?.firstName || 'Ananya'} revokes it.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 28,
  },
  topBanner: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 11,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.white,
  },
  bannerSub: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 248, 242, 0.8)',
  },
  headerGroup: {
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  cardsList: {
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  parentCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#F0E7DA',
    borderRadius: 22,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  blurredAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#E7DACA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurredText: {
    fontFamily: theme.fonts.mono,
    fontSize: 8,
    letterSpacing: 0.6,
    color: '#A8927F',
  },
  cardHeaderInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  cardName: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  cardMeta: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  scoreBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreNum: {
    fontFamily: theme.fonts.sans,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  scoreLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: '#9E8877',
    fontWeight: '500',
  },
  pillarsBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 2,
  },
  pillarRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarName: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B3833',
  },
  pillarMatchCrimson: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  pillarMatchSand: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7A675C',
  },
  pillarMatchMuted: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#96806F',
  },
  maskedNotice: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#F0E7DA',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maskedText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: '#9E8877',
    fontWeight: '500',
  },
  approvedPillBox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 4,
  },
  approvedPill: {
    backgroundColor: theme.colors.surfaceDark,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 99,
  },
  approvedPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFF6EE',
  },
  approvedTimestamp: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: '#96806F',
  },
  actionsRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  concernBtn: {
    flex: 1,
    backgroundColor: '#F0E7DA',
    borderRadius: 12,
    paddingVertical: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concernBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B3833',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    fontWeight: '800',
    color: theme.colors.white,
  },
  disclaimerBox: {
    paddingHorizontal: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#A8927F',
    textAlign: 'center',
  },
});
