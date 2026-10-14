import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { VibeTileGrid } from '../../components/vibes/VibeTileGrid';

export const ValuesVibesPickerScreen = () => {
  const { setCurrentScreen, user, toggleVibe } = useApp();
  const selectedCount = user?.vibes?.length || 4;

  const handleFinish = () => {
    setCurrentScreen('photos');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.stepTag}>STEP 04 / 04 · VALUES & VIBES</Text>
        <Text style={styles.title}>Pick six that feel{'\n'}like your Sunday</Text>
        <Text style={styles.subtitle}>
          Chosen {selectedCount} of 6. Visual, not verbal — this is the texture of daily life.
        </Text>
      </View>

      {/* 3x3 Vibe Grid */}
      <VibeTileGrid
        selectedVibes={user?.vibes || []}
        onToggleVibe={toggleVibe}
      />

      {/* Tile Art Note */}
      <Text style={styles.tileArtNote}>TILE ART — 24 CURATED IMAGES</Text>

      {/* Bottom Actions */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('photos')}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleFinish}
          style={styles.finishBtn}
        >
          <Text style={styles.finishBtnText}>Finish · see matches</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stepTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  tileArtNote: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#A8927F',
    textAlign: 'center',
    marginVertical: 4,
  },
  bottomRow: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  skipBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  finishBtn: {
    flex: 2,
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
