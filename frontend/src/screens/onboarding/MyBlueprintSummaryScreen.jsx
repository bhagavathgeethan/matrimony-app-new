import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pencil, ShieldCheck, Users, ChevronRight, BadgeCheck, Sparkles, UserRound, Images, Heart, Bell, ClipboardList, SlidersHorizontal, Crown, Sun, Star, BookHeart } from 'lucide-react';
import { profileStrengthHint, blueprintSummary } from '@shared/constants';
import { SignOutButton } from '../../components/common/SignOutButton';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  Screen, FadeIn, Eyebrow, Heading, Button, Card, Avatar, Meter, SectionLabel, IconBadge, Divider, ScoreRing,
} from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

export const MyBlueprintSummaryScreen = () => {
  const { setCurrentScreen, setActiveTab, user, completeOnboarding, setPersonalSection } = useApp();
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState(null);
  const bp = user?.blueprint || {};
  const summary = blueprintSummary(bp, { prefix: false });
  const strength = user?.profileStrength ?? 0;
  const photoCount = user?.photos?.length || 0;
  const completed = Boolean(user?.onboarding?.completed);
  const strengthHint = profileStrengthHint(user);
  const nextSection = user?.profileCompletion?.nextSection;
  const openPersonal = (section = null) => {
    setPersonalSection(section);
    setCurrentScreen('personal-details');
  };

  const links = [
    { icon: ClipboardList, label: 'Personal details', sub: t('{n}% complete · family, education, hobbies', { n: strength }), screen: 'personal-details' },
    { icon: UserRound, label: 'Basics', sub: t('Name, city, timeline'), screen: 'basics' },
    { icon: Images, label: 'Photos & privacy', sub: t(photoCount === 1 ? '1 photo' : '{n} photos', { n: photoCount }), screen: 'photos' },
    { icon: Heart, label: 'Vibes', sub: t('{n} of 6 picked', { n: (user?.vibes || []).length }), screen: 'vibes' },
    ...(completed
      ? [
          { icon: SlidersHorizontal, label: 'Partner preferences & prompts', sub: t('{prefs} preferences · {prompts} prompts', { prefs: Object.keys(user?.preferences || {}).length, prompts: (user?.prompts || []).length }), screen: 'preferences' },
          { icon: BadgeCheck, label: 'ID verification', sub: t(user?.verified ? 'Verified' : 'Get the verified badge'), screen: 'verification' },
          { icon: Crown, label: 'Premium', sub: user?.plan && user.plan !== 'free' ? t('3Knot {planName} · active', { planName: t(user.planName) }) : t('Plus, Premium and Family plans'), screen: 'premium' },
          { icon: Sun, label: 'Today’s picks', sub: 'Five curated matches each day', screen: 'daily' },
          { icon: Star, label: 'Shortlist & who viewed you', sub: 'People you’re considering', screen: 'shortlist' },
          { icon: BookHeart, label: 'Success stories', sub: 'Share how you met', screen: 'stories' },
          { icon: ShieldCheck, label: 'Safety centre', sub: 'Tips and blocked members', screen: 'safety' },
          { icon: Bell, label: 'Notifications', sub: 'Inbox and alerts', screen: 'notifications' },
          { icon: Users, label: 'Family access', sub: 'Who can see what you forward', screen: 'link-parent' },
          { icon: ShieldCheck, label: 'Privacy & data', sub: 'Download, consents, erasure', screen: 'privacy' },
        ]
      : []),
  ];

  const handleExplore = async () => {
    if (completed) {
      setActiveTab('feed');
      setCurrentScreen('feed');
      return;
    }
    setFinishing(true);
    setError(null);
    const res = await completeOnboarding();
    setFinishing(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <Screen tabBar={completed}>
      <FadeIn>
        <View style={styles.topRow}>
          <Heading size={34}>{t('My blueprint')}</Heading>
          <TouchableOpacity onPress={() => setCurrentScreen('blueprint-tuner')} style={styles.editBtn}>
            <Pencil size={14} color={colors.accent} />
            <Text style={styles.editText}>{t('Edit')}</Text>
          </TouchableOpacity>
        </View>
      </FadeIn>

      {/* Identity + pillars hero */}
      <FadeIn delay={80}>
        <Card variant="dark" padding={22} style={{ gap: 20, overflow: 'hidden' }}>
          <View style={styles.identity}>
            <Avatar uri={user?.photos?.[0]?.url} name={user?.firstName} size={64} ring />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name}>
                {user?.firstName}, {user?.age}
              </Text>
              <View style={styles.verifiedRow}>
                <BadgeCheck size={14} color={colors.gold} />
                <Text style={styles.meta}>{user?.city} · {user?.verified ? t('ID verified') : t('phone verified')}</Text>
              </View>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Meter label={t('Money')} value={bp.money ?? 0} dark />
            <Meter label={t('Roots')} value={bp.roots ?? 0} dark />
            <Meter label={t('Kids')} value={bp.kids ?? 0} dark />
            <Meter label={t('Ambition')} value={bp.ambition ?? 0} dark />
          </View>

          <View style={styles.quote}>
            <Sparkles size={16} color={colors.gold} />
            <Text style={styles.quoteText}>
              {t('In short:')}{' '}<Text style={styles.quoteStrong}>{summary}</Text>
            </Text>
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={160}>
        <View style={{ gap: 10 }}>
          <SectionLabel>{t('Your vibes')}</SectionLabel>
          <View style={styles.vibes}>
            {(user?.vibes || []).map((vibe) => (
              <View key={vibe} style={styles.vibePill}>
                <Text style={styles.vibeText}>{t(vibe)}</Text>
              </View>
            ))}
            {(user?.vibes || []).length === 0 && <Text style={styles.meta2}>{t('No vibes picked yet.')}</Text>}
          </View>
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <Card style={styles.strength}>
          <ScoreRing score={strength} size={64} label={t('DONE')} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.strengthTitle}>{t('Profile {n}% complete', { n: strength })}</Text>
            <Text style={styles.meta2}>{strengthHint}</Text>
            {completed && strength < 100 && (
              <TouchableOpacity onPress={() => openPersonal(nextSection)} accessibilityRole="button">
                <Text style={styles.completeLink}>{t('Complete my profile')} →</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={280}>
        <Card padding={6}>
          {links.map((l, idx) => (
            <View key={l.screen}>
              {idx > 0 && <Divider style={{ marginHorizontal: 14 }} />}
              <TouchableOpacity activeOpacity={0.8} onPress={() => (l.screen === 'personal-details' ? openPersonal() : setCurrentScreen(l.screen))} style={styles.linkRow}>
                <IconBadge icon={l.icon} size={38} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.linkTitle}>{t(l.label)}</Text>
                  <Text style={styles.meta2}>{t(l.sub)}</Text>
                </View>
                <ChevronRight size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={340}>
        <View style={{ gap: 8 }}>
          {error && <Text style={[styles.meta2, { color: colors.accent, textAlign: 'center' }]}>{error}</Text>}
          <Button
            label={finishing ? t('One moment…') : completed ? t('Explore Aligned Matches') : t('Finish & see my matches')}
            disabled={finishing}
            onPress={handleExplore}
          />
          <SignOutButton style={{ marginTop: 6 }} />
        </View>
      </FadeIn>
    </Screen>
  );
};

const styles = StyleSheet.create({
  completeLink: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  editText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  name: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 24,
    color: colors.onDark,
    letterSpacing: -0.4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: 'rgba(255,246,238,0.7)',
  },
  quote: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  quoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,246,238,0.7)',
  },
  quoteStrong: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 13.6,
    color: colors.onDark,
    letterSpacing: -0.4,
  },
  vibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  vibeText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  strengthTitle: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  meta2: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  linkTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
