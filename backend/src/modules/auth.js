// Phone OTP sign-in and bearer-token sessions
const express = require('express');
const crypto = require('crypto');
const env = require('../config/env');
const db = require('../config/db');
const sms = require('../services/sms');
const { httpError, newId, sha256, randomToken, safeEqualHex, normalizePhone } = require('../lib/util');
const { route } = require('../lib/http');

const router = express.Router();

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Codes are stored hashed with the phone as salt, so a DB leak doesn't reveal live codes
const hashCode = (phone, code) => sha256(`${phone}:${code}`);

async function sendOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw httpError(400, 'Enter a valid mobile number', 'INVALID_PHONE');

  const recent = await db.query(
    `SELECT created_at FROM otp_codes WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC`,
    [phone]
  );
  if (recent.rows.length >= env.OTP_MAX_PER_HOUR) {
    throw httpError(429, 'Too many codes requested. Try again in an hour.', 'OTP_RATE_LIMIT');
  }
  if (recent.rows[0]) {
    const waited = (Date.now() - new Date(recent.rows[0].created_at).getTime()) / 1000;
    if (waited < env.OTP_RESEND_SECONDS) {
      const wait = Math.ceil(env.OTP_RESEND_SECONDS - waited);
      throw httpError(429, `Please wait ${wait}s before requesting another code`, 'OTP_RESEND_WAIT');
    }
  }

  const code = generateCode();
  // A new code supersedes any earlier unused ones
  await db.query('UPDATE otp_codes SET consumed_at = NOW() WHERE phone = $1 AND consumed_at IS NULL', [phone]);
  await db.query(
    `INSERT INTO otp_codes (id, phone, code_hash, expires_at) VALUES ($1, $2, $3, NOW() + make_interval(secs => $4))`,
    [newId(), phone, hashCode(phone, code), env.OTP_TTL_SECONDS]
  );
  await sms.sendOtp(phone, code);

  return {
    phone,
    expiresInSeconds: env.OTP_TTL_SECONDS,
    resendAfterSeconds: env.OTP_RESEND_SECONDS,
    ...(env.OTP_DEV_ECHO ? { devCode: code } : {}),
  };
}

async function verifyOtp(rawPhone, rawCode) {
  const phone = normalizePhone(rawPhone);
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';
  if (!phone) throw httpError(400, 'Enter a valid mobile number', 'INVALID_PHONE');
  if (!/^\d{6}$/.test(code)) throw httpError(400, 'Enter the 6-digit code', 'INVALID_CODE');

  const res = await db.query(
    `SELECT * FROM otp_codes WHERE phone = $1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );
  const otp = res.rows[0];
  if (!otp || new Date(otp.expires_at) < new Date()) {
    throw httpError(400, 'This code has expired. Request a new one.', 'OTP_EXPIRED');
  }
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw httpError(429, 'Too many wrong attempts. Request a new code.', 'OTP_LOCKED');
  }
  if (!safeEqualHex(otp.code_hash, hashCode(phone, code))) {
    await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
    throw httpError(400, 'That code is not right. Check the SMS and try again.', 'OTP_WRONG');
  }

  return db.transaction(async (client) => {
    // Consume atomically so the same code can't be used twice in parallel
    const consumed = await client.query(
      'UPDATE otp_codes SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL RETURNING id',
      [otp.id]
    );
    if (consumed.rows.length === 0) throw httpError(400, 'This code was already used', 'OTP_USED');

    let user = (await client.query('SELECT id FROM users WHERE phone = $1', [phone])).rows[0];
    const isNewUser = !user;
    if (isNewUser) {
      user = { id: newId() };
      await client.query('INSERT INTO users (id, phone) VALUES ($1, $2)', [user.id, phone]);
    }
    // Admin role follows ADMIN_PHONES at every sign-in (removing a number revokes it)
    await client.query('UPDATE users SET role = $2 WHERE id = $1', [user.id, env.ADMIN_PHONES.includes(phone) ? 'admin' : 'member']);
    const token = randomToken(32);
    await client.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, NOW() + make_interval(days => $4))`,
      [newId(), user.id, sha256(token), env.SESSION_TTL_DAYS]
    );
    return { token, userId: user.id, isNewUser };
  });
}

// Resolves a bearer token to its user id, or null
async function userIdForToken(token) {
  if (!token || typeof token !== 'string') return null;
  const res = await db.query(
    `UPDATE sessions SET last_used_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [sha256(token)]
  );
  return res.rows[0]?.user_id || null;
}

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

// Middleware: rejects the request unless it carries a valid session token
const requireAuth = route(async (req, res, next) => {
  const token = bearerToken(req);
  const userId = await userIdForToken(token);
  if (!userId) throw httpError(401, 'Please sign in again', 'UNAUTHENTICATED');
  req.userId = userId;
  req.sessionTokenHash = sha256(token);
  db.query(
    "UPDATE users SET last_active_at = NOW() WHERE id = $1 AND last_active_at < NOW() - INTERVAL '5 minutes'",
    [userId]
  ).catch(() => {});
  next();
});

router.post('/otp/send', route(async (req, res) => {
  res.json(await sendOtp(req.body?.phone));
}));

router.post('/otp/verify', route(async (req, res) => {
  const { token, userId, isNewUser } = await verifyOtp(req.body?.phone, req.body?.code);
  // Security alert when an account that is signed in elsewhere gets a new sign-in
  if (!isNewUser) {
    const others = await db.query(
      `SELECT COUNT(*)::int AS n FROM sessions
       WHERE user_id = $1 AND token_hash <> $2 AND revoked_at IS NULL AND expires_at > NOW()`,
      [userId, sha256(token)]
    );
    if (others.rows[0].n > 0) {
      const { notify } = require('./notifications');
      await notify(userId, {
        type: 'security',
        title: 'New sign-in to your account',
        body: `Signed in on another device at ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}. If this wasn’t you, sign out and contact support.`,
        data: {},
      });
    }
  }
  const { getProfile } = require('./profile');
  res.json({ token, isNewUser, user: await getProfile(userId) });
}));

router.post('/logout', requireAuth, route(async (req, res) => {
  await db.query('UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1', [req.sessionTokenHash]);
  res.json({ success: true });
}));

module.exports = { router, requireAuth, userIdForToken, sendOtp, verifyOtp };
