import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

// Compact pillar slider: draggable value (native range input) + open/firm flexibility band
export const BlueprintSlider = ({
  title,
  subtitle,
  icon: Icon,
  value,
  flexibility = 'open', // 'open' | 'firm'
  onChangeValue,
  onChangeFlexibility,
}) => {
  // Flexibility band: how much difference you'll accept around your value
  const bandWidth = flexibility === 'open' ? 32 : 14;
  const bandLeft = Math.max(0, Math.min(100 - bandWidth, value - bandWidth / 2));
  const [lowLabel, highLabel] = subtitle.split('→').map((s) => s.trim());

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {Icon && (
          <View style={styles.icon}>
            <Icon size={15} color={colors.accent} />
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.segment}>
          {[['open', 'Open'], ['firm', 'Firm']].map(([key, label]) => {
            const active = flexibility === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onChangeFlexibility && onChangeFlexibility(key)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t(label)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.valueBadge}>
          <Text style={styles.valueText}>{value}</Text>
        </View>
      </View>

      <View style={styles.trackArea}>
        <View style={styles.track} />
        <View style={[styles.fill, { width: `${value}%` }]} />
        <View style={[styles.band, { left: `${bandLeft}%`, width: `${bandWidth}%` }]} />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={title}
          className="mx-range"
          onChange={(e) => onChangeValue && onChangeValue(Number(e.target.value))}
          style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
        />
      </View>

      <View style={styles.endLabels}>
        <Text style={styles.endLabel}>{lowLabel}</Text>
        <Text style={[styles.endLabel, { textAlign: 'right' }]}>{highLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  valueBadge: {
    minWidth: 38,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
  },
  valueText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 14,
    color: colors.onDark,
  },
  trackArea: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 6,
    backgroundImage: gradients.primary,
  },
  band: {
    position: 'absolute',
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(201, 162, 92, 0.9)',
    backgroundColor: 'rgba(201, 162, 92, 0.14)',
  },
  endLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: -4,
  },
  endLabel: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  segment: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: 10,
    backgroundColor: colors.cardSecondary,
  },
  segmentBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceDark,
  },
  segmentText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.onDark,
  },
});
