import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';

export const RadialScoreGauge = ({ score = 87, size = 84 }) => {
  const innerSize = size - 16;
  return (
    <View
      style={[
        styles.outerRing,
        {
          width: size,
          height: size,
          background: `conic-gradient(${theme.colors.accent} 0 ${score}%, #2E2E2E ${score}% 100%)`,
        },
      ]}
    >
      <View
        style={[
          styles.innerBadge,
          {
            width: innerSize,
            height: innerSize,
          },
        ]}
      >
        <Text style={styles.scoreText}>
          {score}
          <Text style={styles.percentSign}>%</Text>
        </Text>
        <Text style={styles.alignedText}>ALIGNED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    borderRadius: 99,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A3C2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
  },
  innerBadge: {
    borderRadius: 99,
    backgroundColor: theme.colors.card,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  scoreText: {
    fontFamily: theme.fonts.sans,
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  percentSign: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  alignedText: {
    fontFamily: theme.fonts.mono,
    fontSize: 7.5,
    fontWeight: '500',
    letterSpacing: 0.8,
    color: theme.colors.textSubtle,
  },
});
