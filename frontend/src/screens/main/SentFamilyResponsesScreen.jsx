import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Check, AlertTriangle, Hourglass, Settings2, Quote, ChevronDown, ChevronUp, HelpCircle, ThumbsUp } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, FadeIn, Eyebrow, Heading, Card, Badge, Button, Body, Avatar } from '../../components/ui/kit';

const { colors, fonts, radii } = theme;

const STATUS = {
  approved: { tone: 'success', icon: Check },
  unsure: { tone: 'gold', icon: HelpCircle },
  concern_raised: { tone: 'warning', icon: AlertTriangle },
  awaiting: { tone: 'neutral', icon: Hourglass },
};

export const SentFamilyResponsesScreen = () => {
  const { sentRecords, setCurrentScreen, familyVotes, loadFamilyVotes } = useApp();
  useEffect(() => {
    loadFamilyVotes();
  }, [loadFamilyVotes, sentRecords]);
  const [showExpired, setShowExpired] = useState(false);
  const active = sentRecords.filter((r) => !r.expired);
  const expired = sentRecords.filter((r) => r.expired);

  const counts = {
    shared: sentRecords.length,
    awaiting: sentRecords.filter((r) => r.status === 'awaiting').length,
    approved: sentRecords.filter((r) => r.status === 'approved').length,
  };

  return (
    <Screen tabBar>
      <FadeIn>
        <View style={styles.titleRow}>
          <View style={{ gap: 4, flex: 1 }}>
            <Eyebrow>Family co-pilot</Eyebrow>
            <Heading size={38}>Sent to family</Heading>
          </View>
          <TouchableOpacity onPress={() => setCurrentScreen('link-parent')} style={styles.manage}>
            <Settings2 size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </FadeIn>

      <FadeIn delay={60}>
        <Card variant="dark" style={styles.stats}>
          {[
            ['Shared', counts.shared],
            ['Awaiting', counts.awaiting],
            ['Approved', counts.approved],
          ].map(([label, n], i) => (
            <View key={label} style={[styles.stat, i > 0 && styles.statDivider]}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </Card>
        <Text style={styles.statsCaption}>
          {counts.shared} shared · {counts.awaiting} awaiting a response
        </Text>
      </FadeIn>

      {familyVotes.length > 0 && (
        <Card style={{ gap: 12, marginBottom: 12 }}>
          <Text style={styles.recordMeta}>FAMILY VOTES</Text>
          {familyVotes.map((v) => (
            <View key={v.candidateId} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar uri={v.candidatePhoto} name={v.candidateName} size={34} />
                <Text style={[styles.recordName, { flex: 1 }]}>{v.candidateName}, {v.candidateAge}</Text>
                <ThumbsUp size={14} color={colors.success} /><Text style={styles.recordMeta}>{v.tally.approved}</Text>
                <HelpCircle size={14} color={colors.gold} /><Text style={styles.recordMeta}>{v.tally.unsure}</Text>
                <AlertTriangle size={14} color={colors.warning} /><Text style={styles.recordMeta}>{v.tally.concern_raised}</Text>
              </View>
              <Text style={styles.recordMeta}>
                {v.votes.map((x) => `${x.name}: ${{ approved: 'yes', unsure: 'unsure', concern_raised: 'concern', awaiting: 'waiting' }[x.status]}`).join(' · ')}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <View style={{ gap: 12 }}>
        {[...active, ...(showExpired ? expired : [])].map((record, i) => {
          const st = STATUS[record.status] || STATUS.awaiting;
          return (
            <FadeIn key={record.id} delay={100 + Math.min(i, 6) * 50}>
              <Card style={[styles.record, record.expired && { opacity: 0.6 }]}>
                <View style={styles.recordTop}>
                  <Avatar uri={record.candidatePhoto} name={record.candidateName} size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.recordName}>
                      {record.candidateName}, {record.candidateAge}
                    </Text>
                    <Text style={styles.recordMeta}>
                      Sent to {record.recipientParentName} · {record.sentAt}
                      {record.expired ? ' · access expired' : ''}
                    </Text>
                  </View>
                  {record.overlapScore != null && <Text style={styles.recordScore}>{record.overlapScore}%</Text>}
                </View>

                <View style={styles.statusRow}>
                  <Badge label={record.statusBadge || 'AWAITING REVIEW'} tone={st.tone} icon={st.icon} />
                </View>
                {record.status === 'awaiting' ? (
                  <Text style={styles.awaiting}>{record.feedbackNote}</Text>
                ) : (
                  <View style={styles.feedback}>
                    <Quote size={14} color={colors.textLight} />
                    <Text style={styles.feedbackText}>{record.feedbackNote}</Text>
                  </View>
                )}
              </Card>
            </FadeIn>
          );
        })}
        {expired.length > 0 && (
          <TouchableOpacity onPress={() => setShowExpired((v) => !v)} style={styles.expiredToggle}>
            <Text style={styles.expiredText}>
              {showExpired ? 'Hide' : 'Show'} {expired.length} expired share{expired.length === 1 ? '' : 's'}
            </Text>
            {showExpired ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
        {sentRecords.length === 0 && (
          <Card variant="tinted" style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
            <Users size={26} color={colors.gold} />
            <Body style={{ textAlign: 'center' }}>
              Nothing shared yet. Use “Share with parents” on any match.
            </Body>
          </Card>
        )}
      </View>

      <FadeIn delay={300}>
        <View style={{ gap: 12 }}>
          <Card variant="gold" style={styles.advice}>
            <Text style={styles.adviceText}>A parent’s note is advice, not a veto. The decision stays yours.</Text>
          </Card>
          <Button
            label="Manage family access"
            variant="secondary"
            icon={Settings2}
            onPress={() => setCurrentScreen('link-parent')}
          />
        </View>
      </FadeIn>
    </Screen>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  manage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.14)',
  },
  statNum: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 28.8,
    color: colors.onDark,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  statsCaption: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  record: {
    gap: 12,
    padding: 16,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordName: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17.6,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  recordMeta: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  recordScore: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 20.8,
    color: colors.accent,
    letterSpacing: -0.4,
  },
  statusRow: {
    flexDirection: 'row',
  },
  awaiting: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  feedback: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
  },
  feedbackText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 13.6,
    lineHeight: 17.6,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  expiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
  },
  expiredText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  advice: {
    padding: 16,
  },
  adviceText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 14.4,
    lineHeight: 19.2,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
});
