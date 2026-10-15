import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Hourglass, Quote, Plus, Link2, RotateCw, Trash2, Eye, Users, ChevronDown, ChevronUp, X, HelpCircle, ThumbsUp } from 'lucide-react';
import { FAMILY_RELATIONS, FAMILY_STATUS_LABEL } from '@shared/constants';
import { useStore } from '../../store';
import { Avatar, Badge, Button, Empty, Toggle, cx } from '../../components/ui';

const STATUS = {
  approved: { tone: 'success', icon: Check },
  unsure: { tone: 'gold', icon: HelpCircle },
  concern_raised: { tone: 'warning', icon: AlertTriangle },
  awaiting: { tone: 'neutral', icon: Hourglass },
};

function MembersPanel() {
  const { familyLinks, addFamilyMember, resendFamilyInvite, removeFamilyMember, setFamilyManage } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Mother');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const run = async (key, fn, success) => {
    setBusy(key);
    setError(null);
    setMessage(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) setError(res.error);
    else if (success) setMessage(success);
    return res;
  };

  const add = async (e) => {
    e.preventDefault();
    const res = await run('add', () => addFamilyMember({ name: name.trim(), relation, phone }), `Invite sent to ${name.trim()} by SMS`);
    if (res.ok) {
      setAdding(false);
      setName('');
      setPhone('');
    }
  };

  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link.portalUrl);
      setMessage(`${link.name}’s private link copied`);
    } catch {
      setMessage(link.portalUrl);
    }
  };

  return (
    <div className="card flush">
      <div style={{ padding: '18px 18px 8px' }}>
        <div className="h3">Family members</div>
        <div className="small muted">They only see what you forward. No search, no chat, no browsing.</div>
      </div>
      {familyLinks.map((link) => (
        <div key={link.id}>
          <div className="divider" style={{ margin: '0 16px' }} />
          <div className="setting-row">
            <span className="avatar" style={{ width: 42, height: 42, background: 'var(--g-primary)', color: '#fff' }}>{link.avatarChar}</span>
            <div className="grow">
              <div className="h3">{link.name}{link.relation && <span className="muted" style={{ fontWeight: 500 }}> · {link.relation}</span>}</div>
              <div className="tiny muted">
                {`${FAMILY_STATUS_LABEL[link.status] || link.status} · ${link.sharedProfilesCount} profile${link.sharedProfilesCount === 1 ? '' : 's'} shared · ${link.phoneMasked}`}
              </div>
            </div>
            <Badge tone={link.status === 'linked' ? 'success' : 'gold'}>{link.status === 'linked' ? 'Active' : 'Pending'}</Badge>
          </div>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <span className="grow small"><b>Can edit my personal details</b><span className="tiny muted" style={{ display: 'block' }}>From their link — never your name, photos or chats</span></span>
            <Toggle label={`${link.name} can edit my personal details`} value={Boolean(link.canManage)} onChange={(v) => setFamilyManage(link.id, v)} />
          </div>
          <div className="member-actions">
            <button className="pill-btn" onClick={() => copy(link)}><Link2 size={13} /> Copy link</button>
            <a className="pill-btn" href={`/portal/${link.portalToken}`} target="_blank" rel="noreferrer"><Eye size={13} /> Preview their view</a>
            <button className="pill-btn" disabled={busy === `resend-${link.id}`} onClick={() => run(`resend-${link.id}`, () => resendFamilyInvite(link.id), `Invite re-sent to ${link.name}`)}>
              <RotateCw size={13} /> Resend SMS
            </button>
            <button
              className="pill-btn muted"
              onClick={() => window.confirm(`Remove ${link.name}? Their link stops working and shared cards disappear from their view.`)
                && run(link.id, () => removeFamilyMember(link.id), `${link.name} removed`)}
            >
              <Trash2 size={13} /> Remove
            </button>
          </div>
        </div>
      ))}
      <div className="divider" style={{ margin: '0 16px' }} />
      {adding ? (
        <form className="stack" style={{ padding: 16, '--gap': '10px' }} onSubmit={add}>
          <input className="input" placeholder="Their name (e.g. Amma)" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus />
          <div className="row wrap" style={{ '--gap': '6px' }}>
            {FAMILY_RELATIONS.map((r) => (
              <button key={r} type="button" className={cx('chip', relation === r && 'active')} onClick={() => setRelation(r)}>{r}</button>
            ))}
          </div>
          <input className="input" type="tel" placeholder="Their mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="row">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="grow" loading={busy === 'add'} disabled={!name.trim() || phone.replace(/\D/g, '').length < 10 || busy === 'add'}>
              Send invite
            </Button>
          </div>
        </form>
      ) : (
        <button className="setting-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setAdding(true)}>
          <span className="icon-badge" style={{ width: 42, height: 42, borderRadius: '50%', border: '1.5px dashed rgba(168,30,60,0.4)' }}><Plus size={18} /></span>
          <span className="grow">
            <span className="h3" style={{ display: 'block' }}>Add a family member</span>
            <span className="tiny muted">They get a private link by SMS — no app or account needed</span>
          </span>
        </button>
      )}
      {(message || error) && (
        <div className={cx('center', error ? 'error-text' : 'success-text')} style={{ padding: '0 16px 16px' }}>{error || message}</div>
      )}
    </div>
  );
}

function VotesPanel() {
  const { familyVotes, loadFamilyVotes, sentRecords } = useStore();
  useEffect(() => {
    loadFamilyVotes();
  }, [loadFamilyVotes, sentRecords]);
  const multi = familyVotes.filter((v) => v.votes.length > 0);
  if (!multi.length) return null;
  return (
    <div className="card stack">
      <span className="label">Family votes</span>
      {multi.map((v) => (
        <div key={v.candidateId} className="stack" style={{ '--gap': '6px' }}>
          <div className="row">
            <Avatar src={v.candidatePhoto} name={v.candidateName} size={36} />
            <span className="h3 grow">{v.candidateName}, {v.candidateAge}</span>
            <span className="row small" style={{ '--gap': '10px' }}>
              <span className="row" style={{ '--gap': '3px' }} title="Approved"><ThumbsUp size={14} color="var(--success)" />{v.tally.approved}</span>
              <span className="row" style={{ '--gap': '3px' }} title="Unsure"><HelpCircle size={14} color="var(--gold)" />{v.tally.unsure}</span>
              <span className="row" style={{ '--gap': '3px' }} title="Concerns"><AlertTriangle size={14} color="var(--warning)" />{v.tally.concern_raised}</span>
              {v.tally.awaiting > 0 && <span className="row muted" style={{ '--gap': '3px' }} title="Waiting"><Hourglass size={14} />{v.tally.awaiting}</span>}
            </span>
          </div>
          <span className="tiny muted">{v.votes.map((x) => `${x.name}: ${{ approved: 'yes', unsure: 'unsure', concern_raised: 'concern', awaiting: 'waiting' }[x.status]}`).join(' · ')}</span>
        </div>
      ))}
    </div>
  );
}

export function FamilyPage() {
  const { sentRecords } = useStore();
  const [showExpired, setShowExpired] = useState(false);
  const active = sentRecords.filter((r) => !r.expired);
  const expired = sentRecords.filter((r) => r.expired);
  const counts = {
    shared: sentRecords.length,
    awaiting: active.filter((r) => r.status === 'awaiting').length,
    approved: sentRecords.filter((r) => r.status === 'approved').length,
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">Family co-pilot</span>
          <h1 className="h1">Sent to family</h1>
        </div>
        <Link to="/matches" className="btn btn-soft sm"><Users size={15} /> Share a match</Link>
      </div>

      <div className="family-layout">
        <div className="stack">
          <div className="card dark stats">
            {[['Shared', counts.shared], ['Awaiting', counts.awaiting], ['Approved', counts.approved]].map(([label, n]) => (
              <div key={label} className="stat">
                <span className="stat-num">{n}</span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </div>

          <VotesPanel />

          {sentRecords.length === 0 && (
            <Empty icon={Users} title="Nothing shared yet">
              <span className="small">Use “Share with family” on any match.</span>
            </Empty>
          )}

          {[...active, ...(showExpired ? expired : [])].map((r) => {
            const st = STATUS[r.status] || STATUS.awaiting;
            return (
              <div key={r.id} className={cx('card record fade-in')} style={r.expired ? { opacity: 0.6 } : undefined}>
                <div className="row">
                  <Avatar src={r.candidatePhoto} name={r.candidateName} size={50} />
                  <div className="grow">
                    <div className="h3">{r.candidateName}, {r.candidateAge}</div>
                    <div className="tiny muted">Sent to {r.recipientParentName} · {r.sentAt}{r.expired ? ' · access expired' : ''}</div>
                  </div>
                  {r.overlapScore != null && <span className="h2 accent">{r.overlapScore}%</span>}
                </div>
                <div><Badge tone={st.tone} icon={st.icon}>{r.statusBadge}</Badge></div>
                {r.status === 'awaiting' ? (
                  <span className="small muted">{r.feedbackNote}</span>
                ) : (
                  <div className="quote" style={{ fontSize: 15 }}><Quote size={15} color="var(--text-light)" style={{ flexShrink: 0 }} />{r.feedbackNote}</div>
                )}
              </div>
            );
          })}

          {expired.length > 0 && (
            <button className="btn btn-secondary sm" style={{ borderStyle: 'dashed' }} onClick={() => setShowExpired((v) => !v)}>
              {showExpired ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {showExpired ? 'Hide' : 'Show'} {expired.length} expired share{expired.length === 1 ? '' : 's'}
            </button>
          )}
          <div className="card gold center" style={{ fontWeight: 650 }}>A family member’s note is advice, not a veto. The decision stays yours.</div>
        </div>

        <div className="stack">
          <MembersPanel />
          <div className="card stack" style={{ '--gap': '10px' }}>
            {[
              [true, 'See profiles you forward, with scores'],
              [true, 'Say yes, “not sure yet”, or raise a concern'],
              [true, 'Help fill in your personal details — only if you allow it'],
              [false, 'Browse, search or message anyone'],
              [false, 'See your chats or contact details'],
            ].map(([can, t]) => (
              <div key={t} className="row small">
                {can ? <Check size={15} color="var(--success)" strokeWidth={3} /> : <X size={15} color="var(--accent)" strokeWidth={3} />}
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
