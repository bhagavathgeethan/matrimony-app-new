import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown, Star } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Heading, Body, Card, Button } from '../../components/ui/kit';
import { ProfileThumbnailRow } from '../../components/feed/ProfileThumbnailRow';
import { CandidateSheet } from '../../components/engage/EngageUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// My shortlist, plus who viewed and shortlisted me (people visible with Premium)
export const ShortlistScreen = () => {
  const { shortlist, loadShortlist, admirers, loadAdmirers, setCurrentScreen } = useApp();
  const [tab, setTab] = useState('shortlist');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadShortlist();
    loadAdmirers();
  }, [loadShortlist, loadAdmirers]);

  const all = [...shortlist, ...(admirers?.views.people || []), ...(admirers?.shortlists.people || [])];
  const current = open && all.find((c) => c.id === open);
  const list = tab === 'shortlist' ? shortlist : tab === 'views' ? admirers?.views.people : admirers?.shortlists.people;
  const count = tab === 'views' ? admirers?.views.count : tab === 'shortlisted' ? admirers?.shortlists.count : shortlist.length;
  const locked = tab !== 'shortlist' && admirers && !admirers.premium && count > 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Shortlist')} />
        <Heading size={30}>{t('People you’re considering')}</Heading>
        <View style={styles.tabs} accessibilityRole="tablist">
          {[['shortlist', `Mine (${shortlist.length})`], ['views', `Viewed me (${admirers?.views.count ?? 0})`], ['shortlisted', `Shortlisted me (${admirers?.shortlists.count ?? 0})`]].map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
              <Text style={[styles.tabText, tab === key && { color: colors.accent }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {locked ? (
          <Card variant="dark" style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Lock size={18} color={colors.gold} />
              <Text style={styles.lockTitle}>{count} {count === 1 ? 'person' : 'people'} {tab === 'views' ? 'viewed your profile' : 'shortlisted you'}</Text>
            </View>
            <Text style={styles.lockText}>See who they are — and reach out first — with Sangam Premium.</Text>
            <Button label="See Premium" icon={Crown} onPress={() => setCurrentScreen('premium')} />
          </Card>
        ) : !list?.length ? (
          <Card variant="tinted" style={{ alignItems: 'center', gap: 10 }}>
            <Star size={24} color={colors.gold} />
            <Body style={{ textAlign: 'center' }}>
              {tab === 'shortlist' ? 'Tap the star on any profile to keep it here.' : tab === 'views' ? 'No profile views in the last 30 days.' : 'Nobody has shortlisted you yet.'}
            </Body>
          </Card>
        ) : (
          <View style={styles.grid}>
            {list.map((c) => <ProfileThumbnailRow key={c.id} candidate={c} onPressCard={() => setOpen(c.id)} />)}
          </View>
        )}
      </Screen>
      {current && <CandidateSheet candidate={current} onClose={() => setOpen(null)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.cardSecondary, marginVertical: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabOn: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lockTitle: { fontFamily: fonts.sans, fontSize: 17, fontWeight: '800', color: colors.white, flex: 1 },
  lockText: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,246,238,0.8)' },
});
