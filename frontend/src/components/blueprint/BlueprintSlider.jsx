import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';

export const BlueprintSlider = ({
  title,
  subtitle,
  value,
  flexibility = 'open', // 'open' | 'firm'
  onChangeValue,
  onChangeFlexibility,
}) => {
  // Flexibility band spread (wider if open, narrower if firm)
  const bandWidth = flexibility === 'open' ? 32 : 14;
  const bandLeft = Math.max(0, Math.min(100 - bandWidth, value - bandWidth / 2));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{value}</Text>
        </View>
      </View>

      {/* Interactive Track Area */}
      <View style={styles.trackContainer}>
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: `${value}%` }]} />
        
        {/* Dashed Flexibility Range Band */}
        <View
          style={[
            styles.flexibilityBand,
            {
              left: `${bandLeft}%`,
              width: `${bandWidth}%`,
            },
          ]}
        />

        {/* Thumb Knob */}
        <View
          style={[
            styles.thumb,
            {
              left: `${value}%`,
            },
          ]}
        />
      </View>

      {/* Quick Value Step Adjusters */}
      <View style={styles.adjusterRow}>
        <TouchableOpacity
          onPress={() => onChangeValue && onChangeValue(Math.max(10, value - 10))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepBtnText}>-10</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChangeValue && onChangeValue(Math.min(95, value + 10))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepBtnText}>+10</Text>
        </TouchableOpacity>

        {/* Flexibility Selector */}
        <View style={styles.flexibilityGroup}>
          <Text style={styles.flexibilityLabel}>FLEXIBILITY</Text>
          <View style={styles.flexibilityToggleBox}>
            <TouchableOpacity
              onPress={() => onChangeFlexibility && onChangeFlexibility('open')}
              style={[
                styles.flexTogglePill,
                flexibility === 'open' ? styles.flexTogglePillDark : styles.flexTogglePillLight,
              ]}
            >
              <Text
                style={[
                  styles.flexToggleText,
                  flexibility === 'open' ? styles.flexToggleTextLight : styles.flexToggleTextDark,
                ]}
              >
                Open
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onChangeFlexibility && onChangeFlexibility('firm')}
              style={[
                styles.flexTogglePill,
                flexibility === 'firm' ? styles.flexTogglePillDark : styles.flexTogglePillLight,
              ]}
            >
              <Text
                style={[
                  styles.flexToggleText,
                  flexibility === 'firm' ? styles.flexToggleTextLight : styles.flexToggleTextDark,
                ]}
              >
                Firm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 13,
    marginBottom: 12,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  title: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
  },
  badge: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  trackContainer: {
    height: 26,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#E7DACA',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
  },
  flexibilityBand: {
    position: 'absolute',
    height: 22,
    borderRadius: 99,
    backgroundColor: 'rgba(168, 30, 60, 0.12)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 30, 60, 0.45)',
  },
  thumb: {
    position: 'absolute',
    transform: [{ translateX: -11 }],
    width: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
    borderWidth: 3,
    borderColor: theme.colors.bg,
    shadowColor: '#5A3228',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  adjusterRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  stepBtn: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stepBtnText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  flexibilityGroup: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  flexibilityLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#9E8877',
  },
  flexibilityToggleBox: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
  },
  flexTogglePill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 99,
  },
  flexTogglePillDark: {
    backgroundColor: theme.colors.surfaceDark,
  },
  flexTogglePillLight: {
    backgroundColor: '#F0E7DA',
  },
  flexToggleText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '600',
  },
  flexToggleTextLight: {
    color: '#FFF6EE',
  },
  flexToggleTextDark: {
    color: '#8A756A',
  },
});
