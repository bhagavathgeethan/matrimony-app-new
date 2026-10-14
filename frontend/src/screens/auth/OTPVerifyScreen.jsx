import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ChevronLeft } from 'lucide-react';

export const OTPVerifyScreen = () => {
  const { setCurrentScreen, user } = useApp();
  const [digits, setDigits] = useState(['4', '8', '1', '', '', '']);

  const handleVerify = () => {
    setCurrentScreen('consent');
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => setCurrentScreen('phone')} style={styles.backBtn}>
        <ChevronLeft size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Enter the 6-digit{'\n'}code</Text>
        <Text style={styles.subtitle}>
          Sent to {user?.phone || '+91 98765 43210'} ·{' '}
          <Text
            onPress={() => setCurrentScreen('phone')}
            style={styles.changeLink}
          >
            Change
          </Text>
        </Text>
      </View>

      {/* 6-Digit Pin Boxes */}
      <View style={styles.pinRow}>
        <View style={styles.pinBoxFilled}>
          <Text style={styles.pinDigit}>4</Text>
        </View>
        <View style={styles.pinBoxFilled}>
          <Text style={styles.pinDigit}>8</Text>
        </View>
        <View style={styles.pinBoxFilled}>
          <Text style={styles.pinDigit}>1</Text>
        </View>
        <View style={styles.pinBoxActive}>
          <View style={styles.cursor} />
        </View>
        <View style={styles.pinBoxEmpty} />
        <View style={styles.pinBoxEmpty} />
      </View>

      {/* Resend Row */}
      <View style={styles.resendRow}>
        <Text style={styles.timerText}>Resend in 0:24</Text>
        <Text style={styles.resendDisabled}>Resend code</Text>
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleVerify}
        style={styles.verifyBtn}
      >
        <Text style={styles.verifyBtnText}>Verify</Text>
      </TouchableOpacity>

      {/* Why We Verify Card */}
      <View style={styles.whyCard}>
        <Text style={styles.whyTitle}>Why we verify</Text>
        <Text style={styles.whyDesc}>
          Every profile is tied to one verified number, so nobody can run five accounts and waste your family’s time.
        </Text>
      </View>
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
    gap: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 99,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 34,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    color: theme.colors.textSecondary,
  },
  changeLink: {
    color: theme.colors.accent,
    fontWeight: '700',
  },
  pinRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 4,
  },
  pinBoxFilled: {
    flex: 1,
    aspectRatio: 1 / 1.15,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxActive: {
    flex: 1,
    aspectRatio: 1 / 1.15,
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxEmpty: {
    flex: 1,
    aspectRatio: 1 / 1.15,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 13,
  },
  pinDigit: {
    fontFamily: theme.fonts.sans,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cursor: {
    width: 1.5,
    height: 22,
    backgroundColor: theme.colors.accent,
  },
  resendRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    color: theme.colors.textSubtle,
  },
  resendDisabled: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textDisabled,
  },
  verifyBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
  whyCard: {
    marginTop: 'auto',
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  whyTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  whyDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
});
