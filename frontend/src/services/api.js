// Mobile app's API client, built from the shared client (../shared/api.js).
// Override the backend location at build time with VITE_API_BASE (e.g. https://api.yourdomain.com/api).
import { createApiClient } from '@shared/api';

const defaultBase = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? '/api'
  : 'http://localhost:5000/api';

export const client = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE || defaultBase });
export const { api, session, connectRealtime } = client;
