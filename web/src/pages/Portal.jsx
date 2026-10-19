// Public parent portal: opened from the private SMS link. No account — the token is the credential.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Lock, ShieldCheck, Check, AlertTriangle, Quote, HelpCircle, ClipboardList } from 'lucide-react';
import { PILLARS, pillarVerdict } from '@shared/constants';
import { api } from '../store';
import { Badge, Brand, Button, ScoreRing } from '../components/ui';
import { DetailsSections, SectionEditModal } from '../components/details';
import { PLAN_CATALOG, TIER_INFO, priceText } from '@shared/plans';
import { Modal } from '../components/ui';
import { t } from '@shared/i18n';
import { LanguagePicker } from '../components/LanguagePicker';

// The server's wording when a family member leaves no note of their own
const DEFAULT_NOTES = ['Looks good to me.', 'Not sure yet — let’s discuss.', 'I have some concerns — let’s talk.'];
const DECISIONS = [
  ['concern_raised', 'Raise a concern', AlertTriangle, 'warning'],
  ['unsure', 'Not sure yet', HelpCircle, 'secondary'],
  ['approved', 'I approve', Check, 'success'],
];

export function PortalPage() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [editing, setEditing] = useState(null);
  const [proposing, setProposing] = useState(null);
  const [proposalNote, setProposalNote] = useState('');
  const [gift, setGift] = useState(null); // { plan, order }
  const [notice, setNotice] = useState(null);
  const proposeNow = async () => {
    try {
      await api.proposeInterest(token, proposing.id, proposalNote.trim() || undefined);
      setNotice(t('Suggestion sent — {child} decides whether to send it.', { child: portal.childName }));
      setProposing(null);
      setProposalNote('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  const giftStart = async (plan) => {
    try {
      const order = await api.giftCheckout(token, plan);
      setGift({ plan, order });
    } catch (err) {
      setError(err.message);
    }
  };
  const giftPay = async () => {
    try {
      await api.giftConfirm(token, gift.order.paymentId, { dummyConfirm: true });
      setNotice(t('Thank you — {child} now has 3Knot {plan}.', { child: portal.childName, plan: t(TIER_INFO[gift.order.product.tier].name) }));
      setGift(null);
      await load(); // a Family plan unlocks suggesting interests and comparing — show them now
    } catch (err) {
      setError(err.message);
    }
  };
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

  // The view being written for a card: { decision, note }. Answered cards can be reopened to change it.
  const [drafts, setDrafts] = useState({});
  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const reopen = (r) => setDraft(r.id, { decision: r.status, note: DEFAULT_NOTES.includes(r.feedbackNote) ? '' : r.feedbackNote || '' });
  const respond = async (shareId, decision, note) => {
    setPending(shareId);
    try {
      await api.submitParentFeedback(token, shareId, decision, note?.trim() || undefined);
      setDrafts((d) => { const next = { ...d }; delete next[shareId]; return next; });
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
            <span className="row" style={{ '--gap': '8px' }}>
              <LanguagePicker dark />
              <span className="badge glass"><Eye size={11} />{' '}{t('Read only')}</span>
            </span>
          </div>
          {portal && <span className="small" style={{ color: 'rgba(255,246,238,0.75)', fontWeight: 600, marginTop: 10 }}>{t('{parentName} · shared by {child}', { parentName: portal.parentName, child })}</span>}
          <h1 className="h-display" style={{ fontSize: 36 }}>
            {!portal ? t('Your private view') : awaiting === 0 ? t('Nothing awaiting your view') : t(awaiting === 1 ? '1 profile awaits your view' : '{n} profiles await your view', { n: awaiting })}
          </h1>
          {portal && (
            <p style={{ color: 'rgba(255,246,238,0.78)', lineHeight: 1.6 }}>
              {t('{child} chose to show you these. You can note approval or raise a concern — {child} decides what happens next.', { child })}
            </p>
          )}
        </header>

        <main className="stack" style={{ padding: 20 }}>
          {error && <div className="card tinted error-text">{error}</div>}
          {notice && <div className="card tinted success-text">{notice}</div>}

          {portal?.compareEnabled && records.length > 1 && (
            <section className="card stack" aria-label={t('Compare side by side')}>
              <span className="h2">{t('Side by side')}</span>
              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr><th />{records.map((r) => <th key={r.id}>{r.candidateName}, {r.candidateAge}</th>)}</tr>
                  </thead>
                  <tbody>
                    <tr><td>{t('City')}</td>{records.map((r) => <td key={r.id}>{r.candidateCity || '—'}</td>)}</tr>
                    <tr><td>{t('Overall')}</td>{records.map((r) => <td key={r.id}><b>{r.overlapScore != null ? `${r.overlapScore}%` : '—'}</b></td>)}</tr>
                    {PILLARS.map((p) => (
                      <tr key={p.key}><td>{t(p.title)}</td>{records.map((r) => <td key={r.id}>{r.pillarScores ? pillarVerdict(r.pillarScores[p.key]).label : '—'}</td>)}</tr>
                    ))}
                    <tr><td>{t('Verified')}</td>{records.map((r) => <td key={r.id}>{r.idVerified ? t('ID verified') : t('Phone')}</td>)}</tr>
                    <tr><td>{t('Your view')}</td>{records.map((r) => <td key={r.id}>{t({ awaiting: 'Not yet', approved: 'Approved', unsure: 'Not sure', concern_raised: 'Concern' }[r.status])}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {portal && records.length === 0 && (
            <div className="card tinted empty">
              <Eye size={28} color="var(--gold)" />
              <div className="h3">{t('No profiles shared right now')}</div>
              <span className="small">{t('When {child} forwards a profile, it will appear here for you to review.', { child })}</span>
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
                    {r.candidateCity ? `${r.candidateCity} · ` : ''}{r.idVerified ? t('ID verified') : t('Phone verified')}
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
                        <span style={{ fontWeight: 600 }}>{t(p.title)}</span>
                        <Badge tone={v.tone}>{t(v.label)}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {r.childNote && <div className="quote"><Quote size={15} color="var(--gold)" style={{ flexShrink: 0 }} />{r.childNote}</div>}
              {portal.canPropose && (
                r.contacted
                  ? <span className="small muted">{t('Already in touch with this person')}</span>
                  : (portal.proposals || []).some((p) => p.shareId === r.id && p.status === 'pending')
                    ? <span className="small muted">{t('You suggested an interest — waiting for {child}.', { child })}</span>
                    : <Button variant="soft" size="sm" onClick={() => setProposing(r)}>{t('Suggest sending interest')}</Button>
              )}
              <div className="row tiny muted" style={{ '--gap': '6px' }}><Lock size={12} />{' '}{t('Phone, email and chats are hidden from this view.')}</div>

              {r.status !== 'awaiting' && !drafts[r.id] ? (
                <div className="row card" style={{ boxShadow: 'none', background: r.status === 'approved' ? 'var(--success-soft)' : r.status === 'unsure' ? 'var(--gold-soft)' : 'var(--warning-soft)', border: 0 }}>
                  {r.status === 'approved' ? <Check size={18} color="var(--success)" strokeWidth={3} /> : r.status === 'unsure' ? <HelpCircle size={18} color="var(--gold)" /> : <AlertTriangle size={18} color="var(--warning)" />}
                  <div className="grow">
                    <div className="h3">{t({ approved: 'You approved', unsure: 'You’re not sure yet', concern_raised: 'You raised a concern' }[r.status])}</div>
                    <div className="small muted">{t('{feedbackNote} · awaiting {child}', { feedbackNote: t(r.feedbackNote), child })}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => reopen(r)}>{t('Change my view')}</Button>
                </div>
              ) : (
                <div className="stack" style={{ '--gap': '10px' }}>
                  <div className="row wrap" role="radiogroup" aria-label={t('Your view')}>
                    {DECISIONS.map(([key, label, Icon, variant]) => (
                      <Button
                        key={key}
                        variant={drafts[r.id]?.decision === key ? variant : 'secondary'}
                        icon={Icon}
                        className="grow"
                        role="radio"
                        aria-checked={drafts[r.id]?.decision === key}
                        disabled={pending === r.id}
                        onClick={() => setDraft(r.id, { decision: key })}
                      >
                        {t(label)}
                      </Button>
                    ))}
                  </div>
                  {drafts[r.id]?.decision && (
                    <>
                      <textarea
                        className="input"
                        rows={2}
                        maxLength={500}
                        placeholder={t('Add a note for {child} (optional)', { child })}
                        aria-label={t('Note')}
                        value={drafts[r.id].note || ''}
                        onChange={(e) => setDraft(r.id, { note: e.target.value })}
                      />
                      <div className="row" style={{ justifyContent: 'flex-end' }}>
                        {r.status !== 'awaiting' && (
                          <Button variant="ghost" size="sm" onClick={() => setDrafts((d) => { const next = { ...d }; delete next[r.id]; return next; })}>{t('Cancel')}</Button>
                        )}
                        <Button size="sm" loading={pending === r.id} disabled={pending === r.id} onClick={() => respond(r.id, drafts[r.id].decision, drafts[r.id].note)}>
                          {t('Send my view')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}

          {portal?.canManage && portal.profileDetails && (
            <section className="card stack">
              <span className="row h2" style={{ '--gap': '8px' }}><ClipboardList size={20} color="var(--accent)" />{' '}{t('{child}’s personal details', { child })}</span>
              <span className="small muted">{t('{child} asked you to help complete these. They’re notified of every change.', { child })}</span>
              <DetailsSections person={{ details: portal.profileDetails, firstName: portal.profileDetails.firstName }} own onEdit={setEditing} />
            </section>
          )}
          {portal && (
            <section className="card stack">
              <span className="h3">{t('Gift {child} a 3Knot plan', { child })}</span>
              <span className="small muted">{t('Unlimited interests, see who’s interested, and more. {child} is told it’s from you.', { child })}</span>
              <div className="row wrap" style={{ '--gap': '8px' }}>
                {PLAN_CATALOG.filter((p) => p.months === 3).map((p) => (
                  <Button key={p.code} size="sm" variant={p.tier === 'premium' ? 'gold' : 'secondary'} onClick={() => giftStart(p.code)}>
                    {t('{name} · 3 months · {price}', { name: t(TIER_INFO[p.tier].name), price: priceText(p.pricePaise) })}
                  </Button>
                ))}
              </div>
            </section>
          )}
          {gift && (
            <Modal title={t('Test payment')} onClose={() => setGift(null)} width={440}>
              <p className="small muted" style={{ margin: 0 }}>{t('Payments are in test mode. No money is charged.')}</p>
              <div className="row between"><span className="h3">{t('Gift: {name} · 3 months', { name: t(TIER_INFO[gift.order.product.tier].name) })}</span><span className="h3">{gift.order.product.price}</span></div>
              <Button variant="gold" onClick={giftPay}>{t('Pay (test)')}</Button>
            </Modal>
          )}
          {proposing && (
            <Modal title={t('Suggest an interest in {candidateName}', { candidateName: proposing.candidateName })} onClose={() => setProposing(null)} width={480}>
              <p className="small muted" style={{ margin: 0 }}>{t('{child} sees your suggestion and decides whether to send it.', { child })}</p>
              <textarea className="input" rows={3} maxLength={500} placeholder={t('A note {child} can send with the interest (optional)', { child })} value={proposalNote} onChange={(e) => setProposalNote(e.target.value)} aria-label={t('Note')} />
              <Button onClick={proposeNow}>{t('Send suggestion')}</Button>
            </Modal>
          )}

          {editing && (
            <SectionEditModal sectionKey={editing} values={portal.profileDetails} save={saveDetails} exclude={['firstName']} onClose={() => setEditing(null)} />
          )}

          {portal && (
            <p className="row small muted" style={{ alignItems: 'flex-start', '--gap': '8px' }}>
              <ShieldCheck size={15} style={{ flexShrink: 0 }} />
              {t('You cannot search, message, or browse other profiles. Access ends when {child} removes it or the share expires.', { child })}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
