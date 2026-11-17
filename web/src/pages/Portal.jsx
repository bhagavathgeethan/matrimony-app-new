// Public parent portal: opened from the private SMS link. No account — the token is the credential.
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Lock, ShieldCheck, Check, AlertTriangle, Quote, HelpCircle, ClipboardList, Search, X, UserCheck, Send } from 'lucide-react';
import { PILLARS, pillarVerdict } from '@shared/constants';
import { api } from '../store';
import { Badge, Brand, Button, ScoreRing } from '../components/ui';
import { DetailsSections, SectionEditModal } from '../components/details';
import { PLAN_CATALOG, TIER_INFO, priceText } from '@shared/plans';
import { Modal } from '../components/ui';
import { openRazorpayCheckout } from '../services/razorpay';
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
  const [activeTab, setActiveTab] = useState('shared'); // 'shared' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({ minScore: 0, verified: false, city: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const filterCity = searchFilters.city;
  const filterMinScore = searchFilters.minScore;
  const filterVerified = searchFilters.verified;

  const runSearch = useCallback(async (text = searchQuery, filters = searchFilters) => {
    if (!token) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await api.searchParentPortal(token, {
        q: text ? text.trim() : undefined,
        city: filters.city ? filters.city.trim() : undefined,
        minScore: filters.minScore || undefined,
        verified: filters.verified ? true : undefined,
      });
      setSearchResults(res.results || []);
      setSearchTotal(res.total || 0);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [token, searchQuery, filterCity, filterMinScore, filterVerified]);

  useEffect(() => {
    if (activeTab === 'search') {
      const timer = setTimeout(() => {
        runSearch(searchQuery, { city: filterCity, minScore: filterMinScore, verified: filterVerified });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchQuery, filterCity, filterMinScore, filterVerified, runSearch]);

  const proposeNow = async () => {
    try {
      const target = proposing.candidateId || proposing.id;
      await api.proposeInterest(token, target, proposalNote.trim() || undefined);
      setNotice(t('Suggestion sent — {child} decides whether to send it.', { child: portal.childName }));
      setProposing(null);
      setProposalNote('');
      await load();
      if (activeTab === 'search') {
        runSearch(searchQuery, searchFilters);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  const giftStart = async (plan) => {
    try {
      const order = await api.giftCheckout(token, plan);
      if (order?.provider === 'razorpay') {
        openRazorpayCheckout({
          order,
          prefill: {
            name: portal?.name || '',
          },
          themeColor: '#a81e3c',
          onSuccess: async (payload) => {
            try {
              await api.giftConfirm(token, order.paymentId, payload);
              setNotice(t('Thank you — {child} now has 3Knot {plan}.', { child: portal.childName, plan: t(TIER_INFO[order.product.tier].name) }));
              await load();
            } catch (err) {
              setError(err.message);
            }
          },
          onError: (err) => {
            setError(err?.message || t('Payment failed'));
          },
        });
        return;
      }
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
  const seeking = portal?.seeking || (portal?.childGender === 'man' ? t('Brides') : portal?.childGender === 'woman' ? t('Grooms') : t('Profiles'));
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
            {!portal
              ? t('Your private view')
              : activeTab === 'search'
                ? t('Search {seeking} for {child}', { seeking, child })
                : awaiting === 0
                  ? t('Nothing awaiting your view')
                  : t(awaiting === 1 ? '1 profile awaits your view' : '{n} profiles await your view', { n: awaiting })}
          </h1>
          {portal && (
            <p style={{ color: 'rgba(255,246,238,0.78)', lineHeight: 1.6 }}>
              {activeTab === 'search'
                ? t('Discover compatible {seeking} for {child} based on their 4-pillar blueprint. Suggest profiles for them to review.', { seeking: seeking.toLowerCase(), child })
                : t('{child} chose to show you these. You can note approval or raise a concern — {child} decides what happens next.', { child })}
            </p>
          )}
          {portal && (
            <div className="row" style={{ marginTop: 14, '--gap': '10px' }}>
              <Button
                variant={activeTab === 'shared' ? 'gold' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab('shared')}
              >
                {t('Shared ({n})', { n: records.length })}
              </Button>
              <Button
                variant={activeTab === 'search' ? 'gold' : 'secondary'}
                size="sm"
                icon={Search}
                onClick={() => {
                  setActiveTab('search');
                  if (searchResults.length === 0 && !searchLoading) runSearch(searchQuery, searchFilters);
                }}
              >
                {t('Search {seeking}', { seeking })}
              </Button>
            </div>
          )}
        </header>

        <main className="stack" style={{ padding: 20 }}>
          {error && <div className="card tinted error-text">{error}</div>}
          {notice && <div className="card tinted success-text">{notice}</div>}

          {activeTab === 'shared' && (
            <>
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
            </>
          )}

          {activeTab === 'search' && (
            <div className="stack fade-in" style={{ '--gap': '14px' }}>
              <div className="row card" style={{ padding: '8px 14px', alignItems: 'center', '--gap': '10px' }}>
                <Search size={18} color="var(--text-light)" />
                <input
                  type="text"
                  className="input"
                  style={{ border: 0, padding: 0, background: 'transparent' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search by name, city, profession…')}
                  aria-label={t('Search')}
                />
                {searchQuery && (
                  <button type="button" className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="row wrap" style={{ '--gap': '8px' }}>
                <Button
                  size="sm"
                  variant={searchFilters.minScore >= 80 ? 'primary' : 'secondary'}
                  onClick={() => setSearchFilters((f) => ({ ...f, minScore: f.minScore >= 80 ? 0 : 80 }))}
                >
                  {t('80%+ Aligned')}
                </Button>
                <Button
                  size="sm"
                  variant={searchFilters.verified ? 'primary' : 'secondary'}
                  onClick={() => setSearchFilters((f) => ({ ...f, verified: !f.verified }))}
                >
                  {t('ID Verified')}
                </Button>
              </div>

              {searchError && <div className="card tinted error-text">{searchError}</div>}
              {searchLoading && <span className="small muted">{t('Searching {seeking}…', { seeking })}</span>}

              {!searchLoading && searchResults.length === 0 && (
                <div className="card tinted empty">
                  <Search size={28} color="var(--gold)" />
                  <div className="h3">{t('No {seeking} found', { seeking })}</div>
                  <span className="small">{t('Try adjusting your search or clearing filters to see more profiles for {child}.', { child })}</span>
                  {(searchQuery || searchFilters.minScore > 0 || searchFilters.verified) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchFilters({ minScore: 0, verified: false, city: '' });
                      }}
                    >
                      {t('Clear filters')}
                    </Button>
                  )}
                </div>
              )}

              {searchResults.map((cand) => {
                const isSuggested = (portal?.proposals || []).some(
                  (p) => (p.candidateId === cand.id || p.candidateId === cand.candidateId) && p.status === 'pending'
                ) || cand.suggested;

                return (
                  <article key={cand.id} className="card stack fade-in">
                    <div className="row">
                      <span className="queue-thumb" style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cand.photo ? <img src={cand.photo} alt="" style={cand.photoBlurred ? undefined : { filter: 'none', transform: 'none' }} /> : <Lock size={18} color="var(--text-light)" />}
                      </span>
                      <div className="grow">
                        <div className="h2">{cand.candidateName}, {cand.candidateAge}</div>
                        <div className="row small muted" style={{ '--gap': '5px' }}>
                          <ShieldCheck size={14} color="var(--success)" />
                          {cand.candidateCity ? `${cand.candidateCity} · ` : ''}{cand.idVerified ? t('ID verified') : t('Phone verified')}
                        </div>
                        {cand.profession && <div className="small muted">{cand.profession}</div>}
                      </div>
                      {cand.overlapScore != null && <ScoreRing score={cand.overlapScore} size={68} />}
                    </div>

                    {cand.pillarScores && (
                      <div className="verdicts">
                        {PILLARS.map((p) => {
                          const v = pillarVerdict(cand.pillarScores[p.key]);
                          return (
                            <div key={p.key} className="row between">
                              <span style={{ fontWeight: 600 }}>{t(p.title)}</span>
                              <Badge tone={v.tone}>{t(v.label)}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {cand.quote && <div className="quote"><Quote size={15} color="var(--gold)" style={{ flexShrink: 0 }} />{cand.quote}</div>}
                    <div className="row tiny muted" style={{ '--gap': '6px' }}><Lock size={12} />{' '}{t('Direct contact details and chats remain protected.')}</div>

                    {cand.contacted ? (
                      <div className="row small" style={{ color: 'var(--success)', '--gap': '6px' }}>
                        <UserCheck size={16} />
                        <span>{t('Already connected with {child}', { child })}</span>
                      </div>
                    ) : isSuggested ? (
                      <div className="row small" style={{ color: 'var(--gold)', '--gap': '6px' }}>
                        <Check size={16} />
                        <span>{t('Suggested to {child} · Awaiting response', { child })}</span>
                      </div>
                    ) : (
                      <Button
                        variant="soft"
                        size="sm"
                        icon={Send}
                        onClick={() => {
                          setProposing(cand);
                          setProposalNote('');
                        }}
                      >
                        {t('Suggest to {child}', { child })}
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
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
              {t('Family members can search and suggest matches for {child}. Private chats and contact details remain protected.', { child })}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
