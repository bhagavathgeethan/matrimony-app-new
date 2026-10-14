import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { BlueprintSlider } from '../../components/blueprint/BlueprintSlider';

export const BlueprintTunerScreen = () => {
  const { setCurrentScreen, user, updateBlueprint } = useApp();

  const [money, setMoney] = useState(user?.blueprint?.money || 72);
  const [moneyFlexibility, setMoneyFlexibility] = useState(user?.blueprint?.moneyFlexibility || 'open');
  const [roots, setRoots] = useState(user?.blueprint?.roots || 31);
  const [rootsFlexibility, setRootsFlexibility] = useState(user?.blueprint?.rootsFlexibility || 'firm');
  const [kids, setKids] = useState(user?.blueprint?.kids || 58);
  const [kidsFlexibility, setKidsFlexibility] = useState(user?.blueprint?.kidsFlexibility || 'open');
  const [ambition, setAmbition] = useState(user?.blueprint?.ambition || 84);
  const [ambitionFlexibility, setAmbitionFlexibility] = useState(user?.blueprint?.ambitionFlexibility || 'firm');

  const handleSave = () => {
    updateBlueprint({
      money,
      moneyFlexibility,
      roots,
      rootsFlexibility,
      kids,
      kidsFlexibility,
      ambition,
      ambitionFlexibility,
    });
    setCurrentScreen('vibes');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* 4-Step Indicator Bars */}
      <View style={styles.stepBarsRow}>
        <View style={styles.stepBarActive} />
        <View style={styles.stepBarActive} />
        <View style={styles.stepBarActive} />
        <View style={styles.stepBarInactive} />
      </View>

      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.stepTag}>STEP 03 / 04 · BLUEPRINT</Text>
        <Text style={styles.title}>
          What does your{'\n'}
          <Text style={styles.titleItalic}>shared future</Text> look like?
        </Text>
        <Text style={styles.subtitle}>
          No caste, no income slabs. Four questions about the life you actually want to build.
        </Text>
      </View>

      {/* 4 Pillar Sliders */}
      <View style={styles.slidersList}>
        <BlueprintSlider
          title="Money philosophy"
          subtitle="Save aggressively → Live for now"
          value={money}
          flexibility={moneyFlexibility}
          onChangeValue={setMoney}
          onChangeFlexibility={setMoneyFlexibility}
        />

        <BlueprintSlider
          title="Roots & geography"
          subtitle="Stay near family → Move anywhere"
          value={roots}
          flexibility={rootsFlexibility}
          onChangeValue={setRoots}
          onChangeFlexibility={setRootsFlexibility}
        />

        <BlueprintSlider
          title="Kids & parenting"
          subtitle="Not planning → Soon, hands-on"
          value={kids}
          flexibility={kidsFlexibility}
          onChangeValue={setKids}
          onChangeFlexibility={setKidsFlexibility}
        />

        <BlueprintSlider
          title="Career ambition"
          subtitle="Protect balance → All-in on work"
          value={ambition}
          flexibility={ambitionFlexibility}
          onChangeValue={setAmbition}
          onChangeFlexibility={setAmbitionFlexibility}
        />
      </View>

      {/* Footer */}
      <View style={styles.footerGroup}>
        <Text style={styles.bandExplainer}>
          Dashed bands = how much difference you’ll accept. Wider band, wider match pool.
        </Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSave}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>Save blueprint</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stepBarsRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBarActive: {
    height: 3,
    width: 44,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  stepBarInactive: {
    height: 3,
    width: 44,
    borderRadius: 2,
    backgroundColor: '#E7DACA',
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: '#8A756A',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 34,
    lineHeight: 36,
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  titleItalic: {
    fontStyle: 'italic',
    color: theme.colors.accent,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    maxWidth: 320,
  },
  slidersList: {
    display: 'flex',
    flexDirection: 'column',
  },
  footerGroup: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 8,
  },
  bandExplainer: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#9E8877',
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
