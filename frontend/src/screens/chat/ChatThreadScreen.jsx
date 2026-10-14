import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ChevronLeft, ArrowUp, ShieldCheck } from 'lucide-react';

export const ChatThreadScreen = () => {
  const {
    conversations,
    selectedCandidateForChat,
    setCurrentScreen,
    sendMessageInThread,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');

  const activeThread =
    conversations.find((t) => t.candidateId === selectedCandidateForChat?.id) ||
    conversations[0];

  const candidateName = selectedCandidateForChat?.firstName || activeThread.candidateName;
  const candidateAge = selectedCandidateForChat?.age || activeThread.candidateAge;
  const overlapScore =
    selectedCandidateForChat?.overlapScores?.overall || activeThread.overlapScore;

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    sendMessageInThread(activeThread.id, inputMessage);
    setInputMessage('');
  };

  return (
    <View style={styles.container}>
      {/* Chat Thread Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setCurrentScreen('conversations')}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.avatarMini}>
          <Text style={styles.avatarInitial}>{candidateName[0]}</Text>
        </View>

        <View style={styles.headerDetails}>
          <Text style={styles.headerName}>
            {candidateName}, {candidateAge}
          </Text>
          <Text style={styles.headerScoreTag}>
            {overlapScore}% ALIGNED · BENGALURU
          </Text>
        </View>

        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView contentContainerStyle={styles.messagesScroll} showsVerticalScrollIndicator={false}>
        {/* Matched Pill */}
        <View style={styles.matchedPill}>
          <Text style={styles.matchedPillText}>
            {activeThread.matchedDaysAgo || 'MATCHED 4 DAYS AGO'}
          </Text>
        </View>

        {/* Blueprint Suggested Opener */}
        <View style={styles.openerCard}>
          <Text style={styles.openerTag}>SUGGESTED OPENER</Text>
          <Text style={styles.openerText}>
            You both scored low on “stay near parents” — ask him where he actually pictures being at 40.
          </Text>
        </View>

        {/* Message Bubbles */}
        {activeThread.messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <View
              key={msg.id}
              style={[
                styles.bubble,
                isMe ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {msg.text}
              </Text>
            </View>
          );
        })}

        {/* Parent Privacy Shield Notice */}
        <View style={styles.parentShieldCard}>
          <ShieldCheck size={14} color={theme.colors.accent} />
          <Text style={styles.parentShieldText}>
            Chats are never visible on a parent dashboard.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Message Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Write a message…"
          style={styles.textInput}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSend}
          style={styles.sendBtn}
        >
          <ArrowUp size={20} color={theme.colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4D4',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#E7DACA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  headerDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  headerName: {
    fontFamily: theme.fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerScoreTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  moreBtn: {
    padding: 6,
  },
  moreBtnText: {
    fontFamily: theme.fonts.sans,
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  messagesScroll: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  matchedPill: {
    alignSelf: 'center',
    backgroundColor: theme.colors.cardSecondary,
    borderWidth: 1,
    borderColor: '#F0E7DA',
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  matchedPillText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  openerCard: {
    alignSelf: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'center',
    maxWidth: '92%',
  },
  openerTag: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: theme.colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  openerText: {
    fontFamily: theme.fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#4B3833',
    textAlign: 'center',
  },
  bubble: {
    maxWidth: '76%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderBottomLeftRadius: 5,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.accent,
    borderBottomRightRadius: 5,
  },
  bubbleText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextThem: {
    color: theme.colors.textPrimary,
  },
  bubbleTextMe: {
    color: theme.colors.white,
  },
  parentShieldCard: {
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F2E9',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E7DACA',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  parentShieldText: {
    fontFamily: theme.fonts.sans,
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.bg,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontFamily: theme.fonts.sans,
    fontSize: 13.5,
    color: theme.colors.textPrimary,
    outline: 'none',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 99,
    backgroundColor: theme.colors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
