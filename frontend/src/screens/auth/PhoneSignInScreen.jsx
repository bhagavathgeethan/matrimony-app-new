import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, Check } from 'lucide-react';

export const PhoneSignInScreen = () => {
  const { setCurrentScreen, user, setUser } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('98765 43210');
  const [consentSms, setConsentSms] = useState(true);

  const handleSendOtp = () => {
    // Navigate to OTP verify
    setCurrentScreen('otp');
  };

  return (
    <View style={styles.container}>
      {/* Back Nav */}
      <TouchableOpacity onPress={() => setCurrentScreen('welcome')} style={styles.backBtn}>
        <ChevronLeft size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Your number,{'\n'}your account</Text>
        <Text style={styles.subtitle}>
          One profile per verified phone. It keeps the platform real.
        </Text>
      </View>

      {/* Phone Input Group */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCodeBox}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <View style={styles.phoneInputBox}>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              placeholder="Enter mobile number"
            />
            <View style={styles.activeCursor} />
          </View>
        </View>

        {/* SMS Consent Card */}
        <TouchableOpacity
          onPress={() => setConsentSms((c) => !c)}
          style={styles.consentCard}
        >
          <View style={[styles.checkbox, consentSms && styles.checkboxActive]}>
            {consentSms && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
          </View>
          <Text style={styles.consentText}>
            Send me an OTP by SMS. Standard rates apply. I consent to processing my number for authentication only.
          </Text>
        </TouchableOpacity>

        {/* Send OTP Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSendOtp}
          style={styles.sendOtpBtn}
        >
          <Text style={styles.sendOtpBtnText}>Send OTP</Text>
        </TouchableOpacity>
      </View>

      {/* OR Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Logins */}
      <View style={styles.socialGroup}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('consent')}
          style={styles.socialBtn}
        >
          <Text style={styles.socialBtnText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCurrentScreen('consent')}
          style={styles.socialBtn}
        >
          <Text style={styles.socialBtnText}>Continue with Apple</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Helper */}
      <Text style={styles.footerNote}>
        Parents: use the invite link your child sent you.
      </Text>
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
    gap: 18,
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
    lineHeight: 19,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  inputLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  phoneRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
  },
  countryCodeBox: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 13,
    paddingVertical: 15,
    paddingHorizontal: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  phoneInputBox: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    borderWidth: 0,
    outline: 'none',
  },
  activeCursor: {
    width: 2,
    height: 18,
    backgroundColor: theme.colors.accent,
    marginLeft: 2,
  },
  consentCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    padding: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.accent,
  },
  consentText: {
    flex: 1,
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },
  sendOtpBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOtpBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
  dividerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFE4D4',
  },
  dividerText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    color: '#A8927F',
  },
  socialGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 9,
  },
  socialBtn: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 13,
    paddingVertical: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  footerNote: {
    marginTop: 'auto',
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
    textAlign: 'center',
  },
});
