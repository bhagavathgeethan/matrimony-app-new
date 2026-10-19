import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, ShieldCheck, Sparkles, PauseCircle, PlayCircle, Gift, Headset, Zap } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Modal, Badge, cx } from '../../components/ui';
import { t, formatDate, formatTime } from '@shared/i18n';

// Plans (Plus / Premium / Family), trial, pause, spotlight and add-ons. Payments go through the configured provider
// (test mode while the provider is 'dummy').
export function PremiumPage() {
  const { premium, loadPremium, startCheckout, confirmPayment, startTrial, pausePlan, resumePlan, startSpotlight } = useStore();
  const [tier, setTier] = useState('premium');
  const [chosen, setChosen] = useState('premium_3m');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPremium();
  }, [loadPremium]);

  const run = async (key, fn, ok) => {
    setBusy(key);
    setMessage(null);
    const res = await fn();
    setBusy(null);
    setMessage(res.ok ? (ok ? ['ok', ok] : null) : ['error', res.error]);
    return res;
  };
  const checkout = (code) => run('checkout', async () => {
    const res = await startCheckout(code);
    if (res.ok) setOrder(res.data);
    return res;
  });
  // Test-mode gateway: confirm on our own screen. A real gateway opens its checkout here instead.
  const pay = (succeed) => run('pay', async () => {
    const res = await confirmPayment(order.paymentId, succeed ? { dummyConfirm: true } : {});
    setOrder(null);
    return res;
  }, t('Payment received — your purchase is active.'));

  if (!premium) return <div className="page"><span className="small muted">{t('Loading…')}</span></div>;
  const current = premium.tiers.find((plan) => plan.tier === tier);
  const sp = premium.spotlight;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow gold">{t('3Knot plans')}</span>
          <h1 className="h1">{premium.premium ? t('You’re on 3Knot {tierName}', { tierName: t(premium.tierName) }) : t('Reach out without limits')}</h1>
          {premium.premium && <span className="small muted">{t('Active until {date}. Buying the same plan again extends it.', { date: formatDate(premium.premiumUntil, { dateStyle: 'long' }) })}</span>}
          {premium.paused && <span className="small muted">{t('Paused since {date} · {n} days kept for later.', { date: formatDate(premium.paused.since), n: premium.paused.remainingDays })}</span>}
        </div>
        <div className="row wrap" style={{ '--gap': '8px' }}>
          {premium.trialAvailable && (
            <Button variant="gold" icon={Zap} loading={busy === 'trial'} onClick={() => run('trial', startTrial, t('Your {n}-day Premium trial has started.', { n: premium.trialDays }))}>
              {t('Try Premium free for {trialDays} days', { trialDays: premium.trialDays })}
            </Button>
          )}
          {premium.premium && (
            <Button variant="secondary" icon={PauseCircle} loading={busy === 'pause'} onClick={() => window.confirm(t('Pause your plan? Your remaining days are kept until you resume.')) && run('pause', pausePlan, t('Plan paused — your remaining days are kept.'))}>
              {t('Pause plan')}
            </Button>
          )}
          {premium.paused && (
            <Button icon={PlayCircle} loading={busy === 'resume'} onClick={() => run('resume', resumePlan, t('Welcome back — your plan is active again.'))}>{t('Resume plan')}</Button>
          )}
        </div>
      </div>
      {message && <div className={cx('card tinted small', message[0] === 'error' ? 'error-text' : 'success-text')}>{message[1]}</div>}

      <div className="tabs" role="tablist" style={{ maxWidth: 520 }}>
        {premium.tiers.map((plan) => (
          <button key={plan.tier} role="tab" aria-selected={tier === plan.tier} className={cx('tab', tier === plan.tier && 'active')}
            onClick={() => { setTier(plan.tier); setChosen(plan.plans[1]?.code || plan.plans[0].code); }}>
            {t(plan.name)}{premium.tier === plan.tier ? t(' · current') : ''}
          </button>
        ))}
      </div>

      <div className="family-layout">
        <div className="stack">
          <span className="small muted">{t(current.tagline)}</span>
          <div className="plan-grid">
            {current.plans.map((p) => (
              <button key={p.code} className={cx('card plan-card', chosen === p.code && 'chosen')} onClick={() => setChosen(p.code)} aria-pressed={chosen === p.code}>
                {p.badge && <span className="badge gold" style={{ alignSelf: 'flex-start' }}>{t(p.badge)}</span>}
                <span className="h2">{t(p.months > 1 ? '{n} months' : '1 month', { n: p.months })}</span>
                <span className="h1" style={{ fontSize: 30 }}>{p.price}</span>
                <span className="tiny muted">{t('{price} / month', { price: p.perMonth })}</span>
              </button>
            ))}
          </div>
          <Button variant="gold" icon={Crown} loading={busy === 'checkout'} disabled={!!busy} onClick={() => checkout(chosen)}>
            {premium.tier === tier ? t('Extend {name}', { name: t(current.name) }) : t('Get {name}', { name: t(current.name) })}
          </Button>
          <span className="row tiny muted" style={{ '--gap': '6px' }}><ShieldCheck size={13} />{' '}{t('Values matching, chat, video calls, family sharing and all safety tools stay free for everyone.')}</span>

          <div className="card stack">
            <span className="row h3" style={{ '--gap': '8px' }}><Sparkles size={17} color="var(--gold)" />{' '}{t('Spotlight')}</span>
            <span className="small muted">{t('Be shown first to members who align 80%+ with you, for 24 hours.')}</span>
            {sp.active
              ? <Badge tone="gold">{t('Spotlight on until {time}', { time: formatTime(sp.active.endsAt) })}</Badge>
              : (
                <div className="row wrap" style={{ '--gap': '8px' }}>
                  <Button size="sm" icon={Sparkles} disabled={!!busy || (sp.weeklyLeft === 0 && sp.credits === 0)} loading={busy === 'spot'}
                    onClick={() => run('spot', startSpotlight, t('You’re in the spotlight for 24 hours.'))}>
                    {t('Start spotlight')}
                  </Button>
                  <span className="tiny muted">{t('{weeklyLeft} weekly · {credits} extra', { weeklyLeft: sp.weeklyLeft, credits: sp.credits })}</span>
                </div>
              )}
          </div>

          <div className="card stack">
            <span className="label">{t('Add-ons')}</span>
            {premium.addons.map((a) => (
              <div key={a.code} className="row between" style={{ alignItems: 'flex-start' }}>
                <span className="grow">
                  <span className="row h3" style={{ '--gap': '8px' }}>{a.kind === 'assisted' ? <Headset size={16} /> : <Sparkles size={16} />} {t(a.name)}</span>
                  {a.detail && <span className="tiny muted" style={{ display: 'block' }}>{t(a.detail)}</span>}
                  {a.kind === 'assisted' && premium.assisted.active && <Link to="/premium/assisted" className="small">{t('Open assisted service →')}</Link>}
                </span>
                <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => checkout(a.code)}>{a.price}</Button>
              </div>
            ))}
            <span className="row tiny muted" style={{ '--gap': '6px' }}><Gift size={13} />{' '}{t('Family can gift a plan from their family link.')}</span>
          </div>
        </div>

        <div className="card stack">
          <span className="label">{t('{name} includes', { name: t(current.name) })}</span>
          {current.features.map((f) => (
            <div key={f.key} className="row" style={{ alignItems: 'flex-start', '--gap': '10px' }}>
              <Check size={17} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="h3" style={{ fontSize: 14.5 }}>{t(f.title)}{f.tier !== tier && <span className="tiny muted">{' '}{t(f.tier === 'plus' ? '· from Plus' : '· from Premium')}</span>}</div>
                <div className="tiny muted">{t(f.detail)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {order && (
        <Modal title={t('Test payment')} onClose={() => setOrder(null)} width={460}>
          <p className="small muted" style={{ margin: 0 }}>{t('Payments are in test mode (provider: {provider}). No money is charged.', { provider: order.provider })}</p>
          <div className="row between">
            <span className="h3">{order.product.kind === 'plan' ? `${t(order.product.tier[0].toUpperCase() + order.product.tier.slice(1))} · ${t(order.product.months > 1 ? '{n} months' : '1 month', { n: order.product.months })}` : t(order.product.name)}</span>
            <span className="h3">{order.product.price}</span>
          </div>
          <div className="row between">
            <Button variant="secondary" disabled={busy === 'pay'} onClick={() => pay(false)}>{t('Simulate failure')}</Button>
            <Button variant="gold" loading={busy === 'pay'} disabled={busy === 'pay'} onClick={() => pay(true)}>{t('Pay (test)')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
