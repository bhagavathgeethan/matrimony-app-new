import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'list' | 'chats' | 'family' | 'me'
  const [selectedCandidateForChat, setSelectedCandidateForChat] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCandidate, setShareCandidate] = useState(null);
  const [batchShareCandidates, setBatchShareCandidates] = useState([]);

  // User Profile State
  const [user, setUser] = useState({
    id: 'user-ananya-01',
    phone: '+91 98765 43210',
    firstName: 'Ananya',
    birthYearMonth: 'Mar 1997',
    age: 29,
    city: 'Bengaluru',
    intentTimeline: 'Marriage in 1–2 years',
    familyInvolvement: 'I consult my parents',
    verified: true,
    photoBlurredUntilMutual: true,
    hideFromSearchEngines: true,
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    ],
    vibes: ['Temple mornings', 'Cooking together', 'Quiet weekends', 'Dogs everywhere'],
    quote: 'Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.',
    tags: ['Both: no big wedding', 'Both: dog people'],
    blueprint: {
      money: 72,
      moneyFlexibility: 'open',
      roots: 31,
      rootsFlexibility: 'firm',
      kids: 58,
      kidsFlexibility: 'open',
      ambition: 84,
      ambitionFlexibility: 'firm',
      summaryText:
        'In short: a saver who’d move cities for the right role, wants kids within a few years, and won’t apologise for ambition.',
      profileStrength: 86,
    },
    consent: {
      matching: true,
      familySharing: true,
      productResearch: false,
      marketing: false,
    },
  });

  // Candidates Feed
  const [candidates, setCandidates] = useState([]);
  const [sentRecords, setSentRecords] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [familyLinks, setFamilyLinks] = useState([]);

  // Fetch PostgreSQL data on initial load
  useEffect(() => {
    async function loadPostgresData() {
      try {
        const [meData, feedData, sentData, convsData, linksData] = await Promise.allSettled([
          api.getMe(),
          api.getMatchesFeed(),
          api.getSentFamilyRecords(),
          api.getThreads(),
          api.getFamilyLinks(),
        ]);

        if (meData.status === 'fulfilled' && meData.value && meData.value.id) {
          setUser(meData.value);
        }
        if (feedData.status === 'fulfilled' && Array.isArray(feedData.value) && feedData.value.length > 0) {
          setCandidates(feedData.value);
        }
        if (sentData.status === 'fulfilled' && Array.isArray(sentData.value)) {
          setSentRecords(sentData.value);
        }
        if (convsData.status === 'fulfilled' && Array.isArray(convsData.value)) {
          setConversations(convsData.value);
        }
        if (linksData.status === 'fulfilled' && Array.isArray(linksData.value)) {
          setFamilyLinks(linksData.value);
        }
      } catch (err) {
        console.log('Using local fallback state:', err);
      }
    }

    loadPostgresData();
  }, []);

  // Actions with live PostgreSQL persistence
  const updateBlueprint = async (newBlueprint) => {
    setUser((prev) => ({
      ...prev,
      blueprint: {
        ...prev.blueprint,
        ...newBlueprint,
      },
    }));

    try {
      await api.updateBlueprintWeights(newBlueprint);
      const updatedFeed = await api.getMatchesFeed();
      if (Array.isArray(updatedFeed)) setCandidates(updatedFeed);
    } catch (err) {
      console.error('Failed to sync blueprint to PostgreSQL:', err);
    }
  };

  const updateConsent = async (newConsent) => {
    setUser((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        ...newConsent,
      },
    }));

    try {
      await api.updateConsent(newConsent);
    } catch (err) {
      console.error('Failed to sync consent to PostgreSQL:', err);
    }
  };

  const toggleVibe = async (vibe) => {
    let updated;
    setUser((prev) => {
      const exists = prev.vibes.includes(vibe);
      if (exists) {
        updated = prev.vibes.filter((v) => v !== vibe);
      } else {
        if (prev.vibes.length >= 6) return prev;
        updated = [...prev.vibes, vibe];
      }
      return { ...prev, vibes: updated };
    });

    if (updated) {
      try {
        await api.updateVibes(updated);
      } catch (err) {
        console.error('Failed to sync vibes to PostgreSQL:', err);
      }
    }
  };

  const shareWithFamily = async ({ candidateId, recipientParentId, expiresIn, customNote, permissions }) => {
    const candidate = candidates.find((c) => c.id === candidateId) || candidates[0];
    const parent = familyLinks.find((f) => f.id === recipientParentId) || familyLinks[0];

    const localRecord = {
      id: `share-${Date.now()}`,
      candidateId: candidate?.id,
      candidateName: candidate?.firstName || 'Candidate',
      candidateAge: candidate?.age || 30,
      candidateCity: candidate?.city || 'Bengaluru',
      overlapScore: candidate?.overlapScores?.overall || 85,
      recipientParentId: parent?.id || 'parent-amma',
      recipientParentName: parent?.name || 'Amma',
      sentAt: 'Just now',
      status: 'awaiting',
      statusBadge: 'AWAITING REVIEW',
      feedbackNote: 'Awaiting review · reminder in 2 days',
      permissions: permissions || {
        showBlueprintScore: true,
        showFirstNameCity: true,
        showPhoto: false,
        showContact: false,
      },
      expiresIn: expiresIn || '30d',
      childNote: customNote || 'Please check this candidate and let me know your thoughts.',
    };

    setSentRecords((prev) => [localRecord, ...prev]);
    setShowShareModal(false);
    setShareCandidate(null);

    try {
      await api.shareWithFamily({
        candidateId: candidate?.id,
        recipientParentId: parent?.id,
        expiresIn,
        customNote,
        permissions,
      });
    } catch (err) {
      console.error('Failed to persist family share in PostgreSQL:', err);
    }
  };

  const sendBatchShare = async ({ candidateIds, recipientParentId, expiresIn, customNote }) => {
    const parent = familyLinks.find((f) => f.id === recipientParentId) || familyLinks[0];
    const newItems = candidateIds.map((id) => {
      const candidate = candidates.find((c) => c.id === id);
      return {
        id: `share-${Date.now()}-${id}`,
        candidateId: candidate ? candidate.id : id,
        candidateName: candidate ? candidate.firstName : 'Candidate',
        candidateAge: candidate ? candidate.age : 30,
        candidateCity: candidate ? candidate.city : 'Bengaluru',
        overlapScore: candidate ? candidate.overlapScores.overall : 85,
        recipientParentId: parent?.id || 'parent-amma',
        recipientParentName: parent?.name || 'Amma',
        sentAt: 'Just now',
        status: 'awaiting',
        statusBadge: 'AWAITING REVIEW',
        feedbackNote: 'Awaiting review · reminder in 2 days',
        permissions: {
          showBlueprintScore: true,
          showFirstNameCity: true,
          showPhoto: false,
          showContact: false,
        },
        expiresIn: expiresIn || '30d',
        childNote: customNote || 'Both of these feel right on money and kids. Tell me what you think before I reply.',
      };
    });

    setSentRecords((prev) => [...newItems, ...prev]);
    setShowShareModal(false);
    setBatchShareCandidates([]);

    try {
      for (const cid of candidateIds) {
        await api.shareWithFamily({
          candidateId: cid,
          recipientParentId: parent?.id,
          expiresIn,
          customNote,
        });
      }
    } catch (err) {
      console.error('Failed to persist batch share in PostgreSQL:', err);
    }
  };

  const recordParentFeedback = async (shareId, decision, note) => {
    setSentRecords((prev) =>
      prev.map((r) => {
        if (r.id === shareId) {
          return {
            ...r,
            status: decision,
            statusBadge: decision === 'approved' ? 'AMMA APPROVED' : 'CONCERN RAISED',
            feedbackNote: note || (decision === 'approved' ? '“Sensible about money. Ask about his posting in Pune.”' : '“Concern raised.”'),
          };
        }
        return r;
      })
    );

    try {
      await api.submitParentFeedback(shareId, decision, note);
    } catch (err) {
      console.error('Failed to persist parent feedback in PostgreSQL:', err);
    }
  };

  const sendMessageInThread = async (threadId, text) => {
    if (!text || !text.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessage: text.trim(),
            lastMessageTime: 'Just now',
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    try {
      await api.sendMessage(threadId, text.trim());
    } catch (err) {
      console.error('Failed to persist chat message in PostgreSQL:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        activeTab,
        setActiveTab,
        user,
        setUser,
        updateBlueprint,
        updateConsent,
        toggleVibe,
        candidates,
        sentRecords,
        conversations,
        familyLinks,
        setFamilyLinks,
        selectedCandidateForChat,
        setSelectedCandidateForChat,
        showShareModal,
        setShowShareModal,
        shareCandidate,
        setShareCandidate,
        batchShareCandidates,
        setBatchShareCandidates,
        shareWithFamily,
        sendBatchShare,
        recordParentFeedback,
        sendMessageInThread,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
