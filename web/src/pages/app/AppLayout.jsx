import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Sparkles, Search, MessageCircle, Users, UserRound, Settings, Bell, Sun, Star, Crown, ShieldCheck, LayoutDashboard, LogOut } from 'lucide-react';
import { useStore } from '../../store';
import { Brand, Avatar } from '../../components/ui';
import { ToastStack } from '../../components/notifications';
import { CallLayer } from '../../components/calls';
import { t } from '@shared/i18n';

export function AppLayout() {
  const { user, conversations, sentRecords, unreadNotifications, logout } = useStore();
  const unread = conversations.reduce((n, t) => n + (t.unreadCount || 0), 0) + conversations.filter((t) => t.needsMyResponse && !t.unread).length;
  const awaiting = sentRecords.filter((r) => r.status === 'awaiting' && !r.expired).length;

  const items = [
    { to: '/matches', label: 'Matches', icon: Sparkles },
    { to: '/today', label: 'Today', icon: Sun, desktopOnly: true },
    { to: '/browse', label: 'Search', icon: Search },
    { to: '/shortlist', label: 'Shortlist', icon: Star, desktopOnly: true },
    { to: '/messages', label: 'Messages', icon: MessageCircle, count: unread },
    { to: '/family', label: 'Family', icon: Users, count: awaiting },
    { to: '/profile', label: 'Profile', icon: UserRound },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav className="nav" aria-label="Main">
          {items.map(({ to, label, icon: Icon, count }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon size={19} />
              {t(label)}
              {count > 0 && <span className="nav-count">{count}</span>}
            </NavLink>
          ))}
        </nav>
        <nav className="nav secondary" aria-label="More">
          <NavLink to="/notifications" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Bell size={17} />
            {t('Notifications')}
            {unreadNotifications > 0 && <span className="nav-count">{unreadNotifications}</span>}
          </NavLink>
          <NavLink to="/premium" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Crown size={17} />
            {t(user?.plan === 'premium' ? 'Premium' : 'Go Premium')}
          </NavLink>
          <NavLink to="/safety" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <ShieldCheck size={17} />
            {t('Safety')}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Settings size={17} />
            {t('Privacy & settings')}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <LayoutDashboard size={17} />
              {t('Admin')}
            </NavLink>
          )}
        </nav>
        <div className="me-card">
          <NavLink to="/profile" className="row grow" style={{ '--gap': '10px', minWidth: 0 }}>
            <Avatar src={user?.photos?.[0]?.url} name={user?.firstName} size={38} />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="h3" style={{ display: 'block' }}>{user?.firstName}</span>
              <span className="tiny muted">{user?.city}</span>
            </span>
          </NavLink>
          <button
            className="icon-btn sm"
            aria-label="Sign out"
            title={t('Sign out')}
            onClick={() => window.confirm('Sign out of Sangam on this device?') && logout()}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-topbar">
          <Brand tagline={false} size={28} />
          <Link to="/notifications" className="icon-btn" aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`} style={{ position: 'relative' }}>
            <Bell size={18} />
            {unreadNotifications > 0 && <span className="bell-count">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
          </Link>
        </div>
        <Outlet />
      </main>

      <ToastStack />
      <CallLayer />

      <nav className="bottom-nav" aria-label="Main">
        {items.filter((i) => !i.desktopOnly).map(({ to, label, icon: Icon, count }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <span className="nav-ico" style={{ position: 'relative' }}>
              <Icon size={19} />
              {count > 0 && <span className="nav-count" style={{ position: 'absolute', top: -4, right: -2, minWidth: 18, height: 18, fontSize: 10 }}>{count}</span>}
            </span>
            {t(label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
