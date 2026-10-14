import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ProfileThumbnailRow } from '../../components/feed/ProfileThumbnailRow';
import { ScopedShareSheet } from '../../components/family/ScopedShareSheet';

export const ProfileListScreen = () => {
  const {
    candidates,
    setCurrentScreen,
    setSelectedCandidateForChat,
    sendBatchShare,
  } = useApp();

  const [activeGender, setActiveGender] = useState('Grooms');
  const [activeFilter, setActiveFilter] = useState('80%+');
  const [selectedIds, setSelectedIds] = useState(['candidate-rohan-01', 'candidate-aditya-02']);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedCandidates = candidates.filter((c) => selectedIds.includes(c.id));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Grooms for you</Text>
            <Text style={styles.subtitle}>64 profiles · sorted by blueprint fit</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          {['Grooms', 'Brides', '80%+', 'Verified'].map((chip) => {
            const isActive = chip === activeGender || chip === activeFilter;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => {
                  if (chip === 'Grooms' || chip === 'Brides') setActiveGender(chip);
                  else setActiveFilter(chip);
                }}
                style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
              >
                <Text
                  style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scannable Profile List */}
        <View style={styles.listContainer}>
          {candidates.map((candidate) => (
            <ProfileThumbnailRow
              key={candidate.id}
              candidate={candidate}
              selected={selectedIds.includes(candidate.id)}
              onToggleSelect={() => toggleSelect(candidate.id)}
              onPressCard={() => {
                setSelectedCandidateForChat(candidate);
                setCurrentScreen('feed');
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Batch Action Bar */}
      {selectedIds.length > 0 && (
        <View style={styles.floatingBarWrapper}>
          <View style={styles.floatingBar}>
            <View style={styles.floatingTextGroup}>
              <Text style={styles.floatingTitle}>{selectedIds.length} selected</Text>
              <Text style={styles.floatingSub}>Send to family or express interest</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setShowBatchModal(true)}
              style={styles.sendPillBtn}
            >
              <Text style={styles.sendPillText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Batch Send Modal */}
      {showBatchModal && (
        <ScopedShareSheet
          batchCandidates={selectedCandidates}
          onClose={() => setShowBatchModal(false)}
          onSend={sendBatchShare}
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
    paddingBottom: 90, // Room for floating bar
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  topHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textMuted,
  },
  filterBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 99,
  },
  filterBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B3833',
  },
  chipsRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 4,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 99,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
  },
  chipInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  chipText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  chipTextInactive: {
    color: '#4B3833',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  floatingBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    zIndex: 40,
  },
  floatingBar: {
    backgroundColor: theme.colors.accent,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#5A3C2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  floatingTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  floatingTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  floatingSub: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: 'rgba(255, 248, 242, 0.85)',
  },
  sendPillBtn: {
    backgroundColor: theme.colors.white,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 99,
  },
  sendPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.accent,
  },
});
