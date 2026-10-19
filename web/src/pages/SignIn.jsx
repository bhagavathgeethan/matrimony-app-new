import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ShieldCheck, Users } from 'lucide-react';
import { useStore, api } from '../store';
import { Brand, Button, ScoreRing, cx } from '../components/ui';
import { LanguagePicker } from '../components/LanguagePicker';
import { t } from '@shared/i18n';

const RESEND_SECONDS = 30;

export function SignInPage() {
  const store = useStore();
  const navigate = useNavigate();
  // Family members (invited by a member) sign in with their own number and land on their private view
  const [family, setFamily] = useState(false);
  const [familyCode, setFamilyCode] = useState(null);
  const [portals, setPortals] = useState([]);
  const [step, setStep] = useState('phone'); // phone → otp (→ choose, family with several invites)
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const codeInput = useRef(null);
  const digits = phone.replace(/\D/g, '');
  const pendingPhone = family ? `+91 ${digits}` : store.pendingPhone;
  const devCode = family ? familyCode : store.devCode;

  const familySend = async () => {
    try {
      const res = await api.familySignInSend(digits);
      setFamilyCode(res.devCode || null);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
  const familyVerify = async (value) => {
    try {
      const res = await api.familySignInVerify(digits, value);
      if (res.portals.length === 1) navigate(`/portal/${res.portals[0].token}`);
      else {
        setPortals(res.portals);
        setStep('choose');
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
  const switchMode = (toFamily) => {
    setFamily(toFamily);
    setStep('phone');
    setError(null);
  };

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  const send = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = family ? await familySend() : await store.sendOtp(step === 'otp' ? store.pendingPhone : digits);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setStep('otp');
    setCode('');
    setSecondsLeft(RESEND_SECONDS);
    setTimeout(() => codeInput.current?.focus(), 50);
  };

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    const res = family ? await familyVerify(value) : await store.verifyOtp(value);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setCode('');
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/"><Brand dark /></Link>
        <div className="stack" style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <ScoreRing score={92} size={96} dark />
          <h1 className="h-display" style={{ fontSize: 44 }}>
            {t('One verified number.')}{' '}<span className="accent-gold">{t('One real profile.')}</span>
          </h1>
          <p style={{ color: 'rgba(255,246,238,0.75)', lineHeight: 1.6 }}>
            {t('Nobody can run five accounts and waste your family’s time.')}
          </p>
        </div>
        <span className="small" style={{ color: 'rgba(255,246,238,0.55)', position: 'relative', zIndex: 1 }}>
          {t('By continuing you agree to our Terms and DPDP-compliant Privacy Notice.')}
        </span>
      </aside>

      <main className="auth-main">
        <LanguagePicker className="auth-lang" />
        {step === 'phone' ? (
          <form className="auth-card fade-in" onSubmit={send}>
            {family ? (
              <>
                <span className="eyebrow">{t('Family sign in')}</span>
                <h2 className="h1"><span className="accent">{t('Invited by your family?')}</span></h2>
                <p className="lede">{t('Use the number your family member added. You’ll see only the profiles they share with you.')}</p>
              </>
            ) : (
              <>
                <span className="eyebrow">{t('Sign in or create an account')}</span>
                <h2 className="h1">{t('Your number,')}{' '}<span className="accent">{t('your account')}</span></h2>
                <p className="lede">{t('We’ll text you a 6-digit code. One profile per verified phone.')}</p>
              </>
            )}
            <label className="field">
              <span className="label">{t('Mobile number')}</span>
              <div className="phone-row">
                <span className="country">🇮🇳 +91</span>
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
            </label>
            <button type="button" className="check-row small muted" onClick={() => setSmsConsent((v) => !v)}>
              <span className={cx('checkbox', smsConsent && 'on')}>{smsConsent && <Check size={13} strokeWidth={3} />}</span>
              <span>{t('Send me an OTP by SMS. I consent to processing my number for authentication only.')}</span>
            </button>
            {error && <div className="error-text">{error}</div>}
            <Button type="submit" block loading={busy} disabled={busy || !smsConsent || digits.length !== 10}>
              {t('Send OTP')}
            </Button>
            <p className="small muted center">
              {family ? t('Looking for a match yourself?') : t('Invited by your family?')}{' '}
              <button type="button" className="accent" style={{ fontWeight: 700 }} onClick={() => switchMode(!family)}>
                {family ? t('Member sign in') : t('Family sign in')}
              </button>
            </p>
          </form>
        ) : step === 'choose' ? (
          <div className="auth-card fade-in">
            <span className="eyebrow">{t('Family sign in')}</span>
            <h2 className="h1">{t('Whose profiles')}{' '}<span className="accent">{t('do you want to see?')}</span></h2>
            <p className="lede">{t('More than one family member invited you. You can switch any time.')}</p>
            {portals.map((p) => (
              <button key={p.token} className="card row" style={{ textAlign: 'left' }} onClick={() => navigate(`/portal/${p.token}`)}>
                <Users size={18} color="var(--accent)" />
                <span className="grow">
                  <span className="h3" style={{ display: 'block' }}>{t('{childName}’s profiles', { childName: p.childName })}</span>
                  <span className="small muted">{t('Invited you as {name}', { name: p.name })}</span>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <div className="auth-card fade-in">
            <button className="icon-btn" onClick={() => { setStep('phone'); setError(null); }} aria-label={t('Change number')}>
              <ChevronLeft size={18} />
            </button>
            <span className="eyebrow">{t('Verification')}</span>
            <h2 className="h1">{t('Enter the')}{' '}<span className="accent">{t('6-digit code')}</span></h2>
            <p className="lede">
              {t('Sent to')}{' '}<strong>{pendingPhone}</strong> ·{' '}
              <button className="accent" style={{ fontWeight: 700 }} onClick={() => setStep('phone')}>{t('Change')}</button>
            </p>
            <div className="otp-boxes" onClick={() => codeInput.current?.focus()}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={cx('otp-box', code[i] && 'filled', i === Math.min(code.length, 5) && 'active')}>
                  {code[i] || ''}
                </div>
              ))}
              <input
                ref={codeInput}
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={t('One-time code')}
                value={code}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(next);
                  if (next.length === 6) verify(next);
                }}
              />
            </div>
            {devCode && <span className="dev-code">{t('Test SMS · your code is {devCode}', { devCode })}</span>}
            {error && <div className="error-text center">{error}</div>}
            <Button block loading={busy} disabled={busy || code.length !== 6} onClick={() => verify()}>{t('Verify')}</Button>
            <div className="center small muted">
              {secondsLeft > 0 ? (
                t('Resend in 0:{s}', { s: String(secondsLeft).padStart(2, '0') })
              ) : (
                <button className="accent" style={{ fontWeight: 700 }} onClick={send}>{t('Resend code')}</button>
              )}
            </div>
            <div className="card gold row small" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} color="var(--gold-ink)" />
              <span>{t('Every profile is tied to one verified number, so nobody can run five accounts.')}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
