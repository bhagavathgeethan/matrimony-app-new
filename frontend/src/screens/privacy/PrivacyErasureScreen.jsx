import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { ChevronRight, Download, Trash2, Eye, UserX, ListChecks, LogOut, Check, MessageCircle, Sparkles, Users, Smartphone, PauseCircle, Moon, Ghost, Lightbulb, Crown, EyeOff, Image, MapPinOff } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Screen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Card, Toggle, IconBadge, Divider, Chip, Button } from '../../components/ui/kit';
import { SignOutButton } from '../../components/common/SignOutButton';
import { PHOTO_VISIBILITY } from '@shared/plans';
import { t, formatDateTime } from '@shared/i18n';
import { SelectField } from '../../components/common/Picker';
import { LanguagePicker } from '../../components/common/LanguagePicker';

const { colors, fonts, gradients, radii } = theme;

const ERASURE_STEPS = [
  'Profile, photos and blueprint answers are deleted, not deactivated',
  'Parent links revoked; shared cards vanish from their dashboards',
  'Messages you sent are anonymised to “Former member”',
  'Only a hashed record of the deletion request is retained, for audit',
];

// Premium: hide your profile from chosen cities or ages
const VisibilityRules = ({ user, onSave }) => {
  const rules = user?.visibilityRules || {};
  const [cities, setCities] = useState((rules.hideCities || []).join(', '));
  const [ageMin, setAgeMin] = useState(rules.ageMin ? String(rules.ageMin) : '');
  const [ageMax, setAgeMax] = useState(rules.ageMax ? String(rules.ageMax) : '');
  const save = () => onSave({
    hideCities: cities.split(',').map((c) => c.trim()).filter(Boolean),
    ...(ageMin ? { ageMin: Number(ageMin) } : {}),
    ...(ageMax ? { ageMax: Number(ageMax) } : {}),
  });
  return (
    <View style={{ padding: 14, gap: 8 }}>
      <Text style={styles.rowTitle}>{t('Hide my profile from… (Premium)')}</Text>
      <TextInput value={cities} onChangeText={setCities} placeholder={t('Cities, comma-separated')} placeholderTextColor={colors.textLight}
        style={styles.ruleInput} accessibilityLabel={t('Hide from cities')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.rowValue}>{t('Only ages')}</Text>
        <TextInput value={ageMin} onChangeText={(text) => setAgeMin(text.replace(/\D/g, '').slice(0, 2))} placeholder="18" keyboardType="number-pad"
          style={[styles.ruleInput, { width: 64 }]} accessibilityLabel={t('Show to ages from')} />
        <Text style={styles.rowValue}>to</Text>
        <TextInput value={ageMax} onChangeText={(text) => setAgeMax(text.replace(/\D/g, '').slice(0, 2))} placeholder="80" keyboardType="number-pad"
          style={[styles.ruleInput, { width: 64 }]} accessibilityLabel={t('Show to ages up to')} />
        <Button small variant="secondary" label={t('Save')} onPress={save} />
      </View>
    </View>
  );
};

export const PrivacyErasureScreen = () => {
  const { setCurrentScreen, user, updatePrivacy, requestErasure, cancelErasure, logout, updateNotificationPrefs, setPaused } = useApp();
  const [privacyError, setPrivacyError] = useState(null);
  const privacy = async (patch) => {
    const res = await updatePrivacy(patch);
    setPrivacyError(res.ok ? null : res.error);
  };
  const notifPrefs = user?.notificationPrefs || {};
  const [busy, setBusy] = useState(false);
  const consent = user?.consent || {};
  const consentsOn = ['matching', 'familySharing', 'productResearch', 'marketing'].filter((k) => consent[k]).length;
  const erasureScheduledFor = user?.erasureScheduledFor;

  const handleDownloadData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sangam-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(t('Could not export your data: {reason}', { reason: err.message }));
    }
  };

  const handleErasure = async () => {
    if (busy) return;
    if (erasureScheduledFor) {
      if (!window.confirm(t('Cancel your erasure request and keep your account?'))) return;
      setBusy(true);
      const res = await cancelErasure();
      setBusy(false);
      if (!res.ok) alert(res.error);
      return;
    }
    if (!window.confirm(t('Request permanent erasure of your account? You can cancel within 72 hours; after that it cannot be undone.'))) return;
    setBusy(true);
    const res = await requestErasure();
    setBusy(false);
    if (res.ok) {
      alert(`${t(res.data.message)}
${t('Audit receipt: {hash}', { hash: res.data.auditReceiptHash })}`);
    } else {
      alert(t('Could not register the erasure request: {reason}', { reason: res.error }));
    }
  };

  const Row = ({ icon, title, value, onPress, right }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} style={styles.row}>
      <IconBadge icon={icon} size={38} />
      <Text style={styles.rowTitle}>{title}</Text>
      {right || (
        <View style={styles.rowRight}>
          <Text style={styles.rowValue}>{value}</Text>
          <ChevronRight size={16} color={colors.textLight} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Screen tabBar>
      <TopBar onBack={() => setCurrentScreen('blueprint-summary')} />

      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Settings')}</Eyebrow>
          <Heading>
            {t('Privacy &')}{'\n'}
            <Accent>{t('your data')}</Accent>
          </Heading>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card padding={6}>
          <Row icon={Eye} title={t('Who can see my profile')} value={t('Matches only')} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row
            icon={UserX}
            title={t('Hide from people I know')}
            right={<Toggle value={user?.hideFromContacts ?? true} onChange={(v) => updatePrivacy({ hideFromContacts: v })} />}
          />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={PauseCircle} title={t('Pause my profile')} right={<Toggle value={Boolean(user?.paused)} onChange={(v) => setPaused(v)} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Moon} title={t('Horoscope matching')} right={<Toggle value={Boolean(user?.showHoroscope)} onChange={(v) => privacy({ showHoroscope: v })} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Ghost} title={t('Incognito browsing (Premium)')} right={<Toggle value={Boolean(user?.incognito)} onChange={(v) => privacy({ incognito: v })} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Crown} title={t('Show my plan badge (Plus)')} right={<Toggle value={user?.showPremiumBadge !== false} onChange={(v) => privacy({ showPremiumBadge: v })} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={EyeOff} title={t('Hide my last seen (Premium)')} right={<Toggle value={Boolean(user?.hideActivity)} onChange={(v) => privacy({ hideActivity: v })} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <View style={{ padding: 14, gap: 8 }}>
            <Text style={styles.rowTitle}>{t('Who sees my photos clearly (Premium)')}</Text>
            <SelectField
              label={t('Who sees my photos clearly')}
              value={user?.photoVisibility || null}
              onChange={(k) => privacy({ photoVisibility: k })}
              options={[[null, t('Standard (blur until mutual, as set above)')], ...PHOTO_VISIBILITY.map(([k, label]) => [k, t(label)])]}
            />
          </View>
          <Divider style={{ marginHorizontal: 14 }} />
          <VisibilityRules user={user} onSave={(rules) => privacy({ visibilityRules: rules })} />
          {privacyError && <Text style={[styles.rowValue, { color: colors.accent, paddingHorizontal: 14, paddingBottom: 8 }]}>{privacyError}</Text>}
          <Divider style={{ marginHorizontal: 14 }} />
          <Row
            icon={ListChecks}
            title={t('Consent settings')}
            value={`${consentsOn} of 4 on`}
            onPress={() => setCurrentScreen('consent')}
          />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Download} title={t('Download my data')} value={t('JSON · Instant')} onPress={handleDownloadData} />
        </Card>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding={14} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={[styles.rowTitle, { flex: 1 }]}>{t('Language')}</Text>
          <LanguagePicker style={{ minWidth: 150 }} />
        </Card>
      </FadeIn>

      <FadeIn delay={120}>
        <Card padding={6}>
          <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, gap: 2 }}>
            <Text style={styles.rowTitle}>{t('Notifications')}</Text>
            <Text style={styles.rowValue}>{t('Security alerts are always sent.')}</Text>
          </View>
          {[
            [MessageCircle, 'Messages', 'messages'],
            [Sparkles, 'New aligned matches', 'matches'],
            [Users, 'Family responses', 'family'],
            [Lightbulb, 'Tips & reminders', 'tips'],
            [Smartphone, 'Push to this phone', 'push'],
          ].map(([icon, title, key]) => (
            <View key={key}>
              <Divider style={{ marginHorizontal: 14 }} />
              <Row
                icon={icon}
                title={t(title)}
                right={<Toggle value={notifPrefs[key] !== false} onChange={(v) => updateNotificationPrefs({ [key]: v })} />}
              />
            </View>
          ))}
        </Card>
      </FadeIn>

      <FadeIn delay={160}>
        <Card style={styles.erasure}>
          <View style={styles.erasureHead}>
            <View style={styles.trash}>
              <Trash2 size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.erasureTitle}>{t('Erase my account')}</Text>
              <Text style={styles.erasureSub}>{t('Completed within 72 hours. Irreversible.')}</Text>
            </View>
          </View>
          <Body size={13.5}>{t('Under the DPDP Act you can withdraw consent entirely. Here’s exactly what happens:')}</Body>
          <View style={{ gap: 10 }}>
            {ERASURE_STEPS.map((step, i) => (
              <View key={step} style={styles.step}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.stepText}>{t(step)}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={busy}
            onPress={handleErasure}
            style={[styles.eraseBtn, erasureScheduledFor && styles.eraseBtnDone]}
          >
            {erasureScheduledFor && <Check size={16} color={colors.accent} strokeWidth={3} />}
            <Text style={[styles.eraseText, erasureScheduledFor && { color: colors.accent }]}>
              {erasureScheduledFor
                ? t('Erasure scheduled · {when} · Cancel', { when: formatDateTime(erasureScheduledFor, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })
                : t('Request erasure')}
            </Text>
          </TouchableOpacity>
        </Card>
      </FadeIn>

      <FadeIn delay={220}>
        <SignOutButton />
      </FadeIn>
    </Screen>
  );
};

const styles = StyleSheet.create({
  ruleInput: { minHeight: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, outlineStyle: 'none' },
  header: {
    gap: 10,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  erasure: {
    gap: 16,
    borderColor: 'rgba(168, 30, 60, 0.18)',
  },
  erasureHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trash: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundImage: gradients.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  erasureTitle: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 20.8,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  erasureSub: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.accent,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  eraseBtn: {
    height: 52,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceDark,
  },
  eraseBtnDone: {
    backgroundColor: colors.accentSoft,
  },
  eraseText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.onDark,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
