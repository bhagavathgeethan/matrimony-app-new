// Web notification UI: type icons, live toast banners, and the inbox list
import React, { useEffect } from 'react';
import { MessageCircle, Unlock, Sparkles, Users, ShieldAlert, Bell, X, Heart, Video, Bookmark, Sun, ClipboardList, BadgeCheck } from 'lucide-react';
import { useStore } from '../store';
import { cx } from './ui';
import { t, notificationText } from '@shared/i18n';

const TYPE_ICON = {
  message: [MessageCircle, 'accent'],
  mutual: [Unlock, 'gold'],
  match: [Sparkles, 'gold'],
  family_feedback: [Users, 'success'],
  family_linked: [Users, 'success'],
  security: [ShieldAlert, 'warning'],
  interest_request: [Heart, 'accent'],
  interest_accepted: [Heart, 'success'],
  call: [Video, 'accent'],
  saved_search: [Bookmark, 'gold'],
  daily_picks: [Sun, 'gold'],
  profile_nudge: [ClipboardList, 'gold'],
  family_edit: [Users, 'success'],
  account: [BadgeCheck, 'success'],
};

export function NotificationIcon({ type, size = 40 }) {
  const [Icon, tone] = TYPE_ICON[type] || [Bell, 'accent'];
  return (
    <span className={cx('icon-badge', `tone-${tone}`)} style={{ width: size, height: size }}>
      <Icon size={size * 0.46} />
    </span>
  );
}

export function NotificationItem({ n, onOpen }) {
  return (
    <button className={cx('notif-item', !n.read && 'unread')} onClick={() => onOpen(n)}>
      <NotificationIcon type={n.type} />
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="h3" style={{ display: 'block', fontSize: 15 }}>{notificationText(n).title}</span>
        <span className="small muted notif-body">{notificationText(n).body}</span>
      </span>
      <span className="stack" style={{ '--gap': '6px', alignItems: 'flex-end' }}>
        <span className="tiny muted" style={{ whiteSpace: 'nowrap' }}>{n.time}</span>
        {!n.read && <span className="notif-dot" aria-label={t('Unread')} />}
      </span>
    </button>
  );
}

// Live banners for notifications that arrive while the app is open; auto-dismiss after 6s
export function ToastStack() {
  const { toasts, openNotification, dismissToast } = useStore();

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((toast) => setTimeout(() => dismissToast(toast.id), 6000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((n) => (
        <div key={n.id} className="toast fade-in" role="status">
          <button className="row grow" style={{ textAlign: 'left', minWidth: 0 }} onClick={() => openNotification(n)}>
            <NotificationIcon type={n.type} size={36} />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="h3" style={{ display: 'block', fontSize: 14.5 }}>{notificationText(n).title}</span>
              <span className="small muted notif-body">{notificationText(n).body}</span>
            </span>
          </button>
          <button className="icon-btn" style={{ width: 30, height: 30, boxShadow: 'none' }} onClick={() => dismissToast(n.id)} aria-label={t('Dismiss')}>
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
