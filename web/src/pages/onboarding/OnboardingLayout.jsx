import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store';
import { Brand, cx } from '../../components/ui';

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
  const completed = Boolean(user?.onboarding?.completed);
  const current = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const done = (key) => (key === 'review' ? completed : Boolean(user?.onboarding?.[key]));

  return (
    <div className="ob-page">
      <aside className="ob-rail">
        <Brand dark />
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow gold">{completed ? 'Edit your profile' : 'Your blueprint'}</span>
          <div className="h2">{completed ? 'Keep it current' : 'Four minutes to better matches'}</div>
        </div>
        <nav className="ob-steps" aria-label="Onboarding steps">
          {STEPS.map((s, i) => (
            <div key={s.key} className={cx('ob-step', i === current && 'current', done(s.key) && i !== current && 'done')}>
              <span className="dot">{done(s.key) && i !== current ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              {s.label}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          {completed ? (
            <Link to="/profile" className="btn btn-light sm"><ChevronLeft size={15} /> Back to profile</Link>
          ) : (
            <button className="small" style={{ color: 'rgba(255,246,238,0.6)' }} onClick={logout}>Sign out</button>
          )}
        </div>
      </aside>

      <div className="ob-main">
        <div className="ob-mobile-top">
          <div className="row between">
            <Brand tagline={false} size={30} />
            {completed && <Link to="/profile" className="small accent" style={{ fontWeight: 700 }}>Back to profile</Link>}
          </div>
          <div className="row" style={{ '--gap': '6px' }}>
            {STEPS.map((s, i) => (
              <span key={s.key} className="grow" style={{ height: 4, borderRadius: 4, background: i <= current ? 'var(--g-primary)' : 'var(--border)' }} />
            ))}
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
        <div className="small muted grow">{hint}</div>
        <div className="row">{children}</div>
      </div>
    </div>
  );
}
