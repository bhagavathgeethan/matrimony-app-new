// Web binding for the shared Sangam store (../../shared/store.js): React context + URL routing
import React, { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createApiClient } from '@shared/api';
import { createSangamStore } from '@shared/store';
import { createCallManager } from '@shared/calls';
import { getLanguage, subscribeLanguage } from '@shared/i18n';

// Same origin by default: the backend serves this app and its API together
export const client = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE || '/api' });
export const { api } = client;

const store = createSangamStore({ client });

// Video/voice calls: one manager for the tab, fed by the store's live connection
let callState = { status: 'idle' };
const callListeners = new Set();
export const calls = createCallManager({
  send: (message) => store.actions.sendRealtime(message),
  getConfig: () => api.getCallConfig(),
  onChange: (s) => {
    callState = s;
    callListeners.forEach((l) => l());
  },
});
store.actions.setCallHandler((event) => calls.handleEvent(event));
export const useLanguage = () => useSyncExternalStore(subscribeLanguage, getLanguage);

export function useCall() {
  return useSyncExternalStore((l) => {
    callListeners.add(l);
    return () => callListeners.delete(l);
  }, () => callState);
}

// Store navigation intents -> URLs
const PATHS = {
  welcome: '/',
  consent: '/onboarding/consent',
  basics: '/onboarding/basics',
  personal: '/onboarding/personal',
  'personal-details': '/profile/details',
  daily: '/today',
  conversations: '/messages',
  verification: '/profile/verification',
  premium: '/premium',
  stories: '/stories',
  'blueprint-intro': '/onboarding/blueprint',
  'blueprint-q1': '/onboarding/blueprint/question',
  'blueprint-tuner': '/onboarding/blueprint/tune',
  vibes: '/onboarding/vibes',
  photos: '/onboarding/photos',
  'blueprint-summary': '/onboarding/review',
  feed: '/matches',
  family: '/family',
  settings: '/settings',
  notifications: '/notifications',
};

export const APP_AREA = /^\/(matches|today|browse|shortlist|messages|family|profile|settings|notifications|premium|stories|safety|admin)(\/|$)/;

export function pathFor(target, params = {}) {
  if (target === 'chat-thread') return `/messages/${params.conversationId}`;
  if (target === 'match') return `/matches?focus=${params.candidateId}`;
  if (target === 'personal-details' && params.section) return `/profile/details?edit=${params.section}`;
  return PATHS[target] || '/';
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useSyncExternalStore(store.subscribe, store.getState);

  useEffect(() => {
    store.setOnRoute((target, params) => {
      const here = window.location.pathname;
      // Admin accounts without a member profile go to the console instead of onboarding
      const u = store.getState().user;
      if (u?.role === 'admin' && !u.onboarding?.completed && params?.reason) {
        if (!here.startsWith('/admin')) navigate('/admin');
        return;
      }
      // "Go to the app" keeps whatever app page the user is already on. After a reload (restore) only the
      // public pages redirect, so deep links, edit pages and unknown URLs (404) stay where they are.
      if (target === 'feed' && (APP_AREA.test(here) || (params?.reason === 'restore' && here !== '/' && here !== '/signin'))) return;
      // Public parent-portal pages never get redirected by the signed-in session
      if (here.startsWith('/portal/')) return;
      navigate(pathFor(target, params));
    });
    // Browser notification when a live notification arrives while this tab is in the background
    store.setOnSystemNotification((n) => {
      if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
      const shown = new Notification(n.title, { body: n.body, tag: n.id, icon: '/favicon.svg' });
      shown.onclick = () => {
        window.focus();
        store.actions.openNotification(n);
        shown.close();
      };
    });
    store.actions.restoreSession();
  }, [navigate]);

  // Leaving a conversation clears the "open thread" so new messages count as unread again.
  // Only on the transition away — a thread is marked open just before the route changes to it.
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    const leftThread = prevPath.current.startsWith('/messages/') && prevPath.current !== location.pathname;
    if (leftThread) store.actions.closeThread();
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const value = useMemo(() => ({ ...state, ...store.actions }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
