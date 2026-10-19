import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, UserX, ListChecks, Download, Trash2, LogOut, Check, ChevronRight, EyeOff, SearchX, MessageCircle, Sparkles, Users, Smartphone, BellRing, PauseCircle, Moon, Ghost, Lightbulb, Crown } from 'lucide-react';
import { ERASURE_STEPS } from '@shared/constants';
import { PHOTO_VISIBILITY } from '@shared/plans';
import { hasFeature, UpsellPill } from '../../components/premium';
import { useStore } from '../../store';
import { Button, IconBadge, Toggle } from '../../components/ui';
import { Select } from '../../components/Select';
import { t, formatDateTime } from '@shared/i18n';
import { LanguagePicker } from '../../components/LanguagePicker';

// Premium: hide your profile from chosen cities or ages
function VisibilityRules({ user, enabled, onSave }) {
  const rules = user?.visibilityRules || {};
  const [cities, setCities] = useState((rules.hideCities || []).join(', '));
  const [ageMin, setAgeMin] = useState(rules.ageMin || '');
  const [ageMax, setAgeMax] = useState(rules.ageMax || '');
  const save = () => onSave({
    hideCities: cities.split(',').map((c) => c.trim()).filter(Boolean),
    ...(ageMin ? { ageMin: Number(ageMin) } : {}),
    ...(ageMax ? { ageMax: Number(ageMax) } : {}),
  });
  return (
    <div className="setting-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <IconBadge icon={SearchX} />
      <span className="grow stack" style={{ '--gap': '8px', minWidth: 240 }}>
        <span className="h3">{t('Hide my profile from…')}{' '}{!enabled && <UpsellPill feature="visibilityRules" />}</span>
        <input className="input" aria-label={t('Hide from cities')} disabled={!enabled} placeholder={t('Cities, comma-separated (e.g. Madurai, Trichy)')} value={cities} onChange={(e) => setCities(e.target.value)} />
        <span className="row" style={{ '--gap': '8px' }}>
          <span className="tiny muted">{t('Only show me to ages')}</span>
          <input className="input" style={{ width: 90 }} type="number" min="18" max="80" aria-label={t('Show to ages from')} disabled={!enabled} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
          <span className="tiny muted">{t('to')}</span>
          <input className="input" style={{ width: 90 }} type="number" min="18" max="80" aria-label={t('Show to ages up to')} disabled={!enabled} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
          <Button size="sm" variant="secondary" disabled={!enabled} onClick={save}>{t('Save')}</Button>
        </span>
      </span>
    </div>
  );
}

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
    setMessage(t('Your data export has been downloaded.'));
  };

  const erasure = async () => {
    if (scheduled) {
      if (!window.confirm(t('Cancel your erasure request and keep your account?'))) return;
      setBusy('erase');
      const res = await cancelErasure();
      setBusy(null);
      setMessage(res.ok ? t('Erasure cancelled. Your profile is visible again.') : res.error);
      return;
    }
    if (!window.confirm(t('Request permanent erasure of your account? You can cancel within 72 hours; after that it cannot be undone.'))) return;
    setBusy('erase');
    const res = await requestErasure();
    setBusy(null);
    setMessage(res.ok ? `${t(res.data.message)} ${t('Receipt: {hash}', { hash: res.data.auditReceiptHash })}` : res.error);
  };

  const toggles = [
    [EyeOff, 'Blur photos until mutual interest', 'photoBlurredUntilMutual'],
    [SearchX, 'Hide from search engines', 'hideFromSearchEngines'],
    [UserX, 'Hide from people I know', 'hideFromContacts'],
  ];

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('Settings')}</span>
        <h1 className="h1">{t('Privacy &')}{' '}<span className="accent">{t('your data')}</span></h1>
      </div>

      <div className="card flush">
        <div className="setting-row">
          <IconBadge icon={Eye} />
          <span className="h3 grow">{t('Who can see my profile')}</span>
          <span className="small muted">{t('Matches only')}</span>
        </div>
        {toggles.map(([Icon, label, key]) => (
          <React.Fragment key={key}>
            <div className="divider" style={{ margin: '0 16px' }} />
            <div className="setting-row">
              <IconBadge icon={Icon} />
              <span className="h3 grow">{t(label)}</span>
              <Toggle label={t(label)} value={user?.[key] ?? true} onChange={(v) => updatePrivacy({ [key]: v })} />
            </div>
          </React.Fragment>
        ))}
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={PauseCircle} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Pause my profile')}</span><span className="tiny muted">{t('Hidden from matches and search; your chats carry on')}</span></span>
          <Toggle label={t('Pause my profile')} value={Boolean(user?.paused)} onChange={(v) => setPaused(v)} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={Moon} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Horoscope matching')}</span><span className="tiny muted">{t('Compare star and raasi with members who also turn this on')}</span></span>
          <Toggle label={t('Horoscope matching')} value={Boolean(user?.showHoroscope)} onChange={(v) => privacy({ showHoroscope: v })} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={Ghost} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Incognito browsing')}{' '}{!user?.planFeatures?.includes('incognito') && <Crown size={13} color="var(--gold)" />}</span><span className="tiny muted">{t('View profiles without appearing in their visitors (Premium)')}</span></span>
          <Toggle label={t('Incognito browsing')} value={Boolean(user?.incognito)} onChange={(v) => privacy({ incognito: v })} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={Crown} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Show my plan badge')}{' '}{!hasFeature(user, 'badgeChoice') && <UpsellPill feature="badgeChoice" />}</span><span className="tiny muted">{t('The crown on your card')}</span></span>
          <Toggle label={t('Show my plan badge')} value={user?.showPremiumBadge !== false} onChange={(v) => privacy({ showPremiumBadge: v })} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={EyeOff} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Hide my last seen')}{' '}{!hasFeature(user, 'hideActivity') && <UpsellPill feature="hideActivity" />}</span><span className="tiny muted">{t('Others won’t see “Active now” or “Active today”')}</span></span>
          <Toggle label={t('Hide my last seen')} value={Boolean(user?.hideActivity)} onChange={(v) => privacy({ hideActivity: v })} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row" style={{ flexWrap: 'wrap' }}>
          <IconBadge icon={Eye} />
          <span className="grow"><span className="h3" style={{ display: 'block' }}>{t('Who sees my photos clearly')}{' '}{!hasFeature(user, 'photoPrivacy') && <UpsellPill feature="photoPrivacy" />}</span></span>
          <Select style={{ maxWidth: 340 }} aria-label={t('Who sees my photos clearly')} disabled={!hasFeature(user, 'photoPrivacy')}
            value={user?.photoVisibility || ''} onChange={(v) => privacy({ photoVisibility: v || null })}
            options={[['', t('Standard (blur until mutual, as set above)')], ...PHOTO_VISIBILITY.map(([k, label]) => [k, t(label)])]} />
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />
        <VisibilityRules user={user} enabled={hasFeature(user, 'visibilityRules')} onSave={(rules) => privacy({ visibilityRules: rules })} />
        {privacyError && <div className="small error-text" style={{ padding: '0 18px 12px' }}>{privacyError} <Link to="/premium">{t('See plans')}</Link></div>}
        <div className="divider" style={{ margin: '0 16px' }} />
        <Link to="/onboarding/consent" className="setting-row">
          <IconBadge icon={ListChecks} />
          <span className="h3 grow">{t('Consent settings')}</span>
          <span className="small muted">{t('{consentsOn} of 4 on', { consentsOn })}</span>
          <ChevronRight size={18} color="var(--text-light)" />
        </Link>
        <div className="divider" style={{ margin: '0 16px' }} />
        <button className="setting-row" style={{ width: '100%', textAlign: 'left' }} onClick={download} disabled={busy === 'export'}>
          <IconBadge icon={Download} />
          <span className="h3 grow">{t('Download my data')}</span>
          <span className="small muted">{busy === 'export' ? t('Preparing…') : t('JSON · Instant')}</span>
          <ChevronRight size={18} color="var(--text-light)" />
        </button>
      </div>

      <div className="card row between" style={{ flexWrap: 'wrap' }}>
        <span className="h3">{t('Language')}</span>
        <LanguagePicker />
      </div>

      <div className="card flush" id="notifications">
        <div style={{ padding: '18px 18px 6px' }}>
          <div className="h3">{t('Notifications')}</div>
          <div className="small muted">{t('Security alerts about your account are always sent.')}</div>
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
                <span className="h3" style={{ display: 'block' }}>{t(label)}</span>
                <span className="tiny muted">{t(sub)}</span>
              </span>
              <Toggle label={t(label)} value={prefs[key] !== false} onChange={(v) => updateNotificationPrefs({ [key]: v })} />
            </div>
          </React.Fragment>
        ))}
        <div className="divider" style={{ margin: '0 16px' }} />
        <div className="setting-row">
          <IconBadge icon={BellRing} />
          <span className="grow">
            <span className="h3" style={{ display: 'block' }}>{t('Browser notifications')}</span>
            <span className="tiny muted">
              {permission === 'granted' && t('On — you’ll be notified when this tab is in the background')}
              {permission === 'denied' && t('Blocked — allow notifications for this site in your browser settings')}
              {permission === 'default' && t('Get notified even when this tab isn’t in front')}
              {permission === 'unsupported' && t('Not supported by this browser')}
            </span>
          </span>
          {permission === 'default' && <Button size="sm" variant="soft" onClick={enableBrowser}>{t('Enable')}</Button>}
          {permission === 'granted' && <span className="badge success"><Check size={11} />{' '}{t('On')}</span>}
        </div>
      </div>

      {message && <div className="card tinted small">{message}</div>}

      <div className="card stack" style={{ borderColor: 'rgba(168,30,60,0.18)' }}>
        <div className="row">
          <span className="icon-badge" style={{ background: 'var(--g-primary)', color: '#fff', width: 46, height: 46 }}><Trash2 size={20} /></span>
          <div>
            <div className="h2">{t('Erase my account')}</div>
            <div className="small accent" style={{ fontWeight: 700 }}>{t('Completed within 72 hours. Irreversible.')}</div>
          </div>
        </div>
        <p className="small muted">{t('Under the DPDP Act you can withdraw consent entirely. Here’s exactly what happens:')}</p>
        <div className="stack" style={{ '--gap': '10px' }}>
          {ERASURE_STEPS.map((s, i) => (
            <div key={s} className="row small" style={{ alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{String(i + 1).padStart(2, '0')}</span>
              <span>{t(s)}</span>
            </div>
          ))}
        </div>
        <Button variant={scheduled ? 'soft' : 'dark'} icon={scheduled ? Check : undefined} loading={busy === 'erase'} disabled={busy === 'erase'} onClick={erasure}>
          {scheduled
            ? t('Erasure scheduled for {when} · Cancel', { when: formatDateTime(scheduled, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })
            : t('Request erasure')}
        </Button>
      </div>

      <Button variant="secondary" icon={LogOut} onClick={() => window.confirm(t('Sign out of 3Knot on this device?')) && logout()}>
        {t('Sign out')}
      </Button>
    </div>
  );
}
