// Public parent portal: opened from the private SMS link. No account — the token is the credential.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Lock, ShieldCheck, Check, AlertTriangle, Quote, HelpCircle, ClipboardList } from 'lucide-react';
import { PILLARS, pillarVerdict } from '@shared/constants';
import { api } from '../store';
import { Badge, Brand, Button, ScoreRing } from '../components/ui';
import { DetailsSections, SectionEditModal } from '../components/details';

export function PortalPage() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [editing, setEditing] = useState(null);
  const saveDetails = async (changes) => {
    try {
      const res = await api.updatePortalDetails(token, changes);
      setPortal((p) => ({ ...p, profileDetails: res.profileDetails }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      setPortal(await api.getParentPortal(token));
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (shareId, decision) => {
    setPending(shareId);
    try {
      await api.submitParentFeedback(token, shareId, decision);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  };

  const child = portal?.childName || 'your child';
  const records = portal?.records || [];
  const awaiting = records.filter((r) => r.status === 'awaiting').length;

  return (
    <div style={{ background: 'var(--bg-deep)', minHeight: '100vh' }}>
      <div className="portal">
        <header className="portal-hero">
          <div className="row between">
            <Brand dark tagline={false} size={30} />
            <span className="badge glass"><Eye size={11} /> Read only</span>
          </div>
          {portal && <span className="small" style={{ color: 'rgba(255,246,238,0.75)', fontWeight: 600, marginTop: 10 }}>{portal.parentName} · shared by {child}</span>}
          <h1 className="h-display" style={{ fontSize: 36 }}>
            {!portal ? 'Your private view' : awaiting === 0 ? 'Nothing awaiting your view' : `${awaiting} profile${awaiting === 1 ? '' : 's'} await${awaiting === 1 ? 's' : ''} your view`}
          </h1>
          <p style={{ color: 'rgba(255,246,238,0.78)', lineHeight: 1.6 }}>
            {child} chose to show you these. You can note approval or raise a concern — {child} decides what happens next.
          </p>
        </header>

        <main className="stack" style={{ padding: 20 }}>
          {error && <div className="card tinted error-text">{error}</div>}
          {portal && records.length === 0 && (
            <div className="card tinted empty">
              <Eye size={28} color="var(--gold)" />
              <div className="h3">No profiles shared right now</div>
              <span className="small">When {child} forwards a profile, it will appear here for you to review.</span>
            </div>
          )}

          {records.map((r) => (
            <article key={r.id} className="card stack fade-in">
              <div className="row">
                <span className="queue-thumb" style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.photo ? <img src={r.photo} alt="" style={r.photoBlurred ? undefined : { filter: 'none', transform: 'none' }} /> : <Lock size={18} color="var(--text-light)" />}
                </span>
                <div className="grow">
                  <div className="h2">{r.candidateName}, {r.candidateAge}</div>
                  <div className="row small muted" style={{ '--gap': '5px' }}>
                    <ShieldCheck size={14} color="var(--success)" />
                    {r.candidateCity ? `${r.candidateCity} · ` : ''}{r.idVerified ? 'ID verified' : 'Phone verified'}
                  </div>
                </div>
                {r.overlapScore != null && <ScoreRing score={r.overlapScore} size={68} />}
              </div>

              {r.pillarScores && (
                <div className="verdicts">
                  {PILLARS.map((p) => {
                    const v = pillarVerdict(r.pillarScores[p.key]);
                    return (
                      <div key={p.key} className="row between">
                        <span style={{ fontWeight: 600 }}>{p.title}</span>
                        <Badge tone={v.tone}>{v.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {r.childNote && <div className="quote"><Quote size={15} color="var(--gold)" style={{ flexShrink: 0 }} />{r.childNote}</div>}
              <div className="row tiny muted" style={{ '--gap': '6px' }}><Lock size={12} /> Phone, email and chats are hidden from this view.</div>

              {r.status !== 'awaiting' ? (
                <div className="row card" style={{ boxShadow: 'none', background: r.status === 'approved' ? 'var(--success-soft)' : r.status === 'unsure' ? 'var(--gold-soft)' : 'var(--warning-soft)', border: 0 }}>
                  {r.status === 'approved' ? <Check size={18} color="var(--success)" strokeWidth={3} /> : r.status === 'unsure' ? <HelpCircle size={18} color="var(--gold)" /> : <AlertTriangle size={18} color="var(--warning)" />}
                  <div>
                    <div className="h3">{{ approved: 'You approved', unsure: 'You’re not sure yet', concern_raised: 'You raised a concern' }[r.status]}</div>
                    <div className="small muted">{r.feedbackNote} · awaiting {child}</div>
                  </div>
                </div>
              ) : (
                <div className="row wrap">
                  <Button variant="warning" icon={AlertTriangle} className="grow" disabled={pending === r.id} onClick={() => respond(r.id, 'concern_raised')}>
                    Raise a concern
                  </Button>
                  <Button variant="secondary" icon={HelpCircle} className="grow" disabled={pending === r.id} onClick={() => respond(r.id, 'unsure')}>
                    Not sure yet
                  </Button>
                  <Button variant="success" icon={Check} className="grow" loading={pending === r.id} disabled={pending === r.id} onClick={() => respond(r.id, 'approved')}>
                    I approve
                  </Button>
                </div>
              )}
            </article>
          ))}

          {portal?.canManage && portal.profileDetails && (
            <section className="card stack">
              <span className="row h2" style={{ '--gap': '8px' }}><ClipboardList size={20} color="var(--accent)" /> {child}’s personal details</span>
              <span className="small muted">{child} asked you to help complete these. They’re notified of every change.</span>
              <DetailsSections person={{ details: portal.profileDetails, firstName: portal.profileDetails.firstName }} own onEdit={setEditing} />
            </section>
          )}
          {editing && (
            <SectionEditModal sectionKey={editing} values={portal.profileDetails} save={saveDetails} exclude={['firstName']} onClose={() => setEditing(null)} />
          )}

          <p className="row small muted" style={{ alignItems: 'flex-start', '--gap': '8px' }}>
            <ShieldCheck size={15} style={{ flexShrink: 0 }} />
            You cannot search, message, or browse other profiles. Access ends when {child} removes it or the share expires.
          </p>
        </main>
      </div>
    </div>
  );
}
