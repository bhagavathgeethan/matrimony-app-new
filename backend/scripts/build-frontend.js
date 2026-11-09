const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(backendDir, '../frontend');
const publicDir = path.join(backendDir, 'public');

console.log('[Build] Building frontend from:', frontendDir);

// 1. Install frontend dependencies if needed
const frontendNodeModules = path.join(frontendDir, 'node_modules');
if (!fs.existsSync(frontendNodeModules)) {
  console.log('[Build] Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
}

// 2. Build the Vite frontend
console.log('[Build] Running frontend vite build...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// 3. Ensure backend/public directory exists and clean old files
const distDir = path.join(frontendDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('[Build Error] dist folder was not found at:', distDir);
  process.exit(1);
}

console.log('[Build] Copying dist files to:', publicDir);
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.cpSync(distDir, publicDir, { recursive: true });

console.log('[Build Complete] Frontend successfully copied to backend/public!');

