import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../theme/tokens';
import { RadialScoreGauge } from './RadialScoreGauge';
import { PillarBar } from '../blueprint/PillarBar';
import { Users, Sparkles, MessageCircle, X } from 'lucide-react';

export const MatchCard = ({
  candidate,
  onPass,
  onStartChat,
  onShareWithParents,
}) => {
  const scores = candidate.overlapScores || {
    overall: 87,
    money: 94,
    roots: 71,
    kids: 88,
    ambition: 62,
  };

  const photo = candidate.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  return (
    <View style={styles.card}>
      {/* Portrait Header Area */}
      <View style={styles.portraitContainer}>
        <Image
          source={{ uri: photo }}
          style={styles.portraitImage}
          resizeMode="cover"
        />
        {/* Blur overlay simulating photo privacy */}
        <View style={styles.portraitBlurOverlay}>
          <Text style={styles.portraitPlaceholderText}>PORTRAIT — USER UPLOAD</Text>
        </View>

        {/* DPDP Photo Privacy Badge */}
        <View style={styles.privacyBadge}>
          <Text style={styles.privacyBadgeText}>PHOTO REVEALS AFTER MUTUAL INTEREST</Text>
        </View>

        {/* Floating Conic Radial Score Badge */}
        <View style={styles.radialGaugeWrapper}>
          <RadialScoreGauge score={scores.overall} size={84} />
        </View>
      </View>

      {/* Main Details Body */}
      <View style={styles.body}>
        {/* Name & Verification Info */}
        <View style={styles.nameHeader}>
          <Text style={styles.candidateName}>
            {candidate.firstName}, {candidate.age}
          </Text>
          <Text style={styles.metaText}>
            {candidate.city} · {candidate.verifiedDate || 'verified 2 weeks ago'}
          </Text>
        </View>

        {/* Blueprint Overlap Breakdown */}
        <View style={styles.overlapSection}>
          <Text style={styles.sectionHeader}>BLUEPRINT OVERLAP</Text>
          <View style={styles.pillarStack}>
            <PillarBar label="Money" value={scores.money} color={theme.colors.accent} />
            <PillarBar label="Roots" value={scores.roots} color={theme.colors.accent} />
            <PillarBar label="Kids" value={scores.kids} color={theme.colors.accent} />
            <PillarBar label="Ambition" value={scores.ambition} color="#C9B7A2" />
          </View>
        </View>

        {/* Quote Block */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteHeader}>THEY WROTE</Text>
          <Text style={styles.quoteBody}>
            {candidate.quote || '“Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.”'}
          </Text>
        </View>

        {/* Common Tag Pills */}
        <View style={styles.tagsRow}>
          {(candidate.tags || ['Both: no big wedding', 'Both: dog people']).map((tag, idx) => (
            <View
              key={idx}
              style={[
                styles.tagPill,
                idx === 0 ? styles.tagPillActive : styles.tagPillMuted,
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  idx === 0 ? styles.tagPillTextActive : styles.tagPillTextMuted,
                ]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onPass} style={styles.passBtn}>
            <Text style={styles.passBtnText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onStartChat} style={styles.chatBtn}>
            <Text style={styles.chatBtnText}>Start a conversation</Text>
          </TouchableOpacity>
        </View>

        {/* Share With Parents Link */}
        <TouchableOpacity
          onPress={onShareWithParents}
          style={styles.shareParentRow}
        >
          <View style={styles.shareIconBox} />
          <Text style={styles.shareParentText}>Share with parents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#5A3C2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  portraitContainer: {
    position: 'relative',
    height: 224,
    backgroundColor: '#F8F2E9',
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  portraitBlurOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(240, 231, 218, 0.45)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitPlaceholderText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1,
    color: '#A8927F',
    backgroundColor: 'rgba(255, 253, 249, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  privacyBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(42, 27, 24, 0.78)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  privacyBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#FFF6EE',
    fontWeight: '500',
  },
  radialGaugeWrapper: {
    position: 'absolute',
    right: 14,
    bottom: -30,
    zIndex: 10,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  nameHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingRight: 96, // Keep clear of radial score gauge
  },
  candidateName: {
    fontFamily: theme.fonts.serif,
    fontSize: 26,
    lineHeight: 28,
    color: theme.colors.textPrimary,
  },
  metaText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  overlapSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionHeader: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#9E8877',
    fontWeight: '500',
  },
  pillarStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  quoteCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  quoteHeader: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#9E8877',
    fontWeight: '500',
  },
  quoteBody: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#3A2926',
  },
  tagsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tagPill: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 99,
  },
  tagPillActive: {
    backgroundColor: theme.colors.accent,
  },
  tagPillMuted: {
    backgroundColor: '#F0E7DA',
  },
  tagPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
  },
  tagPillTextActive: {
    color: theme.colors.white,
  },
  tagPillTextMuted: {
    color: '#4B3833',
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  passBtn: {
    flex: 1,
    backgroundColor: '#F0E7DA',
    borderRadius: 13,
    paddingVertical: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: '#7A675C',
  },
  chatBtn: {
    flex: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: 13,
    paddingVertical: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  shareParentRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 2,
  },
  shareIconBox: {
    width: 12,
    height: 9,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 2,
  },
  shareParentText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.accent,
  },
});
