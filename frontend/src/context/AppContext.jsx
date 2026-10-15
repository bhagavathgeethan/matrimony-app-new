// Mobile app context: screen-based navigation on top of the shared Sangam store (../shared/store.js),
// which owns all data and logic. Screens keep using useApp() exactly as before.
import React, { createContext, useContext, useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { createSangamStore } from '@shared/store';
import { client } from '../services/api';
import { systemNotifications } from '../services/systemNotifications';
import { createCallManager } from '@shared/calls';
import { getLanguage, subscribeLanguage } from '@shared/i18n';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Navigation (mobile-only UI state)
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'list' | 'chats' | 'family' | 'me'
  const [focusedCandidateId, setFocusedCandidateId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCandidate, setShareCandidate] = useState(null);
  const [personalSection, setPersonalSection] = useState(null); // section editor to open on Personal details

  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = createSangamStore({
      client,
      onRoute: (target, params = {}) => {
        // Store targets that are not screen names on mobile
        if (target === 'match') {
          setFocusedCandidateId(params.candidateId);
          setActiveTab('feed');
          setCurrentScreen('feed');
          return;
        }
        if (target === 'family') {
          setActiveTab('family');
          setCurrentScreen('family-tracker');
          return;
        }
        if (target === 'settings') {
          setCurrentScreen('privacy');
          return;
        }
        if (target === 'personal-details') {
          setPersonalSection(params.section || null);
          setActiveTab('me');
          setCurrentScreen('personal-details');
          return;
        }
        if (target === 'conversations') setActiveTab('chats');
        if (['daily', 'premium', 'verification', 'stories'].includes(target)) setActiveTab(target === 'daily' ? 'feed' : 'me');
        setCurrentScreen(target);
        if (target === 'feed' || target === 'welcome') setActiveTab('feed');
      },
      // Android notification when a live notification arrives while the app is in the background
      onSystemNotification: (n) => systemNotifications.show(n),
    });
  }
  const store = storeRef.current;
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const language = useSyncExternalStore(subscribeLanguage, getLanguage);
  const { actions } = store;

  // Video/voice calls, fed by the store's live connection
  const [call, setCall] = useState({ status: 'idle' });
  const callsRef = useRef(null);
  if (!callsRef.current) {
    callsRef.current = createCallManager({
      send: (message) => store.actions.sendRealtime(message),
      getConfig: () => client.api.getCallConfig(),
      onChange: setCall,
    });
    store.actions.setCallHandler((event) => callsRef.current.handleEvent(event));
  }
  const calls = callsRef.current;

  useEffect(() => {
    actions.restoreSession();
  }, [actions]);

  // Once signed in: ask for notification permission and route taps on Android notifications
  useEffect(() => {
    if (state.authStatus !== 'signedIn') return undefined;
    systemNotifications.init({ onTap: (n) => actions.openNotification(n) });
    return undefined;
  }, [state.authStatus, actions]);

  // Leaving the chat screen clears the "open thread" so new messages count as unread again.
  // Only on the transition away — a thread is marked open just before the chat screen is shown.
  const prevScreen = useRef(currentScreen);
  useEffect(() => {
    if (prevScreen.current === 'chat-thread' && currentScreen !== 'chat-thread') actions.closeThread();
    prevScreen.current = currentScreen;
  }, [currentScreen, actions]);

  // Closing the share sheet is a mobile UI concern
  const shareWithFamily = async (share) => {
    const res = await actions.shareWithFamily(share);
    if (res.ok) {
      setShowShareModal(false);
      setShareCandidate(null);
    }
    return res;
  };

  return (
    <AppContext.Provider
      value={{
        // navigation
        currentScreen,
        setCurrentScreen,
        activeTab,
        setActiveTab,
        focusedCandidateId,
        setFocusedCandidateId,
        showShareModal,
        setShowShareModal,
        shareCandidate,
        setShareCandidate,
        personalSection,
        setPersonalSection,
        call,
        calls,
        language,
        // shared state
        ...state,
        isLoading: state.authStatus === 'checking',
        // shared actions
        ...actions,
        shareWithFamily,
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
