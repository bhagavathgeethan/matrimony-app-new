import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Check, X, Plus, ShieldCheck, Link2, RotateCw, Trash2 } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, FadeIn, Eyebrow, Heading, Accent, Body, Button, Card, Divider, Badge, Chip, Toggle } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

const STATUS_LABEL = { linked: 'Linked', invited: 'Invite sent' };
const RELATIONS = ['Mother', 'Father', 'Sibling', 'Guardian'];
const CAN = ['See profiles you forward, with scores', 'Mark approval or raise a concern'];
const CANNOT = ['Browse or search other members', 'Message anyone, ever', 'See your chats or contact details'];

export const LinkParentScreen = () => {
  const { familyLinks, addFamilyMember, resendFamilyInvite, removeFamilyMember, setCurrentScreen, setFamilyManage } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Mother');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const run = async (key, fn, success) => {
    setBusy(key);
    setError(null);
    setMessage(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) setError(res.error);
    else if (success) setMessage(success);
    return res;
  };

  const handleAdd = async () => {
    const res = await run('add', () => addFamilyMember({ name: name.trim(), relation, phone }), t('Invite sent to {name} by SMS', { name: name.trim() }));
    if (res.ok) {
      setAdding(false);
      setName('');
      setPhone('');
    }
  };

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.portalUrl);
      setMessage(t('{name}’s private link copied', { name: link.name }));
    } catch {
      setMessage(link.portalUrl);
    }
  };

  const confirmRemove = (link) => {
    if (window.confirm(t('Remove {name}? Their link stops working and shared cards disappear from their view.', { name: link.name }))) {
      run(link.id, () => removeFamilyMember(link.id), t('{name} removed', { name: link.name }));
    }
  };

  return (
    <Screen>
      <TopBar onBack={() => setCurrentScreen('family-tracker')} />

      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>{t('Family access')}</Eyebrow>
          <Heading>
            {t('Bring family in —')}{'\n'}
            <Accent>{t('on your terms')}</Accent>
          </Heading>
          <Body>{t('A family member only sees what you forward. No search, no chat, no browsing.')}</Body>
        </View>
      </FadeIn>

      <FadeIn delay={80}>
        <Card padding={6}>
          {familyLinks.map((link, idx) => (
            <View key={link.id}>
              {idx > 0 && <Divider style={{ marginHorizontal: 14 }} />}
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{link.avatarChar}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>
                    {link.name}
                    {link.relation ? <Text style={styles.phone}>{` · ${t(link.relation)}`}</Text> : null}
                  </Text>
                  <Text style={styles.status}>
                    {`${t(STATUS_LABEL[link.status] || link.status)} · ${t(link.sharedProfilesCount === 1 ? '1 profile shared' : '{n} profiles shared', { n: link.sharedProfilesCount })} · ${link.phoneMasked}`}
                  </Text>
                </View>
                <Badge label={link.status === 'linked' ? t('Active') : t('Pending')} tone={link.status === 'linked' ? 'success' : 'gold'} />
              </View>
              <View style={[styles.row, { paddingTop: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t('Can edit my personal details')}</Text>
                  <Text style={styles.status}>{t('From their link — never your name, photos or chats')}</Text>
                </View>
                <Toggle value={Boolean(link.canManage)} onChange={(v) => setFamilyManage(link.id, v)} />
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => copyLink(link)} style={styles.action}>
                  <Link2 size={14} color={colors.accent} />
                  <Text style={styles.actionText}>{t('Copy link')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy === `resend-${link.id}`}
                  onPress={() => run(`resend-${link.id}`, () => resendFamilyInvite(link.id), t('Invite re-sent to {name}', { name: link.name }))}
                  style={styles.action}
                >
                  <RotateCw size={14} color={colors.accent} />
                  <Text style={styles.actionText}>{t('Resend SMS')}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={busy === link.id} onPress={() => confirmRemove(link)} style={styles.action}>
                  <Trash2 size={14} color={colors.textMuted} />
                  <Text style={[styles.actionText, { color: colors.textMuted }]}>{t('Remove')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {familyLinks.length > 0 && <Divider style={{ marginHorizontal: 14 }} />}

          {adding ? (
            <View style={styles.form}>
              <TextInput
                value={name}
                onChangeText={(v) => { setName(v); setError(null); }}
                placeholder={t('Their name (e.g. Amma)')}
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />
              <View style={styles.chips}>
                {RELATIONS.map((r) => (
                  <Chip key={r} label={t(r)} active={relation === r} onPress={() => setRelation(r)} />
                ))}
              </View>
              <TextInput
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(null); }}
                keyboardType="phone-pad"
                placeholder={t('Their mobile number')}
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />
              <View style={styles.formButtons}>
                <Button small variant="secondary" label={t('Cancel')} style={{ flex: 1 }} onPress={() => setAdding(false)} />
                <Button
                  small
                  label={busy === 'add' ? t('Sending…') : t('Send invite')}
                  style={{ flex: 2 }}
                  disabled={!name.trim() || phone.replace(/\D/g, '').length < 10 || busy === 'add'}
                  onPress={handleAdd}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setAdding(true)} style={styles.row}>
              <View style={styles.addAvatar}>
                <Plus size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t('Add a family member')}</Text>
                <Text style={styles.status}>{t('They get a private link by SMS — no app or account needed')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </Card>
        {(message || error) && (
          <Text style={[styles.feedback, error && { color: colors.accent }]}>{error || message}</Text>
        )}
      </FadeIn>

      <FadeIn delay={160}>
        <View style={{ gap: 10 }}>
          <Card style={[styles.matrixCol, { backgroundColor: colors.successSoft, borderColor: 'transparent' }]}>
            <Text style={[styles.matrixHead, { color: colors.success }]}>{t('A family member can')}</Text>
            {CAN.map((item) => (
              <View key={item} style={styles.matrixItem}>
                <Check size={14} color={colors.success} strokeWidth={3} />
                <Text style={styles.matrixText}>{t(item)}</Text>
              </View>
            ))}
          </Card>
          <Card style={[styles.matrixCol, { backgroundColor: colors.accentSoft, borderColor: 'transparent' }]}>
            <Text style={[styles.matrixHead, { color: colors.accent }]}>{t('A family member cannot')}</Text>
            {CANNOT.map((item) => (
              <View key={item} style={styles.matrixItem}>
                <X size={14} color={colors.accent} strokeWidth={3} />
                <Text style={styles.matrixText}>{t(item)}</Text>
              </View>
            ))}
          </Card>
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <View style={{ gap: 12 }}>
          <View style={styles.revoke}>
            <ShieldCheck size={14} color={colors.success} />
            <Text style={styles.revokeText}>{t('Remove anyone, any time — their link stops working instantly.')}</Text>
          </View>
          <Button label={t('Done')} onPress={() => setCurrentScreen('family-tracker')} />
        </View>
      </FadeIn>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundImage: gradients.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 18,
    color: colors.white,
  },
  addAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(168, 30, 60, 0.4)',
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phone: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  status: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap', // narrow phones / large text: the buttons wrap instead of running off the edge
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingLeft: 74,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.cardSecondary,
  },
  actionText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  form: {
    padding: 14,
    gap: 10,
  },
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feedback: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
    marginTop: 10,
  },
  matrixCol: {
    gap: 10,
    padding: 16,
  },
  matrixHead: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  matrixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matrixText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textPrimary,
  },
  revoke: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revokeText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
});
