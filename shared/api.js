// HTTP + WebSocket client for the Sangam backend, shared by the mobile and web apps.
// Each app creates one client with its own base URL:
//   mobile: absolute (e.g. http://localhost:5000/api, set via VITE_API_BASE)
//   web:    '/api' (same origin — the backend serves the web app)

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
          const err = new Error('Can’t reach Sangam. Check your connection and try again.');
          err.status = 0;
          throw err;
        }
      }
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && auth && unauthorizedHandler) unauthorizedHandler();
      const err = new Error(data?.error || `Request failed (${res.status})`);
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
    openConversation: (candidateId, message) => request('/conversations', { method: 'POST', body: { candidateId, ...(message ? { message } : {}) } }),
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
        if (!res.ok) throw new Error('Could not load the selfie');
        return res.blob();
      },
      stories: () => request('/admin/stories'),
      reviewStory: (id, decision) => request(`/admin/stories/${id}`, { method: 'POST', body: { decision } }),
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

    // Parent portal (no account; the link token is the credential)
    getParentPortal: (token) => request(`/portal/${encodeURIComponent(token)}`, { auth: false }),
    submitParentFeedback: (token, shareId, decision, note) =>
      request(`/portal/${encodeURIComponent(token)}/shares/${shareId}/feedback`, {
        method: 'POST',
        body: { decision, note },
        auth: false,
      }),
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
