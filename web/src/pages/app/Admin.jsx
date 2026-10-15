import React, { useCallback, useEffect, useState } from 'react';
import { Users, Flag, BadgeCheck, Heart, Crown, Activity, EyeOff, Eye, Search } from 'lucide-react';
import { api } from '../../store';
import { Button, Badge, Empty, cx } from '../../components/ui';

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
  if (!s) return <span className="small muted">Loading…</span>;
  const max = Math.max(1, ...s.signups.map((d) => d.count));
  const tiles = [
    [Users, 'Members', s.members], [Activity, 'Active this week', s.active7d], [Heart, 'Accepted interests', s.accepted],
    [Crown, 'Premium', s.premium], [Flag, 'Open reports', s.openReports], [BadgeCheck, 'Pending verifications', s.pendingVerifications],
  ];
  return (
    <div className="stack">
      <div className="stat-grid">
        {tiles.map(([Icon, label, n]) => (
          <div key={label} className="card stack" style={{ '--gap': '6px' }}>
            <Icon size={18} color="var(--accent)" />
            <span className="h1" style={{ fontSize: 30 }}>{n}</span>
            <span className="small muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="card stack">
        <span className="label">Sign-ups, last 14 days</span>
        <div className="spark">
          {s.signups.map((d) => <span key={d.day} title={`${d.day}: ${d.count}`} style={{ height: `${(d.count / max) * 100}%` }} />)}
        </div>
        <span className="tiny muted">{s.onboarded} of {s.members} members finished onboarding · {s.hidden} hidden by moderation · {s.pendingStories} stories awaiting review</span>
      </div>
    </div>
  );
}

function Reports() {
  const [list, reload, error] = useLoad(api.admin.reports);
  const act = async (id, action) => { await api.admin.resolveReport(id, action); reload(); };
  if (error) return <span className="error-text">{error}</span>;
  if (!list) return <span className="small muted">Loading…</span>;
  if (!list.length) return <Empty icon={Flag} title="No open reports" />;
  return (
    <div className="stack">
      {list.map((r) => (
        <div key={r.id} className="card stack" style={{ '--gap': '8px' }}>
          <div className="row between">
            <span className="h3">{r.reported?.firstName}, {r.reported?.age} · {r.reported?.city}</span>
            <Badge tone="accent">{r.reasonLabel}</Badge>
          </div>
          {r.details && <span className="small">“{r.details}”</span>}
          <span className="tiny muted">
            Reported by {r.reporter?.firstName || 'a former member'} · {new Date(r.createdAt).toLocaleString('en-IN')} · {r.openReportsAgainst} open report{r.openReportsAgainst === 1 ? '' : 's'} against them
            {r.reported?.hidden ? ' · currently hidden' : ''}
          </span>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => act(r.id, 'dismiss')}>Dismiss</Button>
            <Button size="sm" icon={EyeOff} onClick={() => act(r.id, 'hide')}>Hide member</Button>
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
  return url ? <img src={url} alt="Selfie" className="verify-img" /> : <div className="verify-img" />;
}

function Verifications() {
  const [list, reload] = useLoad(api.admin.verifications);
  const decide = async (id, decision) => {
    const note = decision === 'rejected' ? window.prompt('Reason shown to the member (optional)') || undefined : undefined;
    await api.admin.reviewVerification(id, decision, note);
    reload();
  };
  if (!list) return <span className="small muted">Loading…</span>;
  if (!list.length) return <Empty icon={BadgeCheck} title="No selfies waiting" />;
  return (
    <div className="stack">
      {list.map((v) => (
        <div key={v.id} className="card stack">
          <span className="h3">{v.member.firstName}, {v.member.age} · {v.member.city}</span>
          <div className="row" style={{ '--gap': '12px' }}>
            <figure className="stack" style={{ margin: 0, '--gap': '4px' }}><Selfie path={v.selfieUrl} /><figcaption className="tiny muted">Selfie</figcaption></figure>
            <figure className="stack" style={{ margin: 0, '--gap': '4px' }}>{v.profilePhoto ? <img src={v.profilePhoto} alt="Profile" className="verify-img" /> : <div className="verify-img" />}<figcaption className="tiny muted">Profile photo</figcaption></figure>
          </div>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => decide(v.id, 'rejected')}>Reject</Button>
            <Button size="sm" icon={BadgeCheck} onClick={() => decide(v.id, 'approved')}>Approve</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stories() {
  const [list, reload] = useLoad(api.admin.stories);
  const decide = async (id, decision) => { await api.admin.reviewStory(id, decision); reload(); };
  if (!list) return <span className="small muted">Loading…</span>;
  if (!list.length) return <Empty icon={Heart} title="No stories waiting" />;
  return (
    <div className="stack">
      {list.map((s) => (
        <div key={s.id} className="card stack" style={{ '--gap': '8px' }}>
          <span className="h3">{s.title}</span>
          <span className="small muted">{s.names}</span>
          <p className="details-text">{s.story}</p>
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => decide(s.id, 'rejected')}>Reject</Button>
            <Button size="sm" icon={Heart} onClick={() => decide(s.id, 'published')}>Publish</Button>
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
        <input placeholder="Name, city or phone digits" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
      </form>
      <div className="card flush">
        {(list || []).map((m, i) => (
          <React.Fragment key={m.id}>
            {i > 0 && <div className="divider" />}
            <div className="setting-row">
              <span className="grow">
                <span className="h3" style={{ display: 'block' }}>{m.firstName || 'No name yet'}{m.age ? `, ${m.age}` : ''} {m.verified && <BadgeCheck size={13} color="var(--gold)" />}</span>
                <span className="tiny muted">{m.city || '—'} · {m.phone} · joined {new Date(m.joinedAt).toLocaleDateString('en-IN')}{m.paused ? ' · paused' : ''}</span>
              </span>
              {m.hidden && <Badge tone="accent">Hidden</Badge>}
              <Button size="sm" variant="secondary" icon={m.hidden ? Eye : EyeOff} onClick={() => toggle(m)}>{m.hidden ? 'Unhide' : 'Hide'}</Button>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const TABS = [['stats', 'Overview', Stats], ['reports', 'Reports', Reports], ['verify', 'Verifications', Verifications], ['stories', 'Stories', Stories], ['members', 'Members', Members]];

export function AdminPage() {
  const [tab, setTab] = useState('stats');
  const Active = TABS.find(([k]) => k === tab)[2];
  return (
    <div className="page">
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">Admin</span>
        <h1 className="h1">Sangam console</h1>
      </div>
      <div className="tabs" role="tablist" style={{ maxWidth: 720 }}>
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={cx('tab', tab === key && 'active')} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      <Active />
    </div>
  );
}
