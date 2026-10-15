import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Users, MessageCircle, Heart, Inbox } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, FadeIn, Eyebrow, Heading, Body, Card, Avatar, Badge, SectionLabel } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

export const ConversationsListScreen = () => {
  const { conversations: all, openThreadById, sentRecords } = useApp();
  const requests = all.filter((t) => t.needsMyResponse);
  const [tab, setTab] = useState(requests.length ? 'requests' : 'chats');
  const conversations = tab === 'requests' ? requests : all.filter((t) => !t.needsMyResponse);
  const previewFor = (t) => (t.needsMyResponse
    ? `Interested in you${t.lastMessage ? ` — “${t.lastMessage}”` : ''}`
    : t.status === 'requested' ? 'Interest sent · waiting'
      : t.status === 'declined' ? 'Not available' : t.lastMessage || 'Say hello — no messages yet');

  const unreadCount = all.filter((t) => t.unread).length;
  const latestParentResponse = sentRecords.find((r) => r.status !== 'awaiting');

  return (
    <Screen tabBar>
      <FadeIn>
        <View style={styles.titleRow}>
          <View style={{ gap: 4 }}>
            <Eyebrow>Messages</Eyebrow>
            <Heading size={38}>Conversations</Heading>
          </View>
          {unreadCount > 0 && <Badge label={`${unreadCount} new`} tone="accent" style={{ marginBottom: 8 }} />}
        </View>
      </FadeIn>

      <View style={styles.tabs} accessibilityRole="tablist">
        {[['chats', t('Chats')], ['requests', `${t('Requests')}${requests.length ? ` (${requests.length})` : ''}`]].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
            <Text style={[styles.tabText, tab === key && { color: colors.accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {conversations.map((thread, i) => (
          <FadeIn key={thread.id} delay={60 + i * 50}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => openThreadById(thread.id)}
              style={[styles.thread, thread.unread && styles.threadUnread]}
            >
              <View>
                <Avatar uri={thread.candidatePhoto} name={thread.candidateName} size={56} />
                {thread.isBlurred && (
                  <View style={styles.lock}>
                    <Lock size={10} color={colors.white} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{thread.candidateName}</Text>
                  {thread.overlapScore != null && <Text style={styles.score}>{thread.overlapScore}%</Text>}
                  <Text style={styles.time}>{thread.lastMessageTime || ''}</Text>
                </View>
                <Text
                  style={[styles.preview, thread.unread && styles.previewUnread]}
                  numberOfLines={1}
                >
                  {previewFor(thread)}
                </Text>
              </View>
              {thread.unread ? (
                <View style={styles.unreadCount}>
                  <Text style={styles.unreadCountText}>{thread.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </FadeIn>
        ))}
        {conversations.length === 0 && (
          <Card variant="tinted" style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
            {tab === 'requests' ? <Inbox size={26} color={colors.gold} /> : <MessageCircle size={26} color={colors.gold} />}
            <Body style={{ textAlign: 'center' }}>{tab === 'requests' ? 'No interest requests waiting.' : 'No conversations yet. Express interest from your feed.'}</Body>
          </Card>
        )}
      </View>

      {latestParentResponse && (
        <FadeIn delay={260}>
          <View style={{ gap: 10 }}>
            <SectionLabel>Shared with parents</SectionLabel>
            <Card variant="gold" style={styles.parentCard}>
              <View style={styles.parentIcon}>
                <Users size={16} color="#8A6A2E" />
              </View>
              <Text style={styles.parentText}>
                {latestParentResponse.recipientParentName}{' '}
                {latestParentResponse.status === 'approved' ? 'approved' : 'raised a concern about'}{' '}
                <Text style={styles.parentStrong}>{latestParentResponse.candidateName}</Text> ·{' '}
                {latestParentResponse.sentAt}
              </Text>
            </Card>
          </View>
        </FadeIn>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.cardSecondary, marginVertical: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabOn: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  threadUnread: {
    borderColor: 'rgba(168, 30, 60, 0.25)',
    boxShadow: '0 8px 22px rgba(168, 30, 60, 0.1)',
  },
  lock: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 17.6,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  score: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  time: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  preview: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  previewUnread: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  openPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundImage: gradients.primary,
  },
  openText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.white,
  },
  unreadCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundImage: gradients.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.white,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundImage: gradients.primary,
  },
  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  parentIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  parentStrong: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
