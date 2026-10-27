// ID verification: the member uploads a live selfie; an admin compares it with their profile photos and
// approves or rejects. Selfies are only viewable through admin endpoints (short-lived signed links).
// (A government-ID provider such as DigiLocker can replace the manual review later.)
const express = require('express');
const sharp = require('sharp');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const uploads = require('./uploads');
const { httpError, newId } = require('../lib/util');
const { tx } = require('../lib/i18n');
const { route } = require('../lib/http');

const router = express.Router();

const toDto = (v) => (v
  ? { id: v.id, status: v.status, note: v.note, submittedAt: v.created_at, reviewedAt: v.reviewed_at }
  : null);

async function latest(userId) {
  const res = await db.query('SELECT * FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
  return res.rows[0] || null;
}

async function status(userId) {
  const u = (await db.query('SELECT id_verified_at FROM users WHERE id = $1', [userId])).rows[0];
  return { verified: Boolean(u?.id_verified_at), verifiedAt: u?.id_verified_at || null, request: toDto(await latest(userId)) };
}

async function assertCanSubmit(userId) {
  const current = await status(userId);
  if (current.verified) throw httpError(409, 'Your profile is already verified');
  if (current.request?.status === 'pending') throw httpError(409, 'Your selfie is already being reviewed');
  const photos = (await db.query('SELECT COUNT(*)::int AS n FROM photos WHERE user_id = $1', [userId])).rows[0].n;
  if (!photos) throw httpError(400, 'Add a profile photo first so we can compare it with your selfie');
}

// Raw selfie goes to a private staging key; POST /me/verification { key } re-encodes it (no EXIF) and files it
uploads.registerPurpose('selfie', {
  bucket: storage.BUCKET,
  types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  maxBytes: env.MAX_UPLOAD_BYTES,
  keyFor: (userId, filename) => storage.buildKey('uploads', userId, filename),
  authorize: assertCanSubmit,
});

async function submit(userId, uploadKey) {
  await assertCanSubmit(userId);
  const { upload } = await uploads.claim(userId, 'selfie', uploadKey);
  let image;
  try {
    const raw = await storage.getObject(upload.bucket, upload.key);
    let meta;
    try {
      meta = await sharp(raw).metadata();
    } catch {
      throw httpError(400, 'That file is not a supported image');
    }
    if (!['jpeg', 'png', 'webp', 'heif'].includes(meta.format)) throw httpError(400, 'Use a JPG, PNG, WEBP or HEIC photo');
    image = await sharp(raw).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 }).toBuffer();
  } catch (err) {
    if (err.status === 400) {
      await storage.deleteObject(upload.bucket, upload.key).catch(() => {});
      await uploads.consume(upload);
    } else {
      await uploads.release(upload);
    }
    throw err;
  }

  const id = newId();
  const key = `verifications/${userId}/${id}.jpg`;
  try {
    await storage.putObject(storage.BUCKET, key, image, 'image/jpeg');
    await db.transaction(async (client) => {
      await client.query('INSERT INTO verifications (id, user_id, selfie_bucket, selfie_key) VALUES ($1, $2, $3, $4)', [id, userId, storage.BUCKET, key]);
      await uploads.consume(upload, client);
    });
  } catch (err) {
    await storage.deleteObject(storage.BUCKET, key).catch(() => {});
    await uploads.release(upload);
    throw err;
  }
  await storage.deleteObject(upload.bucket, upload.key).catch(() => {});
  return status(userId);
}

// Admin decision (called from the admin module)
async function review(adminId, verificationId, decision, note) {
  if (!['approved', 'rejected'].includes(decision)) throw httpError(400, 'decision must be approved or rejected');
  const v = (await db.query('SELECT * FROM verifications WHERE id = $1', [verificationId])).rows[0];
  if (!v) throw httpError(404, 'Verification not found');
  if (v.status !== 'pending') throw httpError(409, 'Already reviewed');
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 300) || null : null;
  await db.query(
    'UPDATE verifications SET status = $2, note = $3, reviewed_at = NOW(), reviewed_by = $4 WHERE id = $1',
    [verificationId, decision, cleanNote, adminId]
  );
  if (decision === 'approved') await db.query('UPDATE users SET id_verified_at = NOW() WHERE id = $1', [v.user_id]);
  const { notify } = require('./notifications');
  await notify(v.user_id, {
    type: 'account',
    title: tx(decision === 'approved' ? 'You’re verified' : 'Verification needs another try'),
    body: decision === 'approved'
      ? tx('Your profile now shows the verified badge.')
      : cleanNote || tx('We couldn’t match your selfie to your photos. Please try again in good light.'),
    data: { target: 'verification' },
  });
  // The selfie has done its job once reviewed
  await storage.deleteObject(v.selfie_bucket, v.selfie_key).catch(() => {});
  return { id: verificationId, status: decision };
}

router.get('/', route(async (req, res) => res.json(await status(req.userId))));
router.post('/', route(async (req, res) => res.status(201).json(await submit(req.userId, req.body?.key))));

module.exports = { router, review, status };
