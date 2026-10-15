// Sangam app state + actions, shared by the mobile app (frontend/) and the web app (web/).
// Framework-free: apps subscribe with React's useSyncExternalStore and supply onRoute(target, params)
// to translate navigation intents ('welcome', 'consent', 'feed', 'chat-thread', …) into their own routing.
import { DEFAULT_SEARCH_FILTERS, searchParams, describeSearch } from './constants.js';

const EMPTY_SEARCH = {
  filters: DEFAULT_SEARCH_FILTERS,
  results: [],
  total: 0,
  nextOffset: null,
  facets: { cities: [] },
  status: 'idle', // 'idle' | 'loading' | 'loadingMore' | 'ready' | 'error'
  error: null,
};
const MAX_RECENT_SEARCHES = 6;

// Recent searches live on this device only, one list per member
const recentKey = (userId) => `sangam.recentSearches.${userId}`;
function readRecent(userId) {
  try {
    const list = JSON.parse(globalThis.localStorage?.getItem(recentKey(userId)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
function writeRecent(userId, list) {
  try {
    globalThis.localStorage?.setItem(recentKey(userId), JSON.stringify(list));
  } catch {
    // storage full or blocked: recent searches are a convenience only
  }
}

const EMPTY_DATA = {
  user: null,
  candidates: [],
  conversations: [],
  threadMessages: {}, // conversationId -> messages
  sentRecords: [],
  familyLinks: [],
  activeThreadId: null,
  dataLoading: false,
  loadError: null,
  notifications: [], // newest first
  unreadNotifications: 0,
  notificationsCursor: null, // for "load older"
  toasts: [], // live notifications waiting to be shown as in-app banners
  search: EMPTY_SEARCH,
  recentSearches: [], // [{ label, filters }]
  dailyPicks: { day: null, picks: [], status: 'idle' },
  shortlist: [],
  admirers: null, // { premium, views: { count, people }, shortlists: { count, people } }
  savedSearches: [],
  blocks: [],
  premium: null, // { premium, premiumUntil, plans, features, provider }
  interestLimits: null,
  stories: [],
  familyVotes: [],
  verification: null, // { verified, request }
};

// Where tapping a notification takes the user
function targetFor(n) {
  const THREAD_TYPES = ['message', 'mutual', 'interest_request', 'interest_accepted', 'call'];
  if (THREAD_TYPES.includes(n.type) && n.data?.conversationId) {
    return { kind: 'thread', conversationId: n.data.conversationId };
  }
  if ((n.type === 'match' || n.type === 'saved_search') && n.data?.candidateId) {
    return { kind: 'route', target: 'match', params: { candidateId: n.data.candidateId } };
  }
  if (n.type === 'daily_picks') return { kind: 'route', target: 'daily' };
  if (n.type === 'profile_nudge' || n.type === 'family_edit') {
    return { kind: 'route', target: 'personal-details', params: { section: n.data?.section || null } };
  }
  if (n.type === 'family_feedback' || n.type === 'family_linked') return { kind: 'route', target: 'family' };
  if (n.type === 'account' && n.data?.target) return { kind: 'route', target: n.data.target };
  if (n.type === 'security') return { kind: 'route', target: 'settings' };
  return { kind: 'route', target: 'notifications' };
}

export function createSangamStore({ client, onRoute = () => {}, onSystemNotification = () => {} }) {
  const { api, session, connectRealtime } = client;
  let route = onRoute;
  // Lets each app raise an OS/browser notification (e.g. when it is in the background)
  let systemNotify = onSystemNotification;
  let pushToken = null; // this device's push token, removed again on sign-out
  let state = {
    ...EMPTY_DATA,
    authStatus: session.get() ? 'checking' : 'signedOut', // 'checking' | 'signedOut' | 'signedIn'
    pendingPhone: null,
    devCode: null, // the dummy SMS provider echoes the code outside production
    signedOutReason: null, // 'logout' (user chose to) | 'expired' (session revoked/expired)
  };
  const listeners = new Set();
  let stopRealtime = null;
  let restoreStarted = false;

  const getState = () => state;
  const set = (patch) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((l) => l());
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Wraps an API call so callers get { ok, data } or { ok: false, error } instead of exceptions
  async function attempt(fn) {
    try {
      return { ok: true, data: await fn() };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code, status: err.status };
    }
  }

  // ---------- session ----------

  function signOutLocally(reason = 'expired') {
    session.set(null);
    stopRealtime?.();
    stopRealtime = null;
    set({ ...EMPTY_DATA, authStatus: 'signedOut', signedOutReason: reason });
    route('welcome', { reason });
  }
  // Any 401 means the session is gone (expired, revoked or account erased)
  session.onUnauthorized(() => signOutLocally('expired'));

  function startRealtime() {
    stopRealtime?.();
    stopRealtime = connectRealtime((event) => {
      if (event.type === 'message:new') {
        set((s) => {
          const msgs = s.threadMessages[event.conversationId];
          if (!msgs || msgs.some((m) => m.id === event.message.id)) return {};
          return { threadMessages: { ...s.threadMessages, [event.conversationId]: [...msgs, event.message] } };
        });
        if (state.activeThreadId === event.conversationId && event.message.sender === 'them') {
          api.markConversationRead(event.conversationId).catch(() => {});
        }
        refreshConversations();
      }
      if (event.type === 'family:feedback' && event.share) {
        set((s) => ({ sentRecords: s.sentRecords.map((r) => (r.id === event.share.id ? event.share : r)) }));
        refreshConversations();
      }
      if (event.type === 'notification:new' && event.notification) receiveNotification(event.notification, event.unreadCount);
      if (event.type === 'notification:read') applyRead(event);
      // Interest requested / accepted / declined: refresh threads, and the cards' interest state
      if (event.type === 'conversation:updated') {
        refreshConversations();
        if (state.activeThreadId === event.conversationId) openThreadById(event.conversationId, { navigate: false });
        refreshFeed();
      }
      // The other person read the open thread: reload it for read receipts (premium only)
      if (event.type === 'conversation:read' && state.activeThreadId === event.conversationId && state.user?.plan === 'premium') {
        openThreadById(event.conversationId, { navigate: false });
      }
      if (event.type === 'safety:blocked') forgetMember(event.userId);
      if (event.type?.startsWith('call:')) {
        try {
          callHandler?.(event);
        } catch {
          // a broken call UI must not break other live events
        }
      }
    });
  }

  // Sends a message over the live connection (call signalling). Returns false when offline.
  const sendRealtime = (message) => Boolean(stopRealtime?.send?.(message));
  let callHandler = null;

  // A blocked member disappears from every list immediately
  function forgetMember(userId) {
    if (!userId) return;
    set((s) => ({
      candidates: s.candidates.filter((c) => c.id !== userId),
      shortlist: s.shortlist.filter((c) => c.id !== userId),
      dailyPicks: { ...s.dailyPicks, picks: s.dailyPicks.picks.filter((c) => c.id !== userId) },
      conversations: s.conversations.filter((t) => t.candidateId !== userId),
      search: { ...s.search, results: s.search.results.filter((c) => c.id !== userId) },
    }));
  }

  // ---------- notifications ----------

  function receiveNotification(n, unreadCount) {
    // Already looking at that conversation: it is read the moment it arrives, no banner
    const viewing = n.type === 'message' && n.data?.conversationId && n.data.conversationId === state.activeThreadId;
    set((s) => ({
      notifications: [n, ...s.notifications.filter((x) => x.id !== n.id)],
      unreadNotifications: typeof unreadCount === 'number' ? unreadCount : s.unreadNotifications + 1,
      toasts: viewing ? s.toasts : [...s.toasts.filter((t) => t.id !== n.id), n].slice(-3),
    }));
    if (viewing) {
      markNotificationsRead([n.id]);
      return;
    }
    try {
      systemNotify(n);
    } catch {
      // a failing OS notification must never break the app
    }
  }

  // Mirrors read state sent by the server (from this or another device)
  function applyRead({ unreadCount, ids, groupKey, all }) {
    const conversationId = groupKey?.startsWith('conversation:') ? groupKey.slice('conversation:'.length) : null;
    set((s) => ({
      unreadNotifications: typeof unreadCount === 'number' ? unreadCount : s.unreadNotifications,
      notifications: s.notifications.map((n) =>
        all || ids?.includes(n.id) || (conversationId && n.type === 'message' && n.data?.conversationId === conversationId)
          ? { ...n, read: true }
          : n
      ),
    }));
  }

  async function loadNotifications({ more = false } = {}) {
    const res = await attempt(() => api.getNotifications(more ? state.notificationsCursor : undefined));
    if (res.ok) {
      set((s) => ({
        notifications: more ? [...s.notifications, ...res.data.items.filter((n) => !s.notifications.some((x) => x.id === n.id))] : res.data.items,
        unreadNotifications: res.data.unreadCount,
        notificationsCursor: res.data.nextCursor,
      }));
    }
    return res;
  }

  async function markNotificationsRead(ids) {
    if (!ids?.length) return { ok: true };
    applyRead({ ids, unreadCount: Math.max(0, state.unreadNotifications - ids.filter((id) => state.notifications.find((n) => n.id === id && !n.read)).length) });
    return attempt(() => api.markNotificationsRead({ ids }));
  }

  async function markAllNotificationsRead() {
    applyRead({ all: true, unreadCount: 0 });
    return attempt(() => api.markNotificationsRead({ all: true }));
  }

  function dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  }

  // Tapping a notification (inbox, banner or OS notification): mark it read and go to what it is about
  async function openNotification(n) {
    dismissToast(n.id);
    if (!n.read) markNotificationsRead([n.id]);
    const t = targetFor(n);
    if (t.kind === 'thread') return openThreadById(t.conversationId);
    route(t.target, t.params || {});
    return { ok: true };
  }

  async function updateNotificationPrefs(prefs) {
    const res = await attempt(() => api.updateNotificationPrefs(prefs));
    if (res.ok) set((s) => ({ user: s.user ? { ...s.user, notificationPrefs: res.data } : s.user }));
    return res;
  }

  // Registers this device for push (FCM token on Android, push subscription id on the web)
  async function registerPushToken(platform, token) {
    if (!token) return { ok: false };
    pushToken = token;
    return attempt(() => api.registerPushToken(platform, token));
  }

  async function refreshFeed() {
    const res = await attempt(() => api.getMatches());
    if (res.ok) set({ candidates: res.data });
    return res;
  }

  async function refreshConversations() {
    const res = await attempt(() => api.getConversations());
    if (res.ok) {
      // Keep the open thread marked read locally while it is on screen
      // The list has no per-thread extras (conversation starters): keep the ones already loaded
      set((s) => ({
        conversations: res.data.map((t) => {
          const prev = s.conversations.find((x) => x.id === t.id);
          const merged = prev?.conversationPrompts ? { ...t, conversationPrompts: prev.conversationPrompts } : t;
          return t.id === s.activeThreadId ? { ...merged, unread: false, unreadCount: 0 } : merged;
        }),
      }));
    }
    return res;
  }

  async function refreshFamily() {
    const [links, shares] = await Promise.all([attempt(api.getFamilyLinks), attempt(api.getFamilyShares)]);
    const patch = {};
    if (links.ok) patch.familyLinks = links.data;
    if (shares.ok) patch.sentRecords = shares.data;
    set(patch);
  }

  // Everything the main app needs once onboarding is complete
  async function loadAppData() {
    set({ dataLoading: true, loadError: null });
    if (state.user?.id) set({ recentSearches: readRecent(state.user.id) });
    const results = await Promise.all([refreshFeed(), refreshConversations(), refreshFamily(), loadNotifications()]);
    loadInterestLimits();
    const failed = results.find((r) => r && !r.ok);
    set({ dataLoading: false, loadError: failed ? failed.error : null });
  }

  // Lands the user on the right step for where they are in onboarding.
  // reason 'restore' lets apps with URLs keep a deep link the user reloaded on.
  function routeForUser(profile, reason) {
    route(profile.onboarding.nextScreen, { reason });
    if (profile.onboarding.completed) loadAppData();
  }

  // Restore a saved session on launch (safe to call more than once)
  async function restoreSession() {
    if (restoreStarted || !session.get()) return;
    restoreStarted = true;
    let res = await attempt(api.getMe);
    // Offline or unreachable at launch: try a few more times before giving up
    for (let i = 0; !res.ok && res.status === 0 && i < 3; i += 1) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      res = await attempt(api.getMe);
    }
    if (!res.ok) {
      if (res.status === 401) {
        signOutLocally('expired');
        return;
      }
      // Keep the saved session: the next launch (or restoreSession call) tries again
      restoreStarted = false;
      set({ loadError: res.error, authStatus: 'signedOut', signedOutReason: 'offline' });
      return;
    }
    set({ user: res.data, authStatus: 'signedIn' });
    startRealtime();
    routeForUser(res.data, 'restore');
  }

  async function sendOtp(phone) {
    const res = await attempt(() => api.sendOtp(phone));
    if (res.ok) set({ pendingPhone: res.data.phone, devCode: res.data.devCode || null });
    return res;
  }

  async function verifyOtp(code) {
    const res = await attempt(() => api.verifyOtp(state.pendingPhone, code));
    if (!res.ok) return res;
    session.set(res.data.token);
    set({ devCode: null, user: res.data.user, authStatus: 'signedIn', signedOutReason: null });
    startRealtime();
    routeForUser(res.data.user, 'signin');
    return res;
  }

  async function logout() {
    if (pushToken) await attempt(() => api.removePushToken(pushToken));
    pushToken = null;
    await attempt(api.logout);
    signOutLocally('logout');
  }

  // ---------- profile & onboarding ----------

  async function refreshMe() {
    const res = await attempt(api.getMe);
    if (res.ok) set({ user: res.data });
    return res;
  }

  async function updateConsent(consent) {
    const res = await attempt(() => api.updateConsent(consent));
    if (res.ok) await refreshMe();
    return res;
  }

  async function updateBasics(basics) {
    const res = await attempt(() => api.updateBasics(basics));
    if (res.ok) set({ user: res.data });
    return res;
  }

  async function updateBlueprint(blueprint) {
    const res = await attempt(() => api.updateBlueprint(blueprint));
    if (res.ok) {
      await refreshMe();
      if (state.user?.onboarding?.completed) refreshFeed();
    }
    return res;
  }

  async function toggleVibe(vibe) {
    const current = state.user?.vibes || [];
    let updated;
    if (current.includes(vibe)) updated = current.filter((v) => v !== vibe);
    else if (current.length >= 6) return { ok: false, error: 'You can pick up to six' };
    else updated = [...current, vibe];
    set((s) => ({ user: { ...s.user, vibes: updated } }));
    const res = await attempt(() => api.updateVibes(updated));
    if (!res.ok) set((s) => ({ user: { ...s.user, vibes: current } }));
    return res;
  }

  const profileAction = (fn) => async (...args) => {
    const res = await attempt(() => fn(...args));
    if (res.ok) set({ user: res.data });
    return res;
  };
  const updatePrivacy = profileAction(api.updatePrivacy);
  // Personal details (partial; null clears a field). See shared/profileFields.js
  const updateDetails = profileAction(api.updateDetails);
  const updatePreferences = profileAction(api.updatePreferences);
  const updatePrompts = profileAction(api.updatePrompts);
  async function setPaused(paused) {
    const res = await attempt(() => api.updateStatus({ paused }));
    if (res.ok) set({ user: res.data });
    return res;
  }
  const uploadPhoto = profileAction(api.uploadPhoto);
  const deletePhoto = profileAction(api.deletePhoto);
  const makePhotoPrimary = profileAction(api.makePhotoPrimary);

  async function completeOnboarding() {
    const res = await attempt(api.completeOnboarding);
    if (res.ok) {
      set({ user: res.data });
      route('feed');
      loadAppData();
    }
    return res;
  }

  // ---------- matches ----------

  async function passCandidate(candidateId) {
    const res = await attempt(() => api.passCandidate(candidateId));
    if (res.ok) {
      set((s) => ({
        candidates: s.candidates.filter((c) => c.id !== candidateId),
        search: s.search.results.some((c) => c.id === candidateId)
          ? { ...s.search, results: s.search.results.filter((c) => c.id !== candidateId), total: Math.max(0, s.search.total - 1) }
          : s.search,
      }));
    }
    return res;
  }

  // ---------- search ----------

  let searchSeq = 0; // only the newest request may write results (typing fires several)

  // Runs a search. `filters` is merged into the current ones; `more` appends the next page.
  async function runSearch(filters = {}, { more = false } = {}) {
    const current = state.search;
    if (more && current.nextOffset == null) return { ok: true };
    const nextFilters = more ? current.filters : { ...current.filters, ...filters };
    const seq = ++searchSeq;
    set({ search: { ...current, filters: nextFilters, status: more ? 'loadingMore' : 'loading', error: null } });
    const res = await attempt(() => api.search(searchParams(nextFilters, { offset: more ? current.nextOffset : 0 })));
    if (seq !== searchSeq) return res;
    if (!res.ok) {
      set((s) => ({ search: { ...s.search, status: 'error', error: res.error } }));
      return res;
    }
    set((s) => ({
      search: {
        ...s.search,
        results: more ? [...s.search.results, ...res.data.results.filter((c) => !s.search.results.some((x) => x.id === c.id))] : res.data.results,
        total: res.data.total,
        nextOffset: res.data.nextOffset,
        facets: res.data.facets,
        status: 'ready',
      },
    }));
    return res;
  }

  const loadMoreSearch = () => runSearch({}, { more: true });
  const resetSearch = () => runSearch(DEFAULT_SEARCH_FILTERS);

  // Remembers the current search (called when the user commits one, not on every keystroke)
  function rememberSearch() {
    const userId = state.user?.id;
    const { filters } = state.search;
    const label = describeSearch(filters);
    if (!userId || label === 'Everyone') return;
    const recent = [{ label, filters }, ...state.recentSearches.filter((r) => r.label !== label)].slice(0, MAX_RECENT_SEARCHES);
    set({ recentSearches: recent });
    writeRecent(userId, recent);
  }

  function clearRecentSearches() {
    set({ recentSearches: [] });
    if (state.user?.id) writeRecent(state.user.id, []);
  }

  // A fresh search with exactly these filters (recent search, or "clear all")
  const applySearch = (filters) => runSearch({ ...DEFAULT_SEARCH_FILTERS, ...filters });

  // ---------- conversations ----------

  // Marks a thread as the one on screen and loads its messages
  async function openThreadById(conversationId, { navigate = true } = {}) {
    set({ activeThreadId: conversationId });
    if (navigate) route('chat-thread', { conversationId });
    const res = await attempt(() => api.getConversation(conversationId));
    if (res.ok) {
      const { messages, ...summary } = res.data;
      set((s) => ({
        threadMessages: { ...s.threadMessages, [conversationId]: messages },
        conversations: [
          { ...summary, unread: false, unreadCount: 0 },
          ...s.conversations.filter((t) => t.id !== conversationId),
        ],
      }));
      if (res.data.unread) attempt(() => api.markConversationRead(conversationId));
    }
    return res;
  }

  function closeThread() {
    set({ activeThreadId: null });
  }

  // Expressing interest (optionally with an intro message) opens the thread as a request
  async function openChatWith(candidateId, message) {
    const res = await attempt(() => api.openConversation(candidateId, message));
    if (res.ok) {
      markInterest(candidateId, { status: res.data.status, byMe: res.data.requestedByMe, conversationId: res.data.id });
      await openThreadById(res.data.id);
      loadInterestLimits();
    }
    return res;
  }
  const expressInterest = openChatWith;

  // Interest state on cards everywhere they appear
  function markInterest(candidateId, interest) {
    const upd = (c) => (c.id === candidateId ? { ...c, interest } : c);
    set((s) => ({
      candidates: s.candidates.map(upd),
      shortlist: s.shortlist.map(upd),
      dailyPicks: { ...s.dailyPicks, picks: s.dailyPicks.picks.map(upd) },
      search: { ...s.search, results: s.search.results.map(upd) },
    }));
  }

  async function acceptInterest(conversationId) {
    const res = await attempt(() => api.acceptInterest(conversationId));
    if (res.ok) {
      const { messages, ...summary } = res.data;
      set((s) => ({
        threadMessages: { ...s.threadMessages, [conversationId]: messages },
        conversations: s.conversations.map((t) => (t.id === conversationId ? summary : t)),
      }));
      refreshFeed();
    }
    return res;
  }

  async function declineInterest(conversationId) {
    const res = await attempt(() => api.declineInterest(conversationId));
    if (res.ok) {
      set((s) => ({ conversations: s.conversations.filter((t) => t.id !== conversationId), activeThreadId: s.activeThreadId === conversationId ? null : s.activeThreadId }));
      if (state.activeThreadId === null) route('conversations');
    }
    return res;
  }

  async function loadInterestLimits() {
    const res = await attempt(api.getInterestLimits);
    if (res.ok) set({ interestLimits: res.data });
    return res;
  }

  // ---------- discovery ----------

  async function loadDailyPicks() {
    set((s) => ({ dailyPicks: { ...s.dailyPicks, status: 'loading' } }));
    const res = await attempt(api.getDailyPicks);
    set((s) => ({ dailyPicks: res.ok ? { ...res.data, status: 'ready' } : { ...s.dailyPicks, status: 'error' } }));
    return res;
  }

  async function loadShortlist() {
    const res = await attempt(api.getShortlist);
    if (res.ok) set({ shortlist: res.data });
    return res;
  }

  // Adds or removes a candidate from the shortlist (optimistic)
  async function toggleShortlist(candidate) {
    const on = !candidate.shortlisted;
    const upd = (c) => (c.id === candidate.id ? { ...c, shortlisted: on } : c);
    const prev = { candidates: state.candidates, shortlist: state.shortlist, dailyPicks: state.dailyPicks, search: state.search };
    set((s) => ({
      candidates: s.candidates.map(upd),
      dailyPicks: { ...s.dailyPicks, picks: s.dailyPicks.picks.map(upd) },
      search: { ...s.search, results: s.search.results.map(upd) },
      shortlist: on ? [{ ...candidate, shortlisted: true }, ...s.shortlist.filter((c) => c.id !== candidate.id)] : s.shortlist.filter((c) => c.id !== candidate.id),
    }));
    const res = await attempt(() => (on ? api.shortlistAdd(candidate.id) : api.shortlistRemove(candidate.id)));
    if (!res.ok) set(prev);
    return res;
  }

  async function loadAdmirers() {
    const res = await attempt(api.getAdmirers);
    if (res.ok) set({ admirers: res.data });
    return res;
  }

  // "Why we matched" (also records the profile view)
  const compareMatch = (candidateId) => attempt(() => api.compareMatch(candidateId));
  const recordView = (candidateId) => attempt(() => api.recordView(candidateId));
  const getCandidate = (candidateId) => attempt(() => api.getCandidate(candidateId));

  // ---------- saved searches ----------

  async function loadSavedSearches() {
    const res = await attempt(api.getSavedSearches);
    if (res.ok) set({ savedSearches: res.data });
    return res;
  }
  async function saveCurrentSearch(name, alerts = true) {
    const filters = Object.fromEntries(Object.entries(searchParams(state.search.filters)).filter(([k]) => !['offset', 'limit'].includes(k)));
    const res = await attempt(() => api.createSavedSearch({ name, filters, alerts }));
    if (res.ok) set((s) => ({ savedSearches: [res.data, ...s.savedSearches] }));
    return res;
  }
  async function updateSavedSearch(id, patch) {
    const res = await attempt(() => api.updateSavedSearch(id, patch));
    if (res.ok) set((s) => ({ savedSearches: s.savedSearches.map((x) => (x.id === id ? res.data : x)) }));
    return res;
  }
  async function deleteSavedSearch(id) {
    const res = await attempt(() => api.deleteSavedSearch(id));
    if (res.ok) set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) }));
    return res;
  }
  // Saved filters use query-string form; turn them back into search filters
  function runSavedSearch(saved) {
    const f = saved.filters || {};
    const lst = (v) => (v ? String(v).split(',').filter(Boolean) : []);
    return applySearch({
      q: f.q || '',
      ageMin: f.ageMin ? Number(f.ageMin) : null,
      ageMax: f.ageMax ? Number(f.ageMax) : null,
      city: f.city || '',
      timelines: lst(f.timelines),
      minScore: f.minScore ? Number(f.minScore) : 0,
      strongOn: lst(f.strongOn),
      vibes: lst(f.vibes),
      verified: f.verified === 'true' || f.verified === true,
      notContacted: f.notContacted === 'true' || f.notContacted === true,
      matchesPreferences: f.matchesPreferences === 'true' || f.matchesPreferences === true,
      sort: f.sort || 'fit',
    });
  }

  // ---------- safety ----------

  async function loadBlocks() {
    const res = await attempt(api.getBlocks);
    if (res.ok) set({ blocks: res.data });
    return res;
  }
  async function blockMember(userId) {
    const res = await attempt(() => api.block(userId));
    if (res.ok) {
      forgetMember(userId);
      if (state.conversations.every((t) => t.id !== state.activeThreadId)) set({ activeThreadId: null });
    }
    return res;
  }
  async function unblockMember(userId) {
    const res = await attempt(() => api.unblock(userId));
    if (res.ok) {
      set((s) => ({ blocks: s.blocks.filter((b) => b.userId !== userId) }));
      refreshFeed();
      refreshConversations();
    }
    return res;
  }
  async function reportMember(userId, reason, details) {
    const res = await attempt(() => api.report(userId, reason, details));
    if (res.ok) forgetMember(userId);
    return res;
  }

  // ---------- premium ----------

  async function loadPremium() {
    const res = await attempt(api.getPremium);
    if (res.ok) set({ premium: res.data });
    return res;
  }
  const startCheckout = (plan) => attempt(() => api.premiumCheckout(plan));
  async function confirmPayment(paymentId, payload) {
    const res = await attempt(() => api.premiumConfirm(paymentId, payload));
    if (res.ok) {
      set({ premium: res.data });
      await refreshMe();
      loadInterestLimits();
    }
    return res;
  }

  // ---------- verification, stories, family votes ----------

  async function loadVerification() {
    const res = await attempt(api.getVerification);
    if (res.ok) set({ verification: res.data });
    return res;
  }
  async function submitVerification(file) {
    const res = await attempt(() => api.submitVerification(file));
    if (res.ok) set({ verification: res.data });
    return res;
  }
  async function loadStories() {
    const res = await attempt(api.getMyStories);
    if (res.ok) set({ stories: res.data });
    return res;
  }
  async function submitStory(story) {
    const res = await attempt(() => api.submitStory(story));
    if (res.ok) set((s) => ({ stories: [res.data, ...s.stories] }));
    return res;
  }
  async function respondStory(id, accept) {
    const res = await attempt(() => (accept ? api.confirmStory(id) : api.declineStory(id)));
    if (res.ok) set((s) => ({ stories: s.stories.map((x) => (x.id === id ? res.data : x)) }));
    return res;
  }
  async function withdrawStory(id) {
    const res = await attempt(() => api.withdrawStory(id));
    if (res.ok) set((s) => ({ stories: s.stories.filter((x) => x.id !== id) }));
    return res;
  }
  async function loadFamilyVotes() {
    const res = await attempt(api.getFamilyVotes);
    if (res.ok) set({ familyVotes: res.data });
    return res;
  }
  async function setFamilyManage(linkId, canManage) {
    const res = await attempt(() => api.setFamilyManage(linkId, canManage));
    if (res.ok) set((s) => ({ familyLinks: s.familyLinks.map((l) => (l.id === linkId ? res.data : l)) }));
    return res;
  }

  async function sendMessageInThread(conversationId, text) {
    const clean = (text || '').trim();
    if (!conversationId || !clean) return { ok: false };
    const tempId = `pending-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender: 'me',
      text: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pending: true,
    };
    const patch = (fn) =>
      set((s) => ({ threadMessages: { ...s.threadMessages, [conversationId]: fn(s.threadMessages[conversationId] || []) } }));
    patch((msgs) => [...msgs, optimistic]);

    const res = await attempt(() => api.sendMessage(conversationId, clean));
    if (res.ok) {
      patch((msgs) => {
        const withoutTemp = msgs.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === res.data.message.id) ? withoutTemp : [...withoutTemp, res.data.message];
      });
      refreshConversations();
    } else {
      patch((msgs) => msgs.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true, error: res.error } : m)));
    }
    return res;
  }

  // ---------- family ----------

  async function addFamilyMember(member) {
    const res = await attempt(() => api.addFamilyMember(member));
    if (res.ok) await refreshFamily();
    return res;
  }

  const resendFamilyInvite = (id) => attempt(() => api.resendFamilyInvite(id));

  async function removeFamilyMember(id) {
    const res = await attempt(() => api.removeFamilyMember(id));
    if (res.ok) await refreshFamily();
    return res;
  }

  // Shares one or more profiles with a family member
  async function shareWithFamily({ candidateIds, familyLinkId, expiresIn, note, permissions }) {
    if (!candidateIds?.length || !familyLinkId) {
      return { ok: false, error: 'Pick a profile and a family member first.' };
    }
    const res = await attempt(() => api.shareWithFamily({ candidateIds, familyLinkId, expiresIn, note, permissions }));
    if (res.ok) await refreshFamily();
    return res;
  }

  // ---------- privacy ----------

  async function requestErasure() {
    const res = await attempt(api.requestErasure);
    if (res.ok) await refreshMe();
    return res;
  }

  async function cancelErasure() {
    const res = await attempt(api.cancelErasure);
    if (res.ok) await refreshMe();
    return res;
  }

  const exportData = () => attempt(api.exportData);

  return {
    getState,
    subscribe,
    setOnRoute(fn) {
      route = fn;
    },
    setOnSystemNotification(fn) {
      systemNotify = fn;
    },
    actions: {
      restoreSession,
      sendOtp,
      verifyOtp,
      logout,
      refreshMe,
      updateConsent,
      updateBasics,
      updateBlueprint,
      toggleVibe,
      updatePrivacy,
      updateDetails,
      updatePreferences,
      updatePrompts,
      setPaused,
      expressInterest,
      acceptInterest,
      declineInterest,
      loadInterestLimits,
      loadDailyPicks,
      loadShortlist,
      toggleShortlist,
      loadAdmirers,
      compareMatch,
      recordView,
      getCandidate,
      loadSavedSearches,
      saveCurrentSearch,
      updateSavedSearch,
      deleteSavedSearch,
      runSavedSearch,
      loadBlocks,
      blockMember,
      unblockMember,
      reportMember,
      loadPremium,
      startCheckout,
      confirmPayment,
      loadVerification,
      submitVerification,
      loadStories,
      submitStory,
      respondStory,
      withdrawStory,
      loadFamilyVotes,
      setFamilyManage,
      sendRealtime,
      setCallHandler: (fn) => {
        callHandler = fn;
      },
      uploadPhoto,
      deletePhoto,
      makePhotoPrimary,
      completeOnboarding,
      loadAppData,
      refreshFeed,
      refreshConversations,
      refreshFamily,
      passCandidate,
      openThreadById,
      closeThread,
      openChatWith,
      sendMessageInThread,
      addFamilyMember,
      resendFamilyInvite,
      removeFamilyMember,
      shareWithFamily,
      requestErasure,
      cancelErasure,
      exportData,
      loadNotifications,
      markNotificationsRead,
      markAllNotificationsRead,
      openNotification,
      dismissToast,
      updateNotificationPrefs,
      registerPushToken,
      runSearch,
      loadMoreSearch,
      resetSearch,
      applySearch,
      rememberSearch,
      clearRecentSearches,
    },
  };
}
