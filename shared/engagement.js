// Profile prompts, safety (report reasons and tips), activity labels and premium entitlements.
// Shared by the backend and both apps. Plain ES module.

export const PROFILE_PROMPTS = [
  'A perfect Sunday for me is…',
  'I’m looking for someone who…',
  'My family would describe me as…',
  'The way to win me over is…',
  'A value I won’t compromise on…',
  'Ten years from now, I see us…',
  'I geek out about…',
  'My love language is…',
  'The best trip I’ve taken…',
  'A small thing that makes my day…',
  'At home, I’m the one who…',
  'We’ll get along if…',
];
export const MAX_PROMPTS = 3;
export const PROMPT_ANSWER_MAX = 200;

export function validatePrompts(input) {
  if (!Array.isArray(input)) return { values: null, error: 'Send prompts as a list' };
  if (input.length > MAX_PROMPTS) return { values: null, error: `Answer at most ${MAX_PROMPTS} prompts` };
  const seen = new Set();
  const values = [];
  for (const item of input) {
    const q = item?.q;
    const a = typeof item?.a === 'string' ? item.a.trim().replace(/\s+/g, ' ') : '';
    if (!PROFILE_PROMPTS.includes(q)) return { values: null, error: 'Choose prompts from the list' };
    if (seen.has(q)) return { values: null, error: 'Each prompt can be answered once' };
    if (!a) return { values: null, error: 'Answers can’t be empty' };
    if (a.length > PROMPT_ANSWER_MAX) return { values: null, error: `Answers must be at most ${PROMPT_ANSWER_MAX} characters` };
    seen.add(q);
    values.push({ q, a });
  }
  return { values, error: null };
}

export const REPORT_REASONS = [
  ['fake', 'Fake profile or photos'],
  ['harassment', 'Harassment or abusive messages'],
  ['money', 'Asked for money or financial details'],
  ['married', 'Already married / not genuine'],
  ['inappropriate', 'Inappropriate photos or content'],
  ['underage', 'May be under 18'],
  ['other', 'Something else'],
];

export const SAFETY_TIPS = [
  ['Keep chats on 3Knot', 'Your phone number and email stay private until you choose to share them.'],
  ['Never send money', 'No genuine match will ask for money, gifts, bank details or OTPs — report anyone who does.'],
  ['Video call before meeting', 'Use the in-app video call once you have both accepted interest.'],
  ['Meet in public, tell family', 'For a first meeting pick a busy public place, arrange your own travel and tell someone where you are.'],
  ['Look for the verified badge', 'Verified members have had a selfie checked by the 3Knot team.'],
  ['Trust your instincts', 'If something feels off, block and report. Reports are confidential.'],
];

// "Active now" / "Active today" / … from the last activity time (online = has a live connection)
export function activityLabel(lastActiveAt, online = false) {
  if (online) return 'Active now';
  if (!lastActiveAt) return null;
  const hours = (Date.now() - new Date(lastActiveAt).getTime()) / 3600000;
  if (hours < 24) return 'Active today';
  if (hours < 24 * 7) return 'Active this week';
  if (hours < 24 * 30) return 'Active this month';
  return 'Away for a while';
}

// What premium unlocks (the backend enforces each one)
export const PREMIUM_FEATURES = [
  ['Unlimited interests', 'Free members can send a limited number of interests per day.'],
  ['See who viewed and shortlisted you', 'Free members see only the count.'],
  ['Read receipts', 'See when your messages have been read.'],
  ['Priority in search', 'Appear higher in search results.'],
  ['Incognito browsing', 'View profiles without appearing in their visitors.'],
];

// Conversation starters for where two blueprints differ most (shown at the start of a chat)
export const CONVERSATION_PROMPTS = {
  money: [
    'How do you each think about saving versus enjoying money now?',
    'Joint account, separate accounts, or a bit of both?',
  ],
  roots: [
    'Where do you each picture living in ten years — and how close to parents?',
    'Would you move cities for the other’s career?',
  ],
  kids: [
    'When do you each picture having children, if at all?',
    'Who do you imagine slowing down at work when kids arrive?',
  ],
  ambition: [
    'What does a good week look like — work-wise and otherwise?',
    'How do you protect time together when work gets intense?',
  ],
  general: [
    'What does a typical weekend look like for you?',
    'What did your family teach you about marriage?',
  ],
};

// Why someone is in your daily picks, from the pillar you align on most
export const PICK_REASONS = {
  money: 'You think alike about money',
  roots: 'Same idea of where home is',
  kids: 'Your plans for children line up',
  ambition: 'Similar drive at work',
};
