// In-memory stand-in for Depot (the storage gateway) implementing the parts of its API the backend uses:
// buckets, objects, signed GET/PUT URLs with expiry and exact Content-Type checks, and multipart uploads.
// `advance(seconds)` moves its clock forward so tests can check that signed links expire.
const http = require('http');
const crypto = require('crypto');

const API_KEY = 'sk_test_fake_depot_key';

function startFakeDepot() {
  const buckets = new Map(); // name -> { public, objects: Map(key -> { body, contentType, etag, meta }) }
  const signatures = new Map(); // sig -> { bucket, key, method, contentType, exp }
  const multiparts = new Map(); // uploadId -> { bucket, key, contentType, parts: Map(n -> { body, etag }) }
  let offsetMs = 0;
  let base;
  const now = () => Date.now() + offsetMs;

  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  const fail = (res, status, code, message = code) => json(res, status, { error: { code, message } });
  const readBody = (req) => new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
  const etagOf = (buf) => `"${crypto.createHash('md5').update(buf).digest('hex')}"`;
  const publicUrl = (bucket, key) => (buckets.get(bucket)?.public ? `${base}/files/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}` : null);
  const sign = (entry) => {
    const sig = crypto.randomBytes(16).toString('hex');
    signatures.set(sig, entry);
    return sig;
  };
  const sendObject = (res, obj, head = false) => {
    res.writeHead(200, { 'Content-Type': obj.contentType, 'Content-Length': obj.body.length, ETag: obj.etag });
    res.end(head ? undefined : obj.body);
  };

  async function handle(req, res) {
    const url = new URL(req.url, base);
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

    // ----- files domain: signed links, multipart part uploads, public reads -----
    if (parts[0] === 'signed' || parts[0] === 'part') {
      const s = signatures.get(url.searchParams.get('sig'));
      if (!s || s.exp < now() || s.method !== req.method) return fail(res, 403, 'signature_invalid');
      if (parts[0] === 'part') {
        const body = await readBody(req);
        const etag = etagOf(body);
        multiparts.get(s.uploadId)?.parts.set(s.partNumber, { body, etag });
        res.writeHead(200, { ETag: etag });
        return res.end();
      }
      const bucket = buckets.get(s.bucket);
      if (req.method === 'PUT') {
        if ((req.headers['content-type'] || '') !== s.contentType) return fail(res, 403, 'signature_mismatch');
        const body = await readBody(req);
        bucket.objects.set(s.key, { body, contentType: s.contentType, etag: etagOf(body), meta: {} });
        res.writeHead(200, { ETag: etagOf(body) });
        return res.end();
      }
      const obj = bucket.objects.get(s.key);
      return obj ? sendObject(res, obj) : fail(res, 404, 'not_found');
    }
    if (parts[0] === 'files') {
      const bucket = buckets.get(parts[1]);
      const obj = bucket?.public && bucket.objects.get(parts.slice(2).join('/'));
      return obj ? sendObject(res, obj) : fail(res, 404, 'not_found');
    }

    // ----- API -----
    if (req.headers.authorization !== `Bearer ${API_KEY}`) return fail(res, 401, 'unauthorized');
    if (parts[0] !== 'v1') return fail(res, 404, 'not_found');
    if (parts[1] === 'me') return json(res, 200, { app: { id: 'app_test', slug: 'test-app', name: 'Test', disabled: false, createdAt: new Date().toISOString() } });
    if (parts[1] !== 'buckets') return fail(res, 404, 'not_found');

    if (parts.length === 2 && req.method === 'GET') {
      return json(res, 200, { buckets: [...buckets].map(([n, b]) => ({ name: n, physicalName: `app-${n}`, public: b.public, url: null })) });
    }
    if (parts.length === 2 && req.method === 'POST') {
      const { name, public: isPublic = false } = JSON.parse(await readBody(req));
      if (buckets.has(name)) return fail(res, 409, 'bucket_exists');
      buckets.set(name, { public: isPublic, objects: new Map() });
      return json(res, 201, { bucket: { name, public: isPublic } });
    }
    const name = parts[2];
    const bucket = buckets.get(name);
    if (!bucket) return fail(res, 404, 'bucket_not_found');
    const action = parts[3];

    if (action === 'objects' && parts.length === 4 && req.method === 'GET') {
      const prefix = url.searchParams.get('prefix') || '';
      const objects = [...bucket.objects.entries()].filter(([k]) => k.startsWith(prefix))
        .map(([key, o]) => ({ key, size: o.body.length, etag: o.etag, url: publicUrl(name, key) }));
      return json(res, 200, { objects, prefixes: [], truncated: false, cursor: null });
    }
    if (action === 'objects') {
      const key = parts.slice(4).join('/');
      if (req.method === 'PUT') {
        const body = await readBody(req);
        const contentType = req.headers['content-type'] || 'application/octet-stream';
        bucket.objects.set(key, { body, contentType, etag: etagOf(body), meta: {} });
        return json(res, 201, { object: { key, etag: etagOf(body), contentType, url: publicUrl(name, key) } });
      }
      if (req.method === 'DELETE') {
        bucket.objects.delete(key);
        res.writeHead(204);
        return res.end();
      }
      const obj = bucket.objects.get(key);
      if (!obj) return req.method === 'HEAD' ? (res.writeHead(404), res.end()) : fail(res, 404, 'not_found');
      return sendObject(res, obj, req.method === 'HEAD');
    }
    if (action === 'delete' && req.method === 'POST') {
      const { keys } = JSON.parse(await readBody(req));
      const deleted = keys.filter((k) => bucket.objects.delete(k));
      return json(res, 200, { deleted, errors: [] });
    }
    if (action === 'presign' && req.method === 'POST') {
      const { key, method, expiresIn = 3600, contentType } = JSON.parse(await readBody(req));
      const exp = now() + expiresIn * 1000;
      const sig = sign({ bucket: name, key, method, contentType, exp });
      return json(res, 200, {
        url: `${base}/signed/${name}/${key.split('/').map(encodeURIComponent).join('/')}?sig=${sig}`,
        method, key, expiresAt: new Date(exp).toISOString(),
        headers: method === 'PUT' ? { 'Content-Type': contentType } : {},
      });
    }
    if (action === 'multipart') {
      const uploadId = parts[4];
      const body = req.method === 'DELETE' ? {} : JSON.parse((await readBody(req)).toString() || '{}');
      if (!uploadId && req.method === 'POST') {
        const id = crypto.randomBytes(8).toString('hex');
        multiparts.set(id, { bucket: name, key: body.key, contentType: body.contentType, parts: new Map() });
        return json(res, 200, { uploadId: id, key: body.key });
      }
      const mp = multiparts.get(uploadId);
      if (!mp) return fail(res, 404, 'upload_not_found');
      if (req.method === 'DELETE') {
        multiparts.delete(uploadId);
        res.writeHead(204);
        return res.end();
      }
      if (parts[5] === 'parts') {
        return json(res, 200, {
          parts: body.partNumbers.map((n) => ({ partNumber: n, url: `${base}/part/${uploadId}/${n}?sig=${sign({ uploadId, partNumber: n, method: 'PUT', exp: now() + 3600 * 1000 })}` })),
        });
      }
      if (parts[5] === 'complete') {
        const chunks = [];
        for (const p of body.parts) {
          const stored = mp.parts.get(p.partNumber);
          if (!stored || stored.etag !== p.etag) return fail(res, 400, 'invalid_part');
          chunks.push(stored.body);
        }
        const all = Buffer.concat(chunks);
        bucket.objects.set(mp.key, { body: all, contentType: mp.contentType, etag: etagOf(all), meta: {} });
        multiparts.delete(uploadId);
        return json(res, 200, { object: { key: mp.key, etag: etagOf(all), contentType: mp.contentType, url: publicUrl(name, mp.key) } });
      }
    }
    return fail(res, 404, 'not_found');
  }

  const server = http.createServer((req, res) => handle(req, res).catch((err) => fail(res, 500, 'internal', err.message)));
  return new Promise((resolve) => server.listen(0, () => {
    base = `http://localhost:${server.address().port}`;
    resolve({
      url: base,
      apiKey: API_KEY,
      // Every key in a bucket (optionally under a prefix)
      keys: (bucket, prefix = '') => [...(buckets.get(bucket)?.objects.keys() || [])].filter((k) => k.startsWith(prefix)),
      object: (bucket, key) => buckets.get(bucket)?.objects.get(key) || null,
      isPublic: (bucket) => Boolean(buckets.get(bucket)?.public),
      advance: (seconds) => { offsetMs += seconds * 1000; },
      stop: () => new Promise((r) => server.close(r)),
    });
  }));
}

module.exports = { startFakeDepot };
