// Loads a module from the shared/ folder (code used by the backend, web and mobile apps).
// Deployed backend: backend/shared (copied by `npm run build`). Local checkout: the repository's shared/.
const fs = require('fs');
const path = require('path');

const local = path.resolve(__dirname, '..', '..', 'shared');
const SHARED_DIR = fs.existsSync(local) ? local : path.resolve(__dirname, '..', '..', '..', 'shared');

module.exports = (file) => require(path.join(SHARED_DIR, file));
