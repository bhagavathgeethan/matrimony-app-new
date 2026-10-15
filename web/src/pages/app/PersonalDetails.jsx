import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PROFILE_SECTIONS } from '@shared/profileFields';
import { profileStrengthHint } from '@shared/constants';
import { useStore } from '../../store';
import { ScoreRing } from '../../components/ui';
import { DetailsSections, SectionEditModal } from '../../components/details';
import { t } from '@shared/i18n';

// Own personal details, section by section; ?edit=<section> opens that section's editor
export function PersonalDetailsPage() {
  const { user } = useStore();
  const [params, setParams] = useSearchParams();
  const editing = PROFILE_SECTIONS.some((s) => s.key === params.get('edit')) ? params.get('edit') : null;
  const completion = user?.profileCompletion;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <Link to="/profile" className="row small muted" style={{ '--gap': '4px' }}><ChevronLeft size={15} /> Profile</Link>
          <span className="eyebrow">Personal information</span>
          <h1 className="h1">{t('Personal details')}</h1>
        </div>
      </div>

      <div className="family-layout">
        <div className="card">
          <DetailsSections person={user} own onEdit={(key) => setParams({ edit: key })} />
        </div>

        <div className="stack">
          <div className="card row">
            <ScoreRing score={completion?.percent ?? 0} size={68} label="DONE" />
            <div className="grow">
              <div className="h3">Profile {completion?.percent ?? 0}% complete</div>
              <div className="small muted">{profileStrengthHint(user)}</div>
            </div>
          </div>
          <div className="card stack" style={{ '--gap': '10px' }}>
            {completion?.sections.map((s) => (
              <button key={s.key} className="completion-row" onClick={() => setParams({ edit: s.key })}>
                <span className="grow">{s.title}</span>
                <span className="tiny muted">{s.filled}/{s.total}</span>
                <span className="mini-bar"><span style={{ width: `${(s.filled / s.total) * 100}%` }} className={s.complete ? 'done' : ''} /></span>
              </button>
            ))}
          </div>
          <p className="tiny muted" style={{ padding: '0 6px' }}>
            Optional fields such as caste, gothram and star are never required and don’t affect matching scores.
          </p>
        </div>
      </div>

      {editing && <SectionEditModal sectionKey={editing} onClose={() => setParams({}, { replace: true })} />}
    </div>
  );
}
