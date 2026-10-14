import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const DPDPConsentScreen = () => {
  const { setCurrentScreen, user, updateConsent } = useApp();

  const [matching, setMatching] = useState(user?.consent?.matching ?? true);
  const [familySharing, setFamilySharing] = useState(user?.consent?.familySharing ?? true);
  const [productResearch, setProductResearch] = useState(user?.consent?.productResearch ?? false);
  const [marketing, setMarketing] = useState(user?.consent?.marketing ?? false);

  const handleContinue = () => {
    updateConsent({ matching, familySharing, productResearch, marketing });
    setCurrentScreen('basics');
  };

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.stepTag}>STEP 01 / 04 · CONSENT</Text>
        <Text style={styles.title}>What you’re{'\n'}agreeing to</Text>
        <Text style={styles.subtitle}>
          Granular, itemised, and reversible any time from Settings.
        </Text>
      </View>

      {/* Itemised Consent Toggles */}
      <View style={styles.togglesList}>
        {/* Matching (Required) */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Matching (required)</Text>
            <Text style={styles.toggleDesc}>Blueprint answers used to compute scores</Text>
          </View>
          <View style={styles.toggleSwitchActive}>
            <View style={styles.switchThumb} />
          </View>
        </View>

        {/* Family Sharing */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Family sharing</Text>
            <Text style={styles.toggleDesc}>Let me forward chosen profiles to a parent</Text>
          </View>
          <TouchableOpacity
            onPress={() => setFamilySharing((s) => !s)}
            style={familySharing ? styles.toggleSwitchActive : styles.toggleSwitchInactive}
          >
            <View
              style={[
                styles.switchThumb,
                !familySharing && styles.switchThumbInactive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Product Research */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Product research</Text>
            <Text style={styles.toggleDesc}>Anonymised analytics to improve matching</Text>
          </View>
          <TouchableOpacity
            onPress={() => setProductResearch((s) => !s)}
            style={productResearch ? styles.toggleSwitchActive : styles.toggleSwitchInactive}
          >
            <View
              style={[
                styles.switchThumb,
                !productResearch && styles.switchThumbInactive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Marketing */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Marketing messages</Text>
            <Text style={styles.toggleDesc}>Offers by SMS, email or WhatsApp</Text>
          </View>
          <TouchableOpacity
            onPress={() => setMarketing((s) => !s)}
            style={marketing ? styles.toggleSwitchActive : styles.toggleSwitchInactive}
          >
            <View
              style={[
                styles.switchThumb,
                !marketing && styles.switchThumbInactive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Your Rights Card */}
      <View style={styles.rightsCard}>
        <Text style={styles.rightsTitle}>Your rights</Text>
        <Text style={styles.rightsDesc}>
          Download everything we hold, correct it, or ask for full erasure. Erasure completes within 72 hours across every table.
        </Text>
        <Text style={styles.rightsLink}>Read the full notice</Text>
      </View>

      {/* Action */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleContinue}
        style={styles.continueBtn}
      >
        <Text style={styles.continueBtnText}>Agree & continue</Text>
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
    lineHeight: 18,
  },
  togglesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  toggleCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 15,
    padding: 13,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  toggleTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  toggleDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.textSubtle,
  },
  toggleSwitchActive: {
    width: 44,
    height: 26,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
    padding: 3,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  toggleSwitchInactive: {
    width: 44,
    height: 26,
    borderRadius: 99,
    backgroundColor: '#E7DACA',
    padding: 3,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: theme.colors.white,
  },
  switchThumbInactive: {
    backgroundColor: theme.colors.card,
  },
  rightsCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E7DACA',
    borderRadius: 14,
    padding: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  rightsTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rightsDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },
  rightsLink: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.accent,
    paddingTop: 2,
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
