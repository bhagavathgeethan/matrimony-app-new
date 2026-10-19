import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Sparkles, BadgeCheck, UserRound, Images, Heart, Wallet, ShieldCheck, Users, ChevronRight, ClipboardList, SlidersHorizontal, Crown, BookHeart, Sun, Star } from 'lucide-react';
import { PILLARS, VIBE_ART, profileStrengthHint, blueprintSummary } from '@shared/constants';
import { useStore } from '../../store';
import { Avatar, Meter, ScoreRing, IconBadge } from '../../components/ui';
import { t, formatDate } from '@shared/i18n';
import { StoreBadges } from '../../components/StoreBadges';

export function ProfilePage() {
  const { user } = useStore();
  const bp = user?.blueprint || {};
  const photos = user?.photos || [];

  const completion = user?.profileCompletion;
  const edits = [
    [ClipboardList, t('Personal details'), t('{n}% complete · family, education, hobbies', { n: completion?.percent ?? 0 }), '/profile/details'],
    [SlidersHorizontal, t('Partner preferences & prompts'), t('{prefs} preferences · {prompts} prompts', { prefs: Object.keys(user?.preferences || {}).length, prompts: (user?.prompts || []).length }), '/profile/preferences'],
    [BadgeCheck, t('ID verification'), user?.verified ? t('Verified') : t('Get the verified badge'), '/profile/verification'],
    [Crown, user?.plan !== 'free' ? t('3Knot {planName}', { planName: t(user?.planName) }) : t('Plans & Premium'), user?.plan !== 'free' ? t('Active until {date}', { date: formatDate(user.premiumUntil) }) : t('Plus, Premium and Family plans'), '/premium'],
    [Sun, t('Today’s picks'), t('Five curated matches each day'), '/today'],
    [Star, t('Shortlist & who viewed you'), t('People you’re considering'), '/shortlist'],
    [BookHeart, t('Success stories'), t('Share how you met'), '/stories'],
    [UserRound, t('Basics'), `${user?.city || ''} · ${t(user?.intentTimeline || '')}`, '/onboarding/basics'],
    [Wallet, t('Blueprint'), t('Re-tune your four pillars'), '/onboarding/blueprint/tune'],
    [Heart, t('Vibes'), t('{n} of 6 picked', { n: (user?.vibes || []).length }), '/onboarding/vibes'],
    [Images, t('Photos & privacy'), t(photos.length === 1 ? '1 photo' : '{n} photos', { n: photos.length }), '/onboarding/photos'],
    [Users, t('Family access'), t('Who sees what you forward'), '/family'],
    [ShieldCheck, t('Privacy & data'), t('Consents, export, erasure'), '/settings'],
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">{t('Profile')}</span>
          <h1 className="h1">{t('My blueprint')}</h1>
        </div>
        <Link to="/onboarding/blueprint/tune" className="btn btn-soft sm"><Pencil size={15} />{' '}{t('Edit blueprint')}</Link>
      </div>

      <div className="family-layout">
        <div className="stack">
          <div className="card dark stack" style={{ padding: 28, '--gap': '22px' }}>
            <div className="row">
              <Avatar src={photos[0]?.url} name={user?.firstName} size={76} ring />
              <div>
                <div className="h1" style={{ color: '#fff' }}>{user?.firstName}{user?.age ? `, ${user.age}` : ''}</div>
                <div className="row small" style={{ '--gap': '6px', color: 'rgba(255,246,238,0.75)' }}>
                  <BadgeCheck size={15} color="var(--gold)" /> {user?.city} · {user?.verified ? t('ID verified') : t('phone verified')}
                </div>
              </div>
            </div>
            <div className="stack" style={{ '--gap': '11px' }}>
              {PILLARS.map((p) => <Meter key={p.key} label={t(p.label)} value={bp[p.key] ?? 0} dark />)}
            </div>
            <div className="row" style={{ alignItems: 'flex-start', padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.08)' }}>
              <Sparkles size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontWeight: 650, lineHeight: 1.5 }}>{blueprintSummary(bp)}</span>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="card stack">
              <span className="label">{t('Photos')}</span>
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <div key={p.id} className="photo-tile"><img src={p.url} alt={i === 0 ? t('Main photo') : t('Photo {n}', { n: i + 1 })} /></div>
                ))}
              </div>
            </div>
          )}

          <div className="card stack">
            <span className="label">{t('Your vibes')}</span>
            <div className="row wrap" style={{ '--gap': '8px' }}>
              {(user?.vibes || []).map((v) => <span key={v} className="chip">{VIBE_ART[v]?.[0]} {t(v)}</span>)}
              {(user?.vibes || []).length === 0 && <span className="small muted">{t('No vibes picked yet.')}</span>}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card stack" style={{ '--gap': '14px' }}>
            <div className="row">
              <ScoreRing score={user?.profileStrength ?? 0} size={68} label={t('DONE')} />
              <div className="grow">
                <div className="h3">{t('Profile {n}% complete', { n: user?.profileStrength ?? 0 })}</div>
                <div className="small muted">{profileStrengthHint(user)}</div>
              </div>
            </div>
            {(user?.profileStrength ?? 0) < 100 && (
              <Link to={completion?.nextSection ? `/profile/details?edit=${completion.nextSection}` : '/profile/details'} className="btn btn-primary sm">
                {t('Complete my profile')}
              </Link>
            )}
          </div>
          <div className="card flush">
            {edits.map(([Icon, label, sub, to], i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
                <Link to={to} className="setting-row">
                  <IconBadge icon={Icon} size={38} />
                  <span className="grow">
                    <span className="h3" style={{ display: 'block' }}>{label}</span>
                    <span className="tiny muted">{sub}</span>
                  </span>
                  <ChevronRight size={18} color="var(--text-light)" />
                </Link>
              </React.Fragment>
            ))}
          </div>
          {/* The sidebar (with its store links) is hidden on phones, so the apps are offered here too */}
          <div className="card stack store-card" style={{ '--gap': '10px' }}>
            <span className="h3">{t('Get the app')}</span>
            <StoreBadges />
          </div>
        </div>
      </div>
    </div>
  );
}
