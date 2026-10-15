const crypto = require('crypto');

// Error carrying an HTTP status so the error middleware can map it to a response
function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

const newId = () => crypto.randomUUID();
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Constant-time comparison of two hex digests
function safeEqualHex(a, b) {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Normalises Indian mobile numbers to E.164 (+91XXXXXXXXXX); other countries must already include "+"
function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

// "+919876543210" -> "+91 98••• ••210"
function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 6) return '••••••';
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)}••• ••${digits.slice(-3)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Accepts "Mar 1997", "March 1997", "03/1997" or "1997-03"
function parseBirthYearMonth(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  let m = s.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) {
    const month = MONTHS.findIndex((name) => m[1].toLowerCase().startsWith(name.toLowerCase())) + 1;
    return month ? { year: Number(m[2]), month } : null;
  }
  m = s.match(/^(\d{1,2})[/-](\d{4})$/);
  if (m) return { year: Number(m[2]), month: Number(m[1]) };
  m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  return null;
}

const formatBirthYearMonth = (year, month) => (year && month ? `${MONTHS[month - 1]} ${year}` : null);

function ageFrom(year, month, now = new Date()) {
  if (!year || !month) return null;
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month) age -= 1;
  return age;
}

// "Just now" / "5m ago" / "3h ago" / "Yesterday" / "3 days ago" / "2 weeks ago"
function relativeTime(date, now = Date.now()) {
  if (!date) return null;
  const mins = Math.floor((now - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? 'Last week' : `${weeks} weeks ago`;
}

module.exports = {
  httpError,
  newId,
  sha256,
  randomToken,
  safeEqualHex,
  normalizePhone,
  maskPhone,
  parseBirthYearMonth,
  formatBirthYearMonth,
  ageFrom,
  relativeTime,
};
