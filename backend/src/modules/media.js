// Links to photos (all files are in a private bucket). The API decides who may see a clear photo when it builds a
// response (photosClearFor) and hands out a link to the original or to the blurred copy:
//   /api/media/photos/<id>?exp=<unix>&sig=<hmac>          original
//   /api/media/photos/<id>?blur=1&exp=<unix>&sig=<hmac>   blurred copy (signed separately, so it can't be turned into the original)
// Links expire (1–2 hours, rounded to the hour so browsers can cache them); opening one redirects to a 5-minute signed storage URL.
const crypto = require('crypto');
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const storage = require('../services/storage');
const { httpError, safeEqualHex } = require('../lib/util');
const { route } = require('../lib/http');

const router = express.Router();
const LINK_HOURS = 1;
const SIGNED_SECONDS = 300;

const hmac = (value) => crypto.createHmac('sha256', env.MEDIA_URL_SECRET).update(value).digest('hex');

function photoLink(photoId, { blurred = false, now = Date.now() } = {}) {
  const hour = 3600 * 1000;
  const exp = Math.floor((Math.ceil(now / hour) * hour + LINK_HOURS * hour) / 1000);
  const kind = blurred ? 'photo-blur' : 'photo';
  return `${env.PUBLIC_BASE_URL}/api/media/photos/${photoId}?${blurred ? 'blur=1&' : ''}exp=${exp}&sig=${hmac(`${kind}:${photoId}:${exp}`)}`;
}

// A photo row as a link to its original or its blurred copy
const photoUrl = (p, blurred = false) => photoLink(p.id, { blurred });

function verifyLink(kind, id, exp, sig) {
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false;
  return typeof sig === 'string' && /^[0-9a-f]{64}$/.test(sig) && safeEqualHex(sig, hmac(`${kind}:${id}:${expires}`));
}

// Reuse a signed storage URL while it has a good while left, so repeat views hit the browser/CDN cache
const signedCache = new Map();
async function cachedSignedUrl(bucket, key) {
  const id = `${bucket}/${key}`;
  const hit = signedCache.get(id);
  if (hit && hit.until > Date.now()) return hit.url;
  const { url } = await storage.getSignedUrl(bucket, key, { expiresIn: SIGNED_SECONDS });
  if (signedCache.size > 5000) signedCache.clear();
  signedCache.set(id, { url, until: Date.now() + (SIGNED_SECONDS - 60) * 1000 });
  return url;
}

// 302 to a short-lived signed URL; ?format=json (or Accept: application/json) returns { url } instead
async function sendSigned(req, res, bucket, key, { cache = false } = {}) {
  const url = cache ? await cachedSignedUrl(bucket, key) : (await storage.getSignedUrl(bucket, key, { expiresIn: SIGNED_SECONDS })).url;
  res.setHeader('Cache-Control', cache ? 'private, max-age=240' : 'no-store');
  if (req.query.format === 'json' || req.get('accept') === 'application/json') return res.json({ url });
  res.redirect(302, url);
}

router.get('/photos/:id', route(async (req, res) => {
  const blurred = req.query.blur === '1';
  if (!verifyLink(blurred ? 'photo-blur' : 'photo', req.params.id, req.query.exp, req.query.sig)) throw httpError(403, 'This photo link has expired');
  const p = (await db.query('SELECT storage_bucket, storage_key, blur_bucket, blur_key FROM photos WHERE id = $1', [req.params.id])).rows[0];
  if (!p) throw httpError(404, 'Photo not found');
  if (blurred) await sendSigned(req, res, p.blur_bucket, p.blur_key, { cache: true });
  else await sendSigned(req, res, p.storage_bucket, p.storage_key, { cache: true });
}));

module.exports = { router, photoUrl, photoLink, sendSigned };
