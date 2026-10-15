import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';
import { Brand, Button, ScoreRing, cx } from '../components/ui';

const RESEND_SECONDS = 30;

export function SignInPage() {
  const { pendingPhone, devCode, sendOtp, verifyOtp } = useStore();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(true);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const codeInput = useRef(null);
  const digits = phone.replace(/\D/g, '');

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondsLeft]);

  const send = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendOtp(step === 'otp' ? pendingPhone : digits);
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
    const res = await verifyOtp(value);
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
            One verified number. <span className="accent-gold">One real profile.</span>
          </h1>
          <p style={{ color: 'rgba(255,246,238,0.75)', lineHeight: 1.6 }}>
            Nobody can run five accounts and waste your family’s time.
          </p>
        </div>
        <span className="small" style={{ color: 'rgba(255,246,238,0.55)', position: 'relative', zIndex: 1 }}>
          By continuing you agree to our Terms and DPDP-compliant Privacy Notice.
        </span>
      </aside>

      <main className="auth-main">
        {step === 'phone' ? (
          <form className="auth-card fade-in" onSubmit={send}>
            <span className="eyebrow">Sign in or create an account</span>
            <h2 className="h1">Your number, <span className="accent">your account</span></h2>
            <p className="lede">We’ll text you a 6-digit code. One profile per verified phone.</p>
            <label className="field">
              <span className="label">Mobile number</span>
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
              <span>Send me an OTP by SMS. I consent to processing my number for authentication only.</span>
            </button>
            {error && <div className="error-text">{error}</div>}
            <Button type="submit" block loading={busy} disabled={busy || !smsConsent || digits.length !== 10}>
              Send OTP
            </Button>
            <p className="small muted center">Family member? Use the private link you were sent instead.</p>
          </form>
        ) : (
          <div className="auth-card fade-in">
            <button className="icon-btn" onClick={() => { setStep('phone'); setError(null); }} aria-label="Change number">
              <ChevronLeft size={18} />
            </button>
            <span className="eyebrow">Verification</span>
            <h2 className="h1">Enter the <span className="accent">6-digit code</span></h2>
            <p className="lede">
              Sent to <strong>{pendingPhone}</strong> ·{' '}
              <button className="accent" style={{ fontWeight: 700 }} onClick={() => setStep('phone')}>Change</button>
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
                aria-label="One-time code"
                value={code}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(next);
                  if (next.length === 6) verify(next);
                }}
              />
            </div>
            {devCode && <span className="dev-code">Test SMS · your code is {devCode}</span>}
            {error && <div className="error-text center">{error}</div>}
            <Button block loading={busy} disabled={busy || code.length !== 6} onClick={() => verify()}>Verify</Button>
            <div className="center small muted">
              {secondsLeft > 0 ? (
                `Resend in 0:${String(secondsLeft).padStart(2, '0')}`
              ) : (
                <button className="accent" style={{ fontWeight: 700 }} onClick={send}>Resend code</button>
              )}
            </div>
            <div className="card gold row small" style={{ alignItems: 'flex-start' }}>
              <ShieldCheck size={18} color="var(--gold-ink)" />
              <span>Every profile is tied to one verified number, so nobody can run five accounts.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
