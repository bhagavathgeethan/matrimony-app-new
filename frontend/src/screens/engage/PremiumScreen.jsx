import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Check, Sparkles, PauseCircle, PlayCircle, Zap, Headset } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button } from '../../components/ui/kit';
import { Sheet } from '../../components/details/DetailsUI';
import { t, formatDate, formatTime } from '@shared/i18n';

const { colors, fonts } = theme;

// Plans (Plus / Premium / Family), trial, pause, spotlight and add-ons
export const PremiumScreen = () => {
  const { premium, loadPremium, startCheckout, confirmPayment, startTrial, pausePlan, resumePlan, startSpotlight, setCurrentScreen } = useApp();
  const [tier, setTier] = useState('premium');
  const [chosen, setChosen] = useState('premium_3m');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirmPause, setConfirmPause] = useState(false);

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
  // Test-mode gateway: confirm on our own sheet. A real gateway opens its checkout here instead.
  const pay = (succeed) => run('pay', async () => {
    const res = await confirmPayment(order.paymentId, succeed ? { dummyConfirm: true } : {});
    setOrder(null);
    return res;
  }, t('Payment received — your purchase is active.'));

  if (!premium) {
    return (
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Plans')} />
        <Body>{t('Loading…')}</Body>
      </Screen>
    );
  }
  const current = premium.tiers.find((plan) => plan.tier === tier);
  const sp = premium.spotlight;

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Plans')} />
        <View style={{ gap: 6, marginBottom: 12 }}>
          <Eyebrow color={colors.gold}>{t('3Knot plans')}</Eyebrow>
          <Heading size={30}>{premium.premium ? t('You’re on {tierName}', { tierName: t(premium.tierName) }) : t('Reach out without limits')}</Heading>
          {premium.premium && <Body size={13}>{t('Active until {date}.', { date: formatDate(premium.premiumUntil, { dateStyle: 'long' }) })}</Body>}
          {premium.paused && <Body size={13}>{t('Paused · {remainingDays} days kept for later.', { remainingDays: premium.paused.remainingDays })}</Body>}
        </View>

        <View style={{ gap: 8, marginBottom: 12 }}>
          {premium.trialAvailable && (
            <Button icon={Zap} label={busy === 'trial' ? t('Starting…') : t('Try Premium free for {trialDays} days', { trialDays: premium.trialDays })}
              onPress={() => run('trial', startTrial, t('Your {n}-day Premium trial has started.', { n: premium.trialDays }))} />
          )}
          {premium.premium && <Button variant="secondary" icon={PauseCircle} label={t('Pause plan')} onPress={() => setConfirmPause(true)} />}
          {premium.paused && <Button icon={PlayCircle} label={busy === 'resume' ? t('Resuming…') : t('Resume plan')} onPress={() => run('resume', resumePlan, t('Your plan is active again.'))} />}
          {message && <Text style={[styles.msg, message[0] === 'error' && { color: colors.accent }]}>{message[1]}</Text>}
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {premium.tiers.map((plan) => (
            <TouchableOpacity key={plan.tier} onPress={() => { setTier(plan.tier); setChosen(plan.plans[1]?.code || plan.plans[0].code); }}
              style={[styles.tab, tier === plan.tier && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tier === plan.tier }}>
              <Text style={[styles.tabText, tier === plan.tier && { color: colors.accent }]}>{t(plan.name)}{premium.tier === plan.tier ? ' ✓' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Body size={13}>{t(current.tagline)}</Body>
        <View style={{ gap: 10, marginTop: 10 }}>
          {current.plans.map((p) => (
            <TouchableOpacity key={p.code} onPress={() => setChosen(p.code)} style={[styles.plan, chosen === p.code && styles.planOn]}
              accessibilityRole="radio" accessibilityState={{ checked: chosen === p.code }} accessibilityLabel={`${t(current.name)} · ${t(p.months > 1 ? '{n} months' : '1 month', { n: p.months })} · ${p.price}`}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.planName}>{t(p.months > 1 ? '{n} months' : '1 month', { n: p.months })}{p.badge ? `  ·  ${t(p.badge)}` : ''}</Text>
                <Text style={styles.planPer}>{t('{price} / month', { price: p.perMonth })}</Text>
              </View>
              <Text style={styles.planPrice}>{p.price}</Text>
            </TouchableOpacity>
          ))}
          <Button icon={Crown} label={busy === 'checkout' ? t('Starting…') : premium.tier === tier ? t('Extend {name}', { name: t(current.name) }) : t('Get {name}', { name: t(current.name) })} disabled={!!busy} onPress={() => checkout(chosen)} />
        </View>

        <Card style={{ gap: 10, marginTop: 14 }}>
          <Text style={styles.planName}>{t('{name} includes', { name: t(current.name) })}</Text>
          {current.features.map((f) => (
            <View key={f.key} style={{ flexDirection: 'row', gap: 10 }}>
              <Check size={16} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.featTitle}>{t(f.title)}</Text>
                <Text style={styles.planPer}>{t(f.detail)}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ gap: 10, marginTop: 14 }}>
          <View style={styles.row}><Sparkles size={17} color={colors.gold} /><Text style={styles.planName}>{t('Spotlight')}</Text></View>
          <Body size={13}>{t('Be shown first to members who align 80%+ with you, for 24 hours.')}</Body>
          {sp.active
            ? <Text style={styles.msg}>{t('Spotlight on until {time}', { time: formatTime(sp.active.endsAt) })}</Text>
            : (
              <>
                <Text style={styles.planPer}>{t('{weeklyLeft} weekly · {credits} extra', { weeklyLeft: sp.weeklyLeft, credits: sp.credits })}</Text>
                <Button small icon={Sparkles} label={busy === 'spot' ? t('Starting…') : t('Start spotlight')} disabled={!!busy || (sp.weeklyLeft === 0 && sp.credits === 0)}
                  onPress={() => run('spot', startSpotlight, t('You’re in the spotlight for 24 hours.'))} />
              </>
            )}
        </Card>

        <Card style={{ gap: 12, marginTop: 14 }}>
          <Text style={styles.label}>{t('Add-ons')}</Text>
          {premium.addons.map((a) => (
            <View key={a.code} style={{ gap: 6 }}>
              <View style={styles.row}>
                {a.kind === 'assisted' ? <Headset size={16} color={colors.textPrimary} /> : <Sparkles size={16} color={colors.textPrimary} />}
                <Text style={[styles.featTitle, { flex: 1 }]}>{t(a.name)}</Text>
                <Button small variant="secondary" label={a.price} disabled={!!busy} onPress={() => checkout(a.code)} />
              </View>
              {a.detail && <Text style={styles.planPer}>{t(a.detail)}</Text>}
              {a.kind === 'assisted' && premium.assisted.active && (
                <Button small label={t('Open assisted service')} onPress={() => setCurrentScreen('assisted')} />
              )}
            </View>
          ))}
          <Text style={styles.planPer}>{t('Family can also gift you a plan from their family link.')}</Text>
        </Card>
      </Screen>

      {order && (
        <Sheet
          title={t('Test payment')}
          onClose={() => setOrder(null)}
          footer={(
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant="secondary" label={t('Simulate failure')} disabled={busy === 'pay'} onPress={() => pay(false)} style={{ flex: 1 }} />
              <Button label={busy === 'pay' ? t('Paying…') : t('Pay (test)')} disabled={busy === 'pay'} onPress={() => pay(true)} style={{ flex: 1 }} />
            </View>
          )}
        >
          <Body>{t('Payments are in test mode (provider: {provider}). No money is charged.', { provider: order.provider })}</Body>
          <Text style={styles.planName}>{order.product.kind === 'plan' ? `${t(order.product.tier[0].toUpperCase() + order.product.tier.slice(1))} · ${t(order.product.months > 1 ? '{n} months' : '1 month', { n: order.product.months })}` : t(order.product.name)} · {order.product.price}</Text>
        </Sheet>
      )}
      {confirmPause && (
        <Sheet
          title={t('Pause your plan?')}
          onClose={() => setConfirmPause(false)}
          footer={<Button label={t('Pause')} icon={PauseCircle} onPress={() => { setConfirmPause(false); run('pause', pausePlan, t('Plan paused — your remaining days are kept.')); }} />}
        >
          <Body>{t('Your remaining days are kept until you resume — useful while you’re talking to someone seriously.')}</Body>
        </Sheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: colors.cardSecondary, marginVertical: 10 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabOn: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.textSecondary },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 2, borderColor: colors.borderLight, backgroundColor: colors.card },
  planOn: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  planName: { fontFamily: fonts.sans, fontSize: 15.5, fontWeight: '800', color: colors.textPrimary },
  featTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  planPer: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
  planPrice: { fontFamily: fonts.sans, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msg: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.success },
});
