// Copies the repository's shared/ folder into backend/shared. Hosts that deploy only the backend folder
// (Hostinger) clone the whole repo for the build but ship just backend/, so ../shared is missing at runtime.
// Run as the build step: `npm run build`.
const fs = require('fs');
const path = require('path');

const from = path.resolve(__dirname, '..', '..', 'shared');
const to = path.resolve(__dirname, '..', 'shared');

if (!fs.existsSync(from)) {
  if (fs.existsSync(to)) {
    console.log('[copy-shared] ../shared not found; keeping existing backend/shared');
    process.exit(0);
  }
  console.error(`[copy-shared] ${from} not found and backend/shared is missing`);
  process.exit(1);
}
fs.rmSync(to, { recursive: true, force: true });
fs.cpSync(from, to, { recursive: true });
console.log(`[copy-shared] Copied ${from} -> ${to}`);
