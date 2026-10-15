import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Heart, Check, X } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Screen, TopBar, Eyebrow, Heading, Body, Card, Button, Chip } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;
const STATUS = {
  pending_partner: 'Waiting for your partner',
  pending_review: 'With the Sangam team',
  published: 'Published',
  rejected: 'Not published',
};

export const StoriesScreen = () => {
  const { conversations, stories, loadStories, submitStory, respondStory, withdrawStory, setCurrentScreen } = useApp();
  const accepted = conversations.filter((t) => t.status === 'accepted' && !t.isFormerMember);
  const [conversationId, setConversationId] = useState(null);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await submitStory({ conversationId, title: title.trim(), story: story.trim() });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setTitle('');
    setStory('');
    setConversationId(null);
  };

  return (
    <Screen tabBar>
      <TopBar onBack={() => setCurrentScreen('blueprint-summary')} title={t('Success stories')} />
      <View style={{ gap: 6, marginBottom: 14 }}>
        <Eyebrow>Success stories</Eyebrow>
        <Heading size={30}>{t('Found each other on Sangam?')}</Heading>
        <Body size={14}>Your partner confirms first, then our team publishes it — first names only.</Body>
      </View>

      {stories.map((s) => (
        <Card key={s.id} style={{ gap: 8, marginBottom: 12 }}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.meta}>{s.names} · {STATUS[s.status]}</Text>
          <Body size={14}>{s.story}</Body>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {s.needsMyConfirmation && (
              <>
                <Button small icon={Check} label="Confirm" onPress={() => respondStory(s.id, true)} />
                <Button small variant="secondary" icon={X} label="Decline" onPress={() => respondStory(s.id, false)} />
              </>
            )}
            <TouchableOpacity onPress={() => withdrawStory(s.id)}><Text style={styles.link}>Withdraw</Text></TouchableOpacity>
          </View>
        </Card>
      ))}

      {accepted.length === 0 ? (
        <Card variant="tinted" style={{ alignItems: 'center', gap: 8 }}>
          <Heart size={24} color={colors.accent} />
          <Body style={{ textAlign: 'center' }}>Stories can be shared once you’ve both accepted interest.</Body>
        </Card>
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={styles.label}>Who did you meet?</Text>
          <View style={styles.chips}>
            {accepted.map((t) => <Chip key={t.id} label={t.candidateName} active={conversationId === t.id} onPress={() => setConversationId(t.id)} />)}
          </View>
          <TextInput value={title} onChangeText={setTitle} placeholder="A title for your story" placeholderTextColor={colors.textLight} maxLength={100} style={styles.input} accessibilityLabel="Title" />
          <TextInput value={story} onChangeText={setStory} placeholder="How did you meet? What made you click?" placeholderTextColor={colors.textLight}
            maxLength={1500} multiline numberOfLines={6} style={[styles.input, { minHeight: 130, textAlignVertical: 'top', paddingTop: 12 }]} accessibilityLabel="Story" />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button icon={Heart} label={busy ? 'Sending…' : 'Send to your partner to confirm'} disabled={!conversationId || !title.trim() || !story.trim() || busy} onPress={send} />
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  meta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted },
  link: { fontFamily: fonts.sans, fontSize: 13.5, fontWeight: '700', color: colors.accent, paddingVertical: 8 },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, outlineStyle: 'none' },
  error: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.accent },
});
