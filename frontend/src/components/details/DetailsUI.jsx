// Personal details on mobile: option picker sheet, field controls, read-only sections and the section editor.
// Field definitions come from ../../../../shared/profileFields.js (same as the web app and backend).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Capacitor } from '@capacitor/core';
import { PenLine, FileText, BookOpen, GraduationCap, MapPin, Users, Contact, Headphones, Pencil, Plus, ChevronDown, Check, X } from 'lucide-react';
import {
  PROFILE_SECTIONS, HEIGHT_OPTIONS, WEIGHT_OPTIONS, MAX_MULTI, formatField, formatHeight, formatWeight, visibleFields, isFilled,
} from '@shared/profileFields';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Chip, Toggle, Button, Heading } from '../ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, shadows } = theme;
const isNativeApp = Capacitor.isNativePlatform();

export const SECTION_ICONS = { pen: PenLine, id: FileText, book: BookOpen, grad: GraduationCap, pin: MapPin, family: Users, contact: Contact, music: Headphones };
const ICON_TONES = { pen: '#5b8fd6', id: '#e0646a', book: '#2bb3b1', grad: '#6c7fd8', pin: '#d36bd1', family: '#6aa84f', contact: '#e8913a', music: '#2bb3c9' };
const ADD_COLOR = '#E8913A';

export const valuesOf = (person) => ({ ...(person?.details || {}), firstName: person?.firstName ?? person?.details?.firstName });

// Only the fields that changed, with empty values sent as null (clears them)
export function changedValues(fields, draft, original) {
  const out = {};
  for (const f of fields) {
    const before = original[f.key] ?? null;
    let after = draft[f.key] ?? null;
    if (typeof after === 'string') after = after.trim() || null;
    if (Array.isArray(after) && !after.length) after = null;
    if (JSON.stringify(before) !== JSON.stringify(after)) out[f.key] = after;
  }
  return out;
}

// Option values are stored in English; show them in the interface language
export function displayValue(f, v, values) {
  if (f.type === 'select') return t(v);
  if (f.type === 'multi') return v.map((x) => t(x)).join(', ');
  return formatField(f, v, values);
}

// ---------- option picker ----------

export const Sheet = ({ title, onClose, children, footer, zIndex = 70 }) => (
  <View style={[styles.overlay, { zIndex }]}>
    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
    <View style={[styles.sheet, isNativeApp && { maxWidth: '100%' }]}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Heading size={24} style={{ flex: 1 }}>{title}</Heading>
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close">
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer && <View style={styles.sheetFooter}>{footer}</View>}
    </View>
  </View>
);

const OptionSheet = ({ title, options, value, onPick, onClose }) => (
  <Sheet title={title} onClose={onClose} zIndex={80}>
    <View style={{ gap: 2 }}>
    {[[null, 'Not set'], ...options].map(([v, label]) => {
      const on = v === value || (v === null && value == null);
      return (
        <TouchableOpacity
          key={String(v)}
          onPress={() => { onPick(v); onClose(); }}
          style={[styles.option, on && styles.optionOn]}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={[styles.optionText, v === null && { color: colors.textMuted }, on && { color: colors.accent }]}>{label}</Text>
          {on && <Check size={16} color={colors.accent} />}
        </TouchableOpacity>
      );
    })}
    </View>
  </Sheet>
);

function optionsFor(field, values) {
  switch (field.type) {
    case 'select': return field.options.map((o) => [o, t(o)]);
    case 'height': return HEIGHT_OPTIONS.map((n) => [n, formatHeight(n)]);
    case 'weight': return WEIGHT_OPTIONS.map((n) => [n, formatWeight(n)]);
    case 'count': {
      const max = field.upTo ? Number(values[field.upTo]) || 0 : 9;
      return Array.from({ length: max + 1 }, (_, n) => [n, String(n)]);
    }
    default: return [];
  }
}

// ---------- one field ----------

export const FieldControl = ({ field, draft, set }) => {
  const [picking, setPicking] = useState(false);
  const value = draft[field.key];

  if (field.type === 'bool') {
    return (
      <View style={styles.boolRow}>
        <Text style={styles.fieldTitle}>{t(field.label)}</Text>
        <Toggle value={Boolean(value)} onChange={(v) => set(field.key, v)} />
      </View>
    );
  }

  let control;
  if (field.type === 'text' || field.type === 'longtext') {
    const long = field.type === 'longtext';
    control = (
      <TextInput
        value={value ?? ''}
        onChangeText={(t) => set(field.key, t)}
        placeholder={field.placeholder || ''}
        placeholderTextColor={colors.textLight}
        maxLength={field.max}
        multiline={long}
        numberOfLines={long ? 5 : 1}
        accessibilityLabel={field.label}
        style={[styles.input, long && styles.inputLong]}
      />
    );
  } else if (field.type === 'multi') {
    const list = value || [];
    control = (
      <View style={styles.chips}>
        {field.options.map((o) => {
          const on = list.includes(o);
          return (
            <Chip
              key={o}
              label={t(o)}
              active={on}
              onPress={() => set(field.key, (prev) => {
                const cur = prev || [];
                if (cur.includes(o)) return cur.filter((x) => x !== o);
                return cur.length < MAX_MULTI ? [...cur, o] : cur;
              })}
            />
          );
        })}
      </View>
    );
  } else {
    const shown = isFilled(value) ? displayValue(field, value, draft) : t('Select');
    control = (
      <>
        <TouchableOpacity onPress={() => setPicking(true)} style={styles.selectBox} accessibilityRole="button" accessibilityLabel={`${field.label}: ${shown}`}>
          <Text style={[styles.selectText, !isFilled(value) && { color: colors.textLight }]} numberOfLines={1}>{shown}</Text>
          <ChevronDown size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {picking && (
          <OptionSheet title={t(field.label)} options={optionsFor(field, draft)} value={value} onPick={(v) => set(field.key, v)} onClose={() => setPicking(false)} />
        )}
      </>
    );
  }

  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{t(field.label)}</Text>
      {control}
    </View>
  );
};

// Draft state with married counts kept within the sibling count
export function useDetailsDraft(fields, original) {
  const [draft, setDraft] = useState(original);
  // v may be a function of the previous value (multi-select chips)
  const set = (key, v) => setDraft((d) => {
    const next = { ...d, [key]: typeof v === 'function' ? v(d[key]) : v };
    for (const f of fields.filter((x) => x.upTo === key)) {
      if (next[f.key] != null && next[f.key] > (Number(v) || 0)) next[f.key] = null;
    }
    return next;
  });
  return [draft, set];
}

// ---------- section editor ----------

export const SectionEditSheet = ({ sectionKey, onClose }) => {
  const { user, updateDetails } = useApp();
  const section = PROFILE_SECTIONS.find((s) => s.key === sectionKey);
  const original = valuesOf(user);
  const [draft, set] = useDetailsDraft(section.fields, original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fields = section.fields.filter((f) => !f.upTo || Number(draft[f.upTo]) > 0);

  const save = async () => {
    const changes = changedValues(section.fields, draft, original);
    if (!Object.keys(changes).length) return onClose();
    setBusy(true);
    setError(null);
    const res = await updateDetails(changes);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
  };

  return (
    <Sheet
      title={t(section.title)}
      onClose={onClose}
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="secondary" label={t('Cancel')} style={{ flex: 1 }} onPress={onClose} />
            <Button label={busy ? 'Saving…' : t('Save')} style={{ flex: 2 }} disabled={busy} onPress={save} />
          </View>
        </>
      }
    >
      {fields.map((f) => <FieldControl key={f.key} field={f} draft={draft} set={set} />)}
    </Sheet>
  );
};

// ---------- read-only sections (screenshot layout) ----------

export const DetailsSections = ({ person, own = false, onEdit }) => {
  const values = valuesOf(person);
  return (
    <View>
      {PROFILE_SECTIONS.map((section, i) => {
        const Icon = SECTION_ICONS[section.icon];
        const fields = visibleFields(section, values);
        const filled = fields.filter((f) => isFilled(values[f.key]));
        if (!own && filled.length === 0) return null;
        const single = fields.length === 1 && fields[0].type === 'longtext';
        const add = (
          <TouchableOpacity onPress={() => onEdit(section.key)} style={styles.addRow} accessibilityLabel={`Add ${section.title}`}>
            <Plus size={13} color={ADD_COLOR} />
            <Text style={styles.addText}>{t('Add Details')}</Text>
          </TouchableOpacity>
        );
        return (
          <View key={section.key} style={[styles.section, i > 0 && styles.sectionDivider]}>
            <View style={styles.sectionHead}>
              <Icon size={20} color={ICON_TONES[section.icon]} />
              <Text style={styles.sectionTitle}>{t(section.title)}</Text>
              {own && (
                <TouchableOpacity onPress={() => onEdit(section.key)} style={styles.pencil} accessibilityLabel={`Edit ${section.title}`}>
                  <Pencil size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {single ? (
              isFilled(values[fields[0].key]) ? <Text style={styles.paragraph}>{values[fields[0].key]}</Text> : add
            ) : (
              (own ? fields : filled).map((f) => (
                <React.Fragment key={f.key}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{t(f.label)}</Text>
                    <View style={styles.rowValueWrap}>
                      {isFilled(values[f.key]) ? <Text style={styles.rowValue}>{displayValue(f, values[f.key], values)}</Text> : add}
                    </View>
                  </View>
                  {section.key === 'basic' && f.key === 'firstName' && person?.age != null && (
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>{t('Age')}</Text>
                      <View style={styles.rowValueWrap}><Text style={styles.rowValue}>{person.age} Yrs</Text></View>
                    </View>
                  )}
                </React.Fragment>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
};

// Read-only full profile of another member
export const FullProfileSheet = ({ candidate, onClose }) => {
  const hasDetails = Object.keys(candidate.details || {}).some((k) => !['firstName', 'city', 'profession'].includes(k));
  return (
    <Sheet title={`${candidate.firstName}, ${candidate.age}`} onClose={onClose}>
      {hasDetails ? <DetailsSections person={candidate} /> : (
        <Text style={styles.paragraph}>{candidate.firstName} hasn’t added personal details yet.</Text>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  sheetBody: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 18,
    gap: 16,
  },
  sheetFooter: {
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  optionOn: {
    backgroundColor: colors.accentSoft,
  },
  optionText: {
    fontFamily: fonts.sans,
    fontSize: 15.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  fieldTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  boolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    minHeight: 48,
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
  inputLong: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  selectBox: {
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
  selectText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  section: {
    paddingVertical: 18,
    gap: 10,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pencil: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowLabel: {
    width: '44%',
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowValueWrap: {
    flex: 1,
  },
  rowValue: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    color: colors.textSecondary,
  },
  paragraph: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: ADD_COLOR,
  },
});
