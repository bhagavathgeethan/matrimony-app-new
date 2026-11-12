// Loads a module from the shared/ folder (code used by the backend, web and mobile apps).
// Deployed backend: backend/shared (copied by `npm run build`). Local checkout: the repository's shared/.
const fs = require('fs');
const path = require('path');

const local = path.resolve(__dirname, '..', '..', 'shared');
const repo = path.resolve(__dirname, '..', '..', '..', 'shared');

module.exports = (file) => {
  if (fs.existsSync(path.join(local, file))) return require(path.join(local, file));
  return require(path.join(repo, file));
};
