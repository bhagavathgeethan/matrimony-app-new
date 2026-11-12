// Copies the repository's shared/ folder into backend/shared, converted to CommonJS.
// Hosts that deploy only the backend folder (Hostinger) clone the whole repo for the build but ship just
// backend/, so ../shared is missing at runtime. shared/ is written as ES modules (the web and mobile apps
// import it); converting it lets the backend require() it on any Node version, not only 22.12+.
// Run as the build step: `npm run build`.
const fs = require('fs');
const path = require('path');
let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  try {
    esbuild = require(path.resolve(__dirname, '..', '..', 'frontend', 'node_modules', 'esbuild'));
  } catch {
    try {
      esbuild = require(path.resolve(__dirname, '..', '..', 'web', 'node_modules', 'esbuild'));
    } catch {
      esbuild = null;
    }
  }
}

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
let count = 0;
(function copy(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copy(s, d);
    else if (entry.name.endsWith('.js') && esbuild) {
      const { code } = esbuild.transformSync(fs.readFileSync(s, 'utf8'), {
        format: 'cjs', platform: 'node', target: 'node18', sourcefile: s,
      });
      fs.writeFileSync(d, code);
      count += 1;
    } else {
      fs.copyFileSync(s, d);
      count += 1;
    }
  }
})(from, to);
// Mark the folder as CommonJS whatever the surrounding package.json says
fs.writeFileSync(path.join(to, 'package.json'), '{ "type": "commonjs" }\n');
console.log(`[copy-shared] Converted ${count} files from ${from} -> ${to}`);
