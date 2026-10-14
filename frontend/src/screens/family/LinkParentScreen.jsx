import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Check, X, Plus } from 'lucide-react';

export const LinkParentScreen = () => {
  const { familyLinks, setCurrentScreen } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.title}>Bring family in —{'\n'}on a leash</Text>
        <Text style={styles.subtitle}>
          A parent account can only see what you forward. No search, no chat, no browsing.
        </Text>
      </View>

      {/* Linked Parents Box */}
      <View style={styles.parentsCard}>
        {/* Amma (Linked) */}
        <View style={styles.parentRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarChar}>A</Text>
          </View>
          <View style={styles.parentInfo}>
            <Text style={styles.parentName}>Amma · +91 98••• ••210</Text>
            <Text style={styles.parentStatus}>Linked · 2 profiles shared</Text>
          </View>
          <TouchableOpacity style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Appa (Invite) */}
        <View style={styles.parentRow}>
          <View style={styles.addAvatarCircle}>
            <Plus size={18} color="#C0B0A0" />
          </View>
          <View style={styles.parentInfo}>
            <Text style={styles.parentName}>Invite Appa</Text>
          </View>
          <TouchableOpacity style={styles.sendLinkBtn}>
            <Text style={styles.sendLinkBtnText}>Send link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Can vs Cannot Permission Matrix */}
      <View style={styles.matrixCard}>
        <Text style={styles.matrixHeader}>A PARENT CAN</Text>
        <View style={styles.matrixItems}>
          <View style={styles.matrixItemRow}>
            <View style={styles.canCheckDot} />
            <Text style={styles.canItemText}>See profiles you forward, with scores</Text>
          </View>
          <View style={styles.matrixItemRow}>
            <View style={styles.canCheckDot} />
            <Text style={styles.canItemText}>Mark approval or raise a concern</Text>
          </View>
        </View>

        <Text style={[styles.matrixHeader, { paddingTop: 6 }]}>A PARENT CANNOT</Text>
        <View style={styles.matrixItems}>
          <View style={styles.matrixItemRow}>
            <View style={styles.cannotDot} />
            <Text style={styles.cannotItemText}>Browse or search other members</Text>
          </View>
          <View style={styles.matrixItemRow}>
            <View style={styles.cannotDot} />
            <Text style={styles.cannotItemText}>Message anyone, ever</Text>
          </View>
          <View style={styles.matrixItemRow}>
            <View style={styles.cannotDot} />
            <Text style={styles.cannotItemText}>See your chats or contact details</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerGroup}>
        <Text style={styles.revokeNotice}>Revoke access instantly, any time.</Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setCurrentScreen('family-tracker')}
          style={styles.doneBtn}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  parentsCard: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 18,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  parentRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0E7DA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: '#8A756A',
  },
  addAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDCDB9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  parentName: {
    fontFamily: theme.fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  parentStatus: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  manageBtn: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  manageBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  sendLinkBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 99,
  },
  sendLinkBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E7DA',
  },
  matrixCard: {
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 18,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  matrixHeader: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  matrixItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  matrixItemRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  canCheckDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  canItemText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4B3833',
  },
  cannotDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E7DACA',
  },
  cannotItemText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#96806F',
  },
  footerGroup: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
  },
  revokeNotice: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: '#96806F',
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
