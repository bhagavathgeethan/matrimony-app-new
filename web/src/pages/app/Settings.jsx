import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, UserX, ListChecks, Download, Trash2, LogOut, Check, ChevronRight, EyeOff, SearchX, MessageCircle, Sparkles, Users, Smartphone, BellRing, PauseCircle, Moon, Ghost, Lightbulb, Crown } from 'lucide-react';
import { ERASURE_STEPS } from '@shared/constants';
import { useStore } from '../../store';
import { Button, IconBadge, Toggle } from '../../components/ui';
import { t, UI_LANGUAGES, getLanguage, setLanguage } from '@shared/i18n';

export function SettingsPage() {
  const { user, updatePrivacy, exportData, requestErasure, cancelErasure, logout, updateNotificationPrefs, setPaused } = useStore();
  const [privacyError, setPrivacyError] = useState(null);
  const privacy = async (patch) => {
    const res = await updatePrivacy(patch);
    setPrivacyError(res.ok ? null : res.error);
  };
  const prefs = user?.notificationPrefs || {};
  const browserSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(browserSupported ? Notification.permission : 'unsupported');

  useEffect(() => {
    if (window.location.hash === '#notifications') document.getElementById('notifications')?.scrollIntoView();
  }, []);

  const enableBrowser = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const consent = user?.consent || {};
  const consentsOn = ['matching', 'familySharing', 'productResearch', 'marketing'].filter((k) => consent[k]).length;
  const scheduled = user?.erasureScheduledFor;

  const download = async () => {
    setBusy('export');
    const res = await exportData();
    setBusy(null);
    if (!res.ok) return setMessage(res.error);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sangam-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Your data export has been downloaded.');
  };

  const erasure = async () => {
    if (scheduled) {
      if (!window.confirm('Cancel your erasure request and keep your account?')) return;
      setBusy('erase');
      const res = await cancelErasure();
      setBusy(null);
      setMessage(res.ok ? 'Erasure cancelled. Your profile is visible again.' : res.error);
      return;
    }
    if (!window.confirm('Request permanent erasure of your account? You can cancel within 72 hours; after that it cannot be undone.')) return;
    setBusy('erase');
    const res = await requestErasure();
    setBusy(null);
    setMessage(res.ok ? `${res.data.message} Receipt: ${res.data.auditReceiptHash}` : res.error);
  };

  const toggles = [
    [EyeOff, 'Blur photos until mutual interest', 'photoBlurredUntilMutual'],
    [SearchX, 'Hide from search engines', 'hideFromSearchEngines'],
    [UserX, 'Hide from people I know', 'hideFromContacts'],
  ];

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">Settings</span>
        <h1 className="h1">Privacy & <span className="accent">your data</span></h1>
      </div>

      <div className="card flush">
        <div className="setting-row">
          <IconBadge icon={Eye} />
          <span className="h3 grow">Who can see my profile</span>
          <span className="small muted">Matches only</span>
        </div>
        {toggles.map(([Icon, label, key]) => (
          <React.Fragment key={key}>
            <div className="divider" style={{ margin: '0 16px' }} />
            <div className="setting-row">
              <IconBadge icon={Icon} />
              <span className="h3 grow">{label}</span>
              <Toggle label={label} value={user?.[key] ?? true} onChange={(v) => updatePrivacy({ [key]: v })} />
            </div>
          </React.Fragment>
        ))}
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={PauseCircle} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>Pause my profile</span><span className="tiny muted">Hidden from matches and search; your chats carry on</span></span>
          <Toggle label="Pause my profile" value={Boolean(user?.paused)} onChange={(v) => setPaused(v)} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={Moon} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>Horoscope matching</span><span className="tiny muted">Compare star and raasi with members who also turn this on</span></span>
          <Toggle label="Horoscope matching" value={Boolean(user?.showHoroscope)} onChange={(v) => privacy({ showHoroscope: v })} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={Ghost} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>Incognito browsing {user?.plan !== 'premium' && <Crown size={13} color="var(--gold)" />}</span><span className="tiny muted">View profiles without appearing in their visitors (Premium)</span></span>
          <Toggle label="Incognito browsing" value={Boolean(user?.incognito)} onChange={(v) => privacy({ incognito: v })} />
        </div>
        {privacyError && <div className="small error-text" style={{ padding: '0 18px 12px' }}>{privacyError} <Link to="/premium">See Premium</Link></div>}
        <div className="divider" style={{ margin: '0 16px' }} />
        <Link to="/onboarding/consent" className="setting-row">
          <IconBadge icon={ListChecks} />
          <span className="h3 grow">Consent settings</span>
          <span className="small muted">{consentsOn} of 4 on</span>
          <ChevronRight size={18} color="var(--text-light)" />
        </Link>
        <div className="divider" style={{ margin: '0 16px' }} />
        <button className="setting-row" style={{ width: '100%', textAlign: 'left' }} onClick={download} disabled={busy === 'export'}>
          <IconBadge icon={Download} />
          <span className="h3 grow">Download my data</span>
          <span className="small muted">{busy === 'export' ? 'Preparing…' : 'JSON · Instant'}</span>
          <ChevronRight size={18} color="var(--text-light)" />
        </button>
      </div>

      <div className="card row between" style={{ flexWrap: 'wrap' }}>
        <span className="h3">{t('Language')} · Language</span>
        <div className="row" style={{ '--gap': '6px' }} role="radiogroup" aria-label="Language">
          {UI_LANGUAGES.map(([code, label]) => (
            <button key={code} role="radio" aria-checked={getLanguage() === code} className={`chip sm${getLanguage() === code ? ' active' : ''}`} onClick={() => setLanguage(code)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card flush" id="notifications">
        <div style={{ padding: '18px 18px 6px' }}>
          <div className="h3">Notifications</div>
          <div className="small muted">Security alerts about your account are always sent.</div>
        </div>
        {[
          [MessageCircle, 'Messages', 'New messages and when photos unlock', 'messages'],
          [Sparkles, 'New aligned matches', 'When someone 80%+ aligned joins', 'matches'],
          [Users, 'Family responses', 'Approvals, concerns and link opens', 'family'],
          [Lightbulb, 'Tips & reminders', 'Profile completion nudges', 'tips'],
          [Smartphone, 'Push to my devices', 'When the app isn’t open', 'push'],
        ].map(([Icon, label, sub, key]) => (
          <React.Fragment key={key}>
            <div className="divider" style={{ margin: '0 16px' }} />
            <div className="setting-row">
              <IconBadge icon={Icon} />
              <span className="grow">
                <span className="h3" style={{ display: 'block' }}>{label}</span>
                <span className="tiny muted">{sub}</span>
              </span>
              <Toggle label={label} value={prefs[key] !== false} onChange={(v) => updateNotificationPrefs({ [key]: v })} />
            </div>
          </React.Fragment>
        ))}
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={BellRing} />
          <span className="grow">
            <span className="h3" style={{ display: 'block' }}>Browser notifications</span>
            <span className="tiny muted">
              {permission === 'granted' && 'On — you’ll be notified when this tab is in the background'}
              {permission === 'denied' && 'Blocked — allow notifications for this site in your browser settings'}
              {permission === 'default' && 'Get notified even when this tab isn’t in front'}
              {permission === 'unsupported' && 'Not supported by this browser'}
            </span>
          </span>
          {permission === 'default' && <Button size="sm" variant="soft" onClick={enableBrowser}>Enable</Button>}
          {permission === 'granted' && <span className="badge success"><Check size={11} /> On</span>}
        </div>
      </div>

      {message && <div className="card tinted small">{message}</div>}

      <div className="card stack" style={{ borderColor: 'rgba(168,30,60,0.18)' }}>
        <div className="row">
          <span className="icon-badge" style={{ background: 'var(--g-primary)', color: '#fff', width: 46, height: 46 }}><Trash2 size={20} /></span>
          <div>
            <div className="h2">Erase my account</div>
            <div className="small accent" style={{ fontWeight: 700 }}>Completed within 72 hours. Irreversible.</div>
          </div>
        </div>
        <p className="small muted">Under the DPDP Act you can withdraw consent entirely. Here’s exactly what happens:</p>
        <div className="stack" style={{ '--gap': '10px' }}>
          {ERASURE_STEPS.map((s, i) => (
            <div key={s} className="row small" style={{ alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <Button variant={scheduled ? 'soft' : 'dark'} icon={scheduled ? Check : undefined} loading={busy === 'erase'} disabled={busy === 'erase'} onClick={erasure}>
          {scheduled
            ? `Erasure scheduled for ${new Date(scheduled).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Cancel`
            : 'Request erasure'}
        </Button>
      </div>

      <Button variant="secondary" icon={LogOut} onClick={() => window.confirm('Sign out of Sangam on this device?') && logout()}>
        Sign out
      </Button>
    </div>
  );
}
