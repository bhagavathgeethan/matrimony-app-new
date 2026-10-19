import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Hourglass, Quote, Plus, Link2, RotateCw, Trash2, Eye, Users, ChevronDown, ChevronUp, X, HelpCircle, ThumbsUp } from 'lucide-react';
import { FAMILY_RELATIONS, FAMILY_STATUS_LABEL } from '@shared/constants';
import { useStore } from '../../store';
import { Avatar, Badge, Button, Empty, Toggle, cx } from '../../components/ui';
import { t } from '@shared/i18n';

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
      setMessage(t('{name}’s private link copied', { name: link.name }));
    } catch {
      setMessage(link.portalUrl);
    }
  };

  return (
    <div className="card flush">
      <div style={{ padding: '18px 18px 8px' }}>
        <div className="h3">{t('Family members')}</div>
        <div className="small muted">{t('They only see what you forward. No search, no chat, no browsing.')}</div>
      </div>
      {familyLinks.map((link) => (
        <div key={link.id}>
          <div className="divider" style={{ margin: '0 16px' }} />
          <div className="setting-row">
            <span className="avatar" style={{ width: 42, height: 42, background: 'var(--g-primary)', color: '#fff' }}>{link.avatarChar}</span>
            <div className="grow">
              <div className="h3">{link.name}{link.relation && <span className="muted" style={{ fontWeight: 500 }}> · {t(link.relation)}</span>}</div>
              <div className="tiny muted">
                {`${t(FAMILY_STATUS_LABEL[link.status] || link.status)} · ${t(link.sharedProfilesCount === 1 ? '1 profile shared' : '{n} profiles shared', { n: link.sharedProfilesCount })} · ${link.phoneMasked}`}
              </div>
            </div>
            <Badge tone={link.status === 'linked' ? 'success' : 'gold'}>{link.status === 'linked' ? t('Active') : t('Pending')}</Badge>
          </div>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <span className="grow small"><b>{t('Can edit my personal details')}</b><span className="tiny muted" style={{ display: 'block' }}>{t('From their link — never your name, photos or chats')}</span></span>
            <Toggle label={t('{name} can edit my personal details', { name: link.name })} value={Boolean(link.canManage)} onChange={(v) => setFamilyManage(link.id, v)} />
          </div>
          <div className="member-actions">
            <button className="pill-btn" onClick={() => copy(link)}><Link2 size={13} />{' '}{t('Copy link')}</button>
            <a className="pill-btn" href={`/portal/${link.portalToken}`} target="_blank" rel="noreferrer"><Eye size={13} />{' '}{t('Preview their view')}</a>
            <button className="pill-btn" disabled={busy === `resend-${link.id}`} onClick={() => run(`resend-${link.id}`, () => resendFamilyInvite(link.id), t('Invite re-sent to {name}', { name: link.name }))}>
              <RotateCw size={13} />{' '}{t('Resend SMS')}
            </button>
            <button
              className="pill-btn muted"
              onClick={() => window.confirm(t('Remove {name}? Their link stops working and shared cards disappear from their view.', { name: link.name }))
                && run(link.id, () => removeFamilyMember(link.id), t('{name} removed', { name: link.name }))}
            >
              <Trash2 size={13} />{' '}{t('Remove')}
            </button>
          </div>
        </div>
      ))}
      <div className="divider" style={{ margin: '0 16px' }} />
      {adding ? (
        <form className="stack" style={{ padding: 16, '--gap': '10px' }} onSubmit={add}>
          <input className="input" placeholder={t('Their name (e.g. Amma)')} value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setError(null); }} autoFocus />
          <div className="row wrap" style={{ '--gap': '6px' }}>
            {FAMILY_RELATIONS.map((r) => (
              <button key={r} type="button" className={cx('chip', relation === r && 'active')} onClick={() => setRelation(r)}>{t(r)}</button>
            ))}
          </div>
          <input className="input" type="tel" placeholder={t('Their mobile number')} value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }} />
          <div className="row">
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(false)}>{t('Cancel')}</Button>
            <Button type="submit" size="sm" className="grow" loading={busy === 'add'} disabled={!name.trim() || phone.replace(/\D/g, '').length < 10 || busy === 'add'}>
              {t('Send invite')}
            </Button>
          </div>
        </form>
      ) : (
        <button className="setting-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setAdding(true)}>
          <span className="icon-badge" style={{ width: 42, height: 42, borderRadius: '50%', border: '1.5px dashed rgba(168,30,60,0.4)' }}><Plus size={18} /></span>
          <span className="grow">
            <span className="h3" style={{ display: 'block' }}>{t('Add a family member')}</span>
            <span className="tiny muted">{t('They get a private link by SMS — no app or account needed')}</span>
          </span>
        </button>
      )}
      {(message || error) && (
        <div className={cx('center', error ? 'error-text' : 'success-text')} style={{ padding: '0 16px 16px' }}>{error || message}</div>
      )}
    </div>
  );
}

// Family plan: interests a trusted family member suggested; the member decides
function ProposalsPanel() {
  const { proposals, loadProposals, answerProposal } = useStore();
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);
  const pending = proposals.filter((p) => p.status === 'pending');
  if (!pending.length) return null;
  return (
    <div className="card stack">
      <span className="label">{t('Suggested by family')}</span>
      {pending.map((p) => (
        <div key={p.id} className="stack" style={{ '--gap': '6px' }}>
          <span className="h3">{t('{familyName} suggests {candidateName}, {candidateAge}', { familyName: p.familyName, candidateName: p.candidateName, candidateAge: p.candidateAge })}</span>
          {p.note && <span className="small muted">{t('“{note}” — sent with your interest if you approve', { note: p.note })}</span>}
          <div className="row" style={{ '--gap': '8px' }}>
            <Button size="sm" variant="secondary" onClick={() => answerProposal(p.id, false)}>{t('Decline')}</Button>
            <Button size="sm" onClick={() => answerProposal(p.id, true)}>{t('Send interest')}</Button>
          </div>
        </div>
      ))}
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
      <span className="label">{t('Family votes')}</span>
      {multi.map((v) => (
        <div key={v.candidateId} className="stack" style={{ '--gap': '6px' }}>
          <div className="row">
            <Avatar src={v.candidatePhoto} name={v.candidateName} size={36} />
            <span className="h3 grow">{v.candidateName}, {v.candidateAge}</span>
            <span className="row small" style={{ '--gap': '10px' }}>
              <span className="row" style={{ '--gap': '3px' }} title={t('Approved')}><ThumbsUp size={14} color="var(--success)" />{v.tally.approved}</span>
              <span className="row" style={{ '--gap': '3px' }} title={t('Unsure')}><HelpCircle size={14} color="var(--gold)" />{v.tally.unsure}</span>
              <span className="row" style={{ '--gap': '3px' }} title={t('Concerns')}><AlertTriangle size={14} color="var(--warning)" />{v.tally.concern_raised}</span>
              {v.tally.awaiting > 0 && <span className="row muted" style={{ '--gap': '3px' }} title={t('Waiting')}><Hourglass size={14} />{v.tally.awaiting}</span>}
            </span>
          </div>
          <span className="tiny muted">{v.votes.map((x) => `${x.name}: ${t({ approved: 'yes', unsure: 'unsure', concern_raised: 'concern', awaiting: 'waiting' }[x.status])}`).join(' · ')}</span>
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
          <span className="eyebrow">{t('Family co-pilot')}</span>
          <h1 className="h1">{t('Sent to family')}</h1>
        </div>
        <Link to="/matches" className="btn btn-soft sm"><Users size={15} />{' '}{t('Share a match')}</Link>
      </div>

      <div className="family-layout">
        <div className="stack">
          <div className="card dark stats">
            {[['Shared', counts.shared], ['Awaiting', counts.awaiting], ['Approved', counts.approved]].map(([label, n]) => (
              <div key={label} className="stat">
                <span className="stat-num">{n}</span>
                <span className="stat-label">{t(label)}</span>
              </div>
            ))}
          </div>

          <ProposalsPanel />
          <VotesPanel />

          {sentRecords.length === 0 && (
            <Empty icon={Users} title={t('Nothing shared yet')}>
              <span className="small">{t('Use “Share with family” on any match.')}</span>
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
                    <div className="tiny muted">{t('Sent to {recipientParentName} · {sentAt}', { recipientParentName: r.recipientParentName, sentAt: t(r.sentAt) })}{r.expired ? t(' · access expired') : ''}</div>
                  </div>
                  {r.overlapScore != null && <span className="h2 accent">{r.overlapScore}%</span>}
                </div>
                <div><Badge tone={st.tone} icon={st.icon}>{t(r.statusBadge)}</Badge></div>
                {r.status === 'awaiting' ? (
                  <span className="small muted">{t(r.feedbackNote)}</span>
                ) : (
                  <div className="quote" style={{ fontSize: 15 }}><Quote size={15} color="var(--text-light)" style={{ flexShrink: 0 }} />{r.feedbackNote}</div>
                )}
              </div>
            );
          })}

          {expired.length > 0 && (
            <button className="btn btn-secondary sm" style={{ borderStyle: 'dashed' }} onClick={() => setShowExpired((v) => !v)}>
              {showExpired ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              {t(showExpired ? (expired.length === 1 ? 'Hide 1 expired share' : 'Hide {n} expired shares') : (expired.length === 1 ? 'Show 1 expired share' : 'Show {n} expired shares'), { n: expired.length })}
            </button>
          )}
          <div className="card gold center" style={{ fontWeight: 650 }}>{t('A family member’s note is advice, not a veto. The decision stays yours.')}</div>
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
            ].map(([can, text]) => (
              <div key={text} className="row small">
                {can ? <Check size={15} color="var(--success)" strokeWidth={3} /> : <X size={15} color="var(--accent)" strokeWidth={3} />}
                {t(text)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
