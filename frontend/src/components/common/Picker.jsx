// Dropdowns on mobile: a select box that opens a bottom sheet of options, with a search box for long
// lists and a check on the chosen one. options: [{ value, label, hint? }] or [value, label] pairs.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, ChevronDown, Search } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { Sheet } from '../details/DetailsUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;
const SEARCH_FROM = 12;

const normalise = (options) => options.map((o) => (Array.isArray(o) ? { value: o[0], label: o[1] } : o));
const same = (a, b) => (a ?? null) === (b ?? null);

export const PickerSheet = ({ title, options, value, onPick, onClose }) => {
  const list = useMemo(() => normalise(options), [options]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? list.filter((o) => String(o.label).toLowerCase().includes(q)) : list;
  return (
    <Sheet title={title} onClose={onClose} zIndex={80}>
      {list.length >= SEARCH_FROM && (
        <View style={styles.search}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Search')}
            placeholderTextColor={colors.textLight}
            accessibilityLabel={t('Search')}
            style={styles.searchInput}
          />
        </View>
      )}
      <View style={{ gap: 4 }} accessibilityRole="radiogroup">
        {shown.map((o) => {
          const on = same(o.value, value);
          return (
            <TouchableOpacity
              key={String(o.value)}
              onPress={() => { onPick(o.value); onClose(); }}
              style={[styles.option, on && styles.optionOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.optionText, o.muted && { color: colors.textMuted }, on && { color: colors.accent }]} lang={o.lang}>{o.label}</Text>
                {o.hint ? <Text style={styles.hint}>{o.hint}</Text> : null}
              </View>
              <View style={[styles.radio, on && styles.radioOn]}>
                {on && <Check size={13} color={colors.white} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          );
        })}
        {shown.length === 0 && <Text style={styles.empty}>{t('No matches')}</Text>}
      </View>
    </Sheet>
  );
};

// The closed box. placeholder shows when nothing (or an option marked empty) is chosen.
export const SelectField = ({ title, options, value, onChange, placeholder, icon: Icon, label, style, small, dark }) => {
  const [open, setOpen] = useState(false);
  const list = useMemo(() => normalise(options), [options]);
  const chosen = list.find((o) => same(o.value, value) && !o.muted);
  const shown = chosen ? chosen.label : (placeholder ?? t('Select'));
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.box, small && styles.boxSmall, dark && styles.boxDark, style]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${shown}` : shown}
      >
        {Icon && <Icon size={16} color={dark ? colors.gold : colors.accent} />}
        <Text style={[styles.boxText, small && { fontSize: 14 }, !chosen && { color: colors.textLight }, dark && { color: colors.onDark }]} numberOfLines={1}>{shown}</Text>
        <ChevronDown size={16} color={dark ? colors.gold : colors.textMuted} />
      </TouchableOpacity>
      {open && <PickerSheet title={title || label} options={list} value={value} onPick={onChange} onClose={() => setOpen(false)} />}
    </>
  );
};

const styles = StyleSheet.create({
  box: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  boxSmall: { height: 40, paddingHorizontal: 12, borderRadius: 12 },
  boxDark: { backgroundColor: 'rgba(255,246,238,0.08)', borderColor: 'rgba(255,246,238,0.24)' },
  boxText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
  },
  searchInput: { flex: 1, height: '100%', fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.textPrimary, outlineStyle: 'none' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionText: { fontFamily: fonts.sans, fontSize: 15.5, fontWeight: '600', color: colors.textPrimary },
  hint: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, paddingVertical: 12, textAlign: 'center' },
});
