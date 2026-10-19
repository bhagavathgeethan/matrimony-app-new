// Family sign-in: a parent or relative who was invited by a member signs in with their own number.
// No member account is made — a code to the invited number opens the private view(s) they were given.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, Users, ChevronRight, ShieldCheck } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { familySession } from '../../services/familySession';
import { OnboardingScreen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Button, Card } from '../../components/ui/kit';
import { Lockup } from '../../components/brand/Logo';
import { t } from '@shared/i18n';

const { colors, fonts, radii } = theme;
const RESEND_SECONDS = 30;

export const FamilySignInScreen = () => {
  const { setCurrentScreen } = useApp();
  const [step, setStep] = useState('phone'); // phone → code → choose
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [portals, setPortals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRef = useRef(null);
  const digits = phone.replace(/\D/g, '');

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.familySignInSend(digits);
      setDevCode(res.devCode || null);
      setCode('');
      setSecondsLeft(RESEND_SECONDS);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.familySignInVerify(digits, value);
      if (res.portals.length === 1) familySession.signIn(res.portals);
      else {
        setPortals(res.portals);
        setStep('choose');
      }
    } catch (err) {
      setError(err.message);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const choose = (token) => {
    familySession.signIn(portals);
    familySession.choose(token);
  };

  const footer =
    step === 'phone' ? (
      <>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button label={busy ? t('Sending…') : t('Send OTP')} disabled={!consent || digits.length !== 10 || busy} onPress={send} />
        <Text style={styles.footer} onPress={() => setCurrentScreen('phone')}>
          {t('Looking for a match yourself?')}{' '}<Text style={styles.link}>{t('Member sign in')}</Text>
        </Text>
      </>
    ) : step === 'code' ? (
      <Button label={busy ? t('Verifying…') : t('Verify')} disabled={code.length !== 6 || busy} onPress={() => verify()} />
    ) : null;

  const boxes = Array.from({ length: 6 }, (_, i) => code[i] || '');

  return (
    <OnboardingScreen
      top={<TopBar onBack={() => (step === 'code' ? setStep('phone') : setCurrentScreen('phone'))} title={<Lockup size={30} />} />}
      footer={footer}
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Family sign in')}</Eyebrow>
          {step === 'phone' && (
            <>
              <Heading size={34}>
                <Accent>{t('Invited by your family?')}</Accent>
              </Heading>
              <Body size={14}>{t('Use the number your family member added. You’ll see only the profiles they share with you.')}</Body>
            </>
          )}
          {step === 'code' && (
            <>
              <Heading size={34}>
                {t('Enter the')}{' '}<Accent>{t('6-digit code')}</Accent>
              </Heading>
              <Body size={14}>
                {t('Sent to')}{' '}<Text style={styles.phone}>+91 {digits}</Text> ·{' '}
                <Text style={styles.link} onPress={() => setStep('phone')}>{t('Change')}</Text>
              </Body>
            </>
          )}
          {step === 'choose' && (
            <>
              <Heading size={34}>
                {t('Whose profiles')}{' '}<Accent>{t('do you want to see?')}</Accent>
              </Heading>
              <Body size={14}>{t('More than one family member invited you. You can switch any time.')}</Body>
            </>
          )}
        </View>
      </FadeIn>

      {step === 'phone' && (
        <FadeIn delay={80}>
          <Card style={{ gap: 12 }} padding={16}>
            <Text style={styles.label}>{t('Mobile number')}</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryText}>+91</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(null); }}
                keyboardType="phone-pad"
                maxLength={11}
                placeholder="98765 43210"
                placeholderTextColor={colors.textLight}
                style={styles.phoneInput}
                accessibilityLabel={t('Mobile number')}
              />
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setConsent((c) => !c)} style={styles.consentRow}>
              <View style={[styles.checkbox, consent && styles.checkboxOn]}>
                {consent && <Check size={13} color={colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.consentText}>
                {t('Send me an OTP by SMS. I consent to processing my number for authentication only.')}
              </Text>
            </TouchableOpacity>
          </Card>
        </FadeIn>
      )}

      {step === 'code' && (
        <>
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
            <View style={styles.boxes}>
              {boxes.map((d, i) => (
                <View key={i} style={[styles.box, d && styles.boxFilled, i === Math.min(code.length, 5) && styles.boxActive]}>
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
                if (next.length === 6) verify(next);
              }}
              keyboardType="number-pad"
              autoFocus
              style={styles.hiddenInput}
              accessibilityLabel={t('One-time code')}
            />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            {secondsLeft > 0 ? (
              <Text style={styles.wait}>{t('Resend in 0:{s}', { s: String(secondsLeft).padStart(2, '0') })}</Text>
            ) : (
              <Text style={styles.link} onPress={send}>{t('Resend code')}</Text>
            )}
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          {devCode && (
            <View style={styles.devCode}>
              <Text style={styles.devCodeText}>{t('Test SMS · your code is {devCode}', { devCode })}</Text>
            </View>
          )}
        </>
      )}

      {step === 'choose' && (
        <View style={{ gap: 10 }}>
          {portals.map((p) => (
            <TouchableOpacity key={p.token} activeOpacity={0.85} onPress={() => choose(p.token)} accessibilityRole="button">
              <Card style={styles.portalRow} padding={16}>
                <View style={styles.portalIcon}><Users size={18} color={colors.accent} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.portalTitle}>{t('{childName}’s profiles', { childName: p.childName })}</Text>
                  <Text style={styles.portalSub}>{t('Invited you as {name}', { name: p.name })}</Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FadeIn delay={160}>
        <Card variant="gold" style={styles.why} padding={14}>
          <ShieldCheck size={18} color="#8A6A2E" />
          <Text style={styles.whyText}>
            {t('Family members cannot search, message, or browse other profiles. Access ends when your family member removes it.')}
          </Text>
        </Card>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: { gap: 10 },
  label: { fontFamily: fonts.sans, fontWeight: '700', fontSize: 11, letterSpacing: 1.6, color: colors.textMuted, textTransform: 'uppercase' },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryCode: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: radii.md,
    backgroundColor: colors.cardSecondary, borderWidth: 1, borderColor: colors.cardBorder,
  },
  flag: { fontSize: 16 },
  countryText: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  phoneInput: {
    flex: 1, height: 52, paddingHorizontal: 14, borderRadius: radii.md, backgroundColor: colors.cardSecondary,
    borderWidth: 1, borderColor: colors.cardBorder, fontFamily: fonts.sans, fontSize: 18, fontWeight: '700',
    letterSpacing: 0.5, color: colors.textPrimary, outlineStyle: 'none',
  },
  consentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  consentText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  phone: { fontWeight: '700', color: colors.textPrimary },
  link: { fontFamily: fonts.sans, fontWeight: '700', color: colors.accent },
  footer: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
  error: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.accent, textAlign: 'center' },
  boxes: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  box: {
    width: 48, height: 58, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.cardBorder,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.textMuted },
  boxActive: { borderColor: colors.accent, boxShadow: '0 0 0 4px rgba(168, 30, 60, 0.12)' },
  boxText: { fontFamily: fonts.sans, fontWeight: '800', fontSize: 24, color: colors.textPrimary },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  wait: { fontFamily: fonts.sans, fontWeight: '600', fontSize: 12.5, color: colors.textMuted },
  devCode: {
    alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.cardBorder,
  },
  devCodeText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  portalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  portalIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  portalTitle: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  portalSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
  why: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  whyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
});
