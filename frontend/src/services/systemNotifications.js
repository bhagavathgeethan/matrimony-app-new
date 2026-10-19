// Android system notifications for the installed app (Capacitor Local Notifications).
// Shown only while the app is in the background; in the foreground the in-app banner is used.
// Remote push (app fully closed) arrives via FCM once a real push provider is connected.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { notificationText, t } from '@shared/i18n';

const native = Capacitor.isNativePlatform();
let ready = false;
let tapHandler = null;
let nextId = 1;

export const systemNotifications = {
  async init({ onTap }) {
    tapHandler = onTap;
    if (!native || ready) return;
    ready = true;
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') await LocalNotifications.requestPermissions();
      await LocalNotifications.createChannel({
        id: 'sangam',
        name: '3Knot',
        description: t('Messages, matches and family responses'),
        importance: 4,
        visibility: 1,
      });
      LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
        if (notification?.extra?.notification) tapHandler?.(notification.extra.notification);
      });
    } catch (err) {
      console.warn('Notifications unavailable:', err?.message || err);
    }
  },

  async show(n) {
    if (!native || !document.hidden) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: nextId++,
            title: notificationText(n).title,
            body: notificationText(n).body,
            channelId: 'sangam',
            smallIcon: 'ic_launcher_foreground',
            extra: { notification: n },
          },
        ],
      });
    } catch (err) {
      console.warn('Could not show notification:', err?.message || err);
    }
  },
};
