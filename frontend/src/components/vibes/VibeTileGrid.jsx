import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { Check } from 'lucide-react';

export const ALL_VIBES = [
  'Temple mornings',
  'Trekking',
  'Cooking together',
  'Big joint family',
  'Quiet weekends',
  'Nightlife',
  'Dogs everywhere',
  'Festivals, loud',
  'Vegetarian home',
  'Filter coffee & book',
  'Early gym sessions',
  'Art & theater',
];

export const VibeTileGrid = ({ selectedVibes = [], onToggleVibe }) => {
  return (
    <View style={styles.grid}>
      {ALL_VIBES.map((vibe, idx) => {
        const isSelected = selectedVibes.includes(vibe);
        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() => onToggleVibe(vibe)}
            style={[
              styles.tile,
              isSelected ? styles.tileSelected : styles.tileUnselected,
            ]}
          >
            {isSelected && (
              <View style={styles.checkIconBadge}>
                <Check size={12} color={theme.colors.white} strokeWidth={3} />
              </View>
            )}
            <Text
              style={[
                styles.tileText,
                isSelected ? styles.tileTextSelected : styles.tileTextUnselected,
              ]}
            >
              {vibe}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 9,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: 14,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden',
  },
  tileSelected: {
    backgroundColor: theme.colors.accent,
  },
  tileUnselected: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  checkIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: 'rgba(255, 248, 242, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 14,
  },
  tileTextSelected: {
    color: theme.colors.white,
  },
  tileTextUnselected: {
    color: theme.colors.textPrimary,
  },
});
