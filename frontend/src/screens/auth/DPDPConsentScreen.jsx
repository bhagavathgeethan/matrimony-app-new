import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeartHandshake, Users, FlaskConical, Megaphone, Scale, Lock } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Body, Button, Card, Toggle, IconBadge, Badge, Divider,
} from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

export const DPDPConsentScreen = () => {
  const { setCurrentScreen, user, updateConsent } = useApp();
  const [familySharing, setFamilySharing] = useState(user?.consent?.familySharing ?? true);
  const [productResearch, setProductResearch] = useState(user?.consent?.productResearch ?? false);
  const [marketing, setMarketing] = useState(user?.consent?.marketing ?? false);

  const items = [
    { icon: HeartHandshake, title: 'Matching', desc: 'Blueprint answers used to compute scores', value: true, required: true },
    { icon: Users, title: 'Family sharing', desc: 'Forward chosen profiles to a parent', value: familySharing, set: setFamilySharing },
    { icon: FlaskConical, title: 'Product research', desc: 'Anonymised analytics to improve matching', value: productResearch, set: setProductResearch },
    { icon: Megaphone, title: 'Marketing messages', desc: 'Offers by SMS, email or WhatsApp', value: marketing, set: setMarketing },
  ];

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const editing = Boolean(user?.onboarding?.completed);

  const handleContinue = async () => {
    setSaving(true);
    setError(null);
    const res = await updateConsent({ familySharing, productResearch, marketing });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    // Existing members edit consents from Privacy; new members continue onboarding
    setCurrentScreen(editing ? 'privacy' : 'basics');
  };

  return (
    <OnboardingScreen
      top={<StepBar step={1} total={5} />}
      footer={
        <>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label={saving ? t('Saving…') : editing ? t('Save consents') : t('Agree & continue')}
            disabled={saving}
            onPress={handleContinue}
          />
          <Text style={styles.notice}>{t('Read the full notice')}</Text>
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Step 01 / 05 · Consent')}</Eyebrow>
          <Heading size={34}>
            {t('What you’re')}{' '}<Accent>{t('agreeing to')}</Accent>
          </Heading>
          <Body size={14}>{t('Granular, itemised, and reversible any time from Settings.')}</Body>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card padding={4}>
          {items.map((item, idx) => (
            <View key={item.title}>
              {idx > 0 && <Divider style={{ marginHorizontal: 12 }} />}
              <View style={styles.row}>
                <IconBadge icon={item.icon} tone={item.value ? 'accent' : 'neutral'} size={34} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitle}>{t(item.title)}</Text>
                    {item.required && <Badge label={t('Required')} tone="gold" icon={Lock} />}
                  </View>
                  <Text style={styles.itemDesc}>{t(item.desc)}</Text>
                </View>
                <Toggle value={item.value} onChange={item.set} disabled={item.required} />
              </View>
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card variant="dark" style={styles.rightsCard} padding={14}>
          <Scale size={18} color={colors.gold} />
          <Text style={styles.rightsText}>
            <Text style={styles.rightsTitle}>{t('Your DPDP rights.')}{' '}</Text>
            {t('Download everything, correct it, or ask for full erasure within 72 hours.')}
          </Text>
        </Card>
      </FadeIn>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDesc: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  rightsCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  rightsTitle: {
    fontWeight: '800',
    color: colors.onDark,
  },
  rightsText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,246,238,0.78)',
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  notice: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
});
