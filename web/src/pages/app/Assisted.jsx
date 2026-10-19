import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Headset, ChevronLeft, Quote } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Badge, Empty } from '../../components/ui';
import { ProfileTile } from '../../components/tiles';
import { CandidateModal } from '../../components/candidate';
import { t, formatDate } from '@shared/i18n';

const STATUS = { new: ['Received', 'gold'], active: ['In progress', 'success'], closed: ['Closed', 'neutral'] };

// Assisted service: a relationship manager hand-picks matches and can speak with the family
export function AssistedPage() {
  const { assisted, loadAssisted, requestAssisted } = useStore();
  const [notes, setNotes] = useState('');
  const [callTime, setCallTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    loadAssisted().then((res) => {
      if (res.ok && res.data.request) {
        setNotes(res.data.request.notes || '');
        setCallTime(res.data.request.callTime || '');
      }
    });
  }, [loadAssisted]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await requestAssisted({ notes, callTime });
    setBusy(false);
    setMsg(res.ok ? t('Saved — your relationship manager will be in touch.') : res.error);
  };

  if (!assisted) return <div className="page"><span className="small muted">{t('Loading…')}</span></div>;
  const current = open && assisted.recommendations.find((c) => c.id === open);
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <Link to="/premium" className="row small muted" style={{ '--gap': '4px' }}><ChevronLeft size={15} />{' '}{t('Plans')}</Link>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow gold">{t('Assisted service')}</span>
        <h1 className="h1">{t('Your relationship manager')}</h1>
      </div>
      {!assisted.active ? (
        <Empty icon={Headset} title={t('Assisted service isn’t active')}>
          <span className="small">{t('A relationship manager hand-picks matches for you and can speak with your family.')}</span>
          <Link to="/premium" className="btn btn-gold sm">{t('See the add-on')}</Link>
        </Empty>
      ) : (
        <>
          <form className="card stack" onSubmit={save}>
            <div className="row between">
              <span className="small muted">{t('Active until {date}', { date: formatDate(assisted.until, { dateStyle: 'long' }) })}</span>
              {assisted.request && <Badge tone={STATUS[assisted.request.status][1]}>{t(STATUS[assisted.request.status][0])}</Badge>}
            </div>
            <label className="field">
              <span className="label">{t('What are you looking for?')}</span>
              <textarea className="input" rows={4} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Anything that helps your manager — values, family, where you’d like to live')} />
            </label>
            <label className="field">
              <span className="label">{t('Best time to call')}</span>
              <input className="input" maxLength={60} value={callTime} onChange={(e) => setCallTime(e.target.value)} placeholder={t('e.g. Weekday evenings')} />
            </label>
            {assisted.request?.managerNote && <div className="quote"><Quote size={15} color="var(--gold)" style={{ flexShrink: 0 }} />{assisted.request.managerNote}</div>}
            {msg && <span className="small" style={{ fontWeight: 700 }}>{msg}</span>}
            <Button type="submit" loading={busy} disabled={busy}>{assisted.request ? t('Update my request') : t('Send to my manager')}</Button>
          </form>

          <div className="stack" style={{ '--gap': '10px' }}>
            <span className="label">{t('Hand-picked for you')}</span>
            {assisted.recommendations.length === 0
              ? <span className="small muted">{t('Your manager’s suggestions will appear here.')}</span>
              : (
                <div className="browse-grid">
                  {assisted.recommendations.map((c) => (
                    <ProfileTile key={c.id} c={c} onOpen={() => setOpen(c.id)} footer={c.managerNote ? <span className="pick-reason">{c.managerNote}</span> : null} />
                  ))}
                </div>
              )}
          </div>
        </>
      )}
      {current && <CandidateModal candidate={current} onClose={() => setOpen(null)} />}
    </div>
  );
}
