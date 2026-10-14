import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const ConversationsListScreen = () => {
  const { conversations, setCurrentScreen, setSelectedCandidateForChat, candidates } = useApp();

  const handleOpenChat = (thread) => {
    const candidate = candidates.find((c) => c.id === thread.candidateId) || {
      id: thread.candidateId,
      firstName: thread.candidateName,
      age: thread.candidateAge,
      city: thread.candidateCity,
      overlapScores: { overall: thread.overlapScore },
    };
    setSelectedCandidateForChat(candidate);
    setCurrentScreen('chat-thread');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.title}>Conversations</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3 new</Text>
        </View>
      </View>

      {/* Conversations List */}
      <View style={styles.threadsList}>
        {conversations.map((thread) => (
          <TouchableOpacity
            key={thread.id}
            activeOpacity={0.88}
            onPress={() => handleOpenChat(thread)}
            style={[styles.threadCard, thread.isBlurred && styles.threadCardBlurred]}
          >
            {/* Avatar (blurred or normal) */}
            <View style={styles.avatarBox}>
              {thread.isBlurred ? (
                <View style={styles.blurPlaceholder}>
                  <Text style={styles.blurText}>BLUR</Text>
                </View>
              ) : (
                <View style={styles.activeAvatar}>
                  <Text style={styles.avatarInitial}>{thread.candidateName[0]}</Text>
                </View>
              )}
            </View>

            {/* Thread Details */}
            <View style={styles.threadDetails}>
              <View style={styles.threadTitleRow}>
                <Text style={styles.candidateName}>{thread.candidateName}</Text>
                <Text style={styles.scoreText}>{thread.overlapScore}%</Text>
              </View>
              <Text style={styles.snippetText} numberOfLines={1}>
                {thread.lastMessage}
              </Text>
            </View>

            {/* Action / Unread Status */}
            {thread.isBlurred ? (
              <TouchableOpacity
                onPress={() => handleOpenChat(thread)}
                style={styles.openBtn}
              >
                <Text style={styles.openBtnText}>Open</Text>
              </TouchableOpacity>
            ) : thread.unread ? (
              <View style={styles.unreadDot} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Shared With Parents Notice */}
      <View style={styles.parentNoticeSection}>
        <Text style={styles.sectionTag}>SHARED WITH PARENTS</Text>
        <View style={styles.parentNoticeCard}>
          <View style={styles.parentNoticeAvatar} />
          <Text style={styles.parentNoticeText}>
            Amma approved <Text style={styles.boldText}>Rohan</Text> · 2 days ago
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  topHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    color: theme.colors.textPrimary,
  },
  badge: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 99,
  },
  badgeText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.white,
  },
  threadsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  threadCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  threadCardBlurred: {
    backgroundColor: '#F8F2E9',
    borderStyle: 'dashed',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  activeAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#E7DACA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: theme.fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  blurPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EFE4D4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurText: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: '#A8927F',
  },
  threadDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  threadTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  candidateName: {
    fontFamily: theme.fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scoreText: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  snippetText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
  },
  openBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  openBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.white,
  },
  parentNoticeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
  },
  sectionTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  parentNoticeCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    padding: 13,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  parentNoticeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F0E7DA',
  },
  parentNoticeText: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    color: '#4B3833',
  },
  boldText: {
    fontWeight: '700',
  },
});
