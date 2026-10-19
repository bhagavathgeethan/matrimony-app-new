import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ShieldCheck } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Button, Card } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, radii } = theme;
const RESEND_SECONDS = 30;

export const OTPVerifyScreen = () => {
  const { setCurrentScreen, pendingPhone, devCode, sendOtp, verifyOtp } = useApp();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (value = code) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    setError(null);
    const res = await verifyOtp(value);
    setVerifying(false);
    if (!res.ok) {
      setError(res.error);
      setCode('');
    }
  };

  const handleResend = async () => {
    setError(null);
    const res = await sendOtp(pendingPhone);
    if (res.ok) setSecondsLeft(RESEND_SECONDS);
    else setError(res.error);
  };
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const boxes = Array.from({ length: 6 }, (_, i) => code[i] || '');
  const activeIndex = Math.min(code.length, 5);

  return (
    <OnboardingScreen
      top={<TopBar onBack={() => setCurrentScreen('phone')} />}
      footer={
        <Button label={verifying ? t('Verifying…') : t('Verify')} disabled={code.length !== 6 || verifying} onPress={() => handleVerify()} />
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Verification')}</Eyebrow>
          <Heading size={34}>
            {t('Enter the')}{' '}<Accent>{t('6-digit code')}</Accent>
          </Heading>
          <Body size={14}>
            {t('Sent to')}{' '}<Text style={styles.phone}>{pendingPhone}</Text> ·{' '}
            <Text style={styles.link} onPress={() => setCurrentScreen('phone')}>
              {t('Change')}
            </Text>
          </Body>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          <View style={styles.boxes}>
            {boxes.map((d, i) => (
              <View key={i} style={[styles.box, d && styles.boxFilled, i === activeIndex && styles.boxActive]}>
                <Text style={styles.boxText}>{d}</Text>
              </View>
            ))}
          </View>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(text) => {
              const next = text.replace(/\D/g, '').slice(0, 6);
              setCode(next);
              if (next.length === 6) handleVerify(next);
            }}
            keyboardType="number-pad"
            autoFocus
            style={styles.hiddenInput}
            accessibilityLabel={t('One-time code')}
          />
        </TouchableOpacity>
      </FadeIn>

      <View style={styles.resendRow}>
        {secondsLeft > 0 ? (
          <Text style={styles.resendWait}>{t('Resend in 0:{s}', { s: String(secondsLeft).padStart(2, '0') })}</Text>
        ) : (
          <Text style={styles.link} onPress={handleResend}>
            {t('Resend code')}
          </Text>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {devCode && (
        <View style={styles.devCode}>
          <Text style={styles.devCodeText}>{t('Test SMS · your code is {devCode}', { devCode })}</Text>
        </View>
      )}

      <FadeIn delay={160}>
        <Card variant="gold" style={styles.whyCard} padding={14}>
          <ShieldCheck size={18} color="#8A6A2E" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.whyTitle}>{t('Why we verify')}</Text>
            <Text style={styles.whyText}>
              {t('One verified number per profile, so nobody can run five accounts and waste your family’s time.')}
            </Text>
          </View>
        </Card>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  phone: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  link: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    color: colors.accent,
  },
  boxes: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    backgroundColor: colors.accentSoft,
    borderColor: 'transparent',
  },
  boxActive: {
    borderColor: colors.accent,
    boxShadow: '0 0 0 4px rgba(168, 30, 60, 0.12)',
  },
  boxText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 24,
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendWait: {
    fontFamily: fonts.sans,
    fontWeight: '600',
    fontSize: 12.5,
    color: colors.textMuted,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  devCode: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
  },
  devCodeText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  whyCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  whyTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  whyText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
