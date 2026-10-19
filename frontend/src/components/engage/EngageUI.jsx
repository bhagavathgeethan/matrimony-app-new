// Acting on another member on mobile: interest, shortlist, full profile ("why we matched"), block and report
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Heart, Star, MessageCircle, Clock, Ban, Flag, Crown, BadgeCheck, Users, Check, X, Sparkles, Moon, Circle } from 'lucide-react';
import { PILLARS } from '@shared/constants';
import { REPORT_REASONS } from '@shared/engagement';
import { PREFERENCE_FIELDS, describePreference, preferenceWanted } from '@shared/preferences';
import { translatePorutham } from '@shared/porutham';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/kit';
import { Sheet, DetailsSections } from '../details/DetailsUI';
import { PhotoGallery } from './PhotoGallery';
import { hasFeature, UpsellTag, ReportButton, SimilarButton } from './PremiumUI';
import { TIER_INFO } from '@shared/plans';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// ---------- small pieces ----------

export const CardBadges = ({ c, dark = false }) => {
  const items = [
    c.spotlight && [Sparkles, 'Spotlight', colors.gold, colors.surfaceDark],
    c.premium && [Crown, TIER_INFO[c.tier]?.name || 'Premium', colors.goldSoft, '#8A6A2E'],
    c.verified && [BadgeCheck, 'Verified', colors.successSoft, colors.success],
    c.managedByFamily && [Users, 'Family-managed', colors.cardSecondary, colors.textSecondary],
    c.activity && [Circle, c.activity, dark ? 'rgba(20,8,6,0.42)' : colors.cardSecondary, dark ? colors.onDark : colors.textSecondary],
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <View style={styles.badges}>
      {items.map(([Icon, label, bg, fg]) => (
        <View key={label} style={[styles.miniBadge, { backgroundColor: bg }]}>
          <Icon size={10} color={fg} fill={label === 'Active now' ? colors.success : 'none'} />
          <Text style={[styles.miniBadgeText, { color: fg }]}>{t(label)}</Text>
        </View>
      ))}
    </View>
  );
};

export const PromptCards = ({ prompts }) => {
  if (!prompts?.length) return null;
  return (
    <View style={{ gap: 8 }}>
      {prompts.map((p) => (
        <View key={p.q} style={styles.prompt}>
          <Text style={styles.promptQ}>{t(p.q)}</Text>
          <Text style={styles.promptA}>{p.a}</Text>
        </View>
      ))}
    </View>
  );
};

export const ShortlistStar = ({ candidate, size = 40, label = false }) => {
  const { toggleShortlist } = useApp();
  const on = Boolean(candidate.shortlisted);
  return (
    <TouchableOpacity
      onPress={() => toggleShortlist(candidate)}
      style={[label ? styles.labelBtn : [styles.star, { width: size, height: size }], on && styles.starOn]}
      accessibilityRole="button"
      accessibilityLabel={on ? t('Remove {firstName} from shortlist', { firstName: candidate.firstName }) : t('Shortlist {firstName}', { firstName: candidate.firstName })}
      accessibilityState={{ selected: on }}
    >
      <Star size={17} color={on ? colors.gold : colors.textSecondary} fill={on ? colors.gold : 'none'} />
      {label && <Text style={styles.labelBtnText}>{t(on ? 'Shortlisted' : 'Shortlist')}</Text>}
    </TouchableOpacity>
  );
};

// ---------- interest ----------

export const InterestSheet = ({ candidate, onClose }) => {
  const { expressInterest, interestLimits, setCurrentScreen, user } = useApp();
  const [isSuper, setIsSuper] = useState(false);
  const superLeft = interestLimits?.superInterestsLeft ?? 0;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [limited, setLimited] = useState(false);
  const left = interestLimits?.interestsLeftToday;

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await expressInterest(candidate.id, message.trim() || undefined, isSuper);
    setBusy(false);
    if (res.ok) return onClose();
    if (res.code === 'INTEREST_LIMIT') setLimited(true);
    setError(res.error);
  };

  return (
    <Sheet
      title={t('Interest in {firstName}', { firstName: candidate.firstName })}
      onClose={onClose}
      footer={(
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          {limited && <Button variant="secondary" label={t('See Premium')} onPress={() => { onClose(); setCurrentScreen('premium'); }} />}
          <Button label={busy ? t('Sending…') : t('Send interest')} icon={Heart} disabled={busy} onPress={send} />
        </>
      )}
    >
      <Text style={styles.muted}>{t('{firstName} can accept or decline. Once accepted you can chat, see each other’s photos and video call.', { firstName: candidate.firstName })}</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder={t('Add a note (optional)')}
        placeholderTextColor={colors.textLight}
        maxLength={500}
        multiline
        numberOfLines={3}
        accessibilityLabel={t('Add a note')}
        style={styles.textarea}
      />
      {hasFeature(user, 'superInterest') ? (
        <TouchableOpacity onPress={() => (isSuper || superLeft > 0) && setIsSuper((v) => !v)} style={[styles.radio, isSuper && styles.radioOn]}
          accessibilityRole="checkbox" accessibilityState={{ checked: isSuper }} accessibilityLabel={t('Send as a super interest')}>
          <View style={[styles.radioDot, isSuper && styles.radioDotOn]} />
          <Text style={[styles.radioText, { flex: 1 }]}>{t('⭐ Super interest')}{' '}<Text style={styles.tiny}>{t('— pinned at the top of their requests ({superLeft} left this week)', { superLeft })}</Text></Text>
        </TouchableOpacity>
      ) : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={styles.tiny}>{t('⭐ Super interests')}</Text><UpsellTag feature="superInterest" /></View>}
      {left != null && <Text style={styles.tiny}>{t(left === 1 ? '1 interest left today on the free plan.' : '{left} interests left today on the free plan.', { left })}</Text>}
    </Sheet>
  );
};

// The main action for a candidate, depending on where the two of you are
export const InterestButton = ({ candidate, style, onOpenThread }) => {
  const { openThreadById } = useApp();
  const [asking, setAsking] = useState(false);
  const i = candidate.interest;
  const go = () => (onOpenThread ? onOpenThread(i.conversationId) : openThreadById(i.conversationId));
  let props;
  if (!i) props = { label: t('Express interest'), icon: Heart, onPress: () => setAsking(true) };
  else if (i.status === 'accepted') props = { label: t('Chat'), icon: MessageCircle, onPress: go };
  else if (i.status === 'requested' && !i.byMe) props = { label: t('Respond to interest'), icon: Heart, onPress: go };
  else if (i.status === 'requested') props = { label: t('Interest sent'), icon: Clock, onPress: go, variant: 'secondary' };
  else props = { label: t('Not available'), disabled: true, variant: 'secondary' };
  return (
    <>
      <Button {...props} style={style} />
      {asking && <InterestSheet candidate={candidate} onClose={() => setAsking(false)} />}
    </>
  );
};

// ---------- block & report ----------

export const ReportSheet = ({ member, onClose, onDone }) => {
  const { reportMember } = useApp();
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    const res = await reportMember(member.id, reason, details.trim() || undefined);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone?.('reported');
    onClose();
  };
  return (
    <Sheet
      title={t('Report {firstName}', { firstName: member.firstName })}
      onClose={onClose}
      zIndex={85}
      footer={(
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={busy ? t('Reporting…') : t('Report and block')} icon={Flag} disabled={!reason || busy} onPress={submit} />
        </>
      )}
    >
      <Text style={styles.muted}>{t('Reports are confidential. We’ll also block {firstName} for you.', { firstName: member.firstName })}</Text>
      <View style={{ gap: 6 }} accessibilityRole="radiogroup">
        {REPORT_REASONS.map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setReason(key)} style={[styles.radio, reason === key && styles.radioOn]} accessibilityRole="radio" accessibilityState={{ checked: reason === key }}>
            <View style={[styles.radioDot, reason === key && styles.radioDotOn]} />
            <Text style={styles.radioText}>{t(label)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput value={details} onChangeText={setDetails} placeholder={t('Anything else we should know (optional)')} placeholderTextColor={colors.textLight}
        maxLength={1000} multiline numberOfLines={3} style={styles.textarea} accessibilityLabel={t('Report details')} />
    </Sheet>
  );
};

export const SafetyRow = ({ member, onDone }) => {
  const { blockMember } = useApp();
  const [reporting, setReporting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <View style={styles.safetyRow}>
        <TouchableOpacity onPress={() => setConfirm(true)} style={styles.safetyBtn} accessibilityRole="button">
          <Ban size={15} color={colors.textSecondary} />
          <Text style={styles.safetyText}>{t('Block')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReporting(true)} style={styles.safetyBtn} accessibilityRole="button">
          <Flag size={15} color={colors.textSecondary} />
          <Text style={styles.safetyText}>{t('Report')}</Text>
        </TouchableOpacity>
      </View>
      {confirm && (
        <Sheet
          title={t('Block {firstName}?', { firstName: member.firstName })}
          onClose={() => setConfirm(false)}
          zIndex={85}
          footer={<Button label={t('Block')} icon={Ban} onPress={async () => { const res = await blockMember(member.id); setConfirm(false); if (res.ok) onDone?.('blocked'); }} />}
        >
          <Text style={styles.muted}>{t('You won’t see each other anywhere on 3Knot and they can’t message you. They aren’t told. You can unblock from Safety.')}</Text>
        </Sheet>
      )}
      {reporting && <ReportSheet member={member} onClose={() => setReporting(false)} onDone={onDone} />}
    </>
  );
};

// ---------- full profile ----------

const VERDICT = {
  aligned: ['Aligned', colors.successSoft, colors.success],
  close: ['Close enough', colors.goldSoft, '#8A6A2E'],
  talk: ['Worth a talk', colors.cardSecondary, colors.textSecondary],
  dealbreaker: ['Possible dealbreaker', colors.accentSoft, colors.accent],
};

const PillarCompare = ({ p, name }) => {
  const pillar = PILLARS.find((x) => x.key === p.key);
  const [label, bg, fg] = VERDICT[p.verdict];
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.between}>
        <Text style={styles.h3}>{t(pillar.title)}</Text>
        <View style={[styles.miniBadge, { backgroundColor: bg }]}><Text style={[styles.miniBadgeText, { color: fg }]}>{t(label)}</Text></View>
      </View>
      <View style={styles.bar} accessibilityLabel={t('{title}: you {mine}, {name} {theirs}', { title: t(pillar.title), mine: p.mine, name, theirs: p.theirs })}>
        <View style={[styles.barGap, { left: `${Math.min(p.mine, p.theirs)}%`, width: `${p.gap}%` }]} />
        <View style={[styles.dot, styles.dotMe, { left: `${p.mine}%` }]} />
        <View style={[styles.dot, styles.dotThem, { left: `${p.theirs}%` }]} />
      </View>
      <View style={styles.between}>
        <Text style={styles.tiny}>{t(pillar.low)}</Text>
        <Text style={styles.tiny}>{t(pillar.high)}</Text>
      </View>
    </View>
  );
};

const PreferenceList = ({ title, match }) => {
  if (!match || match.total === 0) return null;
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.between}>
        <Text style={styles.h3}>{title}</Text>
        <Text style={styles.muted}>{t('{met} of {total}', { met: match.met, total: match.total })}</Text>
      </View>
      {match.items.map((i) => (
        <View key={i.key} style={styles.prefRow}>
          {i.met === true ? <Check size={14} color={colors.success} /> : i.met === false ? <X size={14} color={colors.accent} /> : <Circle size={12} color={colors.textLight} />}
          <Text style={[styles.small, { flex: 1 }]}>{t(i.label)}</Text>
          <Text style={styles.muted}>{preferenceWanted(i)}</Text>
        </View>
      ))}
    </View>
  );
};

// Another member's full profile. Opens on their personal details and loads the latest full profile, so it
// works from anywhere that only knows who they are (search results, chats).
export const CandidateSheet = ({ candidate: initial, onClose, onOpenThread, initialTab = 'about' }) => {
  const { compareMatch, getCandidate, candidates } = useApp();
  const [candidate, setCandidate] = useState(initial);
  const inFeed = candidates.find((x) => x.id === candidate.id);
  const c = inFeed ? { ...candidate, ...inFeed } : candidate;
  const [tab, setTab] = useState(initialTab);
  const [cmp, setCmp] = useState(null);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ loading: true, error: null });
  const [gone, setGone] = useState(null);

  useEffect(() => {
    let live = true;
    compareMatch(candidate.id).then((res) => {
      if (!live) return;
      if (res.ok) setCmp(res.data);
      else setError(res.error);
    });
    return () => { live = false; };
  }, [candidate.id, compareMatch]);
  useEffect(() => {
    let live = true;
    setProfile({ loading: true, error: null });
    getCandidate(candidate.id).then((res) => {
      if (!live) return;
      if (res.ok) setCandidate((prev) => ({ ...prev, ...res.data }));
      setProfile({ loading: false, error: res.ok ? null : res.error });
    });
    return () => { live = false; };
  }, [candidate.id, getCandidate]);

  if (gone) {
    return (
      <Sheet title={gone === 'reported' ? t('Thanks for reporting') : t('Blocked')} onClose={onClose} footer={<Button label={t('Done')} onPress={onClose} />}>
        <Text style={styles.muted}>{t('{firstName} won’t appear for you any more.', { firstName: c.firstName })}</Text>
      </Sheet>
    );
  }

  const looking = PREFERENCE_FIELDS.filter((f) => c.lookingFor?.[f.key]);
  const horoscope = translatePorutham(cmp?.horoscope);
  return (
    <Sheet
      title={c.age != null ? `${c.firstName}, ${c.age}` : c.firstName}
      onClose={onClose}
      footer={(
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <InterestButton candidate={c} style={{ flex: 1 }} onOpenThread={(id) => { onClose(); onOpenThread?.(id); }} />
            <ShortlistStar candidate={c} size={52} />
          </View>
          <SafetyRow member={c} onDone={setGone} />
        </View>
      )}
    >
      <CardBadges c={c} />
      <View style={styles.tabs} accessibilityRole="tablist">
        {[['about', 'About'], ['why', 'Why we matched'], ['looking', 'Looking for']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
            <Text style={[styles.tabText, tab === key && { color: colors.accent }]}>{t(label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'why' && (
        <View style={{ gap: 16 }}>
          {error && <Text style={styles.error}>{error}</Text>}
          {!cmp && !error && <Text style={styles.muted}>{t('Comparing your blueprints…')}</Text>}
          {cmp && (
            <>
              <View style={styles.between}>
                <View style={styles.inline}><Sparkles size={16} color={colors.gold} /><Text style={styles.h3}>{t('{overall}% aligned overall', { overall: cmp.overall })}</Text></View>
                <View style={styles.inline}>
                  <View style={[styles.legend, styles.dotMe]} /><Text style={styles.tiny}>{t('You')}</Text>
                  <View style={[styles.legend, styles.dotThem]} /><Text style={styles.tiny}>{c.firstName}</Text>
                </View>
              </View>
              {cmp.pillars.map((p) => <PillarCompare key={p.key} p={p} name={c.firstName} />)}
              {cmp.topics && (
                <View style={styles.horoscope}>
                  <Text style={styles.h3}>{t('Worth talking about')}</Text>
                  {cmp.topics.map((tp) => <Text key={tp} style={styles.small}>• {t(tp)}</Text>)}
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <ReportButton candidate={c} />
                <SimilarButton candidate={c} onOpen={(x) => { setCmp(null); setTab('why'); setCandidate(x); }} />
              </View>
              {cmp.sharedVibes.length > 0 && <Text style={styles.small}>{t('You both like: {vibes}', { vibes: cmp.sharedVibes.map((v) => t(v)).join(', ') })}</Text>}
              <PreferenceList title={t('Fits your preferences')} match={cmp.fitsMyPreferences} />
              <PreferenceList title={t('You fit theirs')} match={cmp.iFitTheirPreferences} />
              <View style={styles.horoscope}>
                <View style={styles.inline}><Moon size={15} color={colors.gold} /><Text style={styles.h3}>{t('Horoscope match')}</Text></View>
                {horoscope?.items ? (
                  <>
                    <Text style={styles.h3}>{horoscope.summary}</Text>
                    <View style={styles.badges}>
                      {horoscope.items.map((i) => {
                        const [bg, fg] = i.result === 'good' ? [colors.successSoft, colors.success] : i.result === 'average' ? [colors.goldSoft, '#8A6A2E'] : [colors.accentSoft, colors.accent];
                        return <View key={i.name} style={[styles.miniBadge, { backgroundColor: bg }]}><Text style={[styles.miniBadgeText, { color: fg }]}>{i.label}</Text></View>;
                      })}
                    </View>
                    <Text style={styles.tiny}>{horoscope.disclaimer}</Text>
                  </>
                ) : (
                  <Text style={styles.muted}>
                    {horoscope?.unavailable || (!cmp.horoscopeOptIn.me
                      ? t('Optional and off. Turn on Horoscope matching in Privacy to compare stars.')
                      : t('{firstName} hasn’t turned on horoscope matching.', { firstName: c.firstName }))}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {tab === 'about' && (
        <View style={{ gap: 12 }}>
          <PhotoGallery candidate={c} />
          <PromptCards prompts={c.prompts} />
          {Object.keys(c.details || {}).some((k) => !['firstName', 'city', 'profession'].includes(k))
            ? <DetailsSections person={c} />
            : profile.loading ? <Text style={styles.muted}>{t('Loading…')}</Text>
              : profile.error ? <Text style={styles.error}>{profile.error}</Text>
                : <Text style={styles.muted}>{t('{firstName} hasn’t added personal details yet.', { firstName: c.firstName })}</Text>}
        </View>
      )}

      {tab === 'looking' && (
        <View style={{ gap: 10 }}>
          {looking.length === 0 && <Text style={styles.muted}>{t('{firstName} hasn’t set partner preferences.', { firstName: c.firstName })}</Text>}
          {looking.map((f) => (
            <View key={f.key} style={styles.between}>
              <Text style={styles.muted}>{t(f.label)}</Text>
              <Text style={[styles.small, { fontWeight: '700', flexShrink: 1, textAlign: 'right' }]}>{describePreference(f, c.lookingFor[f.key])}</Text>
            </View>
          ))}
          {c.iFitTheirPreferences?.total > 0 && <Text style={styles.h3}>{t('You match {met} of {total}', { met: c.iFitTheirPreferences.met, total: c.iFitTheirPreferences.total })}</Text>}
        </View>
      )}
    </Sheet>
  );
};

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  miniBadgeText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700' },
  prompt: { gap: 3, padding: 12, borderRadius: 14, backgroundColor: colors.cardSecondary, borderLeftWidth: 3, borderLeftColor: colors.gold },
  promptQ: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  promptA: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  star: { borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  starOn: { backgroundColor: colors.goldSoft, borderColor: '#EAD9B4' },
  labelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  labelBtnText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  muted: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textMuted },
  small: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary },
  tiny: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted },
  h3: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  error: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.accent },
  textarea: { minHeight: 90, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top', outlineStyle: 'none' },
  radio: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radioDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.textLight },
  radioDotOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  radioText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  safetyRow: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  safetyText: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.cardSecondary },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabOn: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.borderLight, position: 'relative', marginVertical: 4 },
  barGap: { position: 'absolute', top: 0, bottom: 0, borderRadius: 5, backgroundColor: 'rgba(201,162,92,0.45)' },
  dot: { position: 'absolute', top: -4, width: 18, height: 18, marginLeft: -9, borderRadius: 9, borderWidth: 3, borderColor: colors.white },
  dotMe: { backgroundColor: colors.accent },
  dotThem: { backgroundColor: colors.gold },
  legend: { width: 10, height: 10, borderRadius: 5, marginLeft: 6 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  horoscope: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: colors.cardSecondary },
});
