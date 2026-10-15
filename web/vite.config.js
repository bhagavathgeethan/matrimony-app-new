import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));
// In development the API runs separately; proxy it so the app can always call same-origin /api
const BACKEND = process.env.SANGAM_BACKEND || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Logic shared with the mobile app (API client, store, constants)
      '@shared': path.resolve(dir, '../shared'),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [path.resolve(dir, '..')] },
    proxy: {
      '/api': BACKEND,
      '/uploads': BACKEND,
      '/ws': { target: BACKEND.replace(/^http/, 'ws'), ws: true },
    },
  },
});
