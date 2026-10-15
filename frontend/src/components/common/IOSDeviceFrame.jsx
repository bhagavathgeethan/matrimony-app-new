import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Capacitor } from '@capacitor/core';
import { Sparkles, MessageCircle, Users, User, Search, ChevronDown, X } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { NotificationBanner } from '../notifications/NotificationUI';
import { CallOverlay } from '../engage/CallOverlay';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, shadows } = theme;

// Installed app fills the device; desktop browsers get a centred phone-width column
const isNativeApp = Capacitor.isNativePlatform();
// The screen picker is a development aid only; release builds navigate through the real flow
const SHOW_SCREEN_PICKER = import.meta.env.DEV;

const SCREEN_GROUPS = [
  ['Sign up', [
    { id: 'welcome', label: '2a Welcome' },
    { id: 'phone', label: '2b Sign In' },
    { id: 'otp', label: '2c OTP' },
    { id: 'consent', label: '2d DPDP Consent' },
  ]],
  ['Onboarding', [
    { id: 'basics', label: '2e Basics' },
    { id: 'personal', label: 'About you (personal)' },
    { id: 'blueprint-intro', label: '2f Blueprint Intro' },
    { id: 'blueprint-q1', label: '2g Question Q1' },
    { id: 'blueprint-tuner', label: '1a Tuner' },
    { id: 'vibes', label: '2h Vibes Picker' },
    { id: 'photos', label: '2i Photo Blur & ID' },
    { id: 'blueprint-summary', label: '2j My Blueprint', tab: 'me' },
  ]],
  ['App', [
    { id: 'feed', label: '1b Match Feed', tab: 'feed' },
    { id: 'profile-list', label: '3a Profile List', tab: 'list' },
    { id: 'conversations', label: '2k Chats', tab: 'chats' },
    { id: 'chat-thread', label: '2l Chat Thread' },
    { id: 'family-tracker', label: '3c Family Tracker', tab: 'family' },
    { id: 'link-parent', label: '2m Link Parent' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'personal-details', label: 'Personal details' },
    { id: 'daily', label: 'Today’s picks' },
    { id: 'shortlist', label: 'Shortlist' },
    { id: 'preferences', label: 'Preferences & prompts' },
    { id: 'premium', label: 'Premium' },
    { id: 'verification', label: 'Verification' },
    { id: 'stories', label: 'Success stories' },
    { id: 'safety', label: 'Safety' },
    { id: 'privacy', label: '2n Privacy & Erasure' },
    { id: 'parent-portal', label: '★ 1d Parent Portal' },
  ]],
];

const TABS = [
  { tab: 'feed', screen: 'feed', label: 'Aligned', icon: Sparkles },
  { tab: 'list', screen: 'profile-list', label: 'Search', icon: Search },
  { tab: 'chats', screen: 'conversations', label: 'Chats', icon: MessageCircle },
  { tab: 'family', screen: 'family-tracker', label: 'Family', icon: Users },
  { tab: 'me', screen: 'blueprint-summary', label: 'Me', icon: User },
];

const TAB_SCREENS = TABS.map((t) => t.screen);

export const IOSDeviceFrame = ({ children, customBottomNav = true }) => {
  const { currentScreen, setCurrentScreen, activeTab, setActiveTab, conversations, user } = useApp();
  const [pickerOpen, setPickerOpen] = useState(false);

  // Personal details lives under the Me tab
  const isMainTabScreen = [...TAB_SCREENS, 'personal-details', 'daily', 'shortlist', 'preferences', 'premium', 'verification', 'stories', 'safety', 'notifications', 'privacy']
    .includes(currentScreen) && Boolean(user?.onboarding?.completed);
  const unread = conversations.filter((t) => t.unread).length;
  const currentLabel =
    SCREEN_GROUPS.flatMap(([, items]) => items).find((i) => i.id === currentScreen)?.label || currentScreen;

  const go = (item) => {
    setCurrentScreen(item.id);
    if (item.tab) setActiveTab(item.tab);
    setPickerOpen(false);
  };

  return (
    <View style={styles.page}>
      <View style={[styles.app, isNativeApp && styles.appNative]}>
        {/* Developer screen switcher (dev builds only, collapsed by default) */}
        {SHOW_SCREEN_PICKER && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setPickerOpen((o) => !o)} style={styles.devStrip}>
          <View style={styles.devDot} />
          <Text style={styles.devText}>Screens</Text>
          <Text style={styles.devCurrent} numberOfLines={1}>{currentLabel}</Text>
          <ChevronDown size={14} color="rgba(255,246,238,0.7)" />
        </TouchableOpacity>
        )}

        <View style={[styles.viewport, !SHOW_SCREEN_PICKER && { minHeight: '100vh' }]}>{children}</View>

        {user && <NotificationBanner />}
        {user && <CallOverlay />}

        {pickerOpen && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
            <View style={styles.pickerPanel}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Jump to screen</Text>
                <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.pickerClose}>
                  <X size={16} color={colors.onDark} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 16 }}>
                {SCREEN_GROUPS.map(([group, items]) => (
                  <View key={group} style={{ gap: 8 }}>
                    <Text style={styles.pickerGroup}>{group}</Text>
                    <View style={styles.pickerGrid}>
                      {items.map((item) => {
                        const active = item.id === currentScreen;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => go(item)}
                            style={[styles.pickerPill, active && styles.pickerPillActive]}
                          >
                            <Text style={[styles.pickerPillText, active && styles.pickerPillTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Floating glass tab bar */}
        {isMainTabScreen && customBottomNav && (
          <View style={styles.tabBarWrap} pointerEvents="box-none">
            <View style={[styles.tabBar, isNativeApp && styles.fullWidth]}>
              {TABS.map(({ tab, screen, label, icon: Icon }) => {
                const active = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.8}
                    onPress={() => {
                      setCurrentScreen(screen);
                      setActiveTab(tab);
                    }}
                    style={styles.tabItem}
                  >
                    <View style={[styles.tabIcon, active && styles.tabIconActive]}>
                      <Icon size={19} color={active ? colors.white : colors.textMuted} strokeWidth={active ? 2.4 : 2} />
                      {tab === 'chats' && unread > 0 && <View style={styles.tabDot} />}
                    </View>
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    minHeight: '100vh',
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
  },
  app: {
    width: '100%',
    maxWidth: 440,
    minHeight: '100vh',
    backgroundColor: colors.bg,
    position: 'relative',
    boxShadow: '0 0 60px rgba(60, 30, 20, 0.12)',
  },
  appNative: {
    maxWidth: '100%',
    boxShadow: 'none',
  },
  devStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: colors.surfaceDark,
  },
  devDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  devText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  devCurrent: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(255,246,238,0.7)',
  },
  viewport: {
    flex: 1,
    minHeight: 'calc(100vh - 30px)',
    display: 'flex',
    flexDirection: 'column',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: colors.overlay,
  },
  pickerPanel: {
    margin: 12,
    padding: 18,
    borderRadius: 24,
    backgroundImage: gradients.hero,
    boxShadow: shadows.raised,
    gap: 14,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTitle: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 20.8,
    color: colors.onDark,
    letterSpacing: -0.4,
  },
  pickerClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerGroup: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pickerPillActive: {
    backgroundImage: gradients.gold,
    borderColor: 'transparent',
  },
  pickerPillText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onDark,
  },
  pickerPillTextActive: {
    color: colors.surfaceDark,
  },
  tabBarWrap: {
    position: 'fixed',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
    paddingHorizontal: 14,
  },
  tabBar: {
    width: '100%',
    maxWidth: 412,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    backdropFilter: 'blur(18px) saturate(1.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: shadows.floatingBar,
  },
  fullWidth: {
    maxWidth: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconActive: {
    backgroundImage: gradients.primary,
    boxShadow: '0 6px 14px rgba(168, 30, 60, 0.35)',
  },
  tabDot: {
    position: 'absolute',
    top: 4,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '800',
  },
});
