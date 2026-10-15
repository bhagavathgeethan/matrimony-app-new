import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Capacitor } from '@capacitor/core';
import { X, MapPin } from 'lucide-react';
import {
  PILLARS, TIMELINES, ALL_VIBES, SEARCH_SORTS, MIN_SCORE_OPTIONS, SEARCH_AGE_LIMITS, DEFAULT_SEARCH_FILTERS,
} from '@shared/constants';
import { theme } from '../../theme/tokens';
import { Heading, Accent, Chip, Toggle, Button } from '../ui/kit';

const { colors, fonts, shadows } = theme;
const isNativeApp = Capacitor.isNativePlatform();
const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const Section = ({ title, hint, children }) => (
  <View style={styles.section}>
    <Text style={styles.label}>{title}</Text>
    {children}
    {hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

// Bottom sheet with every search filter; changes apply only on "Show results"
export const SearchFilterSheet = ({ filters, cities = [], onClose, onApply }) => {
  const [d, setD] = useState(filters);
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const age = (key, text) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    set({ [key]: digits ? Number(digits) : null });
  };
  const ageError =
    [d.ageMin, d.ageMax].some((a) => a != null && (a < SEARCH_AGE_LIMITS.min || a > SEARCH_AGE_LIMITS.max))
      ? `Ages must be between ${SEARCH_AGE_LIMITS.min} and ${SEARCH_AGE_LIMITS.max}`
      : d.ageMin != null && d.ageMax != null && d.ageMin > d.ageMax
        ? 'Minimum age is above the maximum'
        : null;
  const sameCity = (c) => d.city.trim().toLowerCase() === c.toLowerCase();

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, isNativeApp && { maxWidth: '100%' }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Heading size={28}>Search <Accent>filters</Accent></Heading>
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close filters">
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Sort by">
            <View style={styles.chips}>
              {SEARCH_SORTS.map(([k, label]) => (
                <Chip key={k} label={label} active={d.sort === k} onPress={() => set({ sort: k })} />
              ))}
            </View>
          </Section>

          <Section title="Age">
            <View style={styles.ageRow}>
              <TextInput
                style={styles.input}
                placeholder="From"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                accessibilityLabel="Minimum age"
                value={d.ageMin == null ? '' : String(d.ageMin)}
                onChangeText={(t) => age('ageMin', t)}
              />
              <Text style={styles.hint}>to</Text>
              <TextInput
                style={styles.input}
                placeholder="To"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                accessibilityLabel="Maximum age"
                value={d.ageMax == null ? '' : String(d.ageMax)}
                onChangeText={(t) => age('ageMax', t)}
              />
            </View>
            {ageError && <Text style={styles.error}>{ageError}</Text>}
          </Section>

          <Section title="City">
            <TextInput
              style={styles.input}
              placeholder="Any city"
              placeholderTextColor={colors.textLight}
              accessibilityLabel="City"
              maxLength={80}
              value={d.city}
              onChangeText={(t) => set({ city: t })}
            />
            {cities.length > 0 && (
              <View style={styles.chips}>
                {cities.map((c) => (
                  <Chip
                    key={c.city}
                    icon={MapPin}
                    label={`${c.city} · ${c.count}`}
                    active={sameCity(c.city)}
                    onPress={() => set({ city: sameCity(c.city) ? '' : c.city })}
                  />
                ))}
              </View>
            )}
          </Section>

          <Section title="Minimum alignment">
            <View style={styles.chips}>
              {MIN_SCORE_OPTIONS.map(([v, label]) => (
                <Chip key={v} label={label} active={d.minScore === v} onPress={() => set({ minScore: v })} />
              ))}
            </View>
          </Section>

          <Section title="Strongly aligned on" hint="Each chosen pillar must be 80% or closer to yours.">
            <View style={styles.chips}>
              {PILLARS.map((p) => (
                <Chip key={p.key} label={p.label} active={d.strongOn.includes(p.key)} onPress={() => set({ strongOn: toggleIn(d.strongOn, p.key) })} />
              ))}
            </View>
          </Section>

          <Section title="Marriage timeline">
            <View style={styles.chips}>
              {TIMELINES.map(([t, label]) => (
                <Chip key={t} label={label} active={d.timelines.includes(t)} onPress={() => set({ timelines: toggleIn(d.timelines, t) })} />
              ))}
            </View>
          </Section>

          <Section title="Shares any of these vibes">
            <View style={styles.chips}>
              {ALL_VIBES.map((v) => (
                <Chip key={v} label={v} active={d.vibes.includes(v)} onPress={() => set({ vibes: toggleIn(d.vibes, v) })} />
              ))}
            </View>
          </Section>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Verified profiles only</Text>
            <Toggle value={d.verified} onChange={(v) => set({ verified: v })} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Hide people I’ve messaged</Text>
            <Toggle value={d.notContacted} onChange={(v) => set({ notContacted: v })} />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="secondary"
            label="Reset"
            style={{ flex: 1 }}
            onPress={() => setD({ ...DEFAULT_SEARCH_FILTERS, q: filters.q })}
          />
          <Button label="Show results" style={{ flex: 2 }} disabled={!!ageError} onPress={() => onApply(d)} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    backgroundColor: colors.overlay,
    backdropFilter: 'blur(3px)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90vh',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    boxShadow: shadows.modal,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.accent,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
