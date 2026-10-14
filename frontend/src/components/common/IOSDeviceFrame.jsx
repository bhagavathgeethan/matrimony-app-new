import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  MessageSquare,
  Users,
  User,
  Layers,
  Sliders,
} from 'lucide-react';

export const IOSDeviceFrame = ({ children, customBottomNav = true }) => {
  const { currentScreen, setCurrentScreen, activeTab, setActiveTab } = useApp();
  const [showScreenSwitcher, setShowScreenSwitcher] = useState(true);

  const isMainTabScreen = [
    'feed',
    'profile-list',
    'conversations',
    'family-tracker',
    'blueprint-summary',
  ].includes(currentScreen);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appContainer}>
        {/* Top Developer & Flow Switcher Bar */}
        <View style={styles.topDevBar}>
          <View style={styles.topDevHeader}>
            <View style={styles.brandGroup}>
              <Text style={styles.brandTitle}>MATRIMONY</Text>
              <Text style={styles.brandSub}>Values-Led · DPDP 2026</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowScreenSwitcher((s) => !s)}
              style={styles.toggleSwitcherBtn}
            >
              <Sliders size={13} color={theme.colors.accent} />
              <Text style={styles.toggleSwitcherText}>
                {showScreenSwitcher ? 'Hide Screen Picker' : 'Switch Screen'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible Screen Switcher Strip */}
          {showScreenSwitcher && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.screenPickerScroll}
            >
              {[
                { id: 'welcome', label: '2a Welcome' },
                { id: 'phone', label: '2b Sign In' },
                { id: 'otp', label: '2c OTP' },
                { id: 'consent', label: '2d DPDP Consent' },
                { id: 'basics', label: '2e Basics' },
                { id: 'blueprint-intro', label: '2f Blueprint Intro' },
                { id: 'blueprint-q1', label: '2g Question Q1' },
                { id: 'blueprint-tuner', label: '1a Tuner' },
                { id: 'vibes', label: '2h Vibes Picker' },
                { id: 'photos', label: '2i Photo Blur & ID' },
                { id: 'blueprint-summary', label: '2j My Blueprint' },
                { id: 'feed', label: '1b Match Feed', tab: 'feed' },
                { id: 'profile-list', label: '3a Profile List', tab: 'list' },
                { id: 'conversations', label: '2k Chats', tab: 'chats' },
                { id: 'chat-thread', label: '2l Chat Thread' },
                { id: 'family-tracker', label: '3c Family Tracker', tab: 'family' },
                { id: 'link-parent', label: '2m Link Parent' },
                { id: 'privacy', label: '2n Privacy & Erasure' },
                { id: 'parent-portal', label: '★ 1d Parent Portal', highlight: true },
              ].map((item) => {
                const isActive = currentScreen === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setCurrentScreen(item.id);
                      if (item.tab) setActiveTab(item.tab);
                    }}
                    style={[
                      styles.screenPill,
                      isActive && styles.screenPillActive,
                      item.highlight && styles.screenPillHighlight,
                      item.highlight && isActive && styles.screenPillHighlightActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.screenPillText,
                        isActive && styles.screenPillTextActive,
                        item.highlight && styles.screenPillTextHighlight,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Direct Edge-to-Edge Screen Viewport */}
        <View style={styles.screenViewport}>{children}</View>

        {/* App Bottom Tab Navigation */}
        {isMainTabScreen && customBottomNav && (
          <View style={styles.bottomNavContainer}>
            <View style={styles.bottomNav}>
              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('feed');
                  setActiveTab('feed');
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIconBox, activeTab === 'feed' && styles.navIconBoxActive]}>
                  <Sparkles size={16} color={activeTab === 'feed' ? theme.colors.white : theme.colors.textMuted} />
                </View>
                <Text style={[styles.navLabel, activeTab === 'feed' && styles.navLabelActive]}>Aligned</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('profile-list');
                  setActiveTab('list');
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIconBox, activeTab === 'list' && styles.navIconBoxActive]}>
                  <Layers size={16} color={activeTab === 'list' ? theme.colors.white : theme.colors.textMuted} />
                </View>
                <Text style={[styles.navLabel, activeTab === 'list' && styles.navLabelActive]}>Browse</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('conversations');
                  setActiveTab('chats');
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIconBox, activeTab === 'chats' && styles.navIconBoxActive]}>
                  <MessageSquare size={16} color={activeTab === 'chats' ? theme.colors.white : theme.colors.textMuted} />
                </View>
                <Text style={[styles.navLabel, activeTab === 'chats' && styles.navLabelActive]}>Chats</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('family-tracker');
                  setActiveTab('family');
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIconBox, activeTab === 'family' && styles.navIconBoxActive]}>
                  <Users size={16} color={activeTab === 'family' ? theme.colors.white : theme.colors.textMuted} />
                </View>
                <Text style={[styles.navLabel, activeTab === 'family' && styles.navLabelActive]}>Family</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('blueprint-summary');
                  setActiveTab('me');
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIconBox, activeTab === 'me' && styles.navIconBoxActive]}>
                  <User size={16} color={activeTab === 'me' ? theme.colors.white : theme.colors.textMuted} />
                </View>
                <Text style={[styles.navLabel, activeTab === 'me' && styles.navLabelActive]}>Me</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: theme.colors.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  appContainer: {
    width: '100%',
    maxWidth: 480, // Clean standard mobile viewport width on desktop, 100% on mobile
    minHeight: '100vh',
    backgroundColor: theme.colors.bg,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 0 40px rgba(90, 60, 45, 0.06)',
  },
  topDevBar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 60,
  },
  topDevHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  brandTitle: {
    fontFamily: theme.fonts.mono,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.accent,
  },
  brandSub: {
    fontFamily: theme.fonts.sans,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },
  toggleSwitcherBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 99,
  },
  toggleSwitcherText: {
    fontFamily: theme.fonts.sans,
    fontSize: 10.5,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  screenPickerScroll: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  screenPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  screenPillActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  screenPillHighlight: {
    backgroundColor: '#3A2420',
    borderColor: '#3A2420',
  },
  screenPillHighlightActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  screenPillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  screenPillTextActive: {
    color: theme.colors.white,
  },
  screenPillTextHighlight: {
    color: '#FFF8F2',
    fontWeight: '700',
  },
  screenViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bottomNavContainer: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: 'rgba(251, 246, 238, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 50,
  },
  bottomNav: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#5A3C2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  navIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBoxActive: {
    backgroundColor: theme.colors.accent,
  },
  navLabel: {
    fontFamily: theme.fonts.sans,
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.textSubtle,
  },
  navLabelActive: {
    color: theme.colors.accent,
    fontWeight: '800',
  },
});
