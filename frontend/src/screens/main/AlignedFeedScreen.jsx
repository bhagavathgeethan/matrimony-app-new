import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { MatchCard } from '../../components/feed/MatchCard';
import { ScopedShareSheet } from '../../components/family/ScopedShareSheet';

export const AlignedFeedScreen = () => {
  const {
    candidates,
    setCurrentScreen,
    setSelectedCandidateForChat,
    showShareModal,
    setShowShareModal,
    shareCandidate,
    setShareCandidate,
    shareWithFamily,
  } = useApp();

  const [filterTab, setFilterTab] = useState('Blueprint');
  const [candidateIndex, setCandidateIndex] = useState(0);

  const currentCandidate = candidates[candidateIndex] || candidates[0];
  const nextCandidate = candidates[(candidateIndex + 1) % candidates.length];

  const handlePass = () => {
    setCandidateIndex((prev) => (prev + 1) % candidates.length);
  };

  const handleStartChat = () => {
    setSelectedCandidateForChat(currentCandidate);
    setCurrentScreen('chat-thread');
  };

  const handleShareWithParents = () => {
    setShareCandidate(currentCandidate);
    setShowShareModal(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.title}>Aligned</Text>
          <View style={styles.filterPills}>
            {['Blueprint', 'Vibes', 'New'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setFilterTab(tab)}
                style={[
                  styles.filterPill,
                  filterTab === tab ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterTab === tab ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Active Candidate MatchCard */}
        <MatchCard
          candidate={currentCandidate}
          onPass={handlePass}
          onStartChat={handleStartChat}
          onShareWithParents={handleShareWithParents}
        />

        {/* Next in Feed Peek Card */}
        {nextCandidate && (
          <TouchableOpacity
            onPress={() => setCandidateIndex((candidateIndex + 1) % candidates.length)}
            style={styles.nextPeekCard}
          >
            <View style={styles.nextPeekInfo}>
              <Text style={styles.nextPeekName}>
                {nextCandidate.firstName}, {nextCandidate.age}
              </Text>
              <Text style={styles.nextPeekCity}>{nextCandidate.city} · next in your feed</Text>
            </View>
            <Text style={styles.nextPeekScore}>
              {nextCandidate.overlapScores?.overall || 81}%
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Scoped Family Share Bottom Sheet Modal */}
      {showShareModal && (
        <ScopedShareSheet
          candidate={shareCandidate || currentCandidate}
          onClose={() => setShowShareModal(false)}
          onSend={shareWithFamily}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  topHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  filterPills: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  filterPillActive: {
    backgroundColor: theme.colors.accent,
  },
  filterPillInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#F0E7DA',
  },
  filterPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: theme.colors.white,
  },
  filterPillTextInactive: {
    color: theme.colors.textSecondary,
  },
  nextPeekCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#F0E7DA',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.82,
  },
  nextPeekInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  nextPeekName: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    color: '#3A2926',
  },
  nextPeekCity: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
  },
  nextPeekScore: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.accent,
  },
});
