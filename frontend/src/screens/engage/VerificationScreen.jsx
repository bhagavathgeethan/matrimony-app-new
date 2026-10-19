import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BadgeCheck, Camera, Clock, ShieldCheck } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

// Selfie verification, reviewed by the 3Knot team against the profile photos
export const VerificationScreen = () => {
  const { user, verification, loadVerification, submitVerification, setCurrentScreen } = useApp();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const input = useRef(null);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await submitVerification(file);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setFile(null);
  };

  const v = verification;
  const pending = v?.request?.status === 'pending';
  return (
    <Screen tabBar>
      <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Verification')} />
      <View style={{ gap: 6, marginBottom: 16 }}>
        <Eyebrow>{t('Trust')}</Eyebrow>
        <Heading size={30}>{t('Get the verified badge')}</Heading>
        <Body size={14}>{t('Take a clear selfie. Our team compares it with your profile photos — it’s never shown to anyone else and is deleted after review.')}</Body>
      </View>
      {v?.verified || user?.verified ? (
        <Card style={styles.row}><BadgeCheck size={30} color={colors.success} /><Text style={styles.title}>{t('You’re verified')}</Text></Card>
      ) : pending ? (
        <Card style={styles.row}><Clock size={26} color={colors.gold} /><View style={{ flex: 1 }}><Text style={styles.title}>{t('Selfie under review')}</Text><Body size={13}>{t('Usually within a day. We’ll notify you.')}</Body></View></Card>
      ) : (
        <Card style={{ gap: 14 }}>
          {v?.request?.status === 'rejected' && (
            <Text style={styles.error}>{v.request.note ? t('Last attempt wasn’t approved: {reason}. Please try again.', { reason: v.request.note }) : t('Last attempt wasn’t approved. Please try again.')}</Text>
          )}
          <Body size={13.5}>{t('• Face the camera in good light, no sunglasses or filters\n• Just you in the photo\n• Your profile needs at least one clear photo of you')}</Body>
          {preview && <Image source={{ uri: preview }} style={styles.preview} accessibilityLabel={t('Your selfie')} />}
          <input ref={input} type="file" accept="image/*" capture="user" onChange={pick} style={{ display: 'none' }} aria-label={t('Selfie')} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button variant="secondary" icon={Camera} label={file ? t('Retake') : t('Take a selfie')} onPress={() => input.current?.click()} />
          <Button icon={ShieldCheck} label={busy ? t('Sending…') : t('Submit for review')} disabled={!file || busy} onPress={send} />
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontFamily: fonts.sans, fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  error: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.accent },
  preview: { width: 200, height: 200, borderRadius: 22, alignSelf: 'center' },
});
