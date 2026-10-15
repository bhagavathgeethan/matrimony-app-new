// Mobile app's API client, built from the shared client (../shared/api.js).
// Override the backend location at build time with VITE_API_BASE (e.g. http://192.168.1.6:5000/api).
import { createApiClient } from '@shared/api';

export const client = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api' });
export const { api, session, connectRealtime } = client;
