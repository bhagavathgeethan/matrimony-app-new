import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ArrowUp, ShieldCheck, Lightbulb, MessageCircle, Phone, Video, Heart, Send } from 'lucide-react';
import { SafetyRow } from '../../components/engage/EngageUI';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { TopBar, Avatar, Body, Button, Card } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts, gradients, radii } = theme;

export const ChatThreadScreen = () => {
  const {
    conversations, candidates, threadMessages, activeThreadId, setCurrentScreen, sendMessageInThread, acceptInterest, declineInterest, calls,
  } = useApp();
  const [inputMessage, setInputMessage] = useState('');
  const [busy, setBusy] = useState(null);
  const [callError, setCallError] = useState(null);

  // Never fall back to another person's thread: messages must go to the right match
  const activeThread = conversations.find((t) => t.id === activeThreadId);
  const candidate = candidates.find((c) => c.id === activeThread?.candidateId);
  const messages = threadMessages[activeThreadId] || [];

  if (!activeThread) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Card variant="tinted" style={{ alignItems: 'center', gap: 14, paddingVertical: 32 }}>
          <MessageCircle size={28} color={colors.gold} />
          <Body style={{ textAlign: 'center' }}>Pick a conversation from Chats, or start one from your feed.</Body>
          <Button label="Go to Chats" variant="secondary" small onPress={() => setCurrentScreen('conversations')} />
        </Card>
      </View>
    );
  }

  const candidateName = activeThread.candidateName || candidate?.firstName || 'Match';
  const candidateAge = activeThread.candidateAge ?? candidate?.age;
  const overlapScore = candidate?.overlapScores?.overall ?? activeThread.overlapScore;
  const candidateCity = activeThread.candidateCity || candidate?.city || '';

  const lastMine = [...messages].reverse().find((m) => m.sender === 'me');
  const canChat = !activeThread.isFormerMember && activeThread.canMessage;
  const respond = async (accept) => {
    setBusy(accept ? 'accept' : 'decline');
    if (accept) await acceptInterest(activeThread.id);
    else {
      await declineInterest(activeThread.id);
      setCurrentScreen('conversations');
    }
    setBusy(null);
  };
  const startCall = async (kind) => {
    setCallError(null);
    const res = await calls.start({ conversationId: activeThread.id, peer: { id: activeThread.candidateId, name: candidateName }, kind });
    if (!res.ok) setCallError(res.error);
  };

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessageInThread(activeThread.id, inputMessage);
    setInputMessage('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TopBar
          onBack={() => setCurrentScreen('conversations')}
          title={
            <View style={styles.headerCenter}>
              <Avatar uri={activeThread.candidatePhoto} name={candidateName} size={40} />
              <View style={{ gap: 1 }}>
                <Text style={styles.headerName}>
                  {candidateName}{candidateAge ? `, ${candidateAge}` : ''}
                </Text>
                <Text style={styles.headerMeta}>
                  {overlapScore != null ? `${overlapScore}% aligned` : 'Sangam'}{candidateCity ? ` · ${candidateCity}` : ''}
                </Text>
              </View>
            </View>
          }
          right={activeThread.status === 'accepted' && !activeThread.isFormerMember ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => startCall('audio')} style={styles.callIcon} accessibilityLabel={`Voice call ${candidateName}`}>
                <Phone size={17} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => startCall('video')} style={[styles.callIcon, { backgroundColor: colors.accentSoft }]} accessibilityLabel={`Video call ${candidateName}`}>
                <Video size={17} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ) : null}
        />
        {callError && <Text style={styles.callError}>{callError}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        <View style={styles.matchedPill}>
          <Text style={styles.matchedText}>{activeThread.matchedDaysAgo || 'MATCHED'}</Text>
        </View>

        {activeThread.needsMyResponse && (
          <View style={styles.request}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Heart size={18} color={colors.accent} />
              <Text style={styles.requestTitle}>{t('{name} is interested in you', { name: candidateName })}</Text>
            </View>
            <Text style={styles.requestText}>Accept to chat, see each other’s photos and video call. Declining is private.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button variant="secondary" small label={busy === 'decline' ? '…' : t('Decline')} disabled={!!busy} onPress={() => respond(false)} style={{ flex: 1 }} />
              <Button small icon={Heart} label={busy === 'accept' ? 'Accepting…' : t('Accept')} disabled={!!busy} onPress={() => respond(true)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {activeThread.status === 'accepted' && messages.length < 4 && activeThread.conversationPrompts?.length > 0 && (
          <View style={styles.opener}>
            <View style={styles.openerHead}>
              <Lightbulb size={14} color="#8A6A2E" />
              <Text style={styles.openerTag}>Conversation starters</Text>
            </View>
            {activeThread.conversationPrompts.map((p) => (
              <TouchableOpacity key={p} onPress={() => setInputMessage(p)} accessibilityRole="button">
                <Text style={styles.openerText}>• {p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {activeThread.status === 'requested' && activeThread.requestedByMe && candidate?.suggestedOpener && messages.length === 0 && (
          <View style={styles.opener}>
            <View style={styles.openerHead}>
              <Lightbulb size={14} color="#8A6A2E" />
              <Text style={styles.openerTag}>Suggested opener</Text>
            </View>
            <Text style={styles.openerText}>{candidate.suggestedOpener}</Text>
          </View>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <View key={msg.id} style={[styles.bubbleRow, isMe && { justifyContent: 'flex-end' }]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && { color: colors.white }]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                  {msg.failed ? `Not sent — ${msg.error || 'try again'}` : msg.pending ? 'Sending…' : msg.timestamp}
                  {msg.id === lastMine?.id && msg.seen !== undefined ? (msg.seen ? ' · Seen' : ' · Delivered') : ''}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.shield}>
          <ShieldCheck size={13} color={colors.success} />
          <Text style={styles.shieldText}>Chats are never visible on a parent dashboard.</Text>
        </View>
        {activeThread.candidateId && (
          <SafetyRow member={{ id: activeThread.candidateId, firstName: candidateName }} onDone={() => setCurrentScreen('conversations')} />
        )}
      </ScrollView>

      {activeThread.isFormerMember ? (
        <View style={styles.composer}>
          <Text style={styles.emptyHint}>This member has left Sangam. Your conversation is kept for you.</Text>
        </View>
      ) : !canChat ? (
        <View style={styles.composer}>
          <Send size={15} color={colors.gold} />
          <Text style={[styles.emptyHint, { flex: 1, textAlign: 'left' }]}>
            {activeThread.status === 'declined'
              ? `${candidateName} isn’t available right now.`
              : `Interest sent — you can write more once ${candidateName} accepts.`}
          </Text>
        </View>
      ) : (
      <View style={styles.composer}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder={activeThread.needsMyResponse ? 'Reply to accept…' : 'Write a message…'}
          placeholderTextColor={colors.textLight}
          style={styles.input}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSend}
          disabled={!inputMessage.trim()}
          style={[styles.send, !inputMessage.trim() && { opacity: 0.5 }]}
          accessibilityLabel="Send"
        >
          <ArrowUp size={20} color={colors.white} strokeWidth={2.6} />
        </TouchableOpacity>
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  callIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight },
  callError: { fontFamily: fonts.sans, fontSize: 12.5, fontWeight: '600', color: colors.accent, textAlign: 'center', paddingBottom: 6 },
  request: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.accentSoft },
  requestTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  requestText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary },
  container: {
    flex: 1,
    height: import.meta.env.DEV ? 'calc(100vh - 30px)' : '100vh',
    backgroundColor: colors.bg,
  },
  empty: {
    justifyContent: 'center',
    padding: 22,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(251, 247, 241, 0.9)',
    backdropFilter: 'blur(14px)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerName: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerMeta: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  messages: {
    padding: 18,
    gap: 10,
  },
  matchedPill: {
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.cardSecondary,
  },
  matchedText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  opener: {
    padding: 16,
    gap: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: '#EAD9B4',
    marginVertical: 6,
  },
  openerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openerTag: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.6,
    color: '#8A6A2E',
    textTransform: 'uppercase',
  },
  openerText: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 14.4,
    lineHeight: 19.2,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  bubbleMe: {
    backgroundImage: gradients.primary,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    boxShadow: '0 6px 16px rgba(168, 30, 60, 0.22)',
  },
  bubbleThem: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bubbleText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  bubbleTime: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 9.5,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
  emptyHint: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: 8,
  },
  shield: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  shieldText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundImage: gradients.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(168, 30, 60, 0.35)',
  },
});
