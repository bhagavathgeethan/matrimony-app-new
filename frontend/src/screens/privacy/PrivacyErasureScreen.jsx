import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Download, Trash2, Eye, UserX, ListChecks, LogOut, Check, MessageCircle, Sparkles, Users, Smartphone, PauseCircle, Moon, Ghost, Lightbulb } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Screen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Card, Toggle, IconBadge, Divider, Chip } from '../../components/ui/kit';
import { SignOutButton } from '../../components/common/SignOutButton';
import { t, UI_LANGUAGES, getLanguage, setLanguage } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

const ERASURE_STEPS = [
  'Profile, photos and blueprint answers are deleted, not deactivated',
  'Parent links revoked; shared cards vanish from their dashboards',
  'Messages you sent are anonymised to “Former member”',
  'Only a hashed record of the deletion request is retained, for audit',
];

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
      alert(`Could not export your data: ${err.message}`);
    }
  };

  const handleErasure = async () => {
    if (busy) return;
    if (erasureScheduledFor) {
      if (!window.confirm('Cancel your erasure request and keep your account?')) return;
      setBusy(true);
      const res = await cancelErasure();
      setBusy(false);
      if (!res.ok) alert(res.error);
      return;
    }
    if (!window.confirm('Request permanent erasure of your account? You can cancel within 72 hours; after that it cannot be undone.')) return;
    setBusy(true);
    const res = await requestErasure();
    setBusy(false);
    if (res.ok) {
      alert(`${res.data.message}
Audit receipt: ${res.data.auditReceiptHash}`);
    } else {
      alert(`Could not register the erasure request: ${res.error}`);
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
          <Eyebrow>Settings</Eyebrow>
          <Heading>
            Privacy &{'\n'}
            <Accent>your data</Accent>
          </Heading>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card padding={6}>
          <Row icon={Eye} title="Who can see my profile" value="Matches only" />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row
            icon={UserX}
            title="Hide from people I know"
            right={<Toggle value={user?.hideFromContacts ?? true} onChange={(v) => updatePrivacy({ hideFromContacts: v })} />}
          />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={PauseCircle} title="Pause my profile" right={<Toggle value={Boolean(user?.paused)} onChange={(v) => setPaused(v)} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Moon} title="Horoscope matching" right={<Toggle value={Boolean(user?.showHoroscope)} onChange={(v) => privacy({ showHoroscope: v })} />} />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Ghost} title="Incognito browsing (Premium)" right={<Toggle value={Boolean(user?.incognito)} onChange={(v) => privacy({ incognito: v })} />} />
          {privacyError && <Text style={[styles.rowValue, { color: colors.accent, paddingHorizontal: 14, paddingBottom: 8 }]}>{privacyError}</Text>}
          <Divider style={{ marginHorizontal: 14 }} />
          <Row
            icon={ListChecks}
            title="Consent settings"
            value={`${consentsOn} of 4 on`}
            onPress={() => setCurrentScreen('consent')}
          />
          <Divider style={{ marginHorizontal: 14 }} />
          <Row icon={Download} title="Download my data" value="JSON · Instant" onPress={handleDownloadData} />
        </Card>
      </FadeIn>

      <FadeIn delay={100}>
        <Card padding={14} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={styles.rowTitle}>{t('Language')} · Language</Text>
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
            {UI_LANGUAGES.map(([code, label]) => (
              <Chip key={code} label={label} active={getLanguage() === code} onPress={() => setLanguage(code)} />
            ))}
          </View>
        </Card>
      </FadeIn>

      <FadeIn delay={120}>
        <Card padding={6}>
          <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, gap: 2 }}>
            <Text style={styles.rowTitle}>{t('Notifications')}</Text>
            <Text style={styles.rowValue}>Security alerts are always sent.</Text>
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
                title={title}
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
              <Text style={styles.erasureTitle}>Erase my account</Text>
              <Text style={styles.erasureSub}>Completed within 72 hours. Irreversible.</Text>
            </View>
          </View>
          <Body size={13.5}>Under the DPDP Act you can withdraw consent entirely. Here’s exactly what happens:</Body>
          <View style={{ gap: 10 }}>
            {ERASURE_STEPS.map((step, i) => (
              <View key={step} style={styles.step}>
                <Text style={styles.stepNum}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.stepText}>{step}</Text>
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
                ? `Erasure scheduled · ${new Date(erasureScheduledFor).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Cancel`
                : 'Request erasure'}
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
