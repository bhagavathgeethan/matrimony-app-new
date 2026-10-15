// File storage. The 'local' driver writes under UPLOAD_DIR and serves files from /uploads.
// A Cloudflare R2 driver will implement the same interface: put(key, buffer, mime), remove(key), url(key).
const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');

const localDriver = {
  name: 'local',

  async put(key, buffer) {
    const file = this.pathFor(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
  },

  async remove(key) {
    await fs.rm(this.pathFor(key), { force: true });
  },

  url(key) {
    return `${env.PUBLIC_BASE_URL}/uploads/${key}`;
  },

  // Keys are generated server-side, but guard against path traversal anyway
  pathFor(key) {
    const file = path.resolve(env.UPLOAD_DIR, key);
    if (!file.startsWith(env.UPLOAD_DIR + path.sep)) throw new Error('Invalid storage key');
    return file;
  },
};

const DRIVERS = { local: localDriver };

const driver = DRIVERS[env.STORAGE_DRIVER];
if (!driver) throw new Error(`Unknown STORAGE_DRIVER "${env.STORAGE_DRIVER}"`);

// Private files (verification selfies): kept outside the served upload folder and read back only by admins
const privateStorage = {
  async put(key, buffer) {
    const file = this.pathFor(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
  },
  read(key) {
    return fs.readFile(this.pathFor(key));
  },
  async remove(key) {
    await fs.rm(this.pathFor(key), { force: true });
  },
  pathFor(key) {
    const file = path.resolve(env.PRIVATE_UPLOAD_DIR, key);
    if (!file.startsWith(env.PRIVATE_UPLOAD_DIR + path.sep)) throw new Error('Invalid storage key');
    return file;
  },
};

driver.private = privateStorage;
module.exports = driver;
