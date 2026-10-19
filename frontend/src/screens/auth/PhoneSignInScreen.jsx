import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Button, Card } from '../../components/ui/kit';
import { Lockup } from '../../components/brand/Logo';
import { t } from '@shared/i18n';

const { colors, fonts, radii } = theme;

export const PhoneSignInScreen = () => {
  const { setCurrentScreen, sendOtp } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [consentSms, setConsentSms] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const digits = phoneNumber.replace(/\D/g, '');
  const canSend = consentSms && digits.length === 10 && !sending;

  const handleSend = async () => {
    setSending(true);
    setError(null);
    const res = await sendOtp(digits);
    setSending(false);
    if (res.ok) setCurrentScreen('otp');
    else setError(res.error);
  };

  return (
    <OnboardingScreen
      top={<TopBar onBack={() => setCurrentScreen('welcome')} title={<Lockup size={30} />} />}
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={sending ? t('Sending…') : t('Send OTP')} disabled={!canSend} onPress={handleSend} />
          <Text style={styles.footer} onPress={() => setCurrentScreen('family-signin')}>
            {t('Invited by your family?')}{' '}<Text style={styles.footerLink}>{t('Family sign in')}</Text>
          </Text>
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Sign in')}</Eyebrow>
          <Heading size={34}>
            {t('Your number,')}{' '}<Accent>{t('your account')}</Accent>
          </Heading>
          <Body size={14}>{t('One profile per verified phone. It keeps the platform real.')}</Body>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card style={{ gap: 12 }} padding={16}>
          <Text style={styles.label}>{t('Mobile number')}</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.countryText}>+91</Text>
            </View>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={11}
              placeholder="98765 43210"
              placeholderTextColor={colors.textLight}
              style={styles.phoneInput}
            />
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setConsentSms((c) => !c)} style={styles.consentRow}>
            <View style={[styles.checkbox, consentSms && styles.checkboxOn]}>
              {consentSms && <Check size={13} color={colors.white} strokeWidth={3} />}
            </View>
            <Text style={styles.consentText}>
              {t('Send me an OTP by SMS. I consent to processing my number for authentication only.')}
            </Text>
          </TouchableOpacity>
        </Card>
      </FadeIn>

    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  label: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  flag: {
    fontSize: 16,
  },
  countryText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  consentRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  consentText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  orText: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  footer: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '700',
    color: colors.accent,
  },
});
