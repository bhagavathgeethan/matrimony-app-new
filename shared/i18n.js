// Interface language for both apps: English plus ten Indian languages. Keys are the English text, so
// anything not yet translated simply shows in English. t('Your profile is {n}% complete', { n: 40 })
// fills {placeholders}. Each language lives in ./locales/<code>.js with the same keys (a backend test
// checks this) and is loaded only when chosen. The choice is stored on this device.

const KEY = 'sangam.lang';

// [code, name in its own script, name in English]
export const UI_LANGUAGES = [
  ['en', 'English', 'English'],
  ['hi', 'हिन्दी', 'Hindi'],
  ['ta', 'தமிழ்', 'Tamil'],
  ['te', 'తెలుగు', 'Telugu'],
  ['kn', 'ಕನ್ನಡ', 'Kannada'],
  ['ml', 'മലയാളം', 'Malayalam'],
  ['mr', 'मराठी', 'Marathi'],
  ['bn', 'বাংলা', 'Bengali'],
  ['gu', 'ગુજરાતી', 'Gujarati'],
  ['pa', 'ਪੰਜਾਬੀ', 'Punjabi'],
  ['or', 'ଓଡ଼ିଆ', 'Odia'],
];
export const LANGUAGE_CODES = UI_LANGUAGES.map(([code]) => code);
export const isLanguage = (code) => LANGUAGE_CODES.includes(code);

const DICTS = {};
export const registerLanguage = (code, dict) => { DICTS[code] = dict; };

export function loadLanguage(code) {
  if (code === 'en' || DICTS[code] || !isLanguage(code)) return Promise.resolve();
  return import(`./locales/${code}.js`).then((m) => registerLanguage(code, m.default));
}

function fill(text, vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`)) : text;
}

// Text the server builds with a number or name inside ("5m ago", "Both: Trekking") is matched against
// these patterns and translated through its template. Captures named in `nested` are translated too.
const PATTERNS = [
  [/^(\d+)m ago$/, '{n}m ago', ['n']],
  [/^(\d+)h ago$/, '{n}h ago', ['n']],
  [/^(\d+) days ago$/, '{n} days ago', ['n']],
  [/^(\d+) weeks ago$/, '{n} weeks ago', ['n']],
  [/^ID verified (.+)$/, 'ID verified {when}', ['when'], ['when']],
  [/^Both: (.+)$/, 'Both: {vibe}', ['vibe'], ['vibe']],
  [/^(.+) APPROVED$/, '{name} APPROVED', ['name']],
  [/^(.+) IS UNSURE$/, '{name} IS UNSURE', ['name']],
  [/^(.+) approved · (.+)$/, '{name} approved · {when}', ['name', 'when'], ['when']],
  [/^(.+) is unsure · (.+)$/, '{name} is unsure · {when}', ['name', 'when'], ['when']],
  [/^(.+) raised a concern · (.+)$/, '{name} raised a concern · {when}', ['name', 'when'], ['when']],
  [/^MATCHED (\d+) DAYS AGO$/, 'MATCHED {n} DAYS AGO', ['n']],
  [/^(Plus|Premium|Family) · (\d+) months?$/, '{plan} · {n} months', ['plan', 'n'], ['plan']],
  [/^Your account is hidden from matches now and will be permanently erased within (\d+) hours\.$/,
    'Your account is hidden from matches now and will be permanently erased within {n} hours.', ['n']],
];

function viaPattern(code, dict, text) {
  for (const [re, key, names, nested = []] of PATTERNS) {
    const m = re.exec(text);
    if (!m || !dict[key]) continue;
    const vars = {};
    names.forEach((n, i) => {
      const v = m[i + 1];
      vars[n] = nested.includes(n) ? translate(code, v.charAt(0).toUpperCase() + v.slice(1)) : v;
    });
    return fill(dict[key], vars);
  }
  return null;
}

// A string in a given language, independent of this device's choice (server-side notifications)
export function translate(code, text, vars) {
  if (typeof text !== 'string') return text;
  const dict = code !== 'en' && DICTS[code];
  if (!dict) return fill(text, vars);
  if (dict[text]) return fill(dict[text], vars);
  return (!vars && viaPattern(code, dict, text)) || fill(text, vars);
}

function initial() {
  try {
    const saved = globalThis.localStorage?.getItem(KEY);
    return saved && isLanguage(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

function markDocument(code) {
  // lets the browser pick the right fonts and screen readers the right voice
  if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = code;
}

let lang = initial();
const listeners = new Set();

// Resolves once the saved language is loaded, so the first screen is already translated
export const languageReady = loadLanguage(lang).then(() => markDocument(lang), () => { lang = 'en'; });

export const getLanguage = () => lang;

// BCP 47 tag for dates and numbers, e.g. 'hi-IN'
export const localeTag = () => `${lang}-IN`;
// Dates and times written the way the chosen language writes them
export const formatDate = (value, options) => new Date(value).toLocaleDateString(localeTag(), options);
export const formatTime = (value, options = { hour: '2-digit', minute: '2-digit' }) => new Date(value).toLocaleTimeString(localeTag(), options);
export const formatDateTime = (value, options) => new Date(value).toLocaleString(localeTag(), options);

export async function setLanguage(next) {
  if (!isLanguage(next)) return;
  await loadLanguage(next);
  lang = next;
  markDocument(next);
  try {
    globalThis.localStorage?.setItem(KEY, next);
  } catch {
    // device storage unavailable: the choice lasts until the app closes
  }
  listeners.forEach((l) => l());
}

export function subscribeLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(text, vars) {
  return translate(lang, text, vars);
}

// A notification in the interface language: the server keeps the template in data.i18n
export function notificationText(n) {
  const i = n?.data?.i18n || {};
  const show = (entry, fallback) => {
    if (!entry) return fallback;
    const vars = entry.vars && Object.fromEntries(Object.entries(entry.vars).map(([k, v]) => [k, typeof v === 'string' ? t(v) : v]));
    return t(entry.key, vars);
  };
  return { title: show(i.title, n?.title), body: show(i.body, n?.body) };
}
