// Product constants shared by the mobile app (frontend/) and the web app (web/).
// The backend validates the same lists (backend/src/modules/profile.js).

export const APP_NAME = 'Sangam';
export const APP_TAGLINE = 'Where two lives meet';

// Logo: left and right halves of the heart, drawn as separate strands, with a bindu where they meet
export const LOGO_PATHS = {
  viewBox: '0 0 120 120',
  left: 'M60 96 C 45 83, 22 66, 22 45 C 22 31, 32 22, 44 22 C 52 22, 58 28, 60 37',
  right: 'M60 96 C 75 83, 98 66, 98 45 C 98 31, 88 22, 76 22 C 68 22, 62 28, 60 37',
  bindu: { cx: 60, cy: 58, r: 7.5 },
  gold: [
    ['0%', '#F1D9A4'],
    ['55%', '#C9A25C'],
    ['100%', '#A8813F'],
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

export const PILLARS = [
  { key: 'money', label: 'Money', title: 'Money philosophy', low: 'Save aggressively', high: 'Live for now', intro: 'Saving, spending, joint or separate' },
  { key: 'roots', label: 'Roots', title: 'Roots & geography', low: 'Stay near family', high: 'Move anywhere', intro: 'Same city as parents, or the world' },
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
  if (score >= 85) return { label: 'Strong match', tone: 'success' };
  if (score >= 70) return { label: 'Close enough', tone: 'gold' };
  return { label: 'Worth a talk', tone: 'neutral' };
}

// What to fill in next to raise the profile completion % (computed by the server)
export function profileStrengthHint(user) {
  const c = user?.profileCompletion;
  if (!c) return '';
  if (c.percent >= 100) return 'Your profile is complete';
  const section = c.sections.find((s) => !s.complete);
  if (section) return `Next: ${section.title} · ${section.total - section.filled} to fill`;
  const photos = user?.photos?.length || 0;
  if (photos < 3) return `Add ${3 - photos} more photo${3 - photos === 1 ? '' : 's'} to stand out`;
  if ((user?.vibes || []).length < 3) return 'Pick a few more vibes';
  return 'Add a line about yourself';
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
  sort: 'fit',
};

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
    const label = f.ageMin && f.ageMax ? `Age ${f.ageMin}–${f.ageMax}` : f.ageMin ? `Age ${f.ageMin}+` : `Age up to ${f.ageMax}`;
    chips.push({ key: 'age', label, clear: { ageMin: null, ageMax: null } });
  }
  if (f.city.trim()) chips.push({ key: 'city', label: f.city.trim(), clear: { city: '' } });
  for (const t of f.timelines) chips.push({ key: `t:${t}`, label: t, clear: { timelines: f.timelines.filter((x) => x !== t) } });
  if (f.minScore) chips.push({ key: 'score', label: `${f.minScore}%+ aligned`, clear: { minScore: 0 } });
  for (const p of f.strongOn) {
    const pillar = PILLARS.find((x) => x.key === p);
    chips.push({ key: `p:${p}`, label: `Strong on ${pillar ? pillar.label : p}`, clear: { strongOn: f.strongOn.filter((x) => x !== p) } });
  }
  for (const v of f.vibes) chips.push({ key: `v:${v}`, label: v, clear: { vibes: f.vibes.filter((x) => x !== v) } });
  if (f.verified) chips.push({ key: 'verified', label: 'Verified', clear: { verified: false } });
  if (f.notContacted) chips.push({ key: 'nc', label: 'Not contacted', clear: { notContacted: false } });
  if (f.matchesPreferences) chips.push({ key: 'prefs', label: 'Fits my preferences', clear: { matchesPreferences: false } });
  return chips;
}

// Short summary of a saved search, e.g. "chennai · Age 25–32 · 80%+ aligned"
export function describeSearch(filters) {
  const parts = [];
  if (filters.q?.trim()) parts.push(`“${filters.q.trim()}”`);
  for (const c of activeFilterChips(filters)) parts.push(c.label);
  return parts.join(' · ') || 'Everyone';
}
