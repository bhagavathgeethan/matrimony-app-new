import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const BasicsIntentScreen = () => {
  const { setCurrentScreen, user, setUser } = useApp();

  const [firstName, setFirstName] = useState(user?.firstName || 'Ananya');
  const [born, setBorn] = useState(user?.birthYearMonth || 'Mar 1997');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [timeline, setTimeline] = useState(user?.intentTimeline || 'Marriage in 1–2 years');
  const [familyInvolvement, setFamilyInvolvement] = useState(
    user?.familyInvolvement || 'I consult my parents'
  );

  const handleNext = () => {
    setUser((prev) => ({
      ...prev,
      firstName,
      birthYearMonth: born,
      city,
      intentTimeline: timeline,
      familyInvolvement,
    }));
    setCurrentScreen('blueprint-intro');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerGroup}>
        <Text style={styles.stepTag}>STEP 02 / 04 · BASICS</Text>
        <Text style={styles.title}>The short version{'\n'}of you</Text>
        <Text style={styles.subtitle}>
          Six fields. That’s the entire “biodata” we will ever ask for.
        </Text>
      </View>

      {/* Fields */}
      <View style={styles.formGroup}>
        {/* First Name */}
        <View style={styles.fieldCol}>
          <Text style={styles.fieldLabel}>FIRST NAME</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={styles.textInput}
            placeholder="Enter first name"
          />
        </View>

        {/* Born & Lives In */}
        <View style={styles.row}>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>BORN</Text>
            <TextInput
              value={born}
              onChangeText={setBorn}
              style={styles.textInput}
              placeholder="e.g. Mar 1997"
            />
          </View>
          <View style={[styles.fieldCol, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>LIVES IN</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              style={styles.textInput}
              placeholder="e.g. Bengaluru"
            />
          </View>
        </View>

        {/* Timeline selector */}
        <View style={styles.fieldCol}>
          <Text style={styles.fieldLabel}>I’M LOOKING FOR</Text>
          <View style={styles.pillsWrap}>
            {['Marriage in 1–2 years', 'Marriage this year', 'Open, no timeline'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTimeline(item)}
                style={[
                  styles.pill,
                  timeline === item ? styles.pillActive : styles.pillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    timeline === item ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Family Involvement selector */}
        <View style={styles.fieldCol}>
          <Text style={styles.fieldLabel}>HOW FAMILY IS INVOLVED</Text>
          <View style={styles.pillsWrap}>
            {['I decide alone', 'I consult my parents', 'Parents lead'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setFamilyInvolvement(item)}
                style={[
                  styles.pill,
                  familyInvolvement === item ? styles.pillActive : styles.pillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    familyInvolvement === item ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Footer Notice & Button */}
      <View style={styles.footerGroup}>
        <Text style={styles.antiCasteNotice}>
          No caste, religion-first, complexion or income fields. Ever.
        </Text>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleNext}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>Next — the blueprint</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    minHeight: '100%',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stepTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 30,
    lineHeight: 32,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: '#96806F',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    outline: 'none',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  pillsWrap: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 99,
  },
  pillActive: {
    backgroundColor: theme.colors.accent,
  },
  pillInactive: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  pillText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
  },
  pillTextActive: {
    color: theme.colors.white,
  },
  pillTextInactive: {
    color: '#4B3833',
  },
  footerGroup: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 10,
  },
  antiCasteNotice: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSubtle,
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 17,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
