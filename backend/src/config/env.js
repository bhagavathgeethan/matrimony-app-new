// Central configuration, read once from the environment (backend/.env)
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name} (see backend/.env)`);
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  NODE_ENV,
  isProduction: NODE_ENV === 'production',
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: required('DATABASE_URL'),
  DATABASE_SSL: process.env.DATABASE_SSL === 'true',

  // Public URL of this backend; used to build upload and parent-portal links
  PUBLIC_BASE_URL: (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim()),

  SESSION_TTL_DAYS: Number(process.env.SESSION_TTL_DAYS || 30),

  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS || 300),
  OTP_RESEND_SECONDS: Number(process.env.OTP_RESEND_SECONDS || 30),
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  OTP_MAX_PER_HOUR: Number(process.env.OTP_MAX_PER_HOUR || 5),

  // 'dummy' until the real SMS provider is integrated
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'dummy',
  // Dev convenience: return the OTP in the API response (never in production)
  OTP_DEV_ECHO: process.env.OTP_DEV_ECHO ? process.env.OTP_DEV_ECHO === 'true' : NODE_ENV !== 'production',

  // 'dummy' logs pushes until Firebase Cloud Messaging is connected
  PUSH_PROVIDER: process.env.PUSH_PROVIDER || 'dummy',
  // Members who score at least this much with a newcomer get a "new aligned match" notification
  MATCH_ALERT_THRESHOLD: Number(process.env.MATCH_ALERT_THRESHOLD || 80),

  // File storage on Depot. The API key is server-side only: never log it or send it to a client.
  STORAGE_URL: (process.env.STORAGE_URL || 'https://depot.thestucompany.com').replace(/\/$/, ''),
  STORAGE_API_KEY: process.env.STORAGE_API_KEY || '',
  // One private bucket holds every file; nothing is publicly readable
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'knotfiles',
  STORAGE_TIMEOUT_MS: Number(process.env.STORAGE_TIMEOUT_MS || 20000),
  // Signs the /api/media links for private photos. Set it in production so links survive restarts.
  MEDIA_URL_SECRET: process.env.MEDIA_URL_SECRET || require('crypto').randomBytes(32).toString('hex'),
  MAX_UPLOAD_BYTES: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  MAX_PHOTOS: Number(process.env.MAX_PHOTOS || 6),
  // Large files (multipart uploads; admin-only for now)
  MAX_VIDEO_BYTES: Number(process.env.MAX_VIDEO_BYTES || 2 * 1024 * 1024 * 1024),
  // Legacy local folders, read only by scripts/migrate-local-uploads.js
  UPLOAD_DIR: path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads'),

  ERASURE_DELAY_HOURS: Number(process.env.ERASURE_DELAY_HOURS || 72),
  ERASURE_SWEEP_MINUTES: Number(process.env.ERASURE_SWEEP_MINUTES || 10),

  PRIVATE_UPLOAD_DIR: path.resolve(__dirname, '..', '..', process.env.PRIVATE_UPLOAD_DIR || 'uploads-private'),

  // Interest requests a free member may send per day (premium: unlimited)
  INTEREST_DAILY_LIMIT: Number(process.env.INTEREST_DAILY_LIMIT || 10),
  // Distinct open reports that hide a profile until an admin reviews it
  REPORT_HIDE_THRESHOLD: Number(process.env.REPORT_HIDE_THRESHOLD || 3),
  // Phone numbers (E.164, comma-separated) that get the admin role when they sign in
  ADMIN_PHONES: (process.env.ADMIN_PHONES || '').split(',').map((s) => s.trim()).filter(Boolean),

  // 'dummy' completes payments without charging until a real gateway (e.g. Razorpay) is connected
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'dummy',

  // Seconds an unanswered call rings before it counts as missed
  CALL_RING_SECONDS: Number(process.env.CALL_RING_SECONDS || 30),

  // Background jobs: daily-picks notifications and profile-completion nudges
  JOBS_INTERVAL_MINUTES: Number(process.env.JOBS_INTERVAL_MINUTES || 30),
  DAILY_PICKS_COUNT: Number(process.env.DAILY_PICKS_COUNT || 5),
  DAILY_PICKS_HOUR_IST: Number(process.env.DAILY_PICKS_HOUR_IST || 8),
  NUDGE_AFTER_HOURS: Number(process.env.NUDGE_AFTER_HOURS || 24),
  NUDGE_EVERY_DAYS: Number(process.env.NUDGE_EVERY_DAYS || 3),

  // The built React web app: checks backend/public, then custom WEB_DIST_DIR, then frontend/dist, then web/dist
  WEB_DIST_DIR: (() => {
    const backendRoot = path.resolve(__dirname, '..', '..');
    const localPublic = path.join(backendRoot, 'public');
    if (fs.existsSync(path.join(localPublic, 'index.html'))) {
      return localPublic;
    }
    const customDir = process.env.WEB_DIST_DIR ? path.resolve(backendRoot, process.env.WEB_DIST_DIR) : null;
    if (customDir && fs.existsSync(path.join(customDir, 'index.html'))) {
      return customDir;
    }
    const candidates = [
      path.resolve(backendRoot, '../frontend/dist'),
      path.resolve(backendRoot, '../web/dist'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
    }
    return localPublic;
  })(),
};
