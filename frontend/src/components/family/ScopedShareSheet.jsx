import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Portal } from '../common/Portal';
import { useBackHandler } from '../../services/backButton';
import { Lock, X, Gauge, MapPin, Image as ImageIcon, Check } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Capacitor } from '@capacitor/core';

const isNativeApp = Capacitor.isNativePlatform();
import { Heading, Accent, Body, Button, Toggle, IconBadge, Badge, Divider, SectionLabel } from '../ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, radii, gradients, shadows } = theme;

const RECIPIENT_NOTES = {
  linked: ['linked', 'Read-only card, approve or flag'],
  invited: ['invite sent', 'They’ll see it once they open your invite link'],
};
const EXPIRY_OPTIONS = [['7d', '7d'], ['30d', '30d'], ['never', 'Never']];

export const ScopedShareSheet = ({ candidate, batchCandidates = [], onClose, onSend }) => {
  const isBatch = batchCandidates.length > 0;
  const targetName = isBatch ? t('{n} profiles', { n: batchCandidates.length }) : candidate?.firstName || t('Candidate');

  const { familyLinks, setCurrentScreen, setShowShareModal } = useApp();
  const [recipient, setRecipient] = useState(
    (familyLinks.find((l) => l.status === 'linked') || familyLinks[0])?.id || null
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [expiresIn, setExpiresIn] = useState('30d');
  const [customNote, setCustomNote] = useState('');
  const [permissions, setPermissions] = useState({
    showBlueprintScore: true,
    showFirstNameCity: true,
    showPhoto: false,
    showContact: false,
  });

  const scoreLabel = isBatch
    ? batchCandidates.map((c) => `${c.overlapScores?.overall ?? '—'}%`).join(' · ')
    : `${candidate?.overlapScores?.overall ?? '—'}%`;
  const nameCityLabel = isBatch
    ? batchCandidates.map((c) => c.firstName).join(', ')
    : `${targetName} · ${candidate?.city || ''}`;

  const togglePerm = (key) => setPermissions((p) => ({ ...p, [key]: !p[key] }));

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    const payload = {
      candidateIds: isBatch ? batchCandidates.map((c) => c.id) : [candidate?.id],
      familyLinkId: recipient,
      expiresIn,
      note: customNote,
      permissions,
    };
    const result = await onSend(payload);
    setSending(false);
    if (result && !result.ok) setError(result.error || t('Could not share. Please try again.'));
  };

  const perms = [
    ['showBlueprintScore', Gauge, t('Blueprint score & pillars'), t('{scores} · four bars', { scores: scoreLabel })],
    ['showFirstNameCity', MapPin, t('First name & city'), nameCityLabel],
    ['showPhoto', ImageIcon, t('Photo'), permissions.showPhoto ? t('Visible to parents') : t('Blurred until you allow it')],
  ];

  useBackHandler(onClose);
  return (
    <Portal>
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, isNativeApp && { maxWidth: '100%' }]}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 8 }}>
              <Heading size={30}>
                {isBatch ? (
                  <>{t('Send {count} profiles', { count: batchCandidates.length })}{' '}<Accent>{t('to family')}</Accent></>
                ) : (
                  <>{t('Share {targetName} with', { targetName })}{' '}<Accent>{t('your family?')}</Accent></>
                )}
              </Heading>
              <Body size={14}>
                {isBatch
                  ? t('Recipients see scores, never contact details.')
                  : t('They get a read-only card. You stay in control of everything below.')}
              </Body>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel={t('Close')}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <SectionLabel>{t('Send to')}</SectionLabel>
          <View style={{ gap: 8 }}>
            {familyLinks.map((link) => {
              const [statusLabel, note] = RECIPIENT_NOTES[link.status] || RECIPIENT_NOTES.invited;
              const active = recipient === link.id;
              return (
                <TouchableOpacity
                  key={link.id}
                  activeOpacity={0.88}
                  onPress={() => setRecipient(link.id)}
                  style={[styles.recipient, active && styles.recipientActive]}
                >
                  <View style={[styles.avatar, active && styles.avatarActive]}>
                    <Text style={[styles.avatarText, active && { color: colors.white }]}>{link.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.recipientName}>
                      {link.name} · {t(statusLabel)}
                    </Text>
                    <Text style={styles.recipientNote}>{t(note)}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <Check size={12} color={colors.white} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            {familyLinks.length === 0 && (
              <View style={{ gap: 8 }}>
                <Body size={13}>{t('Add a family member first — they’ll get a private link by SMS.')}</Body>
                <Button
                  small
                  variant="secondary"
                  label={t('Add family member')}
                  onPress={() => {
                    onClose();
                    setShowShareModal(false);
                    setCurrentScreen('link-parent');
                  }}
                />
              </View>
            )}
          </View>

          <SectionLabel>{t('What they can see')}</SectionLabel>
          <View style={styles.permBox}>
            {perms.map(([key, Icon, title, desc], idx) => (
              <View key={key}>
                {idx > 0 && <Divider style={{ marginHorizontal: 12 }} />}
                <View style={styles.permRow}>
                  <IconBadge icon={Icon} size={34} tone={permissions[key] ? 'accent' : 'neutral'} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.permTitle}>{title}</Text>
                    <Text style={styles.permDesc} numberOfLines={1}>{desc}</Text>
                  </View>
                  <Toggle value={permissions[key]} onChange={() => togglePerm(key)} />
                </View>
              </View>
            ))}
            <Divider style={{ marginHorizontal: 12 }} />
            <View style={styles.permRow}>
              <IconBadge icon={Lock} size={34} tone="neutral" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.permTitle, { color: colors.textMuted }]}>{t('Phone, email, chats')}</Text>
                <Text style={styles.permDesc}>{t('Never shareable')}</Text>
              </View>
              <Badge label={t('Locked')} tone="neutral" icon={Lock} />
            </View>
          </View>

          <SectionLabel>{t('Add a note (optional)')}</SectionLabel>
          <TextInput
            value={customNote}
            onChangeText={setCustomNote}
            multiline
            style={styles.note}
            placeholder={t('Why this one feels right…')}
            placeholderTextColor={colors.textLight}
          />

          <View style={styles.expiryRow}>
            <Text style={styles.expiryLabel}>{t('Access expires in')}</Text>
            <View style={styles.segment}>
              {EXPIRY_OPTIONS.map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setExpiresIn(value)}
                  style={[styles.segmentBtn, expiresIn === value && styles.segmentBtnActive]}
                >
                  <Text style={[styles.segmentText, expiresIn === value && styles.segmentTextActive]}>{t(label)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            label={sending ? t('Sending…') : t('Forward to parent dashboard')}
            disabled={sending || !recipient}
            onPress={handleSend}
          />
          <Button label={t('Not now')} variant="ghost" small onPress={onClose} />
        </ScrollView>
      </View>
    </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    backgroundColor: colors.overlay,
    backdropFilter: 'blur(3px)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92vh',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    boxShadow: shadows.modal,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 26,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  recipientActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFF9F8',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundImage: gradients.primary,
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 16,
    color: colors.accent,
    letterSpacing: -0.4,
  },
  recipientName: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recipientNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  permBox: {
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 4,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  permTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  permDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  note: {
    minHeight: 76,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiryLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
  },
  segmentBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceDark,
  },
  segmentText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.onDark,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.accent,
    textAlign: 'center',
  },
});
