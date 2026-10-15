import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Check } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button } from '../../components/ui/kit';
import { Sheet } from '../../components/details/DetailsUI';

const { colors, fonts } = theme;

export const PremiumScreen = () => {
  const { premium, loadPremium, startCheckout, confirmPayment, setCurrentScreen } = useApp();
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
  // Dummy gateway: confirm on our own sheet. A real gateway opens its checkout here instead.
  const pay = async (succeed) => {
    setBusy(true);
    const res = await confirmPayment(order.paymentId, succeed ? { dummyConfirm: true } : {});
    setBusy(false);
    setOrder(null);
    if (!res.ok) return setError(res.error);
    setDone(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title="Premium" />
        {!premium ? <Body>Loading…</Body> : (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Eyebrow color={colors.gold}>Sangam Premium</Eyebrow>
              <Heading size={30}>{premium.premium ? 'You’re on Premium' : 'Reach out without limits'}</Heading>
              {premium.premium && <Body size={13}>Active until {new Date(premium.premiumUntil).toLocaleDateString('en-IN', { dateStyle: 'long' })}. Buying again extends it.</Body>}
            </View>
            <View style={{ gap: 10 }}>
              {premium.plans.map((p) => (
                <TouchableOpacity key={p.code} onPress={() => setChosen(p.code)} style={[styles.plan, chosen === p.code && styles.planOn]} accessibilityRole="radio" accessibilityState={{ checked: chosen === p.code }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.planName}>{p.name}{p.badge ? `  ·  ${p.badge}` : ''}</Text>
                    <Text style={styles.planPer}>₹{Math.round(p.pricePaise / 100 / p.months)} / month</Text>
                  </View>
                  <Text style={styles.planPrice}>{p.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            {done && <Text style={styles.ok}>Payment received — Premium is active.</Text>}
            <Button label={busy && !order ? 'Starting…' : premium.premium ? 'Extend Premium' : 'Get Premium'} icon={Crown} disabled={busy} onPress={checkout} />
            <Card style={{ gap: 12 }}>
              {premium.features.map((f) => (
                <View key={f.title} style={{ flexDirection: 'row', gap: 10 }}>
                  <Check size={18} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planName}>{f.title}</Text>
                    <Text style={styles.planPer}>{f.detail}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </Screen>
      {order && (
        <Sheet
          title="Test payment"
          onClose={() => setOrder(null)}
          footer={(
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant="secondary" label="Simulate failure" disabled={busy} onPress={() => pay(false)} style={{ flex: 1 }} />
              <Button label={busy ? 'Paying…' : 'Pay (test)'} disabled={busy} onPress={() => pay(true)} style={{ flex: 1 }} />
            </View>
          )}
        >
          <Body>Payments are in test mode (provider: {order.provider}). No money is charged.</Body>
          <Text style={styles.planName}>{order.plan.name} · ₹{(order.plan.pricePaise / 100).toLocaleString('en-IN')}</Text>
        </Sheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  plan: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 18, borderWidth: 2, borderColor: colors.borderLight, backgroundColor: colors.card },
  planOn: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  planName: { fontFamily: fonts.sans, fontSize: 15.5, fontWeight: '800', color: colors.textPrimary },
  planPer: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
  planPrice: { fontFamily: fonts.sans, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  error: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.accent },
  ok: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '700', color: colors.success },
});
