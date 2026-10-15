import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Lock, ShieldCheck, Check, AlertTriangle, Eye, Quote } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Screen, FadeIn, Eyebrow, Heading, Accent, Card, Chip, Badge, ScoreRing } from '../../components/ui/kit';

const { colors, fonts, gradients, radii } = theme;

const PILLARS = [
  ['money', 'Money philosophy'],
  ['roots', 'Roots & geography'],
  ['kids', 'Kids & parenting'],
  ['ambition', 'Career ambition'],
];

// Parents see a plain-language label rather than raw numbers
function pillarVerdict(score) {
  if (score >= 85) return ['Strong match', 'success'];
  if (score >= 70) return ['Close enough', 'gold'];
  return ['Worth a talk', 'neutral'];
}

// tokenFromUrl: set when a family member opens their SMS link (/portal/<token>) — no account needed.
// Without it, the signed-in member previews what each of their family members sees.
export const ParentPortalScreen = ({ tokenFromUrl = null }) => {
  const { familyLinks } = useApp();

  const portalParents = tokenFromUrl ? [] : familyLinks.filter((l) => l.portalToken);
  const [parentId, setParentId] = useState(null);
  const activeParent = portalParents.find((p) => p.id === parentId) || portalParents[0];
  const token = tokenFromUrl || activeParent?.portalToken;

  const [portal, setPortal] = useState(null);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const loadPortal = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setPortal(await api.getParentPortal(token));
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const respond = async (shareId, decision) => {
    setPendingId(shareId);
    try {
      await api.submitParentFeedback(token, shareId, decision);
      await loadPortal();
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const childName = portal?.childName || 'your child';
  const records = portal?.records || [];
  const awaiting = records.filter((r) => r.status === 'awaiting').length;

  return (
    <Screen padded={false}>
      {/* Read-only hero */}
      <View style={styles.hero}>
        <View style={styles.readOnly}>
          <Eye size={12} color={colors.gold} />
          <Text style={styles.readOnlyText}>Parent view · read only</Text>
        </View>
        <Text style={styles.sharedBy}>
          {portal ? `${portal.parentName} · shared by ${childName}` : `Shared by ${childName}`}
        </Text>
        <Heading size={40} color={colors.onDark} style={{ marginTop: 10 }}>
          {awaiting === 0
            ? 'Nothing awaiting\nyour view'
            : `${awaiting} profile${awaiting === 1 ? '' : 's'} await${awaiting === 1 ? 's' : ''}\nyour view`}
        </Heading>
        <Text style={styles.heroText}>
          {childName} chose to show you these. You can note approval or raise a concern — {childName} decides what
          happens next.
        </Text>
        {portalParents.length > 1 && (
          <View style={styles.switcher}>
            {portalParents.map((p) => (
              <Chip
                key={p.id}
                dark
                label={`View as ${p.name}`}
                active={p.id === activeParent?.id}
                onPress={() => setParentId(p.id)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {!token && <Text style={styles.note}>Add a family member from the Family tab to preview their view.</Text>}
        {error && <Text style={[styles.note, { color: colors.accent }]}>{error}</Text>}

        {records.map((record, i) => (
          <FadeIn key={record.id} delay={i * 70}>
            <Card style={styles.card} padding={18}>
              <View style={styles.cardHead}>
                <View style={styles.portrait}>
                  {record.photo ? (
                    <Image source={{ uri: record.photo }} style={styles.portraitImg} />
                  ) : (
                    <Lock size={18} color={colors.textLight} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.name}>
                    {record.candidateName}, {record.candidateAge}
                  </Text>
                  <View style={styles.verified}>
                    <ShieldCheck size={13} color={colors.success} />
                    <Text style={styles.meta}>
                      {record.candidateCity ? `${record.candidateCity} · ` : ''}{record.idVerified ? 'ID verified' : 'Phone verified'}
                    </Text>
                  </View>
                </View>
                {record.overlapScore !== null && <ScoreRing score={record.overlapScore} size={64} />}
              </View>

              {record.pillarScores && (
                <View style={styles.pillars}>
                  {PILLARS.map(([key, label]) => {
                    const [verdict, tone] = pillarVerdict(record.pillarScores[key]);
                    return (
                      <View key={key} style={styles.pillarRow}>
                        <Text style={styles.pillarName}>{label}</Text>
                        <Badge label={verdict} tone={tone} />
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

              <View style={styles.masked}>
                <Lock size={12} color={colors.textMuted} />
                <Text style={styles.maskedText}>Phone, email and chats are hidden from this view.</Text>
              </View>

              {record.status !== 'awaiting' ? (
                <View style={[styles.answered, record.status === 'approved' ? styles.answeredOk : styles.answeredWarn]}>
                  {record.status === 'approved' ? (
                    <Check size={16} color={colors.success} strokeWidth={3} />
                  ) : (
                    <AlertTriangle size={16} color={colors.warning} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.answeredTitle}>
                      {record.status === 'approved' ? 'You approved' : 'You raised a concern'}
                    </Text>
                    <Text style={styles.answeredSub}>
                      {record.feedbackNote} · awaiting {childName}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity
                    disabled={pendingId === record.id}
                    onPress={() => respond(record.id, 'concern_raised')}
                    style={styles.concernBtn}
                  >
                    <AlertTriangle size={16} color={colors.warning} />
                    <Text style={styles.concernText}>Raise a concern</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={pendingId === record.id}
                    onPress={() => respond(record.id, 'approved')}
                    style={styles.approveBtn}
                  >
                    <Check size={16} color={colors.white} strokeWidth={3} />
                    <Text style={styles.approveText}>I approve</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </FadeIn>
        ))}

        {activeParent && portal && records.length === 0 && (
          <Card variant="tinted" style={styles.emptyCard}>
            <Eye size={26} color={colors.gold} />
            <Text style={styles.emptyTitle}>No profiles shared right now</Text>
            <Text style={styles.emptyText}>
              When {childName} forwards a profile, it will appear here for you to review.
            </Text>
          </Card>
        )}

        <View style={styles.disclaimer}>
          <ShieldCheck size={14} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Parents cannot search, message, or browse other profiles. Access ends when {childName} revokes it or the
            share expires.
          </Text>
        </View>
      </View>
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
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  readOnlyText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  sharedBy: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,246,238,0.75)',
    marginTop: 8,
  },
  heroText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,246,238,0.78)',
    marginTop: 6,
  },
  switcher: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 14,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    gap: 16,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  portrait: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitImg: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 22.4,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillars: {
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarName: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  childNote: {
    flexDirection: 'row',
    gap: 8,
  },
  childNoteText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 14.4,
    lineHeight: 19.2,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  masked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  maskedText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  answered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
  },
  answeredOk: {
    backgroundColor: colors.successSoft,
  },
  answeredWarn: {
    backgroundColor: colors.warningSoft,
  },
  answeredTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  answeredSub: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  concernBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.warningSoft,
  },
  concernText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.warning,
  },
  approveBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundImage: 'linear-gradient(135deg, #3A9A7A 0%, #2E7D63 100%)',
    boxShadow: '0 10px 22px rgba(46, 125, 99, 0.3)',
  },
  approveText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 19.2,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
