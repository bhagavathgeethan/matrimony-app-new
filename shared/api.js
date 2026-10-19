// HTTP + WebSocket client for the 3Knot backend, shared by the mobile and web apps.
// Each app creates one client with its own base URL:
//   mobile: absolute (e.g. http://localhost:5000/api, set via VITE_API_BASE)
//   web:    '/api' (same origin — the backend serves the web app)

import { t } from './i18n.js';

const TOKEN_KEY = 'sangam.session';

function resolveWsUrl(baseUrl) {
  const absolute = /^https?:\/\//.test(baseUrl) ? baseUrl : `${window.location.origin}${baseUrl}`;
  return `${absolute.replace(/^http/, 'ws').replace(/\/api$/, '')}/ws`;
}

export function createApiClient({ baseUrl }) {
  const API_BASE = baseUrl.replace(/\/$/, '');
  let unauthorizedHandler = null;

  const session = {
    get() {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    },
    set(token) {
      try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
      } catch {
        // storage unavailable (private mode) — session lasts until the page closes
      }
    },
    onUnauthorized(handler) {
      unauthorizedHandler = handler;
    },
  };

  const TIMEOUT_MS = 12000;

  // One fetch with a timeout, so a stalled connection fails instead of hanging forever
  async function fetchWithTimeout(url, options) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
    try {
      return await fetch(url, { ...options, ...(controller ? { signal: controller.signal } : {}) });
    } finally {
      clearTimeout(timer);
    }
  }

  // Throws an Error carrying .status and .code on any non-2xx response
  async function request(path, { method = 'GET', body, form, auth = true } = {}) {
    const headers = {};
    const token = session.get();
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const options = { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) };
    let res;
    // Reads are retried once on a network failure or timeout; writes are not (they may have gone through)
    for (let attempt = 0; attempt < (method === 'GET' ? 2 : 1) && !res; attempt += 1) {
      try {
        res = await fetchWithTimeout(`${API_BASE}${path}`, options);
      } catch {
        if (attempt === (method === 'GET' ? 1 : 0)) {
          const err = new Error(t('Can’t reach 3Knot. Check your connection and try again.'));
          err.status = 0;
          throw err;
        }
      }
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && auth && unauthorizedHandler) unauthorizedHandler();
      // Server messages are English; show them in the interface language
      const err = new Error(data?.error ? t(data.error) : t('Request failed ({status})', { status: res.status }));
      err.status = res.status;
      err.code = data?.code;
      throw err;
    }
    return data;
  }

  const api = {
    health: () => request('/health', { auth: false }),

    // Auth
    sendOtp: (phone) => request('/auth/otp/send', { method: 'POST', body: { phone }, auth: false }),
    verifyOtp: (phone, code) => request('/auth/otp/verify', { method: 'POST', body: { phone, code }, auth: false }),
    logout: () => request('/auth/logout', { method: 'POST' }),

    // My profile
    getMe: () => request('/me'),
    updateBasics: (basics) => request('/me/basics', { method: 'PUT', body: basics }),
    updateConsent: (consent) => request('/me/consent', { method: 'PUT', body: consent }),
    updateDetails: (details) => request('/me/details', { method: 'PUT', body: details }),
    updatePrivacy: (settings) => request('/me/privacy', { method: 'PUT', body: settings }),
    updateLanguage: (language) => request('/me/language', { method: 'PUT', body: { language } }),
    updateVibes: (vibes) => request('/me/vibes', { method: 'PUT', body: { vibes } }),
    updateBlueprint: (blueprint) => request('/me/blueprint', { method: 'PUT', body: blueprint }),
    uploadPhoto: (file) => {
      const form = new FormData();
      form.append('photo', file);
      return request('/me/photos', { method: 'POST', form });
    },
    deletePhoto: (id) => request(`/me/photos/${id}`, { method: 'DELETE' }),
    makePhotoPrimary: (id) => request(`/me/photos/${id}/primary`, { method: 'PUT' }),
    completeOnboarding: () => request('/me/onboarding/complete', { method: 'POST' }),
    updatePreferences: (prefs) => request('/me/preferences', { method: 'PUT', body: prefs }),
    updatePrompts: (prompts) => request('/me/prompts', { method: 'PUT', body: { prompts } }),
    updateStatus: (status) => request('/me/status', { method: 'PUT', body: status }),
    getVerification: () => request('/me/verification'),
    submitVerification: (file) => {
      const form = new FormData();
      form.append('selfie', file);
      return request('/me/verification', { method: 'POST', form });
    },
    exportData: () => request('/me/export'),
    requestErasure: () => request('/me/erasure', { method: 'POST' }),
    cancelErasure: () => request('/me/erasure', { method: 'DELETE' }),

    // Matches
    getMatches: (filter) => request(`/matches${filter ? `?filter=${encodeURIComponent(filter)}` : ''}`),
    passCandidate: (id) => request(`/matches/${id}/pass`, { method: 'POST' }),
    getCandidate: (id) => request(`/matches/${id}`),
    getDailyPicks: () => request('/matches/daily'),
    getShortlist: () => request('/matches/shortlist'),
    shortlistAdd: (id) => request(`/matches/${id}/shortlist`, { method: 'POST' }),
    shortlistRemove: (id) => request(`/matches/${id}/shortlist`, { method: 'DELETE' }),
    getAdmirers: () => request('/matches/admirers'),
    compareMatch: (id) => request(`/matches/${id}/compare`),
    recordView: (id) => request(`/matches/${id}/view`, { method: 'POST' }),

    // Conversations
    getConversations: () => request('/conversations'),
    openConversation: (candidateId, message, isSuper = false) =>
      request('/conversations', { method: 'POST', body: { candidateId, ...(message ? { message } : {}), ...(isSuper ? { super: true } : {}) } }),
    acceptInterest: (id) => request(`/conversations/${id}/accept`, { method: 'POST' }),
    declineInterest: (id) => request(`/conversations/${id}/decline`, { method: 'POST' }),
    getInterestLimits: () => request('/conversations/limits'),
    getConversation: (id) => request(`/conversations/${id}`),
    sendMessage: (id, text) => request(`/conversations/${id}/messages`, { method: 'POST', body: { text } }),
    markConversationRead: (id) => request(`/conversations/${id}/read`, { method: 'PUT' }),

    // Family co-pilot
    getFamilyLinks: () => request('/family/links'),
    addFamilyMember: (member) => request('/family/links', { method: 'POST', body: member }),
    resendFamilyInvite: (id) => request(`/family/links/${id}/resend`, { method: 'POST' }),
    removeFamilyMember: (id) => request(`/family/links/${id}`, { method: 'DELETE' }),
    getFamilyShares: () => request('/family/shares'),
    shareWithFamily: (share) => request('/family/shares', { method: 'POST', body: share }),
    getFamilyVotes: () => request('/family/votes'),
    setFamilyManage: (id, canManage) => request(`/family/links/${id}`, { method: 'PUT', body: { canManage } }),

    // Saved searches
    getSavedSearches: () => request('/search/saved'),
    createSavedSearch: (saved) => request('/search/saved', { method: 'POST', body: saved }),
    updateSavedSearch: (id, patch) => request(`/search/saved/${id}`, { method: 'PUT', body: patch }),
    deleteSavedSearch: (id) => request(`/search/saved/${id}`, { method: 'DELETE' }),

    // Safety
    getBlocks: () => request('/safety/blocks'),
    block: (userId) => request('/safety/blocks', { method: 'POST', body: { userId } }),
    unblock: (userId) => request(`/safety/blocks/${userId}`, { method: 'DELETE' }),
    report: (userId, reason, details) => request('/safety/reports', { method: 'POST', body: { userId, reason, details } }),

    // Premium
    getPremium: () => request('/premium'),
    premiumCheckout: (plan) => request('/premium/checkout', { method: 'POST', body: { plan } }),
    premiumConfirm: (paymentId, payload) => request('/premium/confirm', { method: 'POST', body: { paymentId, payload } }),
    getPayments: () => request('/premium/payments'),
    startTrial: () => request('/premium/trial', { method: 'POST' }),
    pausePlan: () => request('/premium/pause', { method: 'POST' }),
    resumePlan: () => request('/premium/resume', { method: 'POST' }),
    startSpotlight: () => request('/premium/spotlight', { method: 'POST' }),
    getAssisted: () => request('/premium/assisted'),
    requestAssisted: (body) => request('/premium/assisted', { method: 'POST', body }),
    rewind: () => request('/matches/rewind', { method: 'POST' }),
    getSimilar: (id) => request(`/matches/${id}/similar`),
    reportLink: (id) => request(`/matches/${id}/report-link`, { method: 'POST' }),
    sendVoice: (conversationId, blob, durationMs) => {
      const form = new FormData();
      const ext = (blob.type || '').includes('mp4') ? 'm4a' : (blob.type || '').includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', blob, `voice.${ext}`);
      form.append('durationMs', String(Math.round(durationMs)));
      return request(`/conversations/${conversationId}/voice`, { method: 'POST', form });
    },
    // Voice notes need the session header, so they are fetched as blobs
    voiceBlob: async (audioPath) => {
      const res = await fetch(`${API_BASE}${audioPath}`, { headers: { Authorization: `Bearer ${session.get()}` } });
      if (!res.ok) throw new Error(t('Could not load the voice note'));
      return res.blob();
    },
    shareContact: (conversationId) => request(`/conversations/${conversationId}/contact`, { method: 'POST' }),
    unshareContact: (conversationId) => request(`/conversations/${conversationId}/contact`, { method: 'DELETE' }),
    getProposals: () => request('/family/proposals'),
    answerProposal: (id, approve) => request(`/family/proposals/${id}/${approve ? 'approve' : 'decline'}`, { method: 'POST' }),

    // Success stories
    getMyStories: () => request('/stories'),
    submitStory: (story) => request('/stories', { method: 'POST', body: story }),
    confirmStory: (id) => request(`/stories/${id}/confirm`, { method: 'POST' }),
    declineStory: (id) => request(`/stories/${id}/decline`, { method: 'POST' }),
    withdrawStory: (id) => request(`/stories/${id}`, { method: 'DELETE' }),
    getPublicStories: () => request('/public/stories', { auth: false }),

    // Calls
    getCallConfig: () => request('/calls/config'),

    // Admin console
    admin: {
      stats: () => request('/admin/stats'),
      reports: (status = 'open') => request(`/admin/reports?status=${status}`),
      resolveReport: (id, action) => request(`/admin/reports/${id}/resolve`, { method: 'POST', body: { action } }),
      members: (q = '') => request(`/admin/members?q=${encodeURIComponent(q)}`),
      hideMember: (id) => request(`/admin/members/${id}/hide`, { method: 'POST' }),
      unhideMember: (id) => request(`/admin/members/${id}/unhide`, { method: 'POST' }),
      verifications: () => request('/admin/verifications'),
      reviewVerification: (id, decision, note) => request(`/admin/verifications/${id}`, { method: 'POST', body: { decision, note } }),
      // Selfies need the session header, so they are fetched as blobs
      selfieBlob: async (path) => {
        const res = await fetch(`${API_BASE}${path.replace(/^\/api/, '')}`, { headers: { Authorization: `Bearer ${session.get()}` } });
        if (!res.ok) throw new Error(t('Could not load the selfie'));
        return res.blob();
      },
      stories: () => request('/admin/stories'),
      reviewStory: (id, decision) => request(`/admin/stories/${id}`, { method: 'POST', body: { decision } }),
      assisted: () => request('/admin/assisted'),
      assistedCandidates: (userId) => request(`/admin/assisted/${userId}/candidates`),
      recommend: (userId, candidateId, note) => request(`/admin/assisted/${userId}/recommend`, { method: 'POST', body: { candidateId, note } }),
      updateAssistedRequest: (id, body) => request(`/admin/assisted/requests/${id}`, { method: 'PUT', body }),
    },

    // Search: params are already-validated strings/numbers (see searchParams in constants.js)
    search: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
      return request(`/search${qs ? `?${qs}` : ''}`);
    },

    // Notifications
    getNotifications: (before) => request(`/notifications${before ? `?before=${encodeURIComponent(before)}` : ''}`),
    markNotificationsRead: ({ ids, all } = {}) => request('/notifications/read', { method: 'POST', body: { ids, all } }),
    updateNotificationPrefs: (prefs) => request('/notifications/preferences', { method: 'PUT', body: prefs }),
    registerPushToken: (platform, token) => request('/notifications/push-tokens', { method: 'POST', body: { platform, token } }),
    removePushToken: (token) => request('/notifications/push-tokens', { method: 'DELETE', body: { token } }),

    // Family sign-in in the app: a code to the invited number returns the portals it was invited to
    familySignInSend: (phone) => request('/portal/sign-in/send', { method: 'POST', body: { phone }, auth: false }),
    familySignInVerify: (phone, code) => request('/portal/sign-in/verify', { method: 'POST', body: { phone, code }, auth: false }),
    // Parent portal (no account; the link token is the credential)
    getParentPortal: (token) => request(`/portal/${encodeURIComponent(token)}`, { auth: false }),
    submitParentFeedback: (token, shareId, decision, note) =>
      request(`/portal/${encodeURIComponent(token)}/shares/${shareId}/feedback`, {
        method: 'POST',
        body: { decision, note },
        auth: false,
      }),
    proposeInterest: (token, shareId, note) =>
      request(`/portal/${encodeURIComponent(token)}/proposals`, { method: 'POST', body: { shareId, note }, auth: false }),
    giftCheckout: (token, plan) => request(`/portal/${encodeURIComponent(token)}/gift/checkout`, { method: 'POST', body: { plan }, auth: false }),
    giftConfirm: (token, paymentId, payload) =>
      request(`/portal/${encodeURIComponent(token)}/gift/confirm`, { method: 'POST', body: { paymentId, payload }, auth: false }),
    updatePortalDetails: (token, details) =>
      request(`/portal/${encodeURIComponent(token)}/details`, { method: 'PUT', body: details, auth: false }),
  };

  // Live events (new messages, parent feedback, calls); reconnects with backoff while signed in.
  // Returns stop(); stop.send(message) sends a message to the server (call signalling).
  function connectRealtime(onEvent) {
    let ws;
    let closed = false;
    let retry = 0;
    let timer;

    const open = () => {
      const token = session.get();
      if (!token || closed) return;
      ws = new WebSocket(`${resolveWsUrl(API_BASE)}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => {
        retry = 0;
      };
      ws.onmessage = (e) => {
        try {
          onEvent(JSON.parse(e.data));
        } catch {
          // ignore malformed frames
        }
      };
      ws.onclose = (e) => {
        if (closed || e.code === 4401) return;
        timer = setTimeout(open, Math.min(30000, 1000 * 2 ** retry++));
      };
    };
    open();

    const stop = () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
    stop.send = (message) => {
      if (ws?.readyState !== 1) return false;
      ws.send(JSON.stringify(message));
      return true;
    };
    return stop;
  }

  return { api, session, connectRealtime };
}
