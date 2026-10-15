// Mobile notification UI: type icons, inbox rows, and live banners at the top of the screen
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle, Unlock, Sparkles, Users, ShieldAlert, Bell, X, Heart, Video, Bookmark, Sun, ClipboardList, BadgeCheck } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

const { colors, fonts, radii, shadows } = theme;

const TYPE_ICON = {
  message: [MessageCircle, colors.accentSoft, colors.accent],
  mutual: [Unlock, colors.goldSoft, '#8A6A2E'],
  match: [Sparkles, colors.goldSoft, '#8A6A2E'],
  family_feedback: [Users, colors.successSoft, colors.success],
  family_linked: [Users, colors.successSoft, colors.success],
  security: [ShieldAlert, colors.warningSoft, colors.warning],
  interest_request: [Heart, colors.accentSoft, colors.accent],
  interest_accepted: [Heart, colors.successSoft, colors.success],
  call: [Video, colors.accentSoft, colors.accent],
  saved_search: [Bookmark, colors.goldSoft, '#8A6A2E'],
  daily_picks: [Sun, colors.goldSoft, '#8A6A2E'],
  profile_nudge: [ClipboardList, colors.goldSoft, '#8A6A2E'],
  family_edit: [Users, colors.successSoft, colors.success],
  account: [BadgeCheck, colors.successSoft, colors.success],
};

export const NotificationIcon = ({ type, size = 40 }) => {
  const [Icon, bg, fg] = TYPE_ICON[type] || [Bell, colors.accentSoft, colors.accent];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.46} color={fg} />
    </View>
  );
};

export const NotificationRow = ({ n, onPress }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(n)} style={[styles.row, !n.read && styles.rowUnread]}>
    <NotificationIcon type={n.type} />
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
      <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 6 }}>
      <Text style={styles.time}>{n.time}</Text>
      {!n.read && <View style={styles.dot} />}
    </View>
  </TouchableOpacity>
);

// Banner for notifications that arrive while the app is open; auto-dismiss after 6s
export const NotificationBanner = () => {
  const { toasts, openNotification, dismissToast } = useApp();
  const latest = toasts[toasts.length - 1];

  useEffect(() => {
    if (!latest) return undefined;
    const t = setTimeout(() => dismissToast(latest.id), 6000);
    return () => clearTimeout(t);
  }, [latest, dismissToast]);

  if (!latest) return null;
  return (
    <View style={styles.bannerWrap} pointerEvents="box-none">
      <div className="mx-fade" style={{ width: '100%' }}>
        <View style={styles.banner}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => openNotification(latest)} style={styles.bannerMain}>
            <NotificationIcon type={latest.type} size={36} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{latest.title}</Text>
              <Text style={styles.body} numberOfLines={1}>{latest.body}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => dismissToast(latest.id)} style={styles.close} accessibilityLabel="Dismiss">
            <X size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rowUnread: {
    backgroundColor: '#FFFAF8',
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  time: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  bannerWrap: {
    position: 'fixed',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 90,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  banner: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(14px)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: shadows.raised,
  },
  bannerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
