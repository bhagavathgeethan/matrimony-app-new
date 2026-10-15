import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Sparkles, BadgeCheck, UserRound, Images, Heart, Wallet, ShieldCheck, Users, ChevronRight, ClipboardList, SlidersHorizontal, Crown, BookHeart, Sun, Star } from 'lucide-react';
import { PILLARS, VIBE_ART, profileStrengthHint } from '@shared/constants';
import { useStore } from '../../store';
import { Avatar, Meter, ScoreRing, IconBadge } from '../../components/ui';

export function ProfilePage() {
  const { user } = useStore();
  const bp = user?.blueprint || {};
  const photos = user?.photos || [];

  const completion = user?.profileCompletion;
  const edits = [
    [ClipboardList, 'Personal details', `${completion?.percent ?? 0}% complete · family, education, hobbies`, '/profile/details'],
    [SlidersHorizontal, 'Partner preferences & prompts', `${Object.keys(user?.preferences || {}).length} preferences · ${(user?.prompts || []).length} prompts`, '/profile/preferences'],
    [BadgeCheck, 'ID verification', user?.verified ? 'Verified' : 'Get the verified badge', '/profile/verification'],
    [Crown, 'Premium', user?.plan === 'premium' ? `Active until ${new Date(user.premiumUntil).toLocaleDateString('en-IN')}` : 'Unlimited interests and more', '/premium'],
    [Sun, 'Today’s picks', 'Five curated matches each day', '/today'],
    [Star, 'Shortlist & who viewed you', 'People you’re considering', '/shortlist'],
    [BookHeart, 'Success stories', 'Share how you met', '/stories'],
    [UserRound, 'Basics', `${user?.city || ''} · ${user?.intentTimeline || ''}`, '/onboarding/basics'],
    [Wallet, 'Blueprint', 'Re-tune your four pillars', '/onboarding/blueprint/tune'],
    [Heart, 'Vibes', `${(user?.vibes || []).length} of 6 picked`, '/onboarding/vibes'],
    [Images, 'Photos & privacy', `${photos.length} photo${photos.length === 1 ? '' : 's'}`, '/onboarding/photos'],
    [Users, 'Family access', 'Who sees what you forward', '/family'],
    [ShieldCheck, 'Privacy & data', 'Consents, export, erasure', '/settings'],
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">Profile</span>
          <h1 className="h1">My blueprint</h1>
        </div>
        <Link to="/onboarding/blueprint/tune" className="btn btn-soft sm"><Pencil size={15} /> Edit blueprint</Link>
      </div>

      <div className="family-layout">
        <div className="stack">
          <div className="card dark stack" style={{ padding: 28, '--gap': '22px' }}>
            <div className="row">
              <Avatar src={photos[0]?.url} name={user?.firstName} size={76} ring />
              <div>
                <div className="h1" style={{ color: '#fff' }}>{user?.firstName}{user?.age ? `, ${user.age}` : ''}</div>
                <div className="row small" style={{ '--gap': '6px', color: 'rgba(255,246,238,0.75)' }}>
                  <BadgeCheck size={15} color="var(--gold)" /> {user?.city} · {user?.verified ? 'ID verified' : 'phone verified'}
                </div>
              </div>
            </div>
            <div className="stack" style={{ '--gap': '11px' }}>
              {PILLARS.map((p) => <Meter key={p.key} label={p.label} value={bp[p.key] ?? 0} dark />)}
            </div>
            <div className="row" style={{ alignItems: 'flex-start', padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.08)' }}>
              <Sparkles size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontWeight: 650, lineHeight: 1.5 }}>{bp.summaryText}</span>
            </div>
          </div>

          {photos.length > 0 && (
            <div className="card stack">
              <span className="label">Photos</span>
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <div key={p.id} className="photo-tile"><img src={p.url} alt={i === 0 ? 'Main photo' : `Photo ${i + 1}`} /></div>
                ))}
              </div>
            </div>
          )}

          <div className="card stack">
            <span className="label">Your vibes</span>
            <div className="row wrap" style={{ '--gap': '8px' }}>
              {(user?.vibes || []).map((v) => <span key={v} className="chip">{VIBE_ART[v]?.[0]} {v}</span>)}
              {(user?.vibes || []).length === 0 && <span className="small muted">No vibes picked yet.</span>}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card stack" style={{ '--gap': '14px' }}>
            <div className="row">
              <ScoreRing score={user?.profileStrength ?? 0} size={68} label="DONE" />
              <div className="grow">
                <div className="h3">Profile {user?.profileStrength ?? 0}% complete</div>
                <div className="small muted">{profileStrengthHint(user)}</div>
              </div>
            </div>
            {(user?.profileStrength ?? 0) < 100 && (
              <Link to={completion?.nextSection ? `/profile/details?edit=${completion.nextSection}` : '/profile/details'} className="btn btn-primary sm">
                Complete my profile
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
        </div>
      </div>
    </div>
  );
}
