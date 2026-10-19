import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Headset } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button } from '../../components/ui/kit';
import { ProfileThumbnailRow } from '../../components/feed/ProfileThumbnailRow';
import { CandidateSheet } from '../../components/engage/EngageUI';
import { t, formatDate } from '@shared/i18n';

const { colors, fonts } = theme;
const STATUS = { new: 'Received', active: 'In progress', closed: 'Closed' };

// Assisted service: a relationship manager hand-picks matches
export const AssistedScreen = () => {
  const { assisted, loadAssisted, requestAssisted, setCurrentScreen } = useApp();
  const [notes, setNotes] = useState('');
  const [callTime, setCallTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadAssisted().then((res) => {
      if (res.ok && res.data.request) {
        setNotes(res.data.request.notes || '');
        setCallTime(res.data.request.callTime || '');
      }
    });
  }, [loadAssisted]);

  const save = async () => {
    setBusy(true);
    const res = await requestAssisted({ notes, callTime });
    setBusy(false);
    setMsg(res.ok ? t('Saved — your relationship manager will be in touch.') : res.error);
  };
  const current = open && assisted?.recommendations.find((c) => c.id === open);

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('premium')} title={t('Assisted service')} />
        <View style={{ gap: 6, marginBottom: 14 }}>
          <Eyebrow color={colors.gold}>{t('Assisted service')}</Eyebrow>
          <Heading size={28}>{t('Your relationship manager')}</Heading>
        </View>
        {!assisted ? <Body>{t('Loading…')}</Body> : !assisted.active ? (
          <Card variant="tinted" style={{ gap: 10, alignItems: 'center' }}>
            <Headset size={26} color={colors.gold} />
            <Body style={{ textAlign: 'center' }}>{t('A relationship manager hand-picks matches for you and can speak with your family.')}</Body>
            <Button small label={t('See the add-on')} onPress={() => setCurrentScreen('premium')} />
          </Card>
        ) : (
          <View style={{ gap: 14 }}>
            <Card style={{ gap: 10 }}>
              <Text style={styles.meta}>{t('Active until {date}', { date: formatDate(assisted.until, { dateStyle: 'long' }) })}{assisted.request ? ` · ${t(STATUS[assisted.request.status])}` : ''}</Text>
              <TextInput value={notes} onChangeText={setNotes} placeholder={t('What are you looking for?')} placeholderTextColor={colors.textLight}
                multiline numberOfLines={4} maxLength={1000} style={[styles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]} accessibilityLabel={t('What are you looking for')} />
              <TextInput value={callTime} onChangeText={setCallTime} placeholder={t('Best time to call (e.g. evenings)')} placeholderTextColor={colors.textLight}
                maxLength={60} style={styles.input} accessibilityLabel={t('Best time to call')} />
              {assisted.request?.managerNote && <Text style={styles.note}>“{assisted.request.managerNote}”</Text>}
              {msg && <Text style={styles.meta}>{msg}</Text>}
              <Button label={busy ? t('Saving…') : assisted.request ? t('Update my request') : t('Send to my manager')} disabled={busy} onPress={save} />
            </Card>
            <Text style={styles.label}>{t('Hand-picked for you')}</Text>
            {assisted.recommendations.length === 0
              ? <Body size={13}>{t('Your manager’s suggestions will appear here.')}</Body>
              : (
                <View style={styles.grid}>
                  {assisted.recommendations.map((c) => (
                    <View key={c.id} style={{ width: '48%', flexGrow: 1, gap: 6 }}>
                      <ProfileThumbnailRow candidate={c} onPressCard={() => setOpen(c.id)} />
                      {c.managerNote ? <Text style={styles.note}>{c.managerNote}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
          </View>
        )}
      </Screen>
      {current && <CandidateSheet candidate={current} onClose={() => setOpen(null)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  note: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '700', color: '#8A6A2E', backgroundColor: colors.goldSoft, padding: 8, borderRadius: 10 },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  input: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, outlineStyle: 'none' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
