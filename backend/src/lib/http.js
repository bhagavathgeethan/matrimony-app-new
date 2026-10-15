// Express 4 does not catch rejected promises; forward them to the error handler
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// Validation helpers that throw 400s with readable messages
const { httpError } = require('./util');

function optionalString(body, key, { max = 200, allowEmpty = false } = {}) {
  const value = body[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') throw httpError(400, `${key} must be text`);
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) throw httpError(400, `${key} cannot be empty`);
  if (trimmed.length > max) throw httpError(400, `${key} must be at most ${max} characters`);
  return trimmed;
}

function optionalBoolean(body, key) {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw httpError(400, `${key} must be true or false`);
  return value;
}

function oneOf(body, key, allowed) {
  const value = body[key];
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) throw httpError(400, `${key} must be one of: ${allowed.join(', ')}`);
  return value;
}

module.exports = { route, optionalString, optionalBoolean, oneOf };
