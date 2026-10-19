import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { X, MessageCircle, Users, Lock, BadgeCheck, Quote, ClipboardList, Images } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { ScoreRing, Meter, SectionLabel, Card } from '../ui/kit';
import { InterestButton, ShortlistStar, CardBadges, PromptCards } from '../engage/EngageUI';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii, shadows } = theme;

// onOpenProfile: tapping the portrait opens their full profile; onViewProfile: the "Why we matched" comparison
export const MatchCard = ({ candidate, onPass, onStartChat, onShareWithParents, onViewProfile, onOpenProfile }) => {
  const scores = candidate.overlapScores || {};
  const photo = candidate.photos?.[0];
  // The server already sends a blurred copy until mutual interest
  const blurred = candidate.photoBlurred;

  return (
    <View style={styles.wrap}>
      {/* Portrait — blurred until mutual interest; tap for the full profile */}
      <TouchableOpacity
        activeOpacity={0.92}
        disabled={!onOpenProfile}
        onPress={onOpenProfile}
        style={styles.portrait}
        accessibilityRole="button"
        accessibilityLabel={t('Full profile')}
      >
        {photo && <Image source={{ uri: photo }} style={[styles.photo, !blurred && styles.photoClear]} resizeMode="cover" />}
        <View style={styles.photoFade} />

        <View style={styles.ring}>
          <ScoreRing score={scores.overall ?? 0} size={78} dark />
        </View>

        {/* More photos: tapping the portrait opens the profile, where they can all be viewed */}
        {(candidate.photos?.length || 0) > 1 && (
          <View style={styles.photoCount}>
            <Images size={13} color={colors.onDark} />
            <Text style={styles.privacyText}>{t('{n} photos', { n: candidate.photos.length })}</Text>
          </View>
        )}

        <View style={styles.identity}>
          {blurred && (
            <View style={styles.privacyPill}>
              <Lock size={11} color={colors.onDark} />
              <Text style={styles.privacyText}>{t('Photo reveals after mutual interest')}</Text>
            </View>
          )}
          <Text style={styles.name}>
            {candidate.firstName}, {candidate.age}
          </Text>
          <View style={styles.metaRow}>
            {candidate.verified && <BadgeCheck size={14} color={colors.gold} />}
            <Text style={styles.meta}>
              {candidate.city}
              {candidate.profession ? ` · ${candidate.profession}` : ''}
            </Text>
          </View>
          <CardBadges c={{ ...candidate, verified: false }} dark />
        </View>
      </TouchableOpacity>

      {/* Blueprint overlap */}
      <Card style={styles.body}>
        <SectionLabel right={<Text style={styles.verifiedDate}>{candidate.verifiedDate || t('Verified')}</Text>}>
          {t('Blueprint overlap')}
        </SectionLabel>
        <View style={{ gap: 11 }}>
          <Meter label={t('Money')} value={scores.money ?? 0} />
          <Meter label={t('Roots')} value={scores.roots ?? 0} />
          <Meter label={t('Kids')} value={scores.kids ?? 0} />
          <Meter label={t('Ambition')} value={scores.ambition ?? 0} />
        </View>

        {candidate.quote ? (
          <View style={styles.quote}>
            <Quote size={16} color={colors.gold} />
            <Text style={styles.quoteText}>{candidate.quote}</Text>
          </View>
        ) : null}

        <PromptCards prompts={candidate.prompts?.slice(0, 1)} />
        {candidate.fitsMyPreferences?.total > 0 && (
          <Text style={styles.verifiedDate}>{t('Fits {met} of your {total} preferences', { met: candidate.fitsMyPreferences.met, total: candidate.fitsMyPreferences.total })}</Text>
        )}

        {(candidate.tags || []).length > 0 && (
          <View style={styles.tags}>
            {candidate.tags.map((tag, idx) => (
              <View key={tag} style={[styles.tag, idx === 0 && styles.tagStrong]}>
                <Text style={[styles.tagText, idx === 0 && styles.tagTextStrong]}>{t(tag)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.85} onPress={onPass} style={styles.roundBtn} accessibilityLabel={t('Pass')}>
          <X size={22} color={colors.textSecondary} strokeWidth={2.4} />
          <Text style={styles.roundLabel}>{t('Pass')}</Text>
        </TouchableOpacity>
        <InterestButton candidate={candidate} style={{ flex: 1 }} onOpenThread={onStartChat} />
        <ShortlistStar candidate={candidate} size={56} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {onViewProfile && (
          <TouchableOpacity activeOpacity={0.85} onPress={onViewProfile} style={[styles.shareBtn, { flex: 1 }]}>
            <ClipboardList size={16} color={colors.accent} />
            <Text style={styles.shareText}>{t('Why we matched')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity activeOpacity={0.85} onPress={onShareWithParents} style={[styles.shareBtn, { flex: 1 }]}>
          <Users size={16} color={colors.accent} />
          <Text style={styles.shareText}>{t('Share with parents')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  photoCount: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 8, 12, 0.45)',
  },
  wrap: {
    gap: 12,
  },
  portrait: {
    height: 440,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceDark,
    position: 'relative',
    boxShadow: shadows.raised,
  },
  photo: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    filter: 'blur(6px) saturate(1.1)',
  },
  photoClear: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    filter: 'none',
  },
  photoFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: gradients.photoFade,
  },
  privacyPill: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(20,8,6,0.4)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  privacyText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: colors.onDark,
    textTransform: 'uppercase',
  },
  ring: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  identity: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    gap: 6,
  },
  name: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 35.2,
    lineHeight: 36.8,
    color: colors.white,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,246,238,0.85)',
  },
  body: {
    gap: 16,
  },
  verifiedDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  quote: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cardSecondary,
  },
  quoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 14.4,
    lineHeight: 19.2,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.cardSecondary,
  },
  tagStrong: {
    backgroundColor: colors.accentSoft,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tagTextStrong: {
    color: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  roundBtn: {
    width: 86,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  roundLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chatBtn: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundImage: gradients.primary,
    boxShadow: shadows.glow,
  },
  chatText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  shareBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentSoft,
  },
  shareText: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.accent,
  },
});
