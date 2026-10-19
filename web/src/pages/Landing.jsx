import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Users, Wallet, MapPin, Baby, Briefcase, Lock, Eye, Check, X, Heart, Quote } from 'lucide-react';
import { APP_NAME, PILLARS } from '@shared/constants';
import { Brand, ScoreRing, IconBadge } from '../components/ui';
import { api } from '../store';
import { LanguagePicker } from '../components/LanguagePicker';
import { StoreBadges } from '../components/StoreBadges';
import { t } from '@shared/i18n';

// Published success stories (both partners confirmed, reviewed by the team)
function StoriesSection() {
  const [stories, setStories] = useState([]);
  useEffect(() => {
    api.getPublicStories().then(setStories).catch(() => {});
  }, []);
  if (!stories.length) return null;
  return (
    <section className="section" style={{ paddingTop: 0 }} aria-label={t('Success stories')}>
      <div className="stack" style={{ '--gap': '8px', marginBottom: 22 }}>
        <span className="eyebrow">{t('Success stories')}</span>
        <h2 className="h1">{t('They found each other')}{' '}<span className="accent">{t('on 3Knot')}</span></h2>
      </div>
      <div className="story-grid">
        {stories.slice(0, 6).map((s) => (
          <article key={s.id} className="card stack" style={{ '--gap': '10px' }}>
            <span className="row h3" style={{ '--gap': '8px' }}><Heart size={16} color="var(--accent)" fill="var(--accent)" /> {s.names}</span>
            <span className="h2" style={{ fontSize: 20 }}>{s.title}</span>
            <p className="details-text" style={{ display: 'flex', gap: 8 }}><Quote size={15} color="var(--gold)" style={{ flexShrink: 0 }} />{s.story}</p>
            <span className="tiny muted">{s.month}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

const PILLAR_ICONS = { money: Wallet, roots: MapPin, kids: Baby, ambition: Briefcase };
const PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80',
];

export function LandingPage() {
  return (
    <div>
      <nav className="landing-nav">
        <Brand dark />
        <div className="row">
          <LanguagePicker dark />
          <Link to="/signin" className="btn btn-light sm">{t('Sign in')}</Link>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="hero-grid">
          <div className="hero-copy fade-in">
            <span className="eyebrow gold">{t('Values-led matchmaking')}</span>
            <h1 className="h-display">
              {t('Marriage isn’t a')}{' '}<span className="accent-gold">{t('résumé match.')}</span>
            </h1>
            <p className="lede">
              {t('We match on the life you want to build — money, roots, kids, ambition. Caste and salary never move your score.')}
            </p>
            <div className="hero-promises">
              <span className="hero-promise"><Sparkles size={14} color="var(--gold)" />{' '}{t('Matched on values')}</span>
              <span className="hero-promise"><ShieldCheck size={14} color="var(--gold)" />{' '}{t('DPDP private')}</span>
              <span className="hero-promise"><Users size={14} color="var(--gold)" />{' '}{t('Family, on your terms')}</span>
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <Link to="/signin" className="btn btn-gold">{t('Create my blueprint')}</Link>
              <Link to="/signin" className="btn btn-light">{t('I already have an account')}</Link>
            </div>
            <StoreBadges light />
          </div>

          <div className="hero-collage fade-in" style={{ animationDelay: '120ms' }}>
            <div className="hero-portrait left"><img src={PORTRAITS[0]} alt="" /></div>
            <div className="hero-portrait right"><img src={PORTRAITS[1]} alt="" /></div>
            <div className="hero-ring"><ScoreRing score={92} size={110} dark /></div>
            <span className="float-tag" style={{ left: 0, bottom: 20 }}>{t('Money · 96')}</span>
            <span className="float-tag" style={{ right: 0, top: 30 }}>{t('Kids · 94')}</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="section-head">
          <span className="eyebrow">{t('The blueprint')}</span>
          <h2 className="h1">{t('Four questions for the')}{' '}<span className="accent">{t('next 40 years')}</span></h2>
          <p className="lede">{t('Marriages rarely strain over hobbies. They strain over money, where you live, kids, and whose career bends.')}</p>
        </div>
        <div className="pillar-grid">
          {PILLARS.map((p) => (
            <div key={p.key} className="card pillar-card">
              <IconBadge icon={PILLAR_ICONS[p.key]} />
              <div className="h3">{t(p.title)}</div>
              <p className="small muted">{t(p.intro)}</p>
              <div className="row between tiny muted" style={{ marginTop: 'auto' }}>
                <span>{t(p.low)}</span>
                <span>→</span>
                <span>{t(p.high)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">{t('How it works')}</span>
          <h2 className="h1">{t('Fewer, better introductions')}</h2>
        </div>
        <div className="steps-grid">
          {[
            ['01', 'Build your blueprint', 'Answer four honest questions and mark what’s firm and what’s flexible.'],
            ['02', 'See who truly aligns', 'Every match shows a score for each pillar, with a suggested first question.'],
            ['03', 'Talk when it’s mutual', 'Photos stay blurred until you both reply. No browsing strangers’ albums.'],
          ].map(([n, title, text]) => (
            <div key={n} className="card stack" style={{ '--gap': '10px' }}>
              <span className="step-num">{n}</span>
              <div className="h3">{t(title)}</div>
              <p className="small muted">{t(text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="split">
          <div className="stack">
            <span className="eyebrow">{t('Family co-pilot')}</span>
            <h2 className="h1">{t('Bring family in —')}{' '}<span className="accent">{t('on your terms')}</span></h2>
            <p className="lede">
              {t('Forward a profile to a parent with a private link. They can approve or raise a concern. A parent’s note is advice, not a veto.')}
            </p>
          </div>
          <div className="card stack">
            {[
              [true, 'See profiles you forward, with scores'],
              [true, 'Mark approval or raise a concern'],
              [false, 'Browse or search other members'],
              [false, 'Message anyone, ever'],
              [false, 'See your chats or contact details'],
            ].map(([can, text]) => (
              <div key={text} className="row">
                <span className="icon-badge" style={{ width: 30, height: 30, background: can ? 'var(--success-soft)' : 'var(--accent-soft)', color: can ? 'var(--success)' : 'var(--accent)' }}>
                  {can ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
                </span>
                <span>{t(text)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="split">
          <div className="card dark stack" style={{ padding: 32 }}>
            <Lock color="var(--gold)" />
            <div className="h2">{t('Private by design')}</div>
            <p style={{ color: 'rgba(255,246,238,0.78)', lineHeight: 1.6 }}>
              {t('Built for India’s DPDP Act: itemised consent, a full data export any time, and real erasure within 72 hours — profile, photos and answers deleted, not deactivated.')}
            </p>
          </div>
          <div className="stack">
            <span className="eyebrow">{t('Your data')}</span>
            <h2 className="h1">{t('Scores built on values,')}{' '}<span className="accent">{t('not caste or salary.')}</span></h2>
            <div className="row small muted"><Eye size={16} />{' '}{t('Photos reveal only after mutual interest')}</div>
          </div>
        </div>
      </section>

      <StoriesSection />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="landing-cta">
          <h2 className="h-display" style={{ fontSize: 'clamp(30px, 4vw, 46px)' }}>
            {t('Ready to meet someone')}{' '}<span className="accent-gold">{t('aligned?')}</span>
          </h2>
          <p style={{ color: 'rgba(255,246,238,0.78)' }}>{t('It takes about four minutes to build your blueprint.')}</p>
          <Link to="/signin" className="btn btn-gold">{t('Create my blueprint')}</Link>
          <StoreBadges light className="center" />
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} {APP_NAME}</span>
        <StoreBadges className="small" />
        <span>{t('DPDP-compliant · Values-led matchmaking')}</span>
      </footer>
    </div>
  );
}
