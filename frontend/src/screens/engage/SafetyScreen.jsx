import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react';
import { SAFETY_TIPS } from '@shared/engagement';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button, Divider } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

export const SafetyScreen = () => {
  const { blocks, loadBlocks, unblockMember, setCurrentScreen } = useApp();
  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);
  return (
    <Screen tabBar>
      <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Safety')} />
      <View style={{ gap: 6, marginBottom: 14 }}>
        <Eyebrow>{t('Safety centre')}</Eyebrow>
        <Heading size={30}>{t('Stay safe while you meet')}</Heading>
      </View>
      <Card padding={6} style={{ marginBottom: 14 }}>
        {SAFETY_TIPS.map(([title, body], i) => (
          <View key={title}>
            {i > 0 && <Divider style={{ marginHorizontal: 14 }} />}
            <View style={styles.tip}>
              <ShieldCheck size={18} color={colors.success} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.title}>{t(title)}</Text>
                <Body size={13}>{t(body)}</Body>
              </View>
            </View>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 12 }}>
        <Text style={styles.label}>{t('Blocked members')}</Text>
        {blocks.length === 0 && <Body size={13}>{t('You haven’t blocked anyone. Block or report from any profile or chat.')}</Body>}
        {blocks.map((b) => (
          <View key={b.userId} style={styles.blocked}>
            <Text style={[styles.title, { flex: 1 }]}>{b.firstName}{b.age ? `, ${b.age}` : ''} <Text style={styles.meta}>{b.city}</Text></Text>
            <Button small variant="secondary" label={t('Unblock')} onPress={() => unblockMember(b.userId)} />
          </View>
        ))}
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  tip: { flexDirection: 'row', gap: 12, padding: 14 },
  title: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  meta: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.textMuted },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
