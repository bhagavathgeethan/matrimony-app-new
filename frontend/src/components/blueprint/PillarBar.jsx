import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/tokens';

export const PillarBar = ({ label, value, color = theme.colors.accent, showValue = true }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, value))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      {showValue && <Text style={styles.valueText}>{value}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  label: {
    width: 78,
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#E7DACA',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 99,
  },
  valueText: {
    width: 30,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
});
