// The family member's private view: profiles the member shared, with scores but never contact details.
// Family mode (token given): opened by a family member signed in on this device or from their SMS link —
// they can give their view with a note and change it, compare, suggest an interest (Family plan),
// complete personal details (when allowed) and gift a plan.
// Preview mode (no token): the signed-in member sees, read-only, what each family member sees.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Lock, ShieldCheck, Check, AlertTriangle, Eye, Quote, HelpCircle, LogOut, ClipboardList, Gift, Send } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Screen, FadeIn, Heading, Card, Chip, Badge, ScoreRing, Button } from '../../components/ui/kit';
import { DetailsSections, SectionEditSheet, Sheet } from '../../components/details/DetailsUI';
import { LanguagePicker } from '../../components/common/LanguagePicker';
import { PILLARS, pillarVerdict } from '@shared/constants';
import { PLAN_CATALOG, TIER_INFO, priceText } from '@shared/plans';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

// The server's wording when a family member leaves no note of their own
const DEFAULT_NOTES = ['Looks good to me.', 'Not sure yet — let’s discuss.', 'I have some concerns — let’s talk.'];
const DECISIONS = [
  ['concern_raised', 'Raise a concern', AlertTriangle, colors.warning, colors.warningSoft],
  ['unsure', 'Not sure yet', HelpCircle, '#8A6A2E', colors.goldSoft],
  ['approved', 'I approve', Check, colors.success, colors.successSoft],
];
const ANSWERED = {
  approved: ['You approved', Check, colors.success, colors.successSoft],
  unsure: ['You’re not sure yet', HelpCircle, '#8A6A2E', colors.goldSoft],
  concern_raised: ['You raised a concern', AlertTriangle, colors.warning, colors.warningSoft],
};
const VIEW_LABELS = { awaiting: 'Not yet', approved: 'Approved', unsure: 'Not sure', concern_raised: 'Concern' };

export const ParentPortalScreen = ({ tokenFromUrl = null, portals = [], onChoosePortal, onSignOut }) => {
  const { familyLinks } = useApp();
  const familyMode = Boolean(tokenFromUrl);

  const previewParents = familyMode ? [] : familyLinks.filter((l) => l.portalToken);
  const [parentId, setParentId] = useState(null);
  const activeParent = previewParents.find((p) => p.id === parentId) || previewParents[0];
  const token = tokenFromUrl || activeParent?.portalToken;

  const [portal, setPortal] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [drafts, setDrafts] = useState({}); // shareId → { decision, note }
  const [editing, setEditing] = useState(null);
  const [proposing, setProposing] = useState(null);
  const [proposalNote, setProposalNote] = useState('');
  const [gift, setGift] = useState(null);

  const loadPortal = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setPortal(await api.getParentPortal(token));
    } catch (err) {
      setPortal(null);
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    setDrafts({});
    setNotice(null);
    loadPortal();
  }, [loadPortal]);

  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const dropDraft = (id) => setDrafts((d) => { const next = { ...d }; delete next[id]; return next; });
  const reopen = (r) => setDraft(r.id, { decision: r.status, note: DEFAULT_NOTES.includes(r.feedbackNote) ? '' : r.feedbackNote || '' });

  const respond = async (shareId) => {
    const { decision, note } = drafts[shareId];
    setPendingId(shareId);
    try {
      await api.submitParentFeedback(token, shareId, decision, note?.trim() || undefined);
      dropDraft(shareId);
      await loadPortal();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const proposeNow = async () => {
    try {
      await api.proposeInterest(token, proposing.id, proposalNote.trim() || undefined);
      setNotice(t('Suggestion sent — {child} decides whether to send it.', { child: portal.childName }));
      setProposing(null);
      setProposalNote('');
      await loadPortal();
    } catch (err) {
      setProposing(null);
      setError(err.message);
    }
  };

  const giftStart = async (plan) => {
    try {
      setGift(await api.giftCheckout(token, plan));
    } catch (err) {
      setError(err.message);
    }
  };
  const giftPay = async () => {
    try {
      await api.giftConfirm(token, gift.paymentId, { dummyConfirm: true });
      setNotice(t('Thank you — {child} now has 3Knot {plan}.', { child: portal.childName, plan: t(TIER_INFO[gift.product.tier].name) }));
      setGift(null);
      await loadPortal(); // a Family plan unlocks suggesting interests and comparing
    } catch (err) {
      setGift(null);
      setError(err.message);
    }
  };

  const saveDetails = async (changes) => {
    try {
      const res = await api.updatePortalDetails(token, changes);
      setPortal((p) => ({ ...p, profileDetails: res.profileDetails }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const childName = portal?.childName || '';
  const records = portal?.records || [];
  const awaiting = records.filter((r) => r.status === 'awaiting').length;

  return (
    <Screen padded={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.readOnly}>
            <Eye size={12} color={colors.gold} />
            <Text style={styles.readOnlyText}>{t('Parent view · read only')}</Text>
          </View>
          {familyMode && (
            <View style={styles.heroActions}>
              <LanguagePicker dark />
              {onSignOut && (
                <TouchableOpacity onPress={onSignOut} style={styles.signOut} accessibilityRole="button" accessibilityLabel={t('Sign out')}>
                  <LogOut size={16} color={colors.onDark} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {portal && (
          <Text style={styles.sharedBy}>{t('{parentName} · shared by {childName}', { parentName: portal.parentName, childName })}</Text>
        )}
        <Heading size={40} color={colors.onDark} style={{ marginTop: 10 }}>
          {!portal
            ? t('Your private view')
            : awaiting === 0
              ? t('Nothing awaiting\nyour view')
              : t(awaiting === 1 ? '1 profile awaits\nyour view' : '{n} profiles await\nyour view', { n: awaiting })}
        </Heading>
        {portal && (
          <Text style={styles.heroText}>
            {t('{childName} chose to show you these. You can note approval or raise a concern — {childName} decides what happens next.', { childName })}
          </Text>
        )}
        {portals.length > 1 && (
          <View style={styles.switcher}>
            {portals.map((p) => (
              <Chip key={p.token} dark label={t('{childName}’s profiles', { childName: p.childName })} active={p.token === tokenFromUrl} onPress={() => onChoosePortal?.(p.token)} />
            ))}
          </View>
        )}
        {previewParents.length > 1 && (
          <View style={styles.switcher}>
            {previewParents.map((p) => (
              <Chip key={p.id} dark label={t('View as {name}', { name: p.name })} active={p.id === activeParent?.id} onPress={() => setParentId(p.id)} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {!token && <Text style={styles.note}>{t('Add a family member from the Family tab to preview their view.')}</Text>}
        {error && <Text style={[styles.note, { color: colors.accent }]}>{error}</Text>}
        {notice && <Text style={[styles.note, { color: colors.success, fontWeight: '700' }]}>{notice}</Text>}

        {portal?.compareEnabled && records.length > 1 && (
          <Card style={{ gap: 12 }} padding={16}>
            <Text style={styles.sectionTitle}>{t('Side by side')}</Text>
            <View style={styles.compare}>
              <View style={styles.compareCol}>
                <Text style={styles.compareHead}> </Text>
                {['City', 'Overall', ...PILLARS.map((p) => p.title), 'Your view'].map((label) => (
                  <Text key={label} style={styles.compareLabel} numberOfLines={1}>{t(label)}</Text>
                ))}
              </View>
              {records.map((r) => (
                <View key={r.id} style={styles.compareCol}>
                  <Text style={styles.compareHead} numberOfLines={1}>{r.candidateName}, {r.candidateAge}</Text>
                  <Text style={styles.compareCell} numberOfLines={1}>{r.candidateCity || '—'}</Text>
                  <Text style={[styles.compareCell, { fontWeight: '800' }]}>{r.overlapScore != null ? `${r.overlapScore}%` : '—'}</Text>
                  {PILLARS.map((p) => (
                    <Text key={p.key} style={styles.compareCell} numberOfLines={1}>{r.pillarScores ? pillarVerdict(r.pillarScores[p.key]).label : '—'}</Text>
                  ))}
                  <Text style={styles.compareCell} numberOfLines={1}>{t(VIEW_LABELS[r.status])}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {records.map((record, i) => {
          const draft = drafts[record.id];
          const answered = ANSWERED[record.status];
          return (
            <FadeIn key={record.id} delay={i * 70}>
              <Card style={styles.card} padding={18}>
                <View style={styles.cardHead}>
                  <View style={styles.portrait}>
                    {record.photo ? <Image source={{ uri: record.photo }} style={styles.portraitImg} /> : <Lock size={18} color={colors.textLight} />}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.name}>{record.candidateName}, {record.candidateAge}</Text>
                    <View style={styles.verified}>
                      <ShieldCheck size={13} color={colors.success} />
                      <Text style={styles.meta}>
                        {record.candidateCity ? `${record.candidateCity} · ` : ''}{record.idVerified ? t('ID verified') : t('Phone verified')}
                      </Text>
                    </View>
                  </View>
                  {record.overlapScore != null && <ScoreRing score={record.overlapScore} size={64} />}
                </View>

                {record.pillarScores && (
                  <View style={styles.pillars}>
                    {PILLARS.map((p) => {
                      const v = pillarVerdict(record.pillarScores[p.key]);
                      return (
                        <View key={p.key} style={styles.pillarRow}>
                          <Text style={styles.pillarName}>{t(p.title)}</Text>
                          <Badge label={v.label} tone={v.tone} />
                        </View>
                      );
                    })}
                  </View>
                )}

                {record.childNote ? (
                  <View style={styles.childNote}>
                    <Quote size={14} color={colors.gold} />
                    <Text style={styles.childNoteText}>{record.childNote}</Text>
                  </View>
                ) : null}

                {familyMode && portal.canPropose && (
                  record.contacted ? (
                    <Text style={styles.small}>{t('Already in touch with this person')}</Text>
                  ) : (portal.proposals || []).some((p) => p.shareId === record.id && p.status === 'pending') ? (
                    <Text style={styles.small}>{t('You suggested an interest — waiting for {child}.', { child: childName })}</Text>
                  ) : (
                    <Button small variant="secondary" icon={Send} label={t('Suggest sending interest')} onPress={() => { setProposing(record); setProposalNote(''); }} />
                  )
                )}

                <View style={styles.masked}>
                  <Lock size={12} color={colors.textMuted} />
                  <Text style={styles.maskedText}>{t('Phone, email and chats are hidden from this view.')}</Text>
                </View>

                {record.status !== 'awaiting' && !draft ? (
                  <View style={[styles.answered, { backgroundColor: answered[3] }]}>
                    {React.createElement(answered[1], { size: 16, color: answered[2], strokeWidth: 2.6 })}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.answeredTitle}>{t(answered[0])}</Text>
                      <Text style={styles.answeredSub}>
                        {t('{feedbackNote} · awaiting {childName}', { feedbackNote: t(record.feedbackNote), childName })}
                      </Text>
                    </View>
                    {familyMode && (
                      <TouchableOpacity onPress={() => reopen(record)} accessibilityRole="button">
                        <Text style={styles.change}>{t('Change my view')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : familyMode ? (
                  <View style={{ gap: 10 }}>
                    <View style={styles.actions} accessibilityRole="radiogroup">
                      {DECISIONS.map(([key, label, Icon, fg, bg]) => {
                        const on = draft?.decision === key;
                        return (
                          <TouchableOpacity
                            key={key}
                            disabled={pendingId === record.id}
                            onPress={() => setDraft(record.id, { decision: key })}
                            style={[styles.decision, { backgroundColor: on ? bg : colors.card, borderColor: on ? fg : colors.cardBorder }]}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: on }}
                          >
                            <Icon size={16} color={fg} />
                            <Text style={[styles.decisionText, { color: on ? fg : colors.textPrimary }]} numberOfLines={1}>{t(label)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {draft?.decision && (
                      <>
                        <TextInput
                          value={draft.note || ''}
                          onChangeText={(v) => setDraft(record.id, { note: v })}
                          placeholder={t('Add a note for {child} (optional)', { child: childName })}
                          placeholderTextColor={colors.textLight}
                          multiline
                          maxLength={500}
                          style={styles.noteInput}
                          accessibilityLabel={t('Note')}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          {record.status !== 'awaiting' && (
                            <Button small variant="secondary" label={t('Cancel')} style={{ flex: 1 }} onPress={() => dropDraft(record.id)} />
                          )}
                          <Button
                            small
                            label={pendingId === record.id ? t('Sending…') : t('Send my view')}
                            disabled={pendingId === record.id}
                            style={{ flex: 2 }}
                            onPress={() => respond(record.id)}
                          />
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <Text style={styles.small}>{t('Waiting for their view')}</Text>
                )}
              </Card>
            </FadeIn>
          );
        })}

        {portal && records.length === 0 && (
          <Card variant="tinted" style={styles.emptyCard}>
            <Eye size={26} color={colors.gold} />
            <Text style={styles.emptyTitle}>{t('No profiles shared right now')}</Text>
            <Text style={styles.emptyText}>{t('When {childName} forwards a profile, it will appear here for you to review.', { childName })}</Text>
          </Card>
        )}

        {familyMode && portal?.canManage && portal.profileDetails && (
          <Card style={{ gap: 6 }} padding={16}>
            <View style={styles.sectionHead}>
              <ClipboardList size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>{t('{child}’s personal details', { child: childName })}</Text>
            </View>
            <Text style={styles.small}>{t('{child} asked you to help complete these. They’re notified of every change.', { child: childName })}</Text>
            <DetailsSections person={{ details: portal.profileDetails, firstName: portal.profileDetails.firstName }} own onEdit={setEditing} />
          </Card>
        )}

        {familyMode && portal && (
          <Card style={{ gap: 10 }} padding={16}>
            <View style={styles.sectionHead}>
              <Gift size={20} color={colors.gold} />
              <Text style={styles.sectionTitle}>{t('Gift {child} a 3Knot plan', { child: childName })}</Text>
            </View>
            <Text style={styles.small}>{t('Unlimited interests, see who’s interested, and more. {child} is told it’s from you.', { child: childName })}</Text>
            {PLAN_CATALOG.filter((p) => p.months === 3).map((p) => (
              <Button
                key={p.code}
                small
                variant={p.tier === 'premium' ? 'gold' : 'secondary'}
                label={t('{name} · 3 months · {price}', { name: t(TIER_INFO[p.tier].name), price: priceText(p.pricePaise) })}
                onPress={() => giftStart(p.code)}
              />
            ))}
          </Card>
        )}

        {portal && (
          <View style={styles.disclaimer}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={styles.disclaimerText}>
              {t('Parents cannot search, message, or browse other profiles. Access ends when {childName} revokes it or the share expires.', { childName })}
            </Text>
          </View>
        )}
      </View>

      {editing && (
        <SectionEditSheet sectionKey={editing} values={portal.profileDetails} save={saveDetails} exclude={['firstName']} onClose={() => setEditing(null)} />
      )}

      {proposing && (
        <Sheet
          title={t('Suggest an interest in {candidateName}', { candidateName: proposing.candidateName })}
          onClose={() => setProposing(null)}
          footer={<Button label={t('Send suggestion')} onPress={proposeNow} />}
        >
          <Text style={styles.small}>{t('{child} sees your suggestion and decides whether to send it.', { child: childName })}</Text>
          <TextInput
            value={proposalNote}
            onChangeText={setProposalNote}
            placeholder={t('A note {child} can send with the interest (optional)', { child: childName })}
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            style={styles.noteInput}
            accessibilityLabel={t('Note')}
          />
        </Sheet>
      )}

      {gift && (
        <Sheet title={t('Test payment')} onClose={() => setGift(null)} footer={<Button variant="gold" label={t('Pay (test)')} onPress={giftPay} />}>
          <Text style={styles.small}>{t('Payments are in test mode. No money is charged.')}</Text>
          <View style={styles.giftRow}>
            <Text style={styles.sectionTitle}>{t('Gift: {name} · 3 months', { name: t(TIER_INFO[gift.product.tier].name) })}</Text>
            <Text style={styles.sectionTitle}>{gift.product.price}</Text>
          </View>
        </Sheet>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundImage: gradients.hero,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 6,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOut: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,246,238,0.08)', borderWidth: 1, borderColor: 'rgba(255,246,238,0.24)',
  },
  readOnly: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  readOnlyText: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 10, letterSpacing: 1.6, color: colors.gold, textTransform: 'uppercase' },
  sharedBy: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: 'rgba(255,246,238,0.75)', marginTop: 8 },
  heroText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: 'rgba(255,246,238,0.78)', marginTop: 6 },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  body: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30, gap: 14 },
  note: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 17, color: colors.textPrimary, letterSpacing: -0.3, flexShrink: 1 },
  card: { gap: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  portrait: {
    width: 56, height: 56, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.cardSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  portraitImg: { width: '100%', height: '100%' },
  name: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 22.4, color: colors.textPrimary, letterSpacing: -0.4 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary },
  pillars: { gap: 10, padding: 14, borderRadius: radii.md, backgroundColor: colors.cardSecondary },
  pillarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pillarName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  childNote: { flexDirection: 'row', gap: 8 },
  childNoteText: {
    flex: 1, fontFamily: fonts.sans, fontWeight: '800', fontSize: 14.4, lineHeight: 19.2, color: colors.textPrimary, letterSpacing: -0.4,
  },
  masked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  maskedText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted },
  answered: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radii.md },
  answeredTitle: { fontFamily: fonts.sans, fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  answeredSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary },
  change: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '700', color: colors.accent },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  decision: {
    flexGrow: 1, flexBasis: 100, height: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  decisionText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '800' },
  noteInput: {
    minHeight: 76, padding: 12, borderRadius: radii.md, backgroundColor: colors.cardSecondary, borderWidth: 1,
    borderColor: colors.cardBorder, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, textAlignVertical: 'top', outlineStyle: 'none',
  },
  compare: { flexDirection: 'row', gap: 12 },
  compareCol: { flex: 1, gap: 8, minWidth: 0 },
  compareHead: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  compareLabel: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  compareCell: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textPrimary },
  giftRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 19.2, color: colors.textPrimary, letterSpacing: -0.4 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 6, paddingTop: 4 },
  disclaimerText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
});
