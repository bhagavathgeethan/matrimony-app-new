import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ChevronRight, Download, Trash2 } from 'lucide-react';

export const PrivacyErasureScreen = () => {
  const { setCurrentScreen } = useApp();
  const [hideKnown, setHideKnown] = useState(true);
  const [erasureRequested, setErasureRequested] = useState(false);

  const handleDownloadData = () => {
    alert('DPDP JSON Export generated! Data export bundle ready for download.');
  };

  const handleRequestErasure = () => {
    setErasureRequested(true);
    alert('DPDP 72-Hour Erasure Request Registered. Cryptographic Audit Hash: DPDP-DEL-HASH-9F8A2.');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.title}>Privacy & data</Text>

      {/* Settings Menu List */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuRow}>
          <Text style={styles.menuLabel}>Who can see my profile</Text>
          <Text style={styles.menuValue}>Matches only ›</Text>
        </TouchableOpacity>

        <View style={styles.menuRow}>
          <Text style={styles.menuLabel}>Hide from people I know</Text>
          <TouchableOpacity
            onPress={() => setHideKnown((k) => !k)}
            style={hideKnown ? styles.toggleActive : styles.toggleInactive}
          >
            <View style={[styles.thumb, !hideKnown && styles.thumbInactive]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setCurrentScreen('consent')}
          style={styles.menuRow}
        >
          <Text style={styles.menuLabel}>Consent settings</Text>
          <Text style={styles.menuValue}>3 of 4 on ›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDownloadData} style={styles.menuRow}>
          <Text style={styles.menuLabel}>Download my data</Text>
          <Text style={styles.menuValue}>JSON · Instant ›</Text>
        </TouchableOpacity>
      </View>

      {/* DPDP 72-Hour Account Erasure Card */}
      <View style={styles.erasureCard}>
        <Text style={styles.erasureTitle}>Erase my account</Text>
        <Text style={styles.erasureSubtitle}>
          Under the DPDP Act you can withdraw consent entirely. Here’s exactly what happens:
        </Text>

        <View style={styles.stepsList}>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>01</Text>
            <Text style={styles.stepText}>
              Profile, photos and blueprint answers are deleted, not deactivated
            </Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>02</Text>
            <Text style={styles.stepText}>
              Parent links revoked; shared cards vanish from their dashboards
            </Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>03</Text>
            <Text style={styles.stepText}>
              Messages you sent are anonymised to “Former member”
            </Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>04</Text>
            <Text style={styles.stepText}>
              Only a hashed record of the deletion request is retained, for audit
            </Text>
          </View>
        </View>

        <Text style={styles.erasureWarning}>Completed within 72 hours. Irreversible.</Text>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleRequestErasure}
          style={styles.erasureBtn}
        >
          <Text style={styles.erasureBtnText}>
            {erasureRequested ? 'Erasure Scheduled (72h)' : 'Request erasure'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={() => setCurrentScreen('welcome')}
        style={styles.signOutBtn}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
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
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    color: theme.colors.textPrimary,
  },
  menuContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  menuRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DA',
  },
  menuLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  menuValue: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    color: theme.colors.textSubtle,
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
  erasureCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 18,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  erasureTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  erasureSubtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  stepNumber: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  stepText: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: '#4B3833',
    fontWeight: '500',
  },
  erasureWarning: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: '#96806F',
    fontWeight: '500',
  },
  erasureBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  erasureBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  signOutBtn: {
    marginTop: 'auto',
    paddingVertical: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSubtle,
  },
});
