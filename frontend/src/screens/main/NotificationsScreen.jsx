import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, CheckCheck } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, FadeIn, Eyebrow, Heading, Body, Card, Divider, SectionLabel, Button } from '../../components/ui/kit';
import { NotificationRow } from '../../components/notifications/NotificationUI';

const { colors, fonts } = theme;
const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

export const NotificationsScreen = () => {
  const {
    setCurrentScreen, notifications, unreadNotifications, notificationsCursor,
    loadNotifications, markAllNotificationsRead, openNotification,
  } = useApp();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const groups = [
    ['Today', notifications.filter((n) => isToday(n.createdAt))],
    ['Earlier', notifications.filter((n) => !isToday(n.createdAt))],
  ];

  return (
    <Screen tabBar>
      <TopBar
        onBack={() => setCurrentScreen('feed')}
        right={
          <TouchableOpacity
            disabled={!unreadNotifications}
            onPress={markAllNotificationsRead}
            style={[styles.markAll, !unreadNotifications && { opacity: 0.4 }]}
          >
            <CheckCheck size={15} color={colors.accent} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        }
      />

      <FadeIn>
        <View style={{ gap: 6 }}>
          <Eyebrow>Inbox</Eyebrow>
          <Heading size={36}>Notifications</Heading>
          <Body size={13.5}>{unreadNotifications ? `${unreadNotifications} unread` : 'You’re all caught up'}</Body>
        </View>
      </FadeIn>

      {notifications.length === 0 ? (
        <Card variant="tinted" style={styles.empty}>
          <Bell size={28} color={colors.gold} />
          <Body style={{ textAlign: 'center' }}>
            New messages, aligned matches and family responses will show up here.
          </Body>
        </Card>
      ) : (
        groups.map(([label, items]) => items.length > 0 && (
          <FadeIn key={label} delay={60}>
            <View style={{ gap: 8 }}>
              <SectionLabel>{label}</SectionLabel>
              <Card padding={0} style={{ overflow: 'hidden' }}>
                {items.map((n, i) => (
                  <View key={n.id}>
                    {i > 0 && <Divider style={{ marginHorizontal: 14 }} />}
                    <NotificationRow n={n} onPress={openNotification} />
                  </View>
                ))}
              </Card>
            </View>
          </FadeIn>
        ))
      )}

      {notificationsCursor && (
        <Button
          label={loadingMore ? 'Loading…' : 'Load older'}
          variant="secondary"
          disabled={loadingMore}
          onPress={async () => {
            setLoadingMore(true);
            await loadNotifications({ more: true });
            setLoadingMore(false);
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  markAllText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.accent,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
});
