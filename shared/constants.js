// Product constants shared by the mobile app (frontend/) and the web app (web/).
// The backend validates the same lists (backend/src/modules/profile.js).
// Labels here are English; the apps translate them with t() where they are shown. Helpers that build
// sentences translate as they go.
import { t } from './i18n.js';

export const APP_NAME = '3Knot';
export const APP_FULL_NAME = '3Knot Matrimony';
export const APP_NAME_SUFFIX = 'Matrimony';
export const APP_TAGLINE = 'Where two lives meet';

// Store listings. The Android app id is fixed (frontend/capacitor.config.json); there is no iOS listing yet, so the
// App Store badge shows "Coming soon" until a URL is set. The web app can override both at build time with
// VITE_PLAY_STORE_URL / VITE_APP_STORE_URL.
export const STORE_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.stucompany.matrimony',
  ios: '',
};

// Logo: a pure-gold Tamil thaali pendant. Its three top lobes each carry a gold bead, one for each of the
// three knots (moondru mudichu) that tie it.
export const LOGO_PATHS = {
  viewBox: '0 0 120 120',
  bail: { x: 53, y: 5, width: 14, height: 15, rx: 4.5 },
  bailRidges: 'M54 10 H66 M54 13.5 H66 M54 17 H66',
  body: 'M60 112 C 48 100, 28 84, 27 64 C 26 52, 30 45, 36 42 C 30 36, 34 28, 42 28 C 47 28, 50 31, 51 34 C 50 26, 54 21, 60 21 C 66 21, 70 26, 69 34 C 70 31, 73 28, 78 28 C 86 28, 90 36, 84 42 C 90 45, 94 52, 93 64 C 92 84, 72 100, 60 112 Z',
  inner: 'M60 101 C 51 92, 36 80, 35.5 65 C 35 56, 39 50, 46 48 C 50 47, 55 46.5, 60 46.5 C 65 46.5, 70 47, 74 48 C 81 50, 85 56, 84.5 65 C 84 80, 69 92, 60 101 Z',
  beads: [[42, 37], [60, 31], [78, 37]],
  beadR: 3.2,
  boss: { cx: 60, cy: 66, rx: 10, ry: 12 },
  drop: 'M60 84 C 63 87, 63.5 90, 60 94 C 56.5 90, 57 87, 60 84 Z',
  // polished 22-carat gold: bright yellow with a highlight band and deep amber shadows
  edge: '#7A4E02',
  gold: [
    ['0%', '#FFF1B8'],
    ['22%', '#F9D44A'],
    ['45%', '#FFF6D0'],
    ['62%', '#F0B92B'],
    ['85%', '#C98A0C'],
    ['100%', '#8F5C05'],
  ],
  // raised parts (beads, boss, drop) catch the light
  shine: [
    ['0%', '#FFFBE6'],
    ['45%', '#FFD54F'],
    ['100%', '#B07806'],
  ],
};


// Each vibe gets an emoji and its own soft colour wash [emoji, gradientFrom, gradientTo]
export const VIBE_ART = {
  'Temple mornings': ['🛕', '#F6E7D2', '#EBCB9A'],
  Trekking: ['🏔️', '#E2EEE6', '#B9D6C3'],
  'Cooking together': ['🍲', '#FBE6DA', '#F2BE9F'],
  'Big joint family': ['👨‍👩‍👧‍👦', '#F3E4EC', '#DDB5C9'],
  'Quiet weekends': ['🕯️', '#EFEAE2', '#D8CDBD'],
  Nightlife: ['🌃', '#E3E1F2', '#B9B4DD'],
  'Dogs everywhere': ['🐕', '#F7EBD9', '#E6C796'],
  'Festivals, loud': ['🪔', '#FCE3E0', '#F2A9A0'],
  'Vegetarian home': ['🥗', '#E6F0DC', '#BFD7A4'],
  'Filter coffee & book': ['☕', '#EEE4DA', '#CFB49B'],
  'Early gym sessions': ['🏋️', '#E0EBF2', '#A9C6DA'],
  'Art & theater': ['🎭', '#F4E2E6', '#DDA9B6'],
};
export const ALL_VIBES = Object.keys(VIBE_ART);
export const MAX_VIBES = 6;

export const GENDERS = [
  ['woman', 'Woman'],
  ['man', 'Man'],
];
export const TIMELINES = [
  ['Marriage this year', 'This year'],
  ['Marriage in 1–2 years', 'In 1–2 years'],
  ['Open, no timeline', 'Open'],
];
export const INVOLVEMENT = ['I decide alone', 'I consult my parents', 'Parents lead'];

// Blueprint question 1 (money); score feeds the money pillar
export const MONEY_QUESTION = {
  title: 'A ₹3 lakh bonus lands. What actually happens?',
  options: [
    { key: 'invest', title: 'Straight into investments', desc: 'The plan doesn’t change for a windfall', score: 72 },
    { key: 'split', title: 'Split it — half saved, half enjoyed', desc: 'A trip, and the rest to the fund', score: 55 },
    { key: 'family', title: 'Family first — parents, siblings', desc: 'Obligations before personal goals', score: 65 },
    { key: 'spend', title: 'Spend it on living well now', desc: 'Life is short and money returns', score: 30 },
  ],
};

// Ends of each 0–100 scale. High money = saver and high roots = stays near family, matching the money
// question's scores and the summaries (synthesizeArchetype in backend/src/services/blueprintEngine.js).
export const PILLARS = [
  { key: 'money', label: 'Money', title: 'Money philosophy', low: 'Live for now', high: 'Save aggressively', intro: 'Saving, spending, joint or separate' },
  { key: 'roots', label: 'Roots', title: 'Roots & geography', low: 'Move anywhere', high: 'Stay near family', intro: 'Same city as parents, or the world' },
  { key: 'kids', label: 'Kids', title: 'Kids & parenting', low: 'Not planning', high: 'Soon, hands-on', intro: 'Whether, when, and who slows down' },
  { key: 'ambition', label: 'Ambition', title: 'Career ambition', low: 'Protect balance', high: 'All-in on work', intro: 'How much work is allowed to take' },
];
// Flexibility band width (% of the scale) shown around a pillar value
export const FLEX_BAND = { open: 32, firm: 14 };

export const SHARE_EXPIRY_OPTIONS = [
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['never', 'Never'],
];
export const DEFAULT_SHARE_PERMISSIONS = {
  showBlueprintScore: true,
  showFirstNameCity: true,
  showPhoto: false,
  showContact: false,
};
export const FAMILY_RELATIONS = ['Mother', 'Father', 'Sibling', 'Guardian'];
export const FAMILY_STATUS_LABEL = { linked: 'Linked', invited: 'Invite sent' };

// Parents see a plain-language label rather than raw numbers
export function pillarVerdict(score) {
  if (score >= 85) return { label: t('Strong match'), tone: 'success' };
  if (score >= 70) return { label: t('Close enough'), tone: 'gold' };
  return { label: t('Worth a talk'), tone: 'neutral' };
}

// One-line summary of a blueprint in the interface language (the server stores an English copy, summaryText).
// Same thresholds as synthesizeArchetype in backend/src/services/blueprintEngine.js.
export function blueprintSummary(bp, { prefix = true } = {}) {
  if (!bp || bp.money == null) return bp?.summaryText || '';
  const parts = {
    money: t(bp.money > 60 ? 'saver' : bp.money < 40 ? 'spender who lives for now' : 'balanced saver-spender'),
    roots: t(bp.roots < 40 ? 'who’d move cities for the right role' : bp.roots > 60 ? 'anchored to family roots' : 'flexible about where to live'),
    kids: t(bp.kids > 55 ? 'wants kids within a few years' : bp.kids < 40 ? 'focused on shared partnership' : 'open on when to have kids'),
    ambition: t(bp.ambition > 70 ? 'won’t apologise for ambition' : bp.ambition <= 40 ? 'protects evening work-life balance' : 'balances career and home'),
  };
  return t(prefix ? 'In short: a {money} {roots}, {kids}, and {ambition}.' : 'a {money} {roots}, {kids}, and {ambition}.', parts);
}

// The server's short card note ("saver · rooted · kids soon") in the interface language
export const summaryNote = (note) => (note ? note.split(' · ').map((part) => t(part)).join(' · ') : note);

// What to fill in next to raise the profile completion % (computed by the server)
export function profileStrengthHint(user) {
  const c = user?.profileCompletion;
  if (!c) return '';
  if (c.percent >= 100) return t('Your profile is complete');
  const section = c.sections.find((s) => !s.complete);
  if (section) return t('Next: {section} · {n} to fill', { section: t(section.title), n: section.total - section.filled });
  const photos = user?.photos?.length || 0;
  if (photos < 3) return t(3 - photos === 1 ? 'Add 1 more photo to stand out' : 'Add {n} more photos to stand out', { n: 3 - photos });
  if ((user?.vibes || []).length < 3) return t('Pick a few more vibes');
  return t('Add a line about yourself');
}

export const ERASURE_STEPS = [
  'Profile, photos and blueprint answers are deleted, not deactivated',
  'Family links revoked; shared cards vanish from their view',
  'Messages you sent are anonymised to “Former member”',
  'Only a hashed record of the deletion request is retained, for audit',
];

// ---------- Search ----------
// Values-led filters only: no caste, religion or income filters by design
export const SEARCH_SORTS = [
  ['fit', 'Best fit'],
  ['active', 'Recently active'],
  ['newest', 'Newest'],
  ['age_asc', 'Youngest first'],
  ['age_desc', 'Oldest first'],
];
export const MIN_SCORE_OPTIONS = [
  [0, 'Any'],
  [60, '60%+'],
  [70, '70%+'],
  [80, '80%+'],
  [90, '90%+'],
];
export const SEARCH_AGE_LIMITS = { min: 18, max: 80 };
export const DEFAULT_SEARCH_FILTERS = {
  q: '',
  ageMin: null,
  ageMax: null,
  city: '',
  timelines: [],
  minScore: 0,
  strongOn: [],
  vibes: [],
  verified: false,
  notContacted: false,
  matchesPreferences: false,
  // Premium advanced filters
  heightMin: null,
  heightMax: null,
  education: [],
  employedIn: [],
  eatingHabits: [],
  motherTongue: [],
  familyType: [],
  maritalStatus: [],
  sort: 'fit',
};
export const ADVANCED_FILTER_FIELDS = [
  ['education', 'Education', 'educationCategory'],
  ['employedIn', 'Employed in', 'employedIn'],
  ['eatingHabits', 'Eating habits', 'eatingHabits'],
  ['motherTongue', 'Mother tongue', 'motherTongue'],
  ['familyType', 'Family type', 'familyType'],
  ['maritalStatus', 'Marital status', 'maritalStatus'],
];

// Query-string params for GET /api/search (empty filters are left out)
export function searchParams(filters, { offset = 0, limit } = {}) {
  const f = { ...DEFAULT_SEARCH_FILTERS, ...filters };
  const p = {};
  if (f.q.trim()) p.q = f.q.trim();
  if (f.ageMin) p.ageMin = f.ageMin;
  if (f.ageMax) p.ageMax = f.ageMax;
  if (f.city.trim()) p.city = f.city.trim();
  if (f.timelines.length) p.timelines = f.timelines.join(',');
  if (f.minScore) p.minScore = f.minScore;
  if (f.strongOn.length) p.strongOn = f.strongOn.join(',');
  if (f.vibes.length) p.vibes = f.vibes.join(',');
  if (f.verified) p.verified = 'true';
  if (f.notContacted) p.notContacted = 'true';
  if (f.matchesPreferences) p.matchesPreferences = 'true';
  if (f.heightMin) p.heightMin = f.heightMin;
  if (f.heightMax) p.heightMax = f.heightMax;
  for (const [key] of ADVANCED_FILTER_FIELDS) if (f[key]?.length) p[key] = f[key].join(',');
  if (f.sort !== 'fit') p.sort = f.sort;
  if (offset) p.offset = offset;
  if (limit) p.limit = limit;
  return p;
}

// Active filters as removable chips: [{ key, label, clear: partial filters to apply }]
export function activeFilterChips(filters) {
  const f = { ...DEFAULT_SEARCH_FILTERS, ...filters };
  const chips = [];
  if (f.ageMin || f.ageMax) {
    const label = f.ageMin && f.ageMax ? t('Age {min}–{max}', { min: f.ageMin, max: f.ageMax }) : f.ageMin ? t('Age {min}+', { min: f.ageMin }) : t('Age up to {max}', { max: f.ageMax });
    chips.push({ key: 'age', label, clear: { ageMin: null, ageMax: null } });
  }
  if (f.city.trim()) chips.push({ key: 'city', label: f.city.trim(), clear: { city: '' } });
  for (const tl of f.timelines) chips.push({ key: `t:${tl}`, label: t(tl), clear: { timelines: f.timelines.filter((x) => x !== tl) } });
  if (f.minScore) chips.push({ key: 'score', label: t('{n}%+ aligned', { n: f.minScore }), clear: { minScore: 0 } });
  for (const p of f.strongOn) {
    const pillar = PILLARS.find((x) => x.key === p);
    chips.push({ key: `p:${p}`, label: t('Strong on {pillar}', { pillar: t(pillar ? pillar.label : p) }), clear: { strongOn: f.strongOn.filter((x) => x !== p) } });
  }
  for (const v of f.vibes) chips.push({ key: `v:${v}`, label: t(v), clear: { vibes: f.vibes.filter((x) => x !== v) } });
  if (f.verified) chips.push({ key: 'verified', label: t('Verified'), clear: { verified: false } });
  if (f.notContacted) chips.push({ key: 'nc', label: t('Not contacted'), clear: { notContacted: false } });
  if (f.matchesPreferences) chips.push({ key: 'prefs', label: t('Fits my preferences'), clear: { matchesPreferences: false } });
  if (f.heightMin || f.heightMax) {
    const label = f.heightMin && f.heightMax ? t('Height {min}–{max} cm', { min: f.heightMin, max: f.heightMax }) : f.heightMin ? t('Height {min} cm+', { min: f.heightMin }) : t('Height up to {max} cm', { max: f.heightMax });
    chips.push({ key: 'height', label, clear: { heightMin: null, heightMax: null } });
  }
  for (const [key] of ADVANCED_FILTER_FIELDS) {
    for (const v of f[key] || []) chips.push({ key: `${key}:${v}`, label: t(v), clear: { [key]: f[key].filter((x) => x !== v) } });
  }
  return chips;
}

// Short summary of a saved search, e.g. "chennai · Age 25–32 · 80%+ aligned"
export function describeSearch(filters) {
  const parts = [];
  if (filters.q?.trim()) parts.push(`“${filters.q.trim()}”`);
  for (const c of activeFilterChips(filters)) parts.push(c.label);
  return parts.join(' · ') || t('Everyone');
}
