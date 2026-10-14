import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Plus } from 'lucide-react';

export const PhotoVerificationScreen = () => {
  const { setCurrentScreen, user, setUser } = useApp();

  const [blurMutual, setBlurMutual] = useState(user?.photoBlurredUntilMutual ?? true);
  const [hideSearch, setHideSearch] = useState(user?.hideFromSearchEngines ?? true);

  const handleContinue = () => {
    setUser((prev) => ({
      ...prev,
      photoBlurredUntilMutual: blurMutual,
      hideFromSearchEngines: hideSearch,
    }));
    setCurrentScreen('blueprint-summary');
  };

  const photos = user?.photos || [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Photos, on your{'\n'}terms</Text>
        <Text style={styles.subtitle}>
          Blurred by default. They unblur only when you both say yes.
        </Text>
      </View>

      {/* 3x1 Photo Upload Grid */}
      <View style={styles.photoGrid}>
        <View style={styles.photoSlot}>
          <Image source={{ uri: photos[0] }} style={styles.photoImg} />
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>PRIMARY</Text>
          </View>
        </View>

        <View style={styles.photoSlot}>
          <Image source={{ uri: photos[1] }} style={styles.photoImg} />
        </View>

        <TouchableOpacity style={styles.addPhotoSlot}>
          <Plus size={24} color="#C0B0A0" />
        </TouchableOpacity>
      </View>

      {/* Privacy Settings Card */}
      <View style={styles.privacyCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingTitle}>Blur until mutual interest</Text>
          <TouchableOpacity
            onPress={() => setBlurMutual((b) => !b)}
            style={blurMutual ? styles.toggleActive : styles.toggleInactive}
          >
            <View style={[styles.thumb, !blurMutual && styles.thumbInactive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextGroup}>
            <Text style={styles.settingTitle}>Hide from search engines</Text>
            <Text style={styles.settingSub}>Recommended</Text>
          </View>
          <TouchableOpacity
            onPress={() => setHideSearch((h) => !h)}
            style={hideSearch ? styles.toggleActive : styles.toggleInactive}
          >
            <View style={[styles.thumb, !hideSearch && styles.thumbInactive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ID Verification Card */}
      <View style={styles.idCard}>
        <View style={styles.idIconBox}>
          <ShieldCheck size={20} color={theme.colors.white} />
        </View>
        <View style={styles.idInfo}>
          <Text style={styles.idTitle}>Get the verified badge</Text>
          <Text style={styles.idDesc}>
            One-time ID check. We store a hash, never the document.
          </Text>
        </View>
      </View>

      {/* Action */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleContinue}
        style={styles.continueBtn}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
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
    lineHeight: 18,
  },
  photoGrid: {
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7DACA',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 253, 249, 0.85)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 8.5,
    fontWeight: '600',
    color: '#8A756A',
  },
  addPhotoSlot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDCDB9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardSecondary,
  },
  privacyCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  settingRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  settingTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  settingSub: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.colors.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E7DA',
  },
  toggleActive: {
    width: 44,
    height: 26,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
    padding: 3,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  toggleInactive: {
    width: 44,
    height: 26,
    borderRadius: 99,
    backgroundColor: '#E7DACA',
    padding: 3,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: theme.colors.white,
  },
  thumbInactive: {
    backgroundColor: theme.colors.card,
  },
  idCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  idIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  idTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  idDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },
  continueBtn: {
    marginTop: 'auto',
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
