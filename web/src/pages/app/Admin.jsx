import React, { useCallback, useEffect, useState } from 'react';
import { Users, Flag, BadgeCheck, Heart, Crown, Activity, EyeOff, Eye, Search } from 'lucide-react';
import { api } from '../../store';
import { Button, Badge, Empty, cx } from '../../components/ui';
import { Select } from '../../components/Select';
import { t, formatDate, formatDateTime } from '@shared/i18n';

// Admin console (web only): stats, reports, ID verifications, success stories, members
function useLoad(fn) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const reload = useCallback(async () => {
    try {
      setData(await fn());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [fn]);
  useEffect(() => { reload(); }, [reload]);
  return [data, reload, error];
}

function Stats() {
  const [s] = useLoad(api.admin.stats);
  if (!s) return <span className="small muted">{t('Loading…')}</span>;
  const max = Math.max(1, ...s.signups.map((d) => d.count));
  const tiles = [
    [Users, t('Members'), s.members], [Activity, t('Active this week'), s.active7d], [Heart, t('Accepted interests'), s.accepted],
    [Crown, t('Premium'), s.premium], [Flag, t('Open reports'), s.openReports], [BadgeCheck, t('Pending verifications'), s.pendingVerifications],
  ];
  return (
    <div className="stack">
      <div className="stat-grid">
        {tiles.map(([Icon, label, n]) => (
          <div key={label} className="card stack" style={{ '--gap': '6px' }}>
            <Icon size={18} color="var(--accent)" />
            <span className="h1" style={{ fontSize: 30 }}>{n}</span>
            <span className="small muted">{t(label)}</span>
          </div>
        ))}
      </div>
      <div className="card stack">
        <span className="label">{t('Sign-ups, last 14 days')}</span>
        <div className="spark">
          {s.signups.map((d) => <span key={d.day} title={`${d.day}: ${d.count}`} style={{ height: `${(d.count / max) * 100}%` }} />)}
        </div>
        <span className="tiny muted">{t('{onboarded} of {members} members finished onboarding · {hidden} hidden by moderation · {pendingStories} stories awaiting review', { onboarded: s.onboarded, members: s.members, hidden: s.hidden, pendingStories: s.pendingStories })}</span>
      </div>
    </div>
  );
}

function Reports() {
  const [list, reload, error] = useLoad(api.admin.reports);
  const act = async (id, action) => { await api.admin.resolveReport(id, action); reload(); };
  if (error) return <span className="error-text">{error}</span>;
  if (!list) return <span className="small muted">{t('Loading…')}</span>;
  if (!list.length) return <Empty icon={Flag} title={t('No open reports')} />;
  return (
    <div className="stack">
      {list.map((r) => (
        <div key={r.id} className="card stack" style={{ '--gap': '8px' }}>
          <div className="row between">
            <span className="h3">{r.reported?.firstName}, {r.reported?.age} · {r.reported?.city}</span>
            <Badge tone="accent">{t(r.reasonLabel)}</Badge>
          </div>
          {r.details && <span className="small">“{r.details}”</span>}
          <span className="tiny muted">
            {t('Reported by {name} · {when}', { name: r.reporter?.firstName || t('a former member'), when: formatDateTime(r.createdAt) })}
            {' · '}{t(r.openReportsAgainst === 1 ? '1 open report against them' : '{n} open reports against them', { n: r.openReportsAgainst })}
            {r.reported?.hidden ? t(' · currently hidden') : ''}
          </span>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => act(r.id, 'dismiss')}>{t('Dismiss')}</Button>
            <Button size="sm" icon={EyeOff} onClick={() => act(r.id, 'hide')}>{t('Hide member')}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Selfie({ path }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let objectUrl;
    api.admin.selfieBlob(path).then((b) => { objectUrl = URL.createObjectURL(b); setUrl(objectUrl); }).catch(() => {});
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [path]);
  return url ? <img src={url} alt={t('Selfie')} className="verify-img" /> : <div className="verify-img" />;
}

function Verifications() {
  const [list, reload] = useLoad(api.admin.verifications);
  const decide = async (id, decision) => {
    const note = decision === 'rejected' ? window.prompt(t('Reason shown to the member (optional)')) || undefined : undefined;
    await api.admin.reviewVerification(id, decision, note);
    reload();
  };
  if (!list) return <span className="small muted">{t('Loading…')}</span>;
  if (!list.length) return <Empty icon={BadgeCheck} title={t('No selfies waiting')} />;
  return (
    <div className="stack">
      {list.map((v) => (
        <div key={v.id} className="card stack">
          <span className="h3">{v.member.firstName}, {v.member.age} · {v.member.city}</span>
          <div className="row" style={{ '--gap': '12px' }}>
            <figure className="stack" style={{ margin: 0, '--gap': '4px' }}><Selfie path={v.selfieUrl} /><figcaption className="tiny muted">{t('Selfie')}</figcaption></figure>
            <figure className="stack" style={{ margin: 0, '--gap': '4px' }}>{v.profilePhoto ? <img src={v.profilePhoto} alt={t('Profile')} className="verify-img" /> : <div className="verify-img" />}<figcaption className="tiny muted">{t('Profile photo')}</figcaption></figure>
          </div>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => decide(v.id, 'rejected')}>{t('Reject')}</Button>
            <Button size="sm" icon={BadgeCheck} onClick={() => decide(v.id, 'approved')}>{t('Approve')}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stories() {
  const [list, reload] = useLoad(api.admin.stories);
  const decide = async (id, decision) => { await api.admin.reviewStory(id, decision); reload(); };
  if (!list) return <span className="small muted">{t('Loading…')}</span>;
  if (!list.length) return <Empty icon={Heart} title={t('No stories waiting')} />;
  return (
    <div className="stack">
      {list.map((s) => (
        <div key={s.id} className="card stack" style={{ '--gap': '8px' }}>
          <span className="h3">{s.title}</span>
          <span className="small muted">{s.names}</span>
          <p className="details-text">{s.story}</p>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => decide(s.id, 'rejected')}>{t('Reject')}</Button>
            <Button size="sm" icon={Heart} onClick={() => decide(s.id, 'published')}>{t('Publish')}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Members() {
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const load = useCallback(async (term) => setList(await api.admin.members(term)), []);
  useEffect(() => { load(''); }, [load]);
  const toggle = async (m) => {
    await (m.hidden ? api.admin.unhideMember(m.id) : api.admin.hideMember(m.id));
    load(q);
  };
  return (
    <div className="stack">
      <form className="search-input" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <Search size={18} />
        <input placeholder={t('Name, city or phone digits')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search members')} />
      </form>
      <div className="card flush">
        {(list || []).map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <div className="divider" />}
            <div className="setting-row">
              <span className="grow">
                <span className="h3" style={{ display: 'block' }}>{m.firstName || t('No name yet')}{m.age ? `, ${m.age}` : ''} {m.verified && <BadgeCheck size={13} color="var(--gold)" />}</span>
                <span className="tiny muted">{t('{city} · {phone} · joined {date}', { city: m.city || '—', phone: m.phone, date: formatDate(m.joinedAt) })}{m.paused ? t(' · paused') : ''}</span>
              </span>
              {m.hidden && <Badge tone="accent">{t('Hidden')}</Badge>}
              <Button size="sm" variant="secondary" icon={m.hidden ? Eye : EyeOff} onClick={() => toggle(m)}>{m.hidden ? t('Unhide') : t('Hide')}</Button>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function AssistedMember({ entry, onChange }) {
  const [options, setOptions] = useState(null);
  const [pick, setPick] = useState('');
  const [note, setNote] = useState('');
  const [managerNote, setManagerNote] = useState(entry.request?.managerNote || '');
  const [msg, setMsg] = useState(null);
  const loadOptions = async () => setOptions(await api.admin.assistedCandidates(entry.member.id));
  const recommend = async () => {
    try {
      await api.admin.recommend(entry.member.id, pick, note.trim() || undefined);
      setMsg(t('Recommendation sent'));
      setPick('');
      setNote('');
      onChange();
    } catch (err) {
      setMsg(err.message);
    }
  };
  const setStatus = async (status) => {
    await api.admin.updateAssistedRequest(entry.request.id, { status, managerNote });
    onChange();
  };
  return (
    <div className="card stack" style={{ '--gap': '10px' }}>
      <div className="row between">
        <span className="h3">{entry.member.firstName}, {entry.member.age} · {entry.member.city}</span>
        {entry.request && <Badge tone={entry.request.status === 'new' ? 'gold' : entry.request.status === 'active' ? 'success' : 'neutral'}>{t(REQUEST_STATUS[entry.request.status] || entry.request.status)}</Badge>}
      </div>
      <span className="tiny muted">{t('{phone} · service until {date} · {n} recommended', { phone: entry.member.phone, date: entry.assistedUntil ? formatDate(entry.assistedUntil) : '—', n: entry.recommended })}</span>
      {entry.request?.notes && <span className="small">“{entry.request.notes}”</span>}
      {entry.request?.callTime && <span className="small muted">{t('Call: {callTime}', { callTime: entry.request.callTime })}</span>}
      {entry.request && (
        <div className="row wrap" style={{ '--gap': '8px' }}>
          <input className="input grow" placeholder={t('Note for the member')} value={managerNote} onChange={(e) => setManagerNote(e.target.value)} aria-label={t('Manager note')} />
          <Button size="sm" variant="secondary" onClick={() => setStatus('active')}>{t('Mark in progress')}</Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus('closed')}>{t('Close')}</Button>
        </div>
      )}
      {!options ? (
        <Button size="sm" variant="soft" onClick={loadOptions}>{t('Recommend a profile…')}</Button>
      ) : (
        <div className="row wrap" style={{ '--gap': '8px' }}>
          <Select className="grow" value={pick} onChange={setPick} aria-label={t('Profile to recommend')} placeholder={t('Choose a profile (best fit first)')}
            options={options.map((o) => [o.id, `${o.firstName}, ${o.age} · ${o.city} · ${o.score}%`])} />
          <input className="input grow" placeholder={t('Why this person (shown to the member)')} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t('Recommendation note')} />
          <Button size="sm" disabled={!pick} onClick={recommend}>{t('Recommend')}</Button>
        </div>
      )}
      {msg && <span className="small" style={{ fontWeight: 700 }}>{msg}</span>}
    </div>
  );
}

function Assisted() {
  const [list, reload] = useLoad(api.admin.assisted);
  if (!list) return <span className="small muted">{t('Loading…')}</span>;
  if (!list.length) return <Empty icon={Users} title={t('No assisted-service members yet')} />;
  return <div className="stack">{list.map((e) => <AssistedMember key={e.member.id} entry={e} onChange={reload} />)}</div>;
}

const TABS = [['stats', 'Overview', Stats], ['reports', 'Reports', Reports], ['verify', 'Verifications', Verifications], ['assisted', 'Assisted', Assisted], ['stories', 'Stories', Stories], ['members', 'Members', Members]];
const REQUEST_STATUS = { new: 'New', active: 'In progress', closed: 'Closed' };

export function AdminPage() {
  const [tab, setTab] = useState('stats');
  const Active = TABS.find(([k]) => k === tab)[2];
  return (
    <div className="page">
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('Admin')}</span>
        <h1 className="h1">{t('3Knot console')}</h1>
      </div>
      <div className="tabs" role="tablist" style={{ maxWidth: 720 }}>
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{t(label)}</button>
        ))}
      </div>
      <Active />
    </div>
  );
}
