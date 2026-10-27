// File storage on Depot (our S3-compatible gateway; see https://depot.thestucompany.com).
// Everything lives in one private bucket (STORAGE_BUCKET, default 'knotfiles'): photos and their blurred copies,
// selfies, voice notes. Files are only reachable through short-lived signed URLs the backend hands out.
// The database stores bucket + key; URLs are derived from them. The API key never leaves this server.
const crypto = require('crypto');
const env = require('../config/env');

const BUCKET = env.STORAGE_BUCKET;

// A Depot error response ({ error: { code, message } }) or a network failure (status 0)
class StorageError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'StorageError';
    this.status = status;
    this.code = code;
  }
}

// Keys: at most 1024 bytes, no leading '/', no '.' or '..' segments
function assertKey(key) {
  if (typeof key !== 'string' || !key || Buffer.byteLength(key) > 1024 || key.startsWith('/')
    || key.split('/').some((s) => s === '' || s === '.' || s === '..')) {
    throw new StorageError(400, 'invalid_key', 'Invalid storage key');
  }
  return key;
}

const encodeKey = (key) => assertKey(key).split('/').map(encodeURIComponent).join('/');

// "My Photo (1).HEIC" -> "my-photo-1.heic"
function sanitizeFilename(name) {
  const clean = String(name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(-80).replace(/^[-.]+/, '');
  return clean || 'file';
}

// <entity>/<id>/<uuid>-<filename>, e.g. users/42/9f1c…-avatar.png
const buildKey = (entity, id, filename) => `${entity}/${id}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

async function request(method, path, { json, body, headers = {}, query, raw = false, timeoutMs = env.STORAGE_TIMEOUT_MS } = {}) {
  if (!env.STORAGE_API_KEY) throw new StorageError(0, 'not_configured', 'STORAGE_API_KEY is not set');
  const url = new URL(`${env.STORAGE_URL}${path}`);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const init = { method, headers: { Authorization: `Bearer ${env.STORAGE_API_KEY}`, ...headers }, signal: AbortSignal.timeout(timeoutMs) };
  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  } else if (body !== undefined) {
    init.body = body;
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const timedOut = err.name === 'TimeoutError' || err.name === 'AbortError';
    throw new StorageError(0, timedOut ? 'timeout' : 'network', `Storage ${timedOut ? 'timed out' : 'unreachable'} (${method} ${path})`);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new StorageError(res.status, data?.error?.code || 'http_error', `${data?.error?.message || `Storage request failed (${res.status})`} (${method} ${url.pathname})`);
  }
  if (raw) return res;
  if (res.status === 204 || method === 'HEAD') return null;
  return res.json();
}

const objectPath = (bucket, key) => `/v1/buckets/${encodeURIComponent(bucket)}/objects/${encodeKey(key)}`;

// ---------- app and buckets ----------

const me = async () => (await request('GET', '/v1/me')).app;

// Creates the bucket (private) if missing; 409 = already there. An existing bucket's visibility is never changed,
// only reported: returns { public } so the caller can warn if it is publicly readable.
async function ensureBuckets() {
  try {
    await request('POST', '/v1/buckets', { json: { name: BUCKET, public: false } });
  } catch (err) {
    if (err.status !== 409) throw err;
  }
  const { buckets } = await request('GET', '/v1/buckets');
  return { public: Boolean(buckets.find((b) => b.name === BUCKET)?.public) };
}

// Startup / health check: never throws, returns { ok, app? , error? }
async function check() {
  try {
    const app = await me();
    const bucket = await ensureBuckets();
    return { ok: true, app, bucketPublic: bucket.public };
  } catch (err) {
    return { ok: false, error: `${err.message}${err.code ? ` [${err.code}]` : ''}` };
  }
}

// ---------- objects ----------

// Server-side upload, for files the server already has (processed photos). Returns { key, etag, contentType, url }.
async function putObject(bucket, key, buffer, contentType, meta = {}) {
  const headers = { 'Content-Type': contentType };
  for (const [k, v] of Object.entries(meta)) headers[`x-meta-${k}`] = String(v);
  return (await request('PUT', objectPath(bucket, key), { body: buffer, headers })).object;
}

async function getObject(bucket, key) {
  const res = await request('GET', objectPath(bucket, key), { raw: true });
  return Buffer.from(await res.arrayBuffer());
}

// { contentType, size, etag } or null when the object doesn't exist
async function headObject(bucket, key) {
  try {
    const res = await request('HEAD', objectPath(bucket, key), { raw: true });
    return {
      contentType: (res.headers.get('content-type') || '').split(';')[0],
      size: Number(res.headers.get('content-length') || 0),
      etag: res.headers.get('etag'),
    };
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function deleteObject(bucket, key) {
  if (!key) return;
  await request('DELETE', objectPath(bucket, key));
}

// Batch delete (chunks of 1000); returns the number deleted
async function deleteObjects(bucket, keys) {
  const list = [...new Set(keys.filter(Boolean))];
  let deleted = 0;
  for (let i = 0; i < list.length; i += 1000) {
    const res = await request('POST', `/v1/buckets/${encodeURIComponent(bucket)}/delete`, { json: { keys: list.slice(i, i + 1000) } });
    deleted += Array.isArray(res.deleted) ? res.deleted.length : Number(res.deleted) || 0;
  }
  return deleted;
}

const listObjects = (bucket, { prefix, delimiter, limit, cursor } = {}) => request('GET', `/v1/buckets/${encodeURIComponent(bucket)}/objects`, {
  query: { prefix, delimiter, limit, cursor },
});

// ---------- signed URLs ----------

async function presign(bucket, body) {
  assertKey(body.key);
  return request('POST', `/v1/buckets/${encodeURIComponent(bucket)}/presign`, { json: body });
}

// Short-lived GET link: { url, expiresAt }
const getSignedUrl = (bucket, key, { expiresIn = 300, download = false } = {}) => presign(bucket, { key, method: 'GET', expiresIn, download });

// Direct browser upload: { url, headers, key, expiresAt }. The client must send exactly `headers`.
const getSignedUploadUrl = (bucket, key, { contentType, expiresIn = 900 }) => presign(bucket, { key, method: 'PUT', contentType, expiresIn });

// ---------- multipart (large files) ----------

const multipartPath = (bucket, uploadId = '', rest = '') => `/v1/buckets/${encodeURIComponent(bucket)}/multipart${uploadId ? `/${encodeURIComponent(uploadId)}` : ''}${rest}`;

const createMultipartUpload = (bucket, key, contentType) => request('POST', multipartPath(bucket), { json: { key: assertKey(key), contentType } });
const signMultipartParts = async (bucket, uploadId, key, partNumbers, expiresIn = 3600) => (await request('POST', multipartPath(bucket, uploadId, '/parts'), {
  json: { key: assertKey(key), partNumbers, expiresIn },
})).parts;
const completeMultipartUpload = async (bucket, uploadId, key, parts) => (await request('POST', multipartPath(bucket, uploadId, '/complete'), {
  json: { key: assertKey(key), parts }, timeoutMs: Math.max(env.STORAGE_TIMEOUT_MS, 120000),
})).object;
const abortMultipartUpload = (bucket, uploadId, key) => request('DELETE', multipartPath(bucket, uploadId), { query: { key: assertKey(key) } });

module.exports = {
  BUCKET,
  StorageError,
  assertKey,
  sanitizeFilename,
  buildKey,
  me,
  ensureBuckets,
  check,
  putObject,
  getObject,
  headObject,
  deleteObject,
  deleteObjects,
  listObjects,
  getSignedUrl,
  getSignedUploadUrl,
  createMultipartUpload,
  signMultipartParts,
  completeMultipartUpload,
  abortMultipartUpload,
};
