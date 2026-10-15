import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react';
import { PREFERENCE_FIELDS, describePreference } from '@shared/preferences';
import { PROFILE_PROMPTS, MAX_PROMPTS, PROMPT_ANSWER_MAX } from '@shared/engagement';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button, Chip } from '../../components/ui/kit';
import { Sheet } from '../../components/details/DetailsUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// Picks a number from a range in a sheet (age / height bounds)
const RangePicker = ({ f, value, onChange }) => {
  const [open, setOpen] = useState(null);
  const v = value || {};
  const opts = Array.from({ length: f.max - f.min + 1 }, (_, i) => f.min + i);
  const fmt = (n) => (f.format ? f.format(n) : `${n} ${f.unit}`);
  const set = (end, n) => {
    const next = { ...v, [end]: n };
    onChange(next.min == null && next.max == null ? null : next);
    setOpen(null);
  };
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {['min', 'max'].map((end) => (
        <TouchableOpacity key={end} onPress={() => setOpen(end)} style={styles.select} accessibilityRole="button" accessibilityLabel={`${f.label} ${end === 'min' ? 'from' : 'to'}`}>
          <Text style={[styles.selectText, v[end] == null && { color: colors.textLight }]} numberOfLines={1}>
            {v[end] == null ? (end === 'min' ? 'From — any' : 'To — any') : fmt(v[end])}
          </Text>
        </TouchableOpacity>
      ))}
      {open && (
        <Sheet title={`${f.label} ${open === 'min' ? 'from' : 'to'}`} onClose={() => setOpen(null)} zIndex={80}>
          <View style={{ gap: 2 }}>
            <TouchableOpacity onPress={() => set(open, null)} style={styles.option}><Text style={[styles.optionText, { color: colors.textMuted }]}>Any</Text></TouchableOpacity>
            {opts.map((n) => (
              <TouchableOpacity key={n} onPress={() => set(open, n)} style={[styles.option, v[open] === n && styles.optionOn]} accessibilityRole="button" accessibilityLabel={fmt(n)}>
                <Text style={styles.optionText}>{fmt(n)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Sheet>
      )}
    </View>
  );
};

export const PreferencesScreen = () => {
  const { user, updatePreferences, updatePrompts, setCurrentScreen } = useApp();
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [prompts, setPrompts] = useState(user?.prompts || []);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [adding, setAdding] = useState(false);

  const setPref = (key, v) => setPrefs((p) => ({ ...p, [key]: v }));
  const savePrefs = async () => {
    setBusy('prefs');
    const body = Object.fromEntries(PREFERENCE_FIELDS.map((f) => {
      const v = prefs[f.key];
      return [f.key, v == null || (Array.isArray(v) && !v.length) ? null : v];
    }));
    const res = await updatePreferences(body);
    setBusy(null);
    setMsg(['prefs', res.ok ? 'Preferences saved' : res.error]);
  };
  const savePrompts = async () => {
    setBusy('prompts');
    const res = await updatePrompts(prompts.filter((p) => p.a.trim()).map((p) => ({ q: p.q, a: p.a.trim() })));
    setBusy(null);
    setMsg(['prompts', res.ok ? 'Prompts saved' : res.error]);
    if (res.ok) setPrompts(res.data.prompts);
  };
  const unused = PROFILE_PROMPTS.filter((q) => !prompts.some((p) => p.q === q));

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title="Preferences" />
        <View style={{ gap: 6, marginBottom: 14 }}>
          <Eyebrow>What you’re looking for</Eyebrow>
          <Heading size={30}>{t('Partner preferences')}</Heading>
          <Body size={13.5}>Shown on your profile and used to say how well each match fits. Leave anything as “any”.</Body>
        </View>
        <Card style={{ gap: 18 }}>
          {PREFERENCE_FIELDS.map((f) => (
            <View key={f.key} style={{ gap: 8 }}>
              <View style={styles.between}>
                <Text style={styles.label}>{f.label}</Text>
                <Text style={styles.summary} numberOfLines={1}>{describePreference(f, prefs[f.key])}</Text>
              </View>
              {f.type === 'range' ? (
                <RangePicker f={f} value={prefs[f.key]} onChange={(v) => setPref(f.key, v)} />
              ) : (
                <View style={styles.chips}>
                  {f.options.map((o) => {
                    const list = prefs[f.key] || [];
                    const on = list.includes(o);
                    return <Chip key={o} label={o} active={on} onPress={() => setPref(f.key, on ? list.filter((x) => x !== o) : [...list, o])} />;
                  })}
                </View>
              )}
            </View>
          ))}
          {msg?.[0] === 'prefs' && <Text style={styles.msg}>{msg[1]}</Text>}
          <Button label={busy === 'prefs' ? 'Saving…' : 'Save preferences'} disabled={!!busy} onPress={savePrefs} />
        </Card>

        <View style={{ gap: 6, marginVertical: 16 }}>
          <Eyebrow>In your words</Eyebrow>
          <Heading size={26}>Profile prompts</Heading>
          <Body size={13.5}>Answer up to {MAX_PROMPTS}. They show on your card and make first messages easier.</Body>
        </View>
        <Card style={{ gap: 14 }}>
          {prompts.map((p, i) => (
            <View key={p.q} style={{ gap: 8 }}>
              <View style={styles.between}>
                <Text style={[styles.promptQ, { flex: 1 }]}>{p.q}</Text>
                <TouchableOpacity onPress={() => setPrompts((list) => list.filter((_, j) => j !== i))} accessibilityLabel={`Remove “${p.q}”`}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <TextInput value={p.a} onChangeText={(t) => setPrompts((list) => list.map((x, j) => (j === i ? { ...x, a: t } : x)))}
                maxLength={PROMPT_ANSWER_MAX} multiline numberOfLines={2} style={styles.input} accessibilityLabel={p.q} />
            </View>
          ))}
          {prompts.length < MAX_PROMPTS && <Button variant="secondary" label="Add a prompt" onPress={() => setAdding(true)} />}
          {msg?.[0] === 'prompts' && <Text style={styles.msg}>{msg[1]}</Text>}
          <Button label={busy === 'prompts' ? 'Saving…' : 'Save prompts'} disabled={!!busy} onPress={savePrompts} />
        </Card>
      </Screen>
      {adding && (
        <Sheet title="Pick a prompt" onClose={() => setAdding(false)}>
          <View style={{ gap: 2 }}>
            {unused.map((q) => (
              <TouchableOpacity key={q} onPress={() => { setPrompts((list) => [...list, { q, a: '' }]); setAdding(false); }} style={styles.option} accessibilityRole="button">
                <Text style={styles.optionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Sheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  summary: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '600', color: colors.textSecondary, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  select: { flex: 1, height: 46, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, justifyContent: 'center' },
  selectText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  option: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  optionOn: { backgroundColor: colors.accentSoft },
  optionText: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  promptQ: { fontFamily: fonts.sans, fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  input: { minHeight: 64, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top', outlineStyle: 'none' },
  msg: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
});
