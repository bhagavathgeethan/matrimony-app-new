// Onboarding steps (also used to edit the profile later). Logic lives in the shared store.
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartHandshake, Users, FlaskConical, Megaphone, Scale, Lock, Ban, Wallet, MapPin, Baby, Briefcase, Clock,
  TrendingUp, Plane, Home, Sparkles, Info, Plus, Star, X, EyeOff, SearchX, BadgeCheck, Check, UserRound, Images, Heart,
} from 'lucide-react';
import {
  GENDERS, TIMELINES, INVOLVEMENT, MONEY_QUESTION, PILLARS, MAX_VIBES, profileStrengthHint,
} from '@shared/constants';
import { useStore } from '../../store';
import { Button, Toggle, IconBadge, Badge, ScoreRing, Meter, Avatar, cx } from '../../components/ui';
import { BlueprintSlider, VibeGrid } from '../../components/domain';
import { FieldRow, changedValues, valuesOf } from '../../components/details';
import { FIELD_BY_KEY, ONBOARDING_DETAIL_KEYS, ONBOARDING_REQUIRED_KEYS, isFilled } from '@shared/profileFields';
import { StepFooter } from './OnboardingLayout';

const PILLAR_ICONS = { money: Wallet, roots: MapPin, kids: Baby, ambition: Briefcase };
const OPTION_ICONS = { invest: TrendingUp, split: Plane, family: Home, spend: Sparkles };

// After saving: members editing their profile go back to it, new members continue
function useNext() {
  const { user } = useStore();
  const navigate = useNavigate();
  return (nextPath) => navigate(user?.onboarding?.completed ? '/profile' : nextPath);
}

function Header({ eyebrow, children, lede }) {
  return (
    <div className="stack fade-in" style={{ '--gap': '12px' }}>
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="h1">{children}</h1>
      {lede && <p className="lede">{lede}</p>}
    </div>
  );
}

// ---------- personal (short; the full profile is completed after sign-up) ----------
export function PersonalStep() {
  const { user, updateDetails } = useStore();
  const next = useNext();
  const original = valuesOf(user);
  const fields = ONBOARDING_DETAIL_KEYS.map((k) => FIELD_BY_KEY[k]);
  const [draft, setDraft] = useState(original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const complete = ONBOARDING_REQUIRED_KEYS.every((k) => isFilled(draft[k]));
  const set = (key, v) => setDraft((d) => ({ ...d, [key]: typeof v === 'function' ? v(d[key]) : v }));

  const save = async (e) => {
    e?.preventDefault();
    if (!complete) return;
    const changes = changedValues(fields, draft, original);
    if (Object.keys(changes).length) {
      setBusy(true);
      setError(null);
      const res = await updateDetails(changes);
      setBusy(false);
      if (!res.ok) return setError(res.error);
    }
    next('/onboarding/blueprint');
  };

  return (
    <form onSubmit={save} style={{ display: 'contents' }}>
      <div className="ob-content">
        <Header eyebrow="Step 3 · About you" lede="Just a few details now. Family, education, hobbies and the rest can be added from your profile once you’re in.">
          A little <span className="accent">about you</span>
        </Header>
        <div className="card fade-in personal-grid">
          {fields.map((f) => <FieldRow key={f.key} field={f} draft={draft} set={set} />)}
        </div>
      </div>
      <StepFooter hint={error ? <span className="error-text">{error}</span> : <span className="small muted">Religion has a “Prefer not to say” option. Education and occupation are optional.</span>}>
        <Button type="submit" loading={busy} disabled={!complete || busy}>Next — the blueprint</Button>
      </StepFooter>
    </form>
  );
}

// ---------- consent ----------
export function ConsentStep() {
  const { user, updateConsent } = useStore();
  const navigate = useNavigate();
  const [familySharing, setFamilySharing] = useState(user?.consent?.familySharing ?? true);
  const [productResearch, setProductResearch] = useState(user?.consent?.productResearch ?? false);
  const [marketing, setMarketing] = useState(user?.consent?.marketing ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const editing = Boolean(user?.onboarding?.completed);

  const items = [
    { icon: HeartHandshake, title: 'Matching', desc: 'Blueprint answers used to compute scores', value: true, required: true },
    { icon: Users, title: 'Family sharing', desc: 'Forward chosen profiles to a family member', value: familySharing, set: setFamilySharing },
    { icon: FlaskConical, title: 'Product research', desc: 'Anonymised analytics to improve matching', value: productResearch, set: setProductResearch },
    { icon: Megaphone, title: 'Marketing messages', desc: 'Offers by SMS, email or WhatsApp', value: marketing, set: setMarketing },
  ];

  const save = async () => {
    setBusy(true);
    setError(null);
    const res = await updateConsent({ familySharing, productResearch, marketing });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    navigate(editing ? '/settings' : '/onboarding/basics');
  };

  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 1 · Consent" lede="Granular, itemised, and reversible any time from Settings.">
          What you’re <span className="accent">agreeing to</span>
        </Header>
        <div className="card flush fade-in">
          {items.map((item, i) => (
            <React.Fragment key={item.title}>
              {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
              <div className="setting-row">
                <IconBadge icon={item.icon} tone={item.value ? undefined : 'neutral'} />
                <div className="grow">
                  <div className="row" style={{ '--gap': '8px' }}>
                    <span className="h3">{item.title}</span>
                    {item.required && <Badge tone="gold" icon={Lock}>Required</Badge>}
                  </div>
                  <div className="small muted">{item.desc}</div>
                </div>
                <Toggle label={item.title} value={item.value} onChange={item.set} disabled={item.required} />
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="card dark row fade-in" style={{ alignItems: 'flex-start' }}>
          <Scale color="var(--gold)" />
          <div className="small" style={{ lineHeight: 1.6, color: 'rgba(255,246,238,0.8)' }}>
            <strong style={{ color: '#fff' }}>Your DPDP rights.</strong> Download everything we hold, correct it, or
            ask for full erasure — completed within 72 hours across every table.
          </div>
        </div>
      </div>
      <StepFooter hint={error && <span className="error-text">{error}</span>}>
        <Button loading={busy} disabled={busy} onClick={save}>{editing ? 'Save consents' : 'Agree & continue'}</Button>
      </StepFooter>
    </>
  );
}

// ---------- basics ----------
export function BasicsStep() {
  const { user, updateBasics } = useStore();
  const next = useNext();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [gender, setGender] = useState(user?.gender || null);
  const [born, setBorn] = useState(user?.birthYearMonth || '');
  const [city, setCity] = useState(user?.city || '');
  const [timeline, setTimeline] = useState(user?.intentTimeline || TIMELINES[1][0]);
  const [involvement, setInvolvement] = useState(user?.familyInvolvement || INVOLVEMENT[1]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const complete = firstName.trim() && gender && born.trim() && city.trim();

  const save = async (e) => {
    e?.preventDefault();
    if (!complete) return;
    setBusy(true);
    setError(null);
    const res = await updateBasics({
      firstName: firstName.trim(), gender, birthYearMonth: born.trim(), city: city.trim(),
      intentTimeline: timeline, familyInvolvement: involvement,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    next('/onboarding/personal');
  };

  const Chips = ({ label, options, value, onChange }) => (
    <div className="stack" style={{ '--gap': '8px' }}>
      <span className="label">{label}</span>
      <div className="row wrap" style={{ '--gap': '8px' }}>
        {options.map(([key, text]) => (
          <button key={key} type="button" className={cx('chip', value === key && 'active')} onClick={() => onChange(key)}>{text}</button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={save} style={{ display: 'contents' }}>
      <div className="ob-content">
        <Header eyebrow="Step 2 · Basics" lede="The essentials. A few personal details come next; the rest can wait until you’re in.">
          The short version <span className="accent">of you</span>
        </Header>
        <div className="card stack fade-in">
          <label className="field">
            <span className="label">First name</span>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" maxLength={60} />
          </label>
          <div className="row wrap" style={{ alignItems: 'stretch' }}>
            <label className="field grow" style={{ minWidth: 180 }}>
              <span className="label">Born</span>
              <input className="input" value={born} onChange={(e) => setBorn(e.target.value)} placeholder="e.g. Mar 1997" />
            </label>
            <label className="field grow" style={{ minWidth: 180 }}>
              <span className="label">Lives in</span>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" maxLength={80} />
            </label>
          </div>
        </div>
        <Chips label="I am" options={GENDERS} value={gender} onChange={setGender} />
        <Chips label="Hoping to marry" options={TIMELINES} value={timeline} onChange={setTimeline} />
        <Chips label="Family involvement" options={INVOLVEMENT.map((v) => [v, v])} value={involvement} onChange={setInvolvement} />
      </div>
      <StepFooter
        hint={error ? <span className="error-text">{error}</span> : <span className="row" style={{ '--gap': '6px' }}><Ban size={14} color="var(--accent)" /> No complexion fields. Matching scores use values only.</span>}
      >
        <Button type="submit" loading={busy} disabled={!complete || busy}>Next — about you</Button>
      </StepFooter>
    </form>
  );
}

// ---------- blueprint ----------
export function BlueprintIntroStep() {
  const navigate = useNavigate();
  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 4 · Blueprint" lede="Marriages rarely strain over hobbies. They strain over money, where you live, kids, and whose career bends.">
          Four questions for the <span className="accent">next 40 years</span>
        </Header>
        <div className="stack" style={{ '--gap': '10px' }}>
          {PILLARS.map((p, i) => {
            const Icon = PILLAR_ICONS[p.key];
            return (
              <div key={p.key} className="card row fade-in" style={{ animationDelay: `${80 + i * 60}ms` }}>
                <IconBadge icon={Icon} />
                <div className="grow">
                  <div className="h3">{p.title}</div>
                  <div className="small muted">{p.intro}</div>
                </div>
                <span className="h2" style={{ color: 'var(--gold)' }}>0{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
      <StepFooter hint={<span className="row" style={{ '--gap': '6px' }}><Clock size={14} /> About 4 minutes. You can revise any answer later.</span>}>
        <Button onClick={() => navigate('/onboarding/blueprint/question')}>Begin</Button>
      </StepFooter>
    </>
  );
}

export function BlueprintQuestionStep() {
  const { updateBlueprint } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(MONEY_QUESTION.options[0].key);
  const [accepts, setAccepts] = useState('yes');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const option = MONEY_QUESTION.options.find((o) => o.key === selected);
    const res = await updateBlueprint({ money: option.score, moneyFlexibility: accepts === 'yes' ? 'open' : 'firm' });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    navigate('/onboarding/blueprint/tune');
  };

  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Money philosophy · 1 of 4">{MONEY_QUESTION.title}</Header>
        <div className="option-list" role="radiogroup">
          {MONEY_QUESTION.options.map((o) => {
            const Icon = OPTION_ICONS[o.key];
            const on = selected === o.key;
            return (
              <button key={o.key} type="button" role="radio" aria-checked={on} className={cx('option', on && 'selected')} onClick={() => setSelected(o.key)}>
                <IconBadge icon={Icon} size={38} />
                <span className="grow">
                  <span className="h3" style={{ display: 'block' }}>{o.title}</span>
                  <span className="small muted">{o.desc}</span>
                </span>
                <span className="checkbox" style={on ? { background: '#fff', borderColor: '#fff', color: 'var(--accent)' } : undefined}>
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="card tinted row wrap between">
          <span className="h3">Could you live with someone who answered differently?</span>
          <div className="segment">
            {[['yes', 'Yes'], ['no', 'No']].map(([k, l]) => (
              <button key={k} type="button" className={cx(accepts === k && 'active')} onClick={() => setAccepts(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <StepFooter hint={error && <span className="error-text">{error}</span>}>
        <Button variant="secondary" onClick={() => navigate('/onboarding/blueprint')}>Back</Button>
        <Button loading={busy} disabled={busy} onClick={save}>Next question</Button>
      </StepFooter>
    </>
  );
}

export function TunerStep() {
  const { user, updateBlueprint } = useStore();
  const next = useNext();
  const bp = user?.blueprint || {};
  const [values, setValues] = useState(() =>
    Object.fromEntries(PILLARS.flatMap((p) => [[p.key, bp[p.key] ?? 50], [`${p.key}Flexibility`, bp[`${p.key}Flexibility`] || 'open']]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    const res = await updateBlueprint(values);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    next('/onboarding/vibes');
  };

  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 4 · Blueprint" lede="Drag each dial. Firm pillars count as dealbreakers when the gap is large.">
          Your <span className="accent">shared future</span>
        </Header>
        <div className="stack" style={{ '--gap': '10px' }}>
          {PILLARS.map((p) => (
            <BlueprintSlider
              key={p.key}
              pillar={p}
              icon={PILLAR_ICONS[p.key]}
              value={values[p.key]}
              flexibility={values[`${p.key}Flexibility`]}
              onChange={(v) => setValues((s) => ({ ...s, [p.key]: v }))}
              onFlexibility={(f) => setValues((s) => ({ ...s, [`${p.key}Flexibility`]: f }))}
            />
          ))}
        </div>
      </div>
      <StepFooter hint={error ? <span className="error-text">{error}</span> : <span className="row" style={{ '--gap': '6px' }}><Info size={14} color="var(--gold)" /> Gold band = how much difference you’ll accept</span>}>
        <Button loading={busy} disabled={busy} onClick={save}>Save blueprint</Button>
      </StepFooter>
    </>
  );
}

// ---------- vibes ----------
export function VibesStep() {
  const { user, toggleVibe } = useStore();
  const next = useNext();
  const [error, setError] = useState(null);
  const count = user?.vibes?.length ?? 0;
  const toggle = async (v) => {
    setError(null);
    const res = await toggleVibe(v);
    if (!res.ok) setError(res.error);
  };
  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 5 · Vibes" lede="Visual, not verbal — the texture of daily life.">
          Six that feel like your <span className="accent">Sunday</span>
        </Header>
        <div className="row between">
          <span className="small" style={{ fontWeight: 700 }}>Chosen {count} of {MAX_VIBES}</span>
          <div className="row" style={{ '--gap': '4px' }}>
            {Array.from({ length: MAX_VIBES }, (_, i) => (
              <span key={i} style={{ width: 18, height: 5, borderRadius: 3, background: i < count ? 'var(--g-primary)' : 'var(--border)' }} />
            ))}
          </div>
        </div>
        <VibeGrid selected={user?.vibes || []} onToggle={toggle} />
      </div>
      <StepFooter hint={error && <span className="error-text">{error}</span>}>
        <Button variant="secondary" onClick={() => next('/onboarding/photos')}>Skip</Button>
        <Button onClick={() => next('/onboarding/photos')}>{user?.onboarding?.completed ? 'Done' : 'Next · photos'}</Button>
      </StepFooter>
    </>
  );
}

// ---------- photos ----------
export function PhotosStep() {
  const { user, uploadPhoto, deletePhoto, makePhotoPrimary, updatePrivacy } = useStore();
  const next = useNext();
  const [blur, setBlur] = useState(user?.photoBlurredUntilMutual ?? true);
  const [hideSearch, setHideSearch] = useState(user?.hideFromSearchEngines ?? true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const fileInput = useRef(null);
  const photos = user?.photos || [];

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    const res = await uploadPhoto(file);
    setUploading(false);
    if (!res.ok) setError(res.error);
  };
  const photoAction = async (id, fn) => {
    setBusyId(id);
    setError(null);
    const res = await fn(id);
    setBusyId(null);
    if (!res.ok) setError(res.error);
  };
  const save = async () => {
    const res = await updatePrivacy({ photoBlurredUntilMutual: blur, hideFromSearchEngines: hideSearch });
    if (!res.ok) return setError(res.error);
    next('/onboarding/review');
  };

  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 6 · Photos" lede="Blurred by default. They unblur only when you both say yes.">
          Photos, on <span className="accent">your terms</span>
        </Header>
        <div className="photo-grid">
          {photos.map((p, i) => (
            <div key={p.id} className="photo-tile">
              <img src={p.url} alt={i === 0 ? 'Main photo' : `Photo ${i + 1}`} />
              <div className="photo-actions">
                {i === 0 ? <Badge tone="glass">Main</Badge> : (
                  <button className="photo-action" onClick={() => photoAction(p.id, makePhotoPrimary)} aria-label="Make main photo"><Star size={14} /></button>
                )}
                <button className="photo-action" onClick={() => photoAction(p.id, deletePhoto)} aria-label="Remove photo"><X size={14} /></button>
              </div>
              {busyId === p.id && <div className="photo-busy"><span className="spinner light" /></div>}
            </div>
          ))}
          {photos.length < 6 && (
            <button type="button" className="photo-tile photo-add" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? <span className="spinner" /> : <><Plus size={24} />{photos.length ? 'Add photo' : 'Add your first photo'}</>}
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={onFile} />
        <div className="card flush">
          {[
            [EyeOff, 'Blur until mutual interest', 'Seen only after you both say yes', blur, setBlur],
            [SearchX, 'Hide from search engines', 'Recommended', hideSearch, setHideSearch],
          ].map(([Icon, title, sub, value, set], i) => (
            <React.Fragment key={title}>
              {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
              <div className="setting-row">
                <IconBadge icon={Icon} />
                <div className="grow"><div className="h3">{title}</div><div className="small muted">{sub}</div></div>
                <Toggle label={title} value={value} onChange={set} />
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="card dark row">
          <BadgeCheck color="var(--gold)" />
          <div className="grow">
            <div className="h3">{user?.verified ? 'ID verified' : 'ID verification — coming soon'}</div>
            <div className="small" style={{ color: 'rgba(255,246,238,0.72)' }}>One-time ID check. We store a hash, never the document.</div>
          </div>
        </div>
      </div>
      <StepFooter hint={error ? <span className="error-text">{error}</span> : photos.length === 0 && 'Add at least one photo to continue'}>
        <Button disabled={photos.length === 0 || uploading} onClick={save}>Continue</Button>
      </StepFooter>
    </>
  );
}

// ---------- review ----------
export function ReviewStep() {
  const { user, completeOnboarding } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const bp = user?.blueprint || {};

  const finish = async () => {
    setBusy(true);
    setError(null);
    const res = await completeOnboarding();
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  const editLinks = [
    [UserRound, 'Basics', '/onboarding/basics'],
    [Wallet, 'Blueprint', '/onboarding/blueprint/tune'],
    [Heart, 'Vibes', '/onboarding/vibes'],
    [Images, 'Photos', '/onboarding/photos'],
  ];

  return (
    <>
      <div className="ob-content">
        <Header eyebrow="Step 7 · Review">This is how you’ll <span className="accent">show up</span></Header>
        <div className="card dark stack fade-in" style={{ padding: 26 }}>
          <div className="row">
            <Avatar src={user?.photos?.[0]?.url} name={user?.firstName} size={68} ring />
            <div>
              <div className="h2">{user?.firstName}{user?.age ? `, ${user.age}` : ''}</div>
              <div className="small" style={{ color: 'rgba(255,246,238,0.7)' }}>{user?.city} · phone verified</div>
            </div>
          </div>
          <div className="stack" style={{ '--gap': '10px' }}>
            {PILLARS.map((p) => <Meter key={p.key} label={p.label} value={bp[p.key] ?? 0} dark />)}
          </div>
          <div className="card row" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'none', alignItems: 'flex-start' }}>
            <Sparkles size={16} color="var(--gold)" />
            <span style={{ fontWeight: 650, lineHeight: 1.5 }}>{bp.summaryText}</span>
          </div>
        </div>
        <div className="card row">
          <ScoreRing score={user?.profileStrength ?? 0} size={64} label="DONE" />
          <div className="grow">
            <div className="h3">Profile strength</div>
            <div className="small muted">{profileStrengthHint(user)}</div>
          </div>
        </div>
        <div className="row wrap" style={{ '--gap': '8px' }}>
          {editLinks.map(([Icon, label, to]) => (
            <Link key={label} to={to} className="chip"><Icon size={14} /> Edit {label.toLowerCase()}</Link>
          ))}
        </div>
      </div>
      <StepFooter hint={error && <span className="error-text">{error}</span>}>
        <Button loading={busy} disabled={busy} onClick={finish}>Finish & see my matches</Button>
      </StepFooter>
    </>
  );
}
