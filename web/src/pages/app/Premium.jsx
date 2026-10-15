import React, { useEffect, useState } from 'react';
import { Crown, Check, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Modal, cx } from '../../components/ui';

export function PremiumPage() {
  const { premium, loadPremium, startCheckout, confirmPayment } = useStore();
  const [chosen, setChosen] = useState('premium_3m');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    loadPremium();
  }, [loadPremium]);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    const res = await startCheckout(chosen);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setOrder(res.data);
  };
  // Dummy gateway: the member confirms on our own screen. A real gateway opens its checkout here instead.
  const pay = async (succeed) => {
    setBusy(true);
    const res = await confirmPayment(order.paymentId, succeed ? { dummyConfirm: true } : {});
    setBusy(false);
    setOrder(null);
    if (!res.ok) return setError(res.error);
    setDone(true);
  };

  if (!premium) return <div className="page"><span className="small muted">Loading…</span></div>;
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow gold">Sangam Premium</span>
          <h1 className="h1">{premium.premium ? 'You’re on Premium' : 'Reach out without limits'}</h1>
          {premium.premium && <span className="small muted">Active until {new Date(premium.premiumUntil).toLocaleDateString('en-IN', { dateStyle: 'long' })}. Buying again extends it.</span>}
        </div>
      </div>

      <div className="family-layout">
        <div className="stack">
          <div className="plan-grid">
            {premium.plans.map((p) => (
              <button key={p.code} className={cx('card plan-card', chosen === p.code && 'chosen')} onClick={() => setChosen(p.code)} aria-pressed={chosen === p.code}>
                {p.badge && <span className="badge gold" style={{ alignSelf: 'flex-start' }}>{p.badge}</span>}
                <span className="h2">{p.name}</span>
                <span className="h1" style={{ fontSize: 30 }}>{p.price}</span>
                <span className="tiny muted">₹{Math.round(p.pricePaise / 100 / p.months)} / month</span>
              </button>
            ))}
          </div>
          {error && <span className="error-text">{error}</span>}
          {done && <span className="small" style={{ color: 'var(--success)', fontWeight: 700 }}>Payment received — Premium is active.</span>}
          <Button variant="gold" icon={Crown} loading={busy && !order} disabled={busy} onClick={checkout}>
            {premium.premium ? 'Extend Premium' : 'Get Premium'}
          </Button>
          <span className="row tiny muted" style={{ '--gap': '6px' }}><ShieldCheck size={13} /> Values matching, chat and family sharing stay free for everyone.</span>
        </div>
        <div className="card stack">
          <span className="label">What you get</span>
          {premium.features.map((f) => (
            <div key={f.title} className="row" style={{ alignItems: 'flex-start', '--gap': '10px' }}>
              <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div><div className="h3">{f.title}</div><div className="small muted">{f.detail}</div></div>
            </div>
          ))}
        </div>
      </div>

      {order && (
        <Modal title="Test payment" onClose={() => setOrder(null)} width={460}>
          <p className="small muted" style={{ margin: 0 }}>
            Payments are in test mode (provider: {order.provider}). No money is charged. Choose what happens:
          </p>
          <div className="row between">
            <span className="h3">{order.plan.name}</span>
            <span className="h3">₹{(order.plan.pricePaise / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="row between">
            <Button variant="secondary" disabled={busy} onClick={() => pay(false)}>Simulate failure</Button>
            <Button variant="gold" loading={busy} disabled={busy} onClick={() => pay(true)}>Pay (test)</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
