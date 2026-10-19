import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronRight, Sparkles, Heart, Clock, Bell, X } from 'lucide-react';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { CandidateSheet } from '../../components/engage/EngageUI';
import { MatchCard } from '../../components/feed/MatchCard';
import { ScopedShareSheet } from '../../components/family/ScopedShareSheet';
import { Screen, FadeIn, Eyebrow, Heading, Body, Chip, Card, Button } from '../../components/ui/kit';
import { t } from '@shared/i18n';

const { colors, fonts } = theme;

const FILTERS = [
  ['Blueprint', Sparkles],
  ['Vibes', Heart],
  ['New', Clock],
];

export const AlignedFeedScreen = () => {
  const {
    user,
    candidates,
    conversations,
    dataLoading,
    loadError,
    loadAppData,
    passCandidate,
    focusedCandidateId,
    setFocusedCandidateId,
    refreshFeed,
    openChatWith,
    openThreadById,
    showShareModal,
    setShowShareModal,
    shareCandidate,
    setShareCandidate,
    shareWithFamily,
    unreadNotifications,
    setCurrentScreen,
    setPersonalSection,
    setActiveTab,
    rewind,
  } = useApp();
  const [viewing, setViewing] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const percent = user?.profileStrength ?? 0;

  const [filterTab, setFilterTab] = useState('Blueprint');
  const [candidateIndex, setCandidateIndex] = useState(0);

  // Blueprint: best overall fit first (server order). Vibes: most shared vibes first.
  // New: people you haven't started a conversation with yet.
  const feed = useMemo(() => {
    if (filterTab === 'Vibes') {
      const mine = new Set(user?.vibes || []);
      const shared = (c) => (c.vibes || []).filter((v) => mine.has(v)).length;
      return [...candidates].sort((a, b) => shared(b) - shared(a));
    }
    if (filterTab === 'New') {
      const talkedTo = new Set(conversations.map((conv) => conv.candidateId));
      return candidates.filter((c) => !talkedTo.has(c.id));
    }
    return candidates;
  }, [filterTab, candidates, conversations, user?.vibes]);

  // Opening a profile from the list jumps the feed to that person
  // (search can surface someone who joined after the feed loaded: refresh once, then look again)
  const refreshedFor = useRef(null);
  useEffect(() => {
    if (!focusedCandidateId) return;
    const idx = feed.findIndex((c) => c.id === focusedCandidateId);
    if (idx >= 0) {
      setCandidateIndex(idx);
    } else if (filterTab !== 'Blueprint') {
      setFilterTab('Blueprint');
      return;
    } else if (refreshedFor.current !== focusedCandidateId) {
      refreshedFor.current = focusedCandidateId;
      refreshFeed();
      return;
    }
    setFocusedCandidateId(null);
  }, [focusedCandidateId, feed, filterTab, setFocusedCandidateId, refreshFeed]);

  const safeIndex = feed.length ? candidateIndex % feed.length : 0;
  const currentCandidate = feed[safeIndex];
  const nextCandidate = feed.length > 1 ? feed[(safeIndex + 1) % feed.length] : null;

  // Peeking just moves on; Pass is remembered so they don't come back
  const showNext = () => {
    setCandidateIndex((prev) => (prev + 1) % Math.max(feed.length, 1));
  };
  const handlePass = async () => {
    if (!currentCandidate) return;
    await passCandidate(currentCandidate.id);
    setCanUndo(true);
    setCandidateIndex((prev) => (feed.length > 1 ? prev % (feed.length - 1) : 0));
  };

  // Interest is sent from the card; this opens the existing thread
  const handleStartChat = (conversationId) => {
    if (conversationId) openThreadById(conversationId);
  };

  const handleShareWithParents = () => {
    setShareCandidate(currentCandidate);
    setShowShareModal(true);
  };

  const header = (
    <FadeIn>
      <View style={{ gap: 14 }}>
        <View style={styles.titleRow}>
          <View style={{ gap: 4 }}>
            <Eyebrow>{user?.firstName ? t('Hi {name} · today’s matches', { name: user.firstName }) : t('Hi there · today’s matches')}</Eyebrow>
            <Heading size={40}>{t('Aligned')}</Heading>
          </View>
          <View style={styles.headerRight}>
            {feed.length > 0 && (
              <View style={styles.counter}>
                <Text style={styles.counterNum}>{safeIndex + 1}</Text>
                <Text style={styles.counterOf}>/ {feed.length}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setCurrentScreen('notifications')}
              style={styles.bell}
              accessibilityLabel={unreadNotifications ? t('Notifications, {n} unread', { n: unreadNotifications }) : t('Notifications')}
            >
              <Bell size={19} color={colors.textPrimary} />
              {unreadNotifications > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {percent < 100 && !hidePrompt && (
          <View style={styles.completion}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.completionTitle}>{t('Your profile is {n}% complete', { n: percent })}</Text>
              <Text style={styles.completionSub}>{t('Add family, education and hobbies')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setPersonalSection(user?.profileCompletion?.nextSection || null);
                setActiveTab('me');
                setCurrentScreen('personal-details');
              }}
              style={styles.completionBtn}
              accessibilityRole="button"
            >
              <Text style={styles.completionBtnText}>{t('Complete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHidePrompt(true)} accessibilityLabel={t('Hide for now')} style={{ padding: 4 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        {canUndo && user?.planFeatures?.includes('rewind') && (
          <TouchableOpacity
            onPress={async () => {
              const res = await rewind();
              if (res.ok) {
                setCanUndo(false);
                setFocusedCandidateId(res.data.candidate.id);
              }
            }}
            style={styles.undo}
            accessibilityRole="button"
          >
            <Text style={styles.undoText}>{t('↶ Undo pass')}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.filters}>
          {FILTERS.map(([tab, icon]) => (
            <Chip
              key={tab}
              label={t(tab)}
              icon={icon}
              active={filterTab === tab}
              onPress={() => {
                setFilterTab(tab);
                setCandidateIndex(0);
              }}
            />
          ))}
        </View>
      </View>
    </FadeIn>
  );

  if (!currentCandidate) {
    return (
      <Screen tabBar>
        {header}
        <Card variant="tinted" style={styles.empty}>
          <Sparkles size={28} color={colors.gold} />
          <Body style={{ textAlign: 'center' }}>
            {dataLoading
              ? t('Loading your aligned matches…')
              : loadError ||
                (filterTab === 'New'
                  ? t('You’ve started a conversation with everyone here.')
                  : t('No matches yet. As more people complete their blueprint, they’ll appear here.'))}
          </Body>
          {filterTab !== 'Blueprint' && !dataLoading && (
            <Button label={t('Show all matches')} variant="secondary" small onPress={() => setFilterTab('Blueprint')} />
          )}
          {filterTab === 'Blueprint' && !dataLoading && (
            <Button label={t('Refresh')} variant="secondary" small onPress={loadAppData} />
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        {header}

        <FadeIn key={currentCandidate.id} delay={60}>
          <MatchCard
            candidate={currentCandidate}
            onPass={handlePass}
            onStartChat={handleStartChat}
            onShareWithParents={handleShareWithParents}
            onViewProfile={() => setViewing({ candidate: currentCandidate, tab: 'why' })}
            onOpenProfile={() => setViewing({ candidate: currentCandidate, tab: 'about' })}
          />
        </FadeIn>

        {nextCandidate && (
          <TouchableOpacity activeOpacity={0.88} onPress={showNext} style={styles.peek}>
            <View style={styles.peekPhoto}>
              {nextCandidate.photos?.[0] && (
                <Image source={{ uri: nextCandidate.photos[0] }} style={styles.peekImg} />
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.peekName}>
                {nextCandidate.firstName}, {nextCandidate.age}
              </Text>
              <Text style={styles.peekCity}>{t('{city} · next in your feed', { city: nextCandidate.city })}</Text>
            </View>
            <Text style={styles.peekScore}>{nextCandidate.overlapScores?.overall ?? '—'}%</Text>
            <ChevronRight size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </Screen>

      {viewing && <CandidateSheet candidate={viewing.candidate} initialTab={viewing.tab} onClose={() => setViewing(null)} onOpenThread={(id) => openThreadById(id)} />}

      {showShareModal && (
        <ScopedShareSheet
          candidate={shareCandidate || currentCandidate}
          onClose={() => setShowShareModal(false)}
          onSend={shareWithFamily}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  undo: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.goldSoft },
  undoText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '700', color: '#8A6A2E' },
  completion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingLeft: 14,
    borderRadius: 18,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: '#EAD9B4',
  },
  completionTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  completionSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  completionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  completionBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    paddingBottom: 6,
  },
  counterNum: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 20.8,
    color: colors.accent,
    letterSpacing: -0.4,
  },
  counterOf: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: colors.textMuted,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  empty: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 36,
  },
  peek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  peekPhoto: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
  },
  peekImg: {
    width: '100%',
    height: '100%',
    filter: 'blur(5px)',
    transform: [{ scale: 1.2 }],
  },
  peekName: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  peekCity: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  peekScore: {
    fontFamily: fonts.sans,
    fontWeight: '800',
    fontSize: 19.2,
    color: colors.accent,
    letterSpacing: -0.4,
  },
});
