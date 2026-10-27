// One-time move of files saved by the old local storage driver into the Depot bucket (STORAGE_BUCKET):
//   photos         UPLOAD_DIR/<key>          (original and blurred copy)
//   selfies        PRIVATE_UPLOAD_DIR/<key>  (pending reviews only; reviewed selfies were already deleted)
//   voice notes    PRIVATE_UPLOAD_DIR/<key>
// Keys stay the same and each row's bucket column is set to STORAGE_BUCKET. Safe to re-run: files already in the
// bucket are skipped. Local files are left in place; delete the folders yourself once the app works without them.
//
//   node scripts/migrate-local-uploads.js [--dry-run]
const fs = require('fs/promises');
const path = require('path');
const env = require('../src/config/env');
const db = require('../src/config/db');
const storage = require('../src/services/storage');

const DRY = process.argv.includes('--dry-run');
const TYPES = { jpg: 'image/jpeg', webm: 'audio/webm', ogg: 'audio/ogg', m4a: 'audio/mp4', mp3: 'audio/mpeg', aac: 'audio/aac' };

async function readLocal(dir, key) {
  const file = path.resolve(dir, key);
  if (!file.startsWith(dir + path.sep)) throw new Error(`Invalid key ${key}`);
  try {
    return await fs.readFile(file);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Uploads one local file unless it's already in the bucket; returns the stored object, or null if the file is missing
async function move(dir, bucket, key) {
  if (await storage.headObject(bucket, key)) return { key };
  const buffer = await readLocal(dir, key);
  if (!buffer) return null;
  if (DRY) return { key };
  return storage.putObject(bucket, key, buffer, TYPES[key.split('.').pop()] || 'application/octet-stream');
}

async function main() {
  const check = await storage.check();
  if (!check.ok) throw new Error(`Storage is not usable: ${check.error}`);
  const counts = { photos: 0, selfies: 0, voice: 0, missing: 0 };

  const bucket = storage.BUCKET;
  for (const p of (await db.query('SELECT * FROM photos')).rows) {
    const original = await move(env.UPLOAD_DIR, bucket, p.storage_key);
    const blur = await move(env.UPLOAD_DIR, bucket, p.blur_key);
    if (!original || !blur) {
      counts.missing += 1;
      console.warn(`Photo ${p.id}: local file missing (${!original ? p.storage_key : p.blur_key})`);
      continue;
    }
    if (!DRY) await db.query('UPDATE photos SET storage_bucket = $2, blur_bucket = $2 WHERE id = $1', [p.id, bucket]);
    counts.photos += 1;
  }

  for (const v of (await db.query(`SELECT * FROM verifications WHERE status = 'pending'`)).rows) {
    if (!(await move(env.PRIVATE_UPLOAD_DIR, bucket, v.selfie_key))) {
      counts.missing += 1;
      console.warn(`Selfie ${v.id}: local file missing (${v.selfie_key})`);
      continue;
    }
    if (!DRY) await db.query('UPDATE verifications SET selfie_bucket = $2 WHERE id = $1', [v.id, bucket]);
    counts.selfies += 1;
  }

  for (const m of (await db.query(`SELECT id, media_key FROM messages WHERE kind = 'voice' AND media_key IS NOT NULL`)).rows) {
    if (!(await move(env.PRIVATE_UPLOAD_DIR, bucket, m.media_key))) {
      counts.missing += 1;
      console.warn(`Voice note ${m.id}: local file missing (${m.media_key})`);
      continue;
    }
    if (!DRY) await db.query('UPDATE messages SET media_bucket = $2 WHERE id = $1', [m.id, bucket]);
    counts.voice += 1;
  }

  console.log(`${DRY ? '[dry run] ' : ''}Moved ${counts.photos} photos, ${counts.selfies} selfies, ${counts.voice} voice notes; ${counts.missing} missing locally.`);
}

main()
  .catch((err) => {
    console.error(`Migration failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
