import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const SentFamilyResponsesScreen = () => {
  const { sentRecords, setCurrentScreen } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Sent to family</Text>
        <Text style={styles.subtitle}>
          {sentRecords.length} shared · {sentRecords.filter((r) => r.status === 'awaiting').length} awaiting a response
        </Text>
      </View>

      {/* List of Sent Cards */}
      <View style={styles.recordsList}>
        {sentRecords.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            {/* Top row: thumbnail, name, sent time, score */}
            <View style={styles.recordTopRow}>
              <View style={styles.recordThumbnail}>
                <Text style={styles.recordThumbChar}>{record.candidateName[0]}</Text>
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.candidateName}>
                  {record.candidateName}, {record.candidateAge}
                </Text>
                <Text style={styles.sentTime}>
                  Sent to {record.recipientParentName} · {record.sentAt}
                </Text>
              </View>
              <Text style={styles.scoreText}>{record.overlapScore}%</Text>
            </View>

            {/* Status / Feedback Box */}
            {record.status === 'approved' && (
              <View style={styles.approvedBox}>
                <Text style={styles.approvedTag}>AMMA APPROVED</Text>
                <Text style={styles.feedbackQuote}>{record.feedbackNote}</Text>
              </View>
            )}

            {record.status === 'awaiting' && (
              <View style={styles.awaitingBox}>
                <Text style={styles.awaitingText}>{record.feedbackNote}</Text>
              </View>
            )}

            {record.status === 'concern_raised' && (
              <View style={styles.concernBox}>
                <Text style={styles.concernTag}>CONCERN RAISED</Text>
                <Text style={styles.feedbackQuote}>{record.feedbackNote}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Advice vs Veto Philosophy Banner */}
      <View style={styles.footerGroup}>
        <Text style={styles.advicePhilosophyText}>
          A parent’s note is advice, not a veto. The decision stays yours.
        </Text>
        <TouchableOpacity
          onPress={() => setCurrentScreen('link-parent')}
          style={styles.manageFamilyBtn}
        >
          <Text style={styles.manageFamilyBtnText}>Manage family access</Text>
        </TouchableOpacity>
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
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  recordCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 18,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
  },
  recordTopRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#E7DACA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordThumbChar: {
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  recordInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  candidateName: {
    fontFamily: theme.fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  sentTime: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  scoreText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  approvedBox: {
    backgroundColor: '#F8F2E9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  approvedTag: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  awaitingBox: {
    backgroundColor: '#F8F2E9',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E7DACA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  awaitingText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: '#96806F',
  },
  concernBox: {
    backgroundColor: '#F8F2E9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  concernTag: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    color: '#8A756A',
  },
  feedbackQuote: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4B3833',
  },
  footerGroup: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
    paddingTop: 8,
  },
  advicePhilosophyText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#96806F',
    textAlign: 'center',
  },
  manageFamilyBtn: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    paddingVertical: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageFamilyBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
