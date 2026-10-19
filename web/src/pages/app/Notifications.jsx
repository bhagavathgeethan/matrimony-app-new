import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Empty } from '../../components/ui';
import { NotificationItem } from '../../components/notifications';
import { t } from '@shared/i18n';

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

export function NotificationsPage() {
  const { notifications, unreadNotifications, notificationsCursor, loadNotifications, markAllNotificationsRead, openNotification } = useStore();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const today = notifications.filter((n) => isToday(n.createdAt));
  const earlier = notifications.filter((n) => !isToday(n.createdAt));

  const more = async () => {
    setLoadingMore(true);
    await loadNotifications({ more: true });
    setLoadingMore(false);
  };

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">{t('Inbox')}</span>
          <h1 className="h1">{t('Notifications')}</h1>
          <span className="small muted">{unreadNotifications ? `${unreadNotifications} unread` : t('You’re all caught up')}</span>
        </div>
        <div className="row">
          <Link to="/settings#notifications" className="btn btn-secondary sm"><Settings size={15} />{' '}{t('Preferences')}</Link>
          <Button size="sm" variant="soft" icon={CheckCheck} disabled={!unreadNotifications} onClick={markAllNotificationsRead}>
            {t('Mark all read')}
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Empty icon={Bell} title={t('No notifications yet')}>
          <span className="small">{t('New messages, aligned matches and family responses will show up here.')}</span>
        </Empty>
      ) : (
        <>
          {[['Today', today], ['Earlier', earlier]].map(([label, items]) => items.length > 0 && (
            <div key={label} className="stack" style={{ '--gap': '8px' }}>
              <span className="label">{t(label)}</span>
              <div className="card flush">
                {items.map((n, i) => (
                  <React.Fragment key={n.id}>
                    {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
                    <NotificationItem n={n} onOpen={openNotification} />
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {notificationsCursor && (
            <Button variant="secondary" loading={loadingMore} disabled={loadingMore} onClick={more}>{t('Load older')}</Button>
          )}
        </>
      )}
    </div>
  );
}
