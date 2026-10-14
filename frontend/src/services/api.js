const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Health & DB status
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Profile
  getMe: async () => {
    const res = await fetch(`${API_BASE}/profile/me`);
    return res.json();
  },

  updateBasics: async (basics) => {
    const res = await fetch(`${API_BASE}/profile/basics`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basics),
    });
    return res.json();
  },

  updateVibes: async (vibes) => {
    const res = await fetch(`${API_BASE}/profile/vibes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vibes }),
    });
    return res.json();
  },

  // Blueprint
  getBlueprintSummary: async () => {
    const res = await fetch(`${API_BASE}/blueprint/summary`);
    return res.json();
  },

  updateBlueprintWeights: async (weights) => {
    const res = await fetch(`${API_BASE}/blueprint/weights`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    return res.json();
  },

  // Matches
  getMatchesFeed: async () => {
    const res = await fetch(`${API_BASE}/matches/feed`);
    return res.json();
  },

  getMatchesList: async (filter) => {
    const query = filter ? `?filter=${encodeURIComponent(filter)}` : '';
    const res = await fetch(`${API_BASE}/matches/list${query}`);
    return res.json();
  },

  // Family Co-Pilot
  getFamilyLinks: async () => {
    const res = await fetch(`${API_BASE}/family/links`);
    return res.json();
  },

  inviteFamilyMember: async (parentName, phone) => {
    const res = await fetch(`${API_BASE}/family/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentName, phone }),
    });
    return res.json();
  },

  getSentFamilyRecords: async () => {
    const res = await fetch(`${API_BASE}/family/sent`);
    return res.json();
  },

  shareWithFamily: async (shareData) => {
    const res = await fetch(`${API_BASE}/family/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareData),
    });
    return res.json();
  },

  submitParentFeedback: async (shareId, decision, note) => {
    const res = await fetch(`${API_BASE}/family/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, decision, note }),
    });
    return res.json();
  },

  // Chat
  getThreads: async () => {
    const res = await fetch(`${API_BASE}/chat/threads`);
    return res.json();
  },

  sendMessage: async (threadId, text) => {
    const res = await fetch(`${API_BASE}/chat/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  // Privacy & DPDP
  updateConsent: async (consents) => {
    const res = await fetch(`${API_BASE}/privacy/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consents),
    });
    return res.json();
  },

  exportDPDPData: async () => {
    const res = await fetch(`${API_BASE}/privacy/export-data`);
    return res.json();
  },

  requestErasure: async () => {
    const res = await fetch(`${API_BASE}/privacy/erasure-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};
