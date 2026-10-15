import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wallet, MapPin, Baby, Briefcase, Clock } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { OnboardingScreen, StepBar, FadeIn, Eyebrow, Heading, Accent, Button } from '../../components/ui/kit';

const { colors, fonts, gradients } = theme;

const PILLARS = [
  ['01', Wallet, 'Money philosophy', 'Saving, spending, joint or separate'],
  ['02', MapPin, 'Roots & geography', 'Same city as parents, or the world'],
  ['03', Baby, 'Kids & parenting', 'Whether, when, and who slows down'],
  ['04', Briefcase, 'Career ambition', 'How much work is allowed to take'],
];

export const BlueprintIntroScreen = () => {
  const { setCurrentScreen } = useApp();

  return (
    <OnboardingScreen
      dark
      background={gradients.hero}
      top={<StepBar step={4} total={5} dark />}
      footer={
        <>
          <View style={styles.timeRow}>
            <Clock size={13} color="rgba(255,246,238,0.6)" />
            <Text style={styles.timeText}>About 4 minutes · revise any answer later</Text>
          </View>
          <Button label="Begin" variant="gold" onPress={() => setCurrentScreen('blueprint-q1')} />
        </>
      }
    >
      <FadeIn>
        <View style={styles.header}>
          <Eyebrow color={colors.gold}>Step 04 / 05 · Blueprint</Eyebrow>
          <Heading size={36} color={colors.onDark}>
            Four questions for the <Accent color={colors.gold}>next 40 years</Accent>
          </Heading>
          <Text style={styles.lede}>
            Marriages rarely strain over hobbies. They strain over money, where you live, kids, and whose career bends.
          </Text>
        </View>
      </FadeIn>

      <View style={{ gap: 8 }}>
        {PILLARS.map(([num, Icon, title, desc], i) => (
          <FadeIn key={num} delay={100 + i * 70}>
            <View style={styles.pillar}>
              <View style={styles.pillarIcon}>
                <Icon size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.pillarTitle}>{title}</Text>
                <Text style={styles.pillarDesc}>{desc}</Text>
              </View>
              <Text style={styles.pillarNum}>{num}</Text>
            </View>
          </FadeIn>
        ))}
      </View>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 10,
    marginBottom: 2,
  },
  lede: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,246,238,0.75)',
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillarIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(201,162,92,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: colors.onDark,
  },
  pillarDesc: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: 'rgba(255,246,238,0.65)',
  },
  pillarNum: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 18,
    color: 'rgba(201,162,92,0.6)',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(255,246,238,0.6)',
  },
});
