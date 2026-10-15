// Central configuration, read once from the environment (backend/.env)
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

  // 'local' stores files under UPLOAD_DIR; 'r2' will be added for Cloudflare R2
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  UPLOAD_DIR: path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads'),
  MAX_UPLOAD_BYTES: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  MAX_PHOTOS: Number(process.env.MAX_PHOTOS || 6),

  ERASURE_DELAY_HOURS: Number(process.env.ERASURE_DELAY_HOURS || 72),
  ERASURE_SWEEP_MINUTES: Number(process.env.ERASURE_SWEEP_MINUTES || 10),

  // Files that must never be public (verification selfies); served only through admin endpoints
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

  // The built React web app (web/dist) is served at / — including parent-portal links (/portal/<token>)
  WEB_DIST_DIR: path.resolve(__dirname, '..', '..', process.env.WEB_DIST_DIR || '../web/dist'),
};
