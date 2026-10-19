// Paid tiers, what each one includes, and limits. One table used by the backend (enforcement) and both apps (display).
// Safety (block, report, verification) and video calls are never behind a paywall.
// Plain ES module.

export const TIERS = ['free', 'plus', 'premium', 'family'];
const RANK = { free: 0, plus: 1, premium: 2, family: 3 };

export const TIER_INFO = {
  free: { name: 'Free', tagline: 'Values matching, chat and family sharing' },
  plus: { name: 'Plus', tagline: 'Reach out freely and see who’s interested' },
  premium: { name: 'Premium', tagline: 'Get noticed and find the right person faster' },
  family: { name: 'Family', tagline: 'Premium plus tools for the whole family' },
};

// feature -> the lowest tier that includes it
export const FEATURES = {
  unlimitedInterests: { tier: 'plus', title: 'Unlimited interests', detail: 'Free members can send a limited number per day.' },
  admirers: { tier: 'plus', title: 'See who viewed and shortlisted you', detail: 'Free members see only the count.' },
  readReceipts: { tier: 'plus', title: 'Read receipts', detail: 'See when your messages have been read.' },
  rewind: { tier: 'plus', title: 'Rewind', detail: 'Undo a pass you didn’t mean.' },
  priorityRequests: { tier: 'plus', title: 'Priority in Requests', detail: 'Your interest shows above free members’.' },
  badgeChoice: { tier: 'plus', title: 'Show or hide your badge', detail: 'Choose whether your plan badge shows on your card.' },
  advancedFilters: { tier: 'premium', title: 'Advanced search filters', detail: 'Height, education, work, food habits, mother tongue, family type.' },
  spotlight: { tier: 'premium', title: 'Weekly spotlight', detail: 'Shown first to strongly aligned members for 24 hours, once a week.' },
  superInterest: { tier: 'premium', title: 'Super interests', detail: 'Three a week, highlighted and pinned at the top of their requests.' },
  searchBoost: { tier: 'premium', title: 'Priority in search', detail: 'Appear higher in search results.' },
  featuredPicks: { tier: 'premium', title: 'Featured in daily picks', detail: 'More likely to appear in others’ picks when you align strongly.' },
  extraPicks: { tier: 'premium', title: '10 daily picks and “more like this”', detail: 'Free members get 5 picks a day.' },
  instantAlerts: { tier: 'premium', title: '10 saved searches with instant alerts', detail: 'Free members get 2 with a daily digest.' },
  deepReport: { tier: 'premium', title: 'Compatibility report and PDF', detail: 'Conversation topics plus a report to share with family.' },
  introMessages: { tier: 'premium', title: 'Three messages with an interest', detail: 'Free members can add one note.' },
  voiceNotes: { tier: 'premium', title: 'Voice notes in chat', detail: 'Send up to a minute of audio.' },
  contactShare: { tier: 'premium', title: 'Share phone numbers', detail: 'Exchange numbers in-app once both of you agree.' },
  photoPrivacy: { tier: 'premium', title: 'Photo privacy controls', detail: 'Choose who sees your photos clearly.' },
  hideActivity: { tier: 'premium', title: 'Hide last seen', detail: 'Keep your activity status private.' },
  visibilityRules: { tier: 'premium', title: 'Visibility rules', detail: 'Hide your profile from chosen cities or ages.' },
  incognito: { tier: 'premium', title: 'Incognito browsing', detail: 'View profiles without appearing in their visitors.' },
  familyLinks: { tier: 'family', title: 'Up to 4 family members', detail: 'Other plans link 2.' },
  familyCompare: { tier: 'family', title: 'Side-by-side family comparison', detail: 'Family members compare shared profiles together.' },
  familyAssisted: { tier: 'family', title: 'Family-assisted interests', detail: 'A trusted family member suggests interests; you approve each one.' },
};

export const LIMITS = {
  free: { savedSearches: 2, dailyPicks: 5, introMessages: 1, familyLinks: 2, spotlightsPerWeek: 0, superInterestsPerWeek: 0 },
  plus: { savedSearches: 2, dailyPicks: 5, introMessages: 1, familyLinks: 2, spotlightsPerWeek: 0, superInterestsPerWeek: 0 },
  premium: { savedSearches: 10, dailyPicks: 10, introMessages: 3, familyLinks: 2, spotlightsPerWeek: 1, superInterestsPerWeek: 3 },
  family: { savedSearches: 10, dailyPicks: 10, introMessages: 3, familyLinks: 4, spotlightsPerWeek: 1, superInterestsPerWeek: 3 },
};

// Prices in paise (₹1 = 100 paise). Placeholder prices — change here.
export const PLAN_CATALOG = [
  { code: 'plus_1m', tier: 'plus', months: 1, pricePaise: 29900 },
  { code: 'plus_3m', tier: 'plus', months: 3, pricePaise: 69900 },
  { code: 'plus_6m', tier: 'plus', months: 6, pricePaise: 119900 },
  { code: 'premium_1m', tier: 'premium', months: 1, pricePaise: 49900 },
  { code: 'premium_3m', tier: 'premium', months: 3, pricePaise: 119900, badge: 'Popular' },
  { code: 'premium_6m', tier: 'premium', months: 6, pricePaise: 199900 },
  { code: 'family_1m', tier: 'family', months: 1, pricePaise: 79900 },
  { code: 'family_3m', tier: 'family', months: 3, pricePaise: 189900 },
  { code: 'family_6m', tier: 'family', months: 6, pricePaise: 319900, badge: 'Best value' },
];

// One-off purchases
export const ADDONS = [
  { code: 'spotlight_1', kind: 'spotlight', name: 'Extra spotlight (24 hours)', pricePaise: 14900 },
  { code: 'assisted_3m', kind: 'assisted', name: 'Assisted service · 3 months', months: 3, pricePaise: 999900,
    detail: 'A relationship manager hand-picks matches for you and can speak with your family.' },
];

export const TRIAL_DAYS = 7;
export const TRIAL_TIER = 'premium';
export const SPOTLIGHT_HOURS = 24;

export const tierRank = (tier) => RANK[tier] ?? 0;
export const tierHas = (tier, feature) => tierRank(tier) >= tierRank(FEATURES[feature]?.tier || 'family');
export const tierLimit = (tier, key) => (LIMITS[tier] || LIMITS.free)[key];
export const featuresOf = (tier) => Object.entries(FEATURES).filter(([, f]) => tierRank(tier) >= tierRank(f.tier)).map(([k]) => k);
export const priceText = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

// Photo privacy options (premium)
export const PHOTO_VISIBILITY = [
  ['accepted', 'Only after we both accept interest'],
  ['verified', 'Verified members, or after acceptance'],
  ['aligned', 'Members 80%+ aligned with me, or after acceptance'],
  ['everyone', 'Everyone who can see my profile'],
];
