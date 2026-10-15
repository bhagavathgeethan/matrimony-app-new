import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wallet, MapPin, Baby, Briefcase, Info } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { BlueprintSlider } from '../../components/blueprint/BlueprintSlider';
import { OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Button } from '../../components/ui/kit';

const { colors, fonts } = theme;

export const BlueprintTunerScreen = () => {
  const { setCurrentScreen, user, updateBlueprint } = useApp();
  const bp = user?.blueprint || {};
  const [money, setMoney] = useState(bp.money ?? 50);
  const [moneyFlexibility, setMoneyFlexibility] = useState(bp.moneyFlexibility || 'open');
  const [roots, setRoots] = useState(bp.roots ?? 50);
  const [rootsFlexibility, setRootsFlexibility] = useState(bp.rootsFlexibility || 'open');
  const [kids, setKids] = useState(bp.kids ?? 50);
  const [kidsFlexibility, setKidsFlexibility] = useState(bp.kidsFlexibility || 'open');
  const [ambition, setAmbition] = useState(bp.ambition ?? 50);
  const [ambitionFlexibility, setAmbitionFlexibility] = useState(bp.ambitionFlexibility || 'open');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await updateBlueprint({
      money,
      moneyFlexibility,
      roots,
      rootsFlexibility,
      kids,
      kidsFlexibility,
      ambition,
      ambitionFlexibility,
    });
    setSaving(false);
    if (!res.ok) return setError(res.error);
    setCurrentScreen(user?.onboarding?.completed ? 'blueprint-summary' : 'vibes');
  };

  const sliders = [
    ['Money', 'Save aggressively → Live for now', Wallet, money, setMoney, moneyFlexibility, setMoneyFlexibility],
    ['Roots', 'Stay near family → Move anywhere', MapPin, roots, setRoots, rootsFlexibility, setRootsFlexibility],
    ['Kids', 'Not planning → Soon, hands-on', Baby, kids, setKids, kidsFlexibility, setKidsFlexibility],
    ['Ambition', 'Protect balance → All-in on work', Briefcase, ambition, setAmbition, ambitionFlexibility, setAmbitionFlexibility],
  ];

  return (
    <OnboardingScreen
      top={<StepBar step={4} total={5} />}
      footer={
        <>
          <View style={styles.hint}>
            <Info size={13} color={colors.gold} />
            <Text style={styles.hintText}>Gold band = how much difference you’ll accept</Text>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label={saving ? 'Saving…' : 'Save blueprint'} disabled={saving} onPress={handleSave} />
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow>Step 04 / 05 · Blueprint</Eyebrow>
          <Heading size={32}>
            Your <Accent>shared future</Accent>
          </Heading>
        </View>
      </FadeIn>

      <View style={{ gap: 8 }}>
        {sliders.map(([title, subtitle, icon, value, setValue, flex, setFlex], i) => (
          <FadeIn key={title} delay={60 + i * 60}>
            <BlueprintSlider
              title={title}
              subtitle={subtitle}
              icon={icon}
              value={value}
              flexibility={flex}
              onChangeValue={setValue}
              onChangeFlexibility={setFlex}
            />
          </FadeIn>
        ))}
      </View>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  hint: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
