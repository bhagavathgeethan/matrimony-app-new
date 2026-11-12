import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store';
import { Brand, cx } from '../../components/ui';
import { t } from '@shared/i18n';

const STEPS = [
  { key: 'consent', label: 'Consent', path: '/onboarding/consent' },
  { key: 'basics', label: 'Basics', path: '/onboarding/basics' },
  { key: 'personal', label: 'About you', path: '/onboarding/personal' },
  { key: 'blueprint', label: 'Blueprint', path: '/onboarding/blueprint' },
  { key: 'vibes', label: 'Vibes', path: '/onboarding/vibes' },
  { key: 'photos', label: 'Photos', path: '/onboarding/photos' },
  { key: 'review', label: 'Review', path: '/onboarding/review' },
];

export function OnboardingLayout() {
  const { user, logout } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const completed = Boolean(user?.onboarding?.completed);
  const current = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const done = (key) => (key === 'review' ? completed : Boolean(user?.onboarding?.[key]));
  const canNavigate = (i) => i < current || done(STEPS[i].key) || completed;

  return (
    <div className="ob-page">
      <aside className="ob-rail">
        <Brand dark />
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow gold">{completed ? t('Edit your profile') : t('Your blueprint')}</span>
          <div className="h2">{completed ? t('Keep it current') : t('Four minutes to better matches')}</div>
        </div>
        <nav className="ob-steps" aria-label={t('Onboarding steps')}>
          {STEPS.map((s, i) => {
            const isClickable = canNavigate(i);
            return (
              <div
                key={s.key}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={() => isClickable && navigate(s.path)}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    navigate(s.path);
                  }
                }}
                className={cx('ob-step', i === current && 'current', done(s.key) && i !== current && 'done')}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
                title={isClickable ? t('Go to {step}', { step: t(s.label) }) : undefined}
              >
                <span className="dot">{done(s.key) && i !== current ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                {t(s.label)}
              </div>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          {completed ? (
            <Link to="/profile" className="btn btn-light sm"><ChevronLeft size={15} />{' '}{t('Back to profile')}</Link>
          ) : (
            <button className="small" style={{ color: 'rgba(255,246,238,0.6)' }} onClick={logout}>{t('Sign out')}</button>
          )}
        </div>
      </aside>

      <div className="ob-main">
        <div className="ob-mobile-top">
          <div className="row between">
            <Brand tagline={false} size={30} />
            {completed && <Link to="/profile" className="small accent" style={{ fontWeight: 700 }}>{t('Back to profile')}</Link>}
          </div>
          <div className="row" style={{ '--gap': '6px', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const isClickable = canNavigate(i);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => isClickable && navigate(s.path)}
                  disabled={!isClickable}
                  title={`${i + 1}. ${t(s.label)}`}
                  aria-label={`${t('Step')} ${i + 1}: ${t(s.label)}`}
                  className="grow"
                  style={{
                    height: 20,
                    padding: '8px 0',
                    border: 'none',
                    background: 'transparent',
                    cursor: isClickable ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      width: '100%',
                      height: 4,
                      borderRadius: 4,
                      background: i <= current ? 'var(--g-primary)' : 'var(--border)',
                      opacity: isClickable && i < current ? 0.85 : 1,
                      transition: 'transform 0.15s, opacity 0.15s',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

// Sticky action bar at the bottom of each step
export function StepFooter({ children, hint }) {
  return (
    <div className="ob-footer">
      <div className="ob-footer-inner">
        <div className="small muted grow">{t(hint)}</div>
        <div className="row">{children}</div>
      </div>
    </div>
  );
}
