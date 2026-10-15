import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { profileStrengthHint } from '@shared/constants';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, FadeIn, TopBar, Eyebrow, Heading, Card, ScoreRing } from '../../components/ui/kit';
import { DetailsSections, SectionEditSheet } from '../../components/details/DetailsUI';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// Own personal details, section by section (Me → Personal details)
export const PersonalDetailsScreen = () => {
  const { user, setCurrentScreen, personalSection, setPersonalSection } = useApp();
  const [editing, setEditing] = useState(personalSection || null);
  const completion = user?.profileCompletion;
  const percent = completion?.percent ?? 0;

  const close = () => {
    setEditing(null);
    setPersonalSection(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Personal details')} />

        <FadeIn>
          <Card style={styles.progress} padding={16}>
            <ScoreRing score={percent} size={64} label="DONE" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.progressTitle}>Profile {percent}% complete</Text>
              <Text style={styles.progressHint}>{profileStrengthHint(user)}</Text>
            </View>
          </Card>
        </FadeIn>

        {percent < 100 && completion?.nextSection && (
          <TouchableOpacity onPress={() => setEditing(completion.nextSection)} style={styles.cta} accessibilityRole="button">
            <Text style={styles.ctaText}>Complete next section</Text>
          </TouchableOpacity>
        )}

        <FadeIn delay={80}>
          <View style={{ gap: 6, marginTop: 18 }}>
            <Eyebrow color={colors.success}>Personal information</Eyebrow>
            <Heading size={26}>About you</Heading>
          </View>
          <Card style={{ marginTop: 10 }} padding={18}>
            <DetailsSections person={user} own onEdit={setEditing} />
          </Card>
          <Text style={styles.footnote}>
            Caste, gothram, star and similar fields are optional and never affect matching scores.
          </Text>
        </FadeIn>
      </Screen>

      {editing && <SectionEditSheet sectionKey={editing} onClose={close} />}
    </View>
  );
};

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  progressTitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  cta: {
    marginTop: 12,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  ctaText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    paddingHorizontal: 4,
  },
});
