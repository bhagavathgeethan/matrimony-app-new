import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react';
import { theme } from '../../theme/tokens';

const { colors, fonts, gradients } = theme;

import { VIBE_ART, ALL_VIBES } from '@shared/constants';

export { ALL_VIBES };

export const VibeTileGrid = ({ selectedVibes = [], onToggleVibe }) => (
  <View style={styles.grid}>
    {ALL_VIBES.map((vibe) => {
      const [emoji, from, to] = VIBE_ART[vibe];
      const isSelected = selectedVibes.includes(vibe);
      return (
        <TouchableOpacity
          key={vibe}
          activeOpacity={0.88}
          onPress={() => onToggleVibe(vibe)}
          style={[
            styles.tile,
            { backgroundImage: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` },
            isSelected && styles.tileSelected,
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.label}>{vibe}</Text>
          <View style={[styles.check, isSelected && styles.checkOn]}>
            {isSelected && <Check size={10} color={colors.white} strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: 'calc(25% - 6px)',
    aspectRatio: 0.82,
    borderRadius: 16,
    padding: 7,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '180ms',
  },
  tileSelected: {
    borderColor: colors.accent,
    boxShadow: '0 10px 24px rgba(168, 30, 60, 0.28)',
    transform: [{ scale: 1.03 }],
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: -0.2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(35,20,15,0.18)',
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundImage: gradients.primary,
    borderColor: 'transparent',
  },
});
