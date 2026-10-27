// Direct browser uploads to storage. The client asks us to sign an upload, PUTs the file straight to storage,
// then calls the feature's own endpoint (e.g. POST /me/photos { key }) which claims the upload here.
// Each feature registers a "purpose": allowed types, size limit, bucket, key layout and who may upload.
// Large files (purpose.multipart) go through the multipart endpoints in 10 MB parts.
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const { sendSigned } = require('./media');
const { httpError, newId } = require('../lib/util');
const { route } = require('../lib/http');

const router = express.Router();
const PART_SIZE = 10 * 1024 * 1024;
const PENDING_TTL_HOURS = 24;

// name -> { bucket, types, maxBytes, keyFor(userId, filename, context), authorize?(userId, body) -> context, multipart?, standalone? }
const purposes = new Map();
const registerPurpose = (name, spec) => purposes.set(name, spec);

function purposeOf(name) {
  const p = purposes.get(name);
  if (!p) throw httpError(400, `purpose must be one of: ${[...purposes.keys()].join(', ')}`);
  return p;
}

const baseType = (type) => String(type || '').split(';')[0].trim().toLowerCase();

// Validates type and size, checks the user may upload, and records the server-generated key
async function prepare(userId, body) {
  const purpose = purposeOf(body.purpose);
  const contentType = baseType(body.contentType);
  if (!purpose.types.includes(contentType)) throw httpError(400, 'That file type isn’t supported here');
  const size = Number(body.size);
  if (!Number.isInteger(size) || size <= 0) throw httpError(400, 'size must be the file size in bytes');
  if (size > purpose.maxBytes) throw httpError(413, `File must be under ${Math.round(purpose.maxBytes / 1024 / 1024)} MB`);
  const context = (await purpose.authorize?.(userId, body)) || {};
  const key = purpose.keyFor(userId, typeof body.filename === 'string' ? body.filename : 'file', context);
  return { purpose, contentType, size, context, key };
}

async function sign(userId, body) {
  const { purpose, contentType, size, context, key } = await prepare(userId, body);
  if (purpose.multipart && size > PART_SIZE * 10) throw httpError(400, 'Use a multipart upload for files this large');
  const signed = await storage.getSignedUploadUrl(purpose.bucket, key, { contentType });
  await db.query(
    `INSERT INTO uploads (id, user_id, purpose, bucket, key, content_type, size_bytes, context) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [newId(), userId, body.purpose, purpose.bucket, key, contentType, size, context]
  );
  return { url: signed.url, headers: signed.headers || { 'Content-Type': contentType }, key, expiresAt: signed.expiresAt };
}

// Called by the feature endpoint: atomically takes a pending upload this user signed, and checks the object
// really arrived with the signed type and size. Returns { upload, object }; call release() if processing fails.
async function claim(userId, purposeName, key) {
  if (typeof key !== 'string' || !key) throw httpError(400, 'key is required (from the upload you just finished)');
  const upload = (await db.query(
    `UPDATE uploads SET completed_at = NOW()
     WHERE key = $1 AND user_id = $2 AND purpose = $3 AND completed_at IS NULL AND multipart_id IS NULL RETURNING *`,
    [key, userId, purposeName]
  )).rows[0];
  if (!upload) throw httpError(400, 'Upload not found. Please try again.');
  try {
    const object = await storage.headObject(upload.bucket, upload.key);
    if (!object) throw httpError(400, 'The upload didn’t finish. Please try again.');
    if (object.size > purposeOf(purposeName).maxBytes || baseType(object.contentType) !== upload.content_type) {
      await storage.deleteObject(upload.bucket, upload.key);
      await db.query('DELETE FROM uploads WHERE id = $1', [upload.id]);
      throw httpError(400, 'The uploaded file doesn’t match what was signed');
    }
    return { upload, object };
  } catch (err) {
    await release(upload);
    throw err;
  }
}

// Makes a claimed upload retryable again (if its row still exists)
const release = (upload) => db.query('UPDATE uploads SET completed_at = NULL WHERE id = $1', [upload.id]).catch(() => {});

// The upload became part of a record (or was processed into new objects): forget it
const consume = (upload, client = db) => client.query('DELETE FROM uploads WHERE id = $1', [upload.id]);

// ---------- standalone files (no owning record yet, e.g. large videos) ----------

const toFile = (u) => ({ id: u.id, key: u.key, purpose: u.purpose, contentType: u.content_type, size: Number(u.size_bytes), createdAt: u.created_at, completed: Boolean(u.completed_at) });

async function ownedUpload(userId, id, { multipart = false } = {}) {
  const u = (await db.query('SELECT * FROM uploads WHERE id = $1 AND user_id = $2', [id, userId])).rows[0];
  if (!u || (multipart && !u.multipart_id)) throw httpError(404, 'Upload not found');
  return u;
}

async function completeStandalone(userId, key) {
  const row = (await db.query('SELECT purpose FROM uploads WHERE key = $1 AND user_id = $2', [key, userId])).rows[0];
  if (!row || !purposes.get(row.purpose)?.standalone) throw httpError(400, 'Upload not found. Please try again.');
  const { upload, object } = await claim(userId, row.purpose, key);
  await db.query('UPDATE uploads SET size_bytes = $2 WHERE id = $1', [upload.id, object.size]);
  return toFile({ ...upload, size_bytes: object.size });
}

async function removeUpload(userId, id) {
  const u = await ownedUpload(userId, id);
  if (u.multipart_id && !u.completed_at) await storage.abortMultipartUpload(u.bucket, u.multipart_id, u.key).catch(() => {});
  else await storage.deleteObject(u.bucket, u.key);
  await db.query('DELETE FROM uploads WHERE id = $1', [u.id]);
}

// ---------- multipart (files over ~100 MB) ----------

async function startMultipart(userId, body) {
  const { purpose, contentType, size, context, key } = await prepare(userId, body);
  if (!purpose.multipart) throw httpError(400, 'This kind of file uses a single upload');
  const { uploadId } = await storage.createMultipartUpload(purpose.bucket, key, contentType);
  const id = newId();
  await db.query(
    `INSERT INTO uploads (id, user_id, purpose, bucket, key, content_type, size_bytes, context, multipart_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, userId, body.purpose, purpose.bucket, key, contentType, size, context, uploadId]
  );
  return { id, key, partSize: PART_SIZE, partCount: Math.ceil(size / PART_SIZE) };
}

async function signParts(userId, id, partNumbers) {
  const u = await ownedUpload(userId, id, { multipart: true });
  if (u.completed_at) throw httpError(409, 'This upload is already complete');
  const partCount = Math.ceil(Number(u.size_bytes) / PART_SIZE);
  if (!Array.isArray(partNumbers) || !partNumbers.length || partNumbers.length > 1000
    || !partNumbers.every((n) => Number.isInteger(n) && n >= 1 && n <= Math.min(partCount, 10000))) {
    throw httpError(400, `partNumbers must be 1–1000 part numbers between 1 and ${partCount}`);
  }
  return { parts: await storage.signMultipartParts(u.bucket, u.multipart_id, u.key, partNumbers) };
}

async function completeMultipart(userId, id, parts) {
  const u = await ownedUpload(userId, id, { multipart: true });
  if (u.completed_at) throw httpError(409, 'This upload is already complete');
  if (!Array.isArray(parts) || !parts.length || !parts.every((p) => Number.isInteger(p?.partNumber) && typeof p.etag === 'string')) {
    throw httpError(400, 'parts must be [{ partNumber, etag }]');
  }
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber).map(({ partNumber, etag }) => ({ partNumber, etag }));
  await storage.completeMultipartUpload(u.bucket, u.multipart_id, u.key, sorted);
  const object = await storage.headObject(u.bucket, u.key);
  if (!object || object.size > purposeOf(u.purpose).maxBytes) {
    await storage.deleteObject(u.bucket, u.key);
    await db.query('DELETE FROM uploads WHERE id = $1', [u.id]);
    throw httpError(400, 'The uploaded file doesn’t match what was signed');
  }
  const done = (await db.query('UPDATE uploads SET completed_at = NOW(), size_bytes = $2 WHERE id = $1 RETURNING *', [u.id, object.size])).rows[0];
  return toFile(done);
}

// ---------- cleanup ----------

// Uploads signed but never completed (closed tab, failed upload): delete their objects and rows
async function sweepAbandoned({ hours = PENDING_TTL_HOURS } = {}) {
  const stale = (await db.query(
    `SELECT * FROM uploads WHERE completed_at IS NULL AND created_at < NOW() - make_interval(hours => $1) LIMIT 500`,
    [hours]
  )).rows;
  for (const u of stale) {
    try {
      if (u.multipart_id) await storage.abortMultipartUpload(u.bucket, u.multipart_id, u.key).catch(() => {});
      await storage.deleteObject(u.bucket, u.key);
      await db.query('DELETE FROM uploads WHERE id = $1', [u.id]);
    } catch (err) {
      console.error(`Could not clean up upload ${u.id}: ${err.message}`);
    }
  }
  return stale.length;
}

// Every object a user's upload rows point to (for account erasure)
async function deleteAllFor(userId) {
  const rows = (await db.query('SELECT * FROM uploads WHERE user_id = $1', [userId])).rows;
  for (const u of rows) {
    if (u.multipart_id && !u.completed_at) await storage.abortMultipartUpload(u.bucket, u.multipart_id, u.key).catch(() => {});
    await storage.deleteObject(u.bucket, u.key);
  }
  await db.query('DELETE FROM uploads WHERE user_id = $1', [userId]);
}

// Large videos: no member-facing feature yet, so admins only (used to verify the multipart pipeline end to end)
registerPurpose('video', {
  bucket: storage.BUCKET,
  types: ['video/mp4', 'video/webm', 'video/quicktime'],
  maxBytes: env.MAX_VIDEO_BYTES,
  multipart: true,
  standalone: true,
  keyFor: (userId, filename) => storage.buildKey('users', `${userId}/videos`, filename),
  async authorize(userId) {
    const u = (await db.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0];
    if (u?.role !== 'admin') throw httpError(403, 'Admins only', 'FORBIDDEN');
  },
});

// ---------- routes (signed-in user; mounted at /api/me/uploads) ----------

router.post('/sign', route(async (req, res) => res.json(await sign(req.userId, req.body || {}))));
router.post('/complete', route(async (req, res) => res.status(201).json(await completeStandalone(req.userId, req.body?.key))));
router.post('/multipart', route(async (req, res) => res.status(201).json(await startMultipart(req.userId, req.body || {}))));
router.post('/multipart/:id/parts', route(async (req, res) => res.json(await signParts(req.userId, req.params.id, req.body?.partNumbers))));
router.post('/multipart/:id/complete', route(async (req, res) => res.json(await completeMultipart(req.userId, req.params.id, req.body?.parts))));
router.delete('/multipart/:id', route(async (req, res) => {
  await removeUpload(req.userId, req.params.id);
  res.status(204).end();
}));
router.get('/:id/view', route(async (req, res) => {
  const u = await ownedUpload(req.userId, req.params.id);
  if (!u.completed_at) throw httpError(404, 'Upload not found');
  await sendSigned(req, res, u.bucket, u.key);
}));
router.delete('/:id', route(async (req, res) => {
  await removeUpload(req.userId, req.params.id);
  res.status(204).end();
}));

module.exports = { router, registerPurpose, claim, release, consume, sweepAbandoned, deleteAllFor, PART_SIZE };
