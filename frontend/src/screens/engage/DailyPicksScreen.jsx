import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, FadeIn, TopBar, Eyebrow, Heading, Body, Card } from '../../components/ui/kit';
import { ProfileThumbnailRow } from '../../components/feed/ProfileThumbnailRow';
import { CandidateSheet, InterestButton } from '../../components/engage/EngageUI';
import { t, formatDate } from '@shared/i18n';

const { colors, fonts } = theme;

// Today's picks: a short list chosen each morning
export const DailyPicksScreen = () => {
  const { dailyPicks, loadDailyPicks, setCurrentScreen } = useApp();
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadDailyPicks();
  }, [loadDailyPicks]);

  const picks = dailyPicks.picks || [];
  const current = open && picks.find((p) => p.id === open);
  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('feed')} title={t('Today')} />
        <FadeIn>
          <View style={{ gap: 6 }}>
            <Eyebrow>{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</Eyebrow>
            <Heading size={32}>{t('Your picks for today')}</Heading>
            <Body size={14}>{t('Chosen each morning for how closely your blueprints align. New picks tomorrow.')}</Body>
          </View>
        </FadeIn>
        {dailyPicks.status === 'loading' && picks.length === 0 && <Body style={{ marginTop: 16 }}>{t('Choosing your picks…')}</Body>}
        {dailyPicks.status === 'ready' && picks.length === 0 && (
          <Card variant="tinted" style={{ alignItems: 'center', gap: 10, marginTop: 16 }}>
            <Sun size={26} color={colors.gold} />
            <Body style={{ textAlign: 'center' }}>{t('No new picks today — you’ve reached out to everyone who fits right now.')}</Body>
          </Card>
        )}
        <View style={styles.grid}>
          {picks.map((c) => (
            <View key={c.id} style={styles.cell}>
              <ProfileThumbnailRow candidate={c} onPressCard={() => setOpen(c.id)} />
              <Text style={styles.reason}>{t(c.pickReason)}</Text>
              <InterestButton candidate={c} />
            </View>
          ))}
        </View>
      </Screen>
      {current && <CandidateSheet candidate={current} onClose={() => setOpen(null)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  cell: { gap: 8, width: '48%', flexGrow: 1 },
  reason: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '700', color: '#8A6A2E', backgroundColor: colors.goldSoft, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 9 },
});
