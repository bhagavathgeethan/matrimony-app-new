// Manual end-to-end check of file storage against a running backend and the real Depot:
//   health → photo: sign → upload → complete → view → delete → large video: multipart → view → delete
//
//   node scripts/storage-smoke.js [--api http://localhost:5000/api] [--phone +919999999999] [--video-mb 210] [--wait-expiry]
//
// Signs in with the dev OTP echo, so run it against a development backend (OTP_DEV_ECHO=true) and use a phone listed in
// ADMIN_PHONES (large uploads are admin-only for now). --wait-expiry waits 5½ minutes to confirm a signed link expires.
const path = require('path');
const { pathToFileURL } = require('url');
const sharp = require('sharp');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const API = arg('api', 'http://localhost:5000/api').replace(/\/$/, '');
const PHONE = arg('phone', '+919999999999');
const VIDEO_MB = Number(arg('video-mb', 210));
const WAIT_EXPIRY = process.argv.includes('--wait-expiry');

let token;
async function request(p, { method = 'GET', body, timeout = 120000 } = {}) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${p} → ${res.status} ${JSON.stringify(data)}`);
  return data;
}

const step = async (label, fn) => {
  process.stdout.write(`• ${label} … `);
  const started = Date.now();
  const result = await fn();
  console.log(`ok (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  return result;
};

async function main() {
  const { uploadFile, uploadLargeFile } = await import(pathToFileURL(path.join(__dirname, '..', '..', 'shared', 'uploads.js')).href);

  await step('health: database and storage connected', async () => {
    const h = await request('/health');
    if (h.storage !== 'connected') throw new Error(`storage is ${h.storage}; check the backend log for "STORAGE ERROR"`);
  });
  await step(`sign in ${PHONE}`, async () => {
    const sent = await request('/auth/otp/send', { method: 'POST', body: { phone: PHONE } });
    if (!sent.devCode) throw new Error('no devCode: the backend must run with OTP_DEV_ECHO=true');
    token = (await request('/auth/otp/verify', { method: 'POST', body: { phone: PHONE, code: sent.devCode } })).token;
  });

  // ---------- photo ----------
  const image = await sharp({ create: { width: 800, height: 1000, channels: 3, background: '#a81e3c' } }).jpeg().toBuffer();
  const key = await step('photo: sign + direct PUT to storage', () => uploadFile(request, new Blob([image], { type: 'image/jpeg' }), { purpose: 'photo', filename: 'smoke.jpg' }));
  const profile = await step('photo: complete (server processes it)', () => request('/me/photos', { method: 'POST', body: { key } }));
  const photo = profile.photos[profile.photos.length - 1];
  const signedUrl = await step('photo: view original through /api/media (302 → signed URL)', async () => {
    const first = await fetch(photo.url, { redirect: 'manual' });
    if (first.status !== 302) throw new Error(`expected 302, got ${first.status}`);
    const url = first.headers.get('location');
    const img = await fetch(url);
    if (!img.ok || img.headers.get('content-type') !== 'image/jpeg') throw new Error(`signed URL gave ${img.status} ${img.headers.get('content-type')}`);
    return url;
  });
  await step('photo: blurred copy through its own signed link', async () => {
    const first = await fetch(photo.blurUrl, { redirect: 'manual' });
    if (first.status !== 302) throw new Error(`expected 302, got ${first.status}`);
    const res = await fetch(first.headers.get('location'));
    if (!res.ok) throw new Error(`blurred copy → ${res.status}`);
  });
  await step('photo: the bucket is not publicly readable', async () => {
    const res = await fetch(signedUrl.split('?')[0]);
    await res.body?.cancel();
    if (res.ok) throw new Error('the file opened without a signature: make the bucket private');
  });
  if (WAIT_EXPIRY) {
    await step('photo: signed URL stops working after 5 minutes (waiting 330 s)', async () => {
      await new Promise((r) => setTimeout(r, 330000));
      const res = await fetch(signedUrl);
      if (res.ok) throw new Error('signed URL still works');
    });
  }
  await step('photo: delete removes it', async () => {
    await request(`/me/photos/${photo.id}`, { method: 'DELETE' });
    const res = await fetch(photo.url, { redirect: 'manual' });
    if (res.status !== 404) throw new Error(`photo link still answers ${res.status}`);
  });

  // ---------- large video (multipart) ----------
  const size = VIDEO_MB * 1024 * 1024;
  const video = new Blob([Buffer.alloc(size, 1)], { type: 'video/mp4' });
  let last = -1;
  const file = await step(`video: ${VIDEO_MB} MB multipart upload`, () => uploadLargeFile(request, video, {
    purpose: 'video',
    filename: 'smoke.mp4',
    onProgress: (f) => {
      const pct = Math.floor(f * 10) * 10;
      if (pct !== last) process.stdout.write(`${(last = pct)}% `);
    },
  }));
  if (file.size !== size) throw new Error(`stored size ${file.size} ≠ ${size}`);
  await step('video: view through a signed link', async () => {
    const { url } = await request(`/me/uploads/${file.id}/view?format=json`);
    const res = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    if (![200, 206].includes(res.status)) throw new Error(`signed URL gave ${res.status}`);
    await res.body?.cancel();
  });
  await step('video: delete', async () => {
    const { url } = await request(`/me/uploads/${file.id}/view?format=json`);
    await request(`/me/uploads/${file.id}`, { method: 'DELETE' });
    const res = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    await res.body?.cancel();
    if (res.ok) throw new Error('deleted video still served');
  });
  console.log('\nAll storage checks passed.');
}

main().catch((err) => {
  console.error(`\nFAILED: ${err.message}`);
  process.exit(1);
});
