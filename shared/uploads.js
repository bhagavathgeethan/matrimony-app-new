// Direct uploads to file storage, shared by the mobile and web apps.
// Our backend signs each upload; the file goes straight from the device to storage (never through the backend).
//   uploadFile(request, file, { purpose, ...extra, onProgress }) -> key           single signed PUT
//   uploadLargeFile(request, file, { purpose, onProgress }) -> { id, key, … }    multipart, 10 MB parts, 4 at a time
// `request` is the API client's request function; onProgress gets a fraction 0..1.

const MULTIPART_PARALLEL = 4;
const PART_RETRIES = 3;

// PUT with upload progress. XMLHttpRequest is the only browser API with upload progress events;
// fetch is the fallback (e.g. Node scripts), reporting progress only at the end.
export function putWithProgress(url, body, headers = {}, onProgress) {
  if (typeof XMLHttpRequest === 'undefined') {
    return fetch(url, { method: 'PUT', headers, body }).then((res) => {
      if (!res.ok) throw Object.assign(new Error(`Upload failed (${res.status})`), { status: res.status });
      onProgress?.(1);
      return { etag: res.headers.get('etag') };
    });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve({ etag: xhr.getResponseHeader('ETag') });
      } else {
        reject(Object.assign(new Error(`Upload failed (${xhr.status})`), { status: xhr.status }));
      }
    };
    xhr.onerror = () => reject(Object.assign(new Error('Upload failed: network error'), { status: 0 }));
    xhr.send(body);
  });
}

// Some devices leave File.type empty: fall back to the extension
const TYPE_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4a: 'audio/mp4', ogg: 'audio/ogg', mp3: 'audio/mpeg', aac: 'audio/aac',
};
const contentTypeOf = (file, filename) => (file.type || TYPE_BY_EXT[String(filename || file.name || '').split('.').pop().toLowerCase()]
  || 'application/octet-stream').split(';')[0];

export async function uploadFile(request, file, { onProgress, filename, ...extra }) {
  const contentType = contentTypeOf(file, filename);
  const signed = await request('/me/uploads/sign', {
    method: 'POST',
    body: { ...extra, contentType, size: file.size, filename: filename || file.name || 'file' },
  });
  // Send exactly the signed headers, or the signature check fails
  await putWithProgress(signed.url, file, signed.headers, onProgress);
  return signed.key;
}

export async function uploadLargeFile(request, file, { purpose, onProgress, filename }) {
  const contentType = contentTypeOf(file, filename);
  const started = await request('/me/uploads/multipart', {
    method: 'POST',
    body: { purpose, contentType, size: file.size, filename: filename || file.name || 'file' },
  });
  const { id, partSize, partCount } = started;
  const loaded = new Array(partCount).fill(0);
  const report = () => onProgress?.(Math.min(1, loaded.reduce((a, b) => a + b, 0) / file.size));
  try {
    const parts = [];
    // Sign URLs in batches (max 1000 per call), then upload each batch MULTIPART_PARALLEL parts at a time
    for (let first = 1; first <= partCount; first += 1000) {
      const numbers = Array.from({ length: Math.min(1000, partCount - first + 1) }, (_, i) => first + i);
      const { parts: urls } = await request(`/me/uploads/multipart/${id}/parts`, { method: 'POST', body: { partNumbers: numbers } });
      const queue = [...urls];
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { partNumber, url } = next;
          const chunk = file.slice((partNumber - 1) * partSize, partNumber * partSize);
          let result;
          for (let attempt = 1; !result; attempt += 1) {
            try {
              result = await putWithProgress(url, chunk, {}, (f) => { loaded[partNumber - 1] = f * chunk.size; report(); });
            } catch (err) {
              if (attempt >= PART_RETRIES) throw err;
            }
          }
          // Storage must expose the ETag header to the browser (CORS Access-Control-Expose-Headers: ETag)
          if (!result.etag) throw new Error('Upload failed: storage did not return the part ETag');
          parts.push({ partNumber, etag: result.etag });
        }
      };
      await Promise.all(Array.from({ length: Math.min(MULTIPART_PARALLEL, urls.length) }, worker));
    }
    return await request(`/me/uploads/multipart/${id}/complete`, { method: 'POST', body: { parts } });
  } catch (err) {
    await request(`/me/uploads/multipart/${id}`, { method: 'DELETE' }).catch(() => {});
    throw err;
  }
}
