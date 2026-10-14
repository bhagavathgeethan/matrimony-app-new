import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { theme } from '../../theme/tokens';
import { Lock, X } from 'lucide-react';

export const ScopedShareSheet = ({
  candidate,
  batchCandidates = [],
  onClose,
  onSend,
}) => {
  const isBatch = batchCandidates.length > 0;
  const targetName = isBatch
    ? `${batchCandidates.length} profiles`
    : candidate?.firstName || 'Candidate';

  const [recipient, setRecipient] = useState('parent-amma');
  const [expiresIn, setExpiresIn] = useState('30d');
  const [customNote, setCustomNote] = useState(
    'Both of these feel right on money and kids. Tell me what you think before I reply.'
  );

  const [permissions, setPermissions] = useState({
    showBlueprintScore: true,
    showFirstNameCity: true,
    showPhoto: false,
    showContact: false,
  });

  const handleSend = () => {
    if (isBatch) {
      onSend({
        candidateIds: batchCandidates.map((c) => c.id),
        recipientParentId: recipient,
        expiresIn,
        customNote,
      });
    } else {
      onSend({
        candidateId: candidate?.id,
        recipientParentId: recipient,
        expiresIn,
        customNote,
        permissions,
      });
    }
  };

  return (
    <View style={styles.sheetOverlay}>
      <View style={styles.sheetContent}>
        {/* Handle */}
        <View style={styles.dragHandle} />

        {/* Title */}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>
            {isBatch ? `Send ${batchCandidates.length} profiles to…` : `Share ${targetName} with\n`}
            {!isBatch && <Text style={styles.titleItalic}>Amma & Appa?</Text>}
          </Text>
          <Text style={styles.subtitle}>
            {isBatch
              ? 'Recipients see scores, never contact details.'
              : 'They get a read-only card. You stay in control of everything below.'}
          </Text>
        </View>

        {/* Recipient Selection if Batch or Single */}
        <View style={styles.recipientsContainer}>
          <TouchableOpacity
            onPress={() => setRecipient('parent-amma')}
            style={[
              styles.recipientCard,
              recipient === 'parent-amma' ? styles.recipientCardActive : styles.recipientCardInactive,
            ]}
          >
            <View
              style={[
                styles.radioCircle,
                recipient === 'parent-amma' && styles.radioCircleActive,
              ]}
            />
            <View style={styles.recipientDetails}>
              <Text style={styles.recipientName}>Amma · parent dashboard</Text>
              <Text style={styles.recipientNote}>Read-only card, approve or flag</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRecipient('parent-appa')}
            style={[
              styles.recipientCard,
              recipient === 'parent-appa' ? styles.recipientCardActive : styles.recipientCardInactive,
            ]}
          >
            <View
              style={[
                styles.radioCircle,
                recipient === 'parent-appa' && styles.radioCircleActive,
              ]}
            />
            <View style={styles.recipientDetails}>
              <Text style={styles.recipientName}>Appa · not linked yet</Text>
              <Text style={styles.recipientNote}>We’ll text him an invite first</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Granular Permission Scope Box */}
        <View style={styles.permissionsBox}>
          <View style={styles.permRow}>
            <View style={styles.permInfo}>
              <Text style={styles.permTitle}>Blueprint score & pillars</Text>
              <Text style={styles.permDesc}>87% · four bars</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                setPermissions((p) => ({ ...p, showBlueprintScore: !p.showBlueprintScore }))
              }
              style={[
                styles.toggleTrack,
                permissions.showBlueprintScore ? styles.toggleTrackActive : styles.toggleTrackInactive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  permissions.showBlueprintScore && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.permRow}>
            <View style={styles.permInfo}>
              <Text style={styles.permTitle}>First name & city</Text>
              <Text style={styles.permDesc}>{targetName} · Bengaluru</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                setPermissions((p) => ({ ...p, showFirstNameCity: !p.showFirstNameCity }))
              }
              style={[
                styles.toggleTrack,
                permissions.showFirstNameCity ? styles.toggleTrackActive : styles.toggleTrackInactive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  permissions.showFirstNameCity && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.permRow}>
            <View style={styles.permInfo}>
              <Text style={styles.permTitle}>Photo</Text>
              <Text style={styles.permDesc}>
                {permissions.showPhoto ? 'Visible to parents' : 'Blurred until you allow it'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                setPermissions((p) => ({ ...p, showPhoto: !p.showPhoto }))
              }
              style={[
                styles.toggleTrack,
                permissions.showPhoto ? styles.toggleTrackActive : styles.toggleTrackInactive,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  permissions.showPhoto && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Strictly Locked Phone & Contact details */}
          <View style={styles.permRowLocked}>
            <View style={styles.permInfo}>
              <Text style={styles.permTitleLocked}>Phone, email, chats</Text>
              <Text style={styles.permDescLocked}>Never shareable</Text>
            </View>
            <View style={styles.lockedBadge}>
              <Lock size={10} color="#A8927F" />
              <Text style={styles.lockedBadgeText}>LOCKED</Text>
            </View>
          </View>
        </View>

        {/* Optional Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>ADD A NOTE (OPTIONAL)</Text>
          <TextInput
            value={customNote}
            onChangeText={setCustomNote}
            multiline
            style={styles.noteInput}
            placeholder="Add advice context..."
          />
        </View>

        {/* Expiration Timer Row */}
        <View style={styles.expiryRow}>
          <Text style={styles.expiryLabel}>Access expires in</Text>
          <View style={styles.expiryPills}>
            {['7d', '30d', 'Never'].map((exp) => (
              <TouchableOpacity
                key={exp}
                onPress={() => setExpiresIn(exp)}
                style={[
                  styles.expiryPill,
                  expiresIn === exp ? styles.expiryPillActive : styles.expiryPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.expiryPillText,
                    expiresIn === exp ? styles.expiryPillTextActive : styles.expiryPillTextInactive,
                  ]}
                >
                  {exp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit & Close Buttons */}
        <View style={styles.buttonsGroup}>
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Forward to parent dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(90, 60, 45, 0.45)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheetContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    maxHeight: '88%',
    overflowY: 'auto',
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E7DACA',
    alignSelf: 'center',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 27,
    lineHeight: 30,
    color: theme.colors.textPrimary,
  },
  titleItalic: {
    fontStyle: 'italic',
    color: theme.colors.accent,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  recipientsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  recipientCard: {
    padding: 13,
    borderRadius: 15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipientCardActive: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: '#F8F2E9',
  },
  recipientCardInactive: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: '#DDCDB9',
  },
  radioCircleActive: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accent,
  },
  recipientDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  recipientName: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  recipientNote: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  permissionsBox: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  permRow: {
    backgroundColor: theme.colors.cardSecondary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DA',
  },
  permRowLocked: {
    backgroundColor: theme.colors.cardSecondary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  permTitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  permDesc: {
    fontFamily: theme.fonts.sans,
    fontSize: 10.5,
    color: theme.colors.textSubtle,
  },
  permTitleLocked: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#A8927F',
  },
  permDescLocked: {
    fontFamily: theme.fonts.sans,
    fontSize: 10.5,
    color: '#B7A490',
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 99,
    padding: 2,
    display: 'flex',
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: theme.colors.accent,
    alignItems: 'flex-end',
  },
  toggleTrackInactive: {
    backgroundColor: '#E7DACA',
    alignItems: 'flex-start',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 99,
    backgroundColor: '#C9B7A2',
  },
  toggleThumbActive: {
    backgroundColor: theme.colors.white,
  },
  lockedBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E7DACA',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  lockedBadgeText: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: '#A8927F',
  },
  noteContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  noteLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1,
    color: '#96806F',
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#F0E7DA',
    borderRadius: 12,
    padding: 11,
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    color: theme.colors.textSecondary,
    minHeight: 50,
  },
  expiryRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E7DACA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  expiryLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B3833',
  },
  expiryPills: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
  },
  expiryPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  expiryPillActive: {
    backgroundColor: theme.colors.accent,
  },
  expiryPillInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: '#E7DACA',
  },
  expiryPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '700',
  },
  expiryPillTextActive: {
    color: theme.colors.white,
  },
  expiryPillTextInactive: {
    color: theme.colors.textSecondary,
  },
  buttonsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingTop: 4,
  },
  sendBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.white,
  },
  cancelBtn: {
    paddingVertical: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
