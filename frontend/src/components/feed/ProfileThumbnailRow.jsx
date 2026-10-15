import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Check, BadgeCheck, Images, Lock } from 'lucide-react';
import { theme } from '../../theme/tokens';

const { colors, fonts, gradients, radii, shadows } = theme;

// Grid card used on the Browse screen
export const ProfileThumbnailRow = ({ candidate, selected = false, onToggleSelect, onPressCard }) => {
  const photos = candidate.photos || [];
  const score = candidate.overlapScores?.overall ?? 0;

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPressCard} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.photoWrap}>
        {photos[0] && <Image source={{ uri: photos[0] }} style={styles.photo} resizeMode="cover" />}
        <View style={styles.fade} />

        <TouchableOpacity
          onPress={onToggleSelect}
          style={[styles.select, selected && styles.selectOn]}
          accessibilityLabel={selected ? 'Deselect' : 'Select'}
        >
          {selected && <Check size={14} color={colors.white} strokeWidth={3} />}
        </TouchableOpacity>

        {candidate.photoBlurred && (
          <View style={styles.lock}>
            <Lock size={14} color={colors.white} />
          </View>
        )}
        {photos.length > 1 && (
          <View style={styles.count}>
            <Images size={11} color={colors.onDark} />
            <Text style={styles.countText}>{photos.length}</Text>
          </View>
        )}

        <View style={[styles.score, score >= 90 && styles.scoreTop]}>
          <Text style={[styles.scoreText, score >= 90 && { color: colors.surfaceDark }]}>{score}%</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {candidate.firstName}, {candidate.age}
          </Text>
          {candidate.verified && <BadgeCheck size={14} color={colors.gold} />}
          {candidate.activeRecently && <View style={styles.activeDot} accessibilityLabel="Active today" />}
        </View>
        <Text style={styles.city} numberOfLines={1}>{candidate.city}</Text>
        {candidate.summaryNote ? (
          <Text style={styles.note} numberOfLines={1}>{candidate.summaryNote}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  card: {
    width: 'calc(50% - 6px)',
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    boxShadow: shadows.card,
  },
  cardSelected: {
    borderColor: colors.accent,
    boxShadow: '0 12px 28px rgba(168, 30, 60, 0.25)',
  },
  photoWrap: {
    height: 210,
    position: 'relative',
    backgroundColor: colors.accentSoft,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundImage: 'linear-gradient(180deg, rgba(20,8,6,0) 0%, rgba(20,8,6,0.45) 100%)',
  },
  select: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(20,8,6,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOn: {
    backgroundImage: gradients.primary,
    borderColor: colors.white,
  },
  lock: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -17,
    marginLeft: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(20,8,6,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    top: 12,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(20,8,6,0.4)',
    backdropFilter: 'blur(8px)',
  },
  countText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    color: colors.onDark,
  },
  score: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundImage: gradients.primary,
  },
  scoreTop: {
    backgroundImage: gradients.gold,
  },
  scoreText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  info: {
    padding: 12,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17.6,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  city: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
});
