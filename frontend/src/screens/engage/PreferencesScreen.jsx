import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react';
import { PREFERENCE_FIELDS, describePreference } from '@shared/preferences';
import { PROFILE_PROMPTS, MAX_PROMPTS, PROMPT_ANSWER_MAX } from '@shared/engagement';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button, Chip } from '../../components/ui/kit';
import { PickerSheet, SelectField } from '../../components/common/Picker';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// Picks a number from a range in a sheet (age / height bounds)
const RangePicker = ({ f, value, onChange }) => {
  const v = value || {};
  const fmt = (n) => (f.format ? f.format(n) : `${n} ${f.unit}`);
  const opts = Array.from({ length: f.max - f.min + 1 }, (_, i) => [f.min + i, fmt(f.min + i)]);
  const set = (end, n) => {
    const next = { ...v, [end]: n };
    onChange(next.min == null && next.max == null ? null : next);
  };
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {['min', 'max'].map((end) => {
        const any = t(end === 'min' ? 'From — any' : 'To — any');
        return (
          <SelectField
            key={end}
            style={{ flex: 1 }}
            label={t(end === 'min' ? '{field} from' : '{field} to', { field: t(f.label) })}
            placeholder={any}
            value={v[end] ?? null}
            onChange={(n) => set(end, n)}
            options={[{ value: null, label: t('Any'), muted: true }, ...opts]}
          />
        );
      })}
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
    setMsg(['prefs', res.ok ? t('Preferences saved') : res.error]);
  };
  const savePrompts = async () => {
    setBusy('prompts');
    const res = await updatePrompts(prompts.filter((p) => p.a.trim()).map((p) => ({ q: p.q, a: p.a.trim() })));
    setBusy(null);
    setMsg(['prompts', res.ok ? t('Prompts saved') : res.error]);
    if (res.ok) setPrompts(res.data.prompts);
  };
  const unused = PROFILE_PROMPTS.filter((q) => !prompts.some((p) => p.q === q));

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Preferences')} />
        <View style={{ gap: 6, marginBottom: 14 }}>
          <Eyebrow>{t('What you’re looking for')}</Eyebrow>
          <Heading size={30}>{t('Partner preferences')}</Heading>
          <Body size={13.5}>{t('Shown on your profile and used to say how well each match fits. Leave anything as “any”.')}</Body>
        </View>
        <Card style={{ gap: 18 }}>
          {PREFERENCE_FIELDS.map((f) => (
            <View key={f.key} style={{ gap: 8 }}>
              <View style={styles.between}>
                <Text style={styles.label}>{t(f.label)}</Text>
                <Text style={styles.summary} numberOfLines={1}>{describePreference(f, prefs[f.key])}</Text>
              </View>
              {f.type === 'range' ? (
                <RangePicker f={f} value={prefs[f.key]} onChange={(v) => setPref(f.key, v)} />
              ) : (
                <View style={styles.chips}>
                  {f.options.map((o) => {
                    const list = prefs[f.key] || [];
                    const on = list.includes(o);
                    return <Chip key={o} label={t(o)} active={on} onPress={() => setPref(f.key, on ? list.filter((x) => x !== o) : [...list, o])} />;
                  })}
                </View>
              )}
            </View>
          ))}
          {msg?.[0] === 'prefs' && <Text style={styles.msg}>{msg[1]}</Text>}
          <Button label={busy === 'prefs' ? t('Saving…') : t('Save preferences')} disabled={!!busy} onPress={savePrefs} />
        </Card>

        <View style={{ gap: 6, marginVertical: 16 }}>
          <Eyebrow>{t('In your words')}</Eyebrow>
          <Heading size={26}>{t('Profile prompts')}</Heading>
          <Body size={13.5}>{t('Answer up to {MAX_PROMPTS}. They show on your card and make first messages easier.', { MAX_PROMPTS })}</Body>
        </View>
        <Card style={{ gap: 14 }}>
          {prompts.map((p, i) => (
            <View key={p.q} style={{ gap: 8 }}>
              <View style={styles.between}>
                <Text style={[styles.promptQ, { flex: 1 }]}>{t(p.q)}</Text>
                <TouchableOpacity onPress={() => setPrompts((list) => list.filter((_, j) => j !== i))} accessibilityLabel={t('Remove “{q}”', { q: p.q })}>
                  <Trash2 size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <TextInput value={p.a} onChangeText={(text) => setPrompts((list) => list.map((x, j) => (j === i ? { ...x, a: text } : x)))}
                maxLength={PROMPT_ANSWER_MAX} multiline numberOfLines={2} style={styles.input} accessibilityLabel={t(p.q)} />
            </View>
          ))}
          {prompts.length < MAX_PROMPTS && <Button variant="secondary" label={t('Add a prompt')} onPress={() => setAdding(true)} />}
          {msg?.[0] === 'prompts' && <Text style={styles.msg}>{msg[1]}</Text>}
          <Button label={busy === 'prompts' ? t('Saving…') : t('Save prompts')} disabled={!!busy} onPress={savePrompts} />
        </Card>
      </Screen>
      {adding && (
        <PickerSheet
          title={t('Pick a prompt')}
          options={unused.map((q) => [q, t(q)])}
          value={null}
          onPick={(q) => setPrompts((list) => [...list, { q, a: '' }])}
          onClose={() => setAdding(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  summary: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '600', color: colors.textSecondary, flexShrink: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptQ: { fontFamily: fonts.sans, fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  input: { minHeight: 64, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top', outlineStyle: 'none' },
  msg: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
});
