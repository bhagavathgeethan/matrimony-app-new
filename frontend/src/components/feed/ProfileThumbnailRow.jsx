import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { theme } from '../../theme/tokens';
import { Check } from 'lucide-react';

export const ProfileThumbnailRow = ({
  candidate,
  selected = false,
  onToggleSelect,
  onPressCard,
}) => {
  const photos = candidate.photos || [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressCard}
      style={[styles.container, selected && styles.containerSelected]}
    >
      {/* Horizontal Photostrip */}
      <View style={styles.photoStripContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoStripScroll}
        >
          {photos.map((url, idx) => (
            <View
              key={idx}
              style={[
                styles.photoCard,
                idx === 0 ? styles.photoCardPrimary : styles.photoCardSecondary,
              ]}
            >
              <Image
                source={{ uri: url }}
                style={styles.photoImg}
                resizeMode="cover"
              />
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>
                  {idx === 0 ? `PHOTO 1 OF ${photos.length}` : `PHOTO ${idx + 1}`}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Carousel indicator dots */}
        <View style={styles.dotsContainer}>
          <View style={styles.activeDot} />
          <View style={styles.inactiveDot} />
          <View style={styles.inactiveDot} />
          <View style={styles.inactiveDot} />
        </View>
      </View>

      {/* Profile Row Metadata & Selection Checkbox */}
      <View style={styles.infoRow}>
        <TouchableOpacity
          onPress={onToggleSelect}
          style={[styles.checkbox, selected ? styles.checkboxChecked : styles.checkboxUnchecked]}
        >
          {selected && <Check size={14} color={theme.colors.white} strokeWidth={3} />}
        </TouchableOpacity>

        <View style={styles.detailsCol}>
          <Text style={styles.nameText}>
            {candidate.firstName}, {candidate.age}
          </Text>
          <Text style={styles.summaryText}>
            {candidate.city} · {candidate.summaryNote || 'saver · wants kids soon'}
          </Text>
        </View>

        <View style={styles.scoreCol}>
          <Text style={styles.scoreText}>
            {candidate.overlapScores?.overall || 87}%
          </Text>
          <Text style={styles.alignedLabel}>ALIGNED</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    borderRadius: 20,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    marginBottom: 12,
  },
  containerSelected: {
    borderColor: theme.colors.accent,
  },
  photoStripContainer: {
    position: 'relative',
    height: 190,
  },
  photoStripScroll: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  photoCard: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7DACA',
    position: 'relative',
  },
  photoCardPrimary: {
    width: 196,
  },
  photoCardSecondary: {
    width: 120,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    backgroundColor: 'rgba(251, 246, 238, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  photoBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#A8927F',
  },
  dotsContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -30 }],
    bottom: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 253, 249, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  activeDot: {
    width: 15,
    height: 5,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
  },
  inactiveDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(42, 27, 24, 0.25)',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent,
  },
  checkboxUnchecked: {
    borderWidth: 1.5,
    borderColor: '#DDCDB9',
    backgroundColor: theme.colors.card,
  },
  detailsCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  nameText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  summaryText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },
  scoreCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  scoreText: {
    fontFamily: theme.fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  alignedLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: '#96806F',
  },
});
