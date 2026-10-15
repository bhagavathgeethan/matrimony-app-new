// Personal details: one definition used by the backend (validation, completion %) and both apps (forms, views).
// Plain ES module with no imports so the CommonJS backend can require() it.
//
// Field types: text, longtext, select, multi, count (0–9), height (cm), weight (kg), bool.
// `column` fields live in their own users column (shared with onboarding basics and search);
// the rest are stored together in users.details (JSONB).
// `counted: false` fields are optional extras that do not affect the completion percentage.

const opts = (...values) => values;

export const MARITAL_STATUS = opts('Never married', 'Divorced', 'Widowed', 'Awaiting divorce', 'Annulled');
export const LANGUAGES = opts(
  'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Hindi', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Odia', 'Urdu',
  'Konkani', 'Tulu', 'Assamese', 'Sindhi', 'Kashmiri', 'Nepali', 'Sanskrit', 'English', 'Other'
);
export const RELIGIONS = opts(
  'Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Jewish', 'Spiritual', 'No religious belief', 'Other', 'Prefer not to say'
);
export const STARS = opts(
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
);
export const RAASIS = opts(
  'Mesham (Aries)', 'Rishabam (Taurus)', 'Mithunam (Gemini)', 'Kadagam (Cancer)', 'Simmam (Leo)', 'Kanni (Virgo)',
  'Thulam (Libra)', 'Viruchigam (Scorpio)', 'Dhanusu (Sagittarius)', 'Magaram (Capricorn)', 'Kumbam (Aquarius)', 'Meenam (Pisces)'
);
export const ZODIACS = opts(
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
);
export const EDUCATION = opts(
  'High school', 'Diploma', 'B.E. / B.Tech', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA', 'B.Arch', 'MBBS', 'BDS', 'LLB',
  'CA / CS / ICWA', 'M.E. / M.Tech', 'M.Sc', 'M.Com', 'M.A.', 'MBA / PGDM', 'MCA', 'MD / MS', 'Ph.D', 'Other'
);
export const EMPLOYED_IN = opts('Private', 'Government / PSU', 'Business', 'Self-employed', 'Defence', 'Not working');
export const INCOME = opts(
  'Below Rs. 2 Lakhs', 'Rs. 2 - 4 Lakhs', 'Rs. 4 - 6 Lakhs', 'Rs. 6 - 8 Lakhs', 'Rs. 8 - 10 Lakhs', 'Rs. 10 - 12 Lakhs',
  'Rs. 12 - 14 Lakhs', 'Rs. 14 - 16 Lakhs', 'Rs. 16 - 20 Lakhs', 'Rs. 20 - 25 Lakhs', 'Rs. 25 - 30 Lakhs',
  'Rs. 30 - 50 Lakhs', 'Rs. 50 Lakhs - 1 Crore', 'Above Rs. 1 Crore', 'Prefer not to say'
);
export const INDIAN_STATES = opts(
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry', 'Outside India'
);
export const PARENT_OCCUPATION = opts('Employed', 'Business', 'Professional', 'Retired', 'Homemaker', 'Not employed', 'Passed away');

const HOBBIES = opts(
  'Technology', 'Travel', 'Cooking', 'Photography', 'Gardening', 'Painting', 'Dancing', 'Singing', 'Writing',
  'Volunteering', 'Gaming', 'Pets', 'Fashion', 'Yoga / Meditation', 'Astronomy', 'DIY / Crafts'
);
const MUSIC = opts('Carnatic', 'Hindustani', 'Film songs', 'Indie', 'Pop', 'Rock', 'Jazz', 'Western classical', 'Devotional', 'Hip hop', 'EDM', 'Folk');
const READING = opts('Fiction', 'Non-fiction', 'Biographies', 'Self-help', 'Poetry', 'Comics / Manga', 'History', 'Science', 'Business', 'Spiritual');
const MOVIES = opts('Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Sci-fi', 'Horror', 'Documentaries', 'Anime', 'Web series', 'Regional cinema', 'World cinema');
const SPORTS = opts(
  'Cricket', 'Football', 'Badminton', 'Tennis', 'Swimming', 'Cycling', 'Jogging / Walking / Running', 'Gym', 'Yoga', 'Chess', 'Basketball', 'Trekking'
);
const FOOD = opts('South Indian', 'North Indian', 'Chinese', 'Italian', 'Continental', 'Street food', 'Desserts', 'Biryani', 'Seafood', 'Vegan', 'Baking');

export const HEIGHT_RANGE = { min: 137, max: 213 }; // 4 ft 6 in – 7 ft
export const WEIGHT_RANGE = { min: 35, max: 150 };

export const PROFILE_SECTIONS = [
  {
    key: 'about',
    title: 'In My Own Words',
    icon: 'pen',
    fields: [
      { key: 'aboutMe', label: 'About me', type: 'longtext', max: 1000, placeholder: 'Your education, work, family background and what you are looking for' },
    ],
  },
  {
    key: 'basic',
    title: 'Basic Details',
    icon: 'id',
    fields: [
      { key: 'firstName', label: 'Name', type: 'text', max: 60, column: true, required: true },
      { key: 'heightCm', label: 'Height', type: 'height' },
      { key: 'weightKg', label: 'Weight', type: 'weight' },
      { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: MARITAL_STATUS },
      { key: 'motherTongue', label: 'Mother Tongue', type: 'select', options: LANGUAGES },
      { key: 'physicalStatus', label: 'Physical Status', type: 'select', options: opts('Normal', 'Physically challenged') },
      { key: 'bodyType', label: 'Body Type', type: 'select', options: opts('Slim', 'Average', 'Athletic', 'Heavy') },
      { key: 'profileCreatedBy', label: 'Profile Created By', type: 'select', options: opts('Self', 'Parent', 'Sibling', 'Relative', 'Friend') },
      { key: 'eatingHabits', label: 'Eating Habits', type: 'select', options: opts('Vegetarian', 'Eggetarian', 'Non vegetarian', 'Vegan') },
      { key: 'drinkingHabits', label: 'Drinking Habits', type: 'select', options: opts('Never drinks', 'Drinks socially', 'Drinks regularly') },
      { key: 'smokingHabits', label: 'Smoking Habits', type: 'select', options: opts('Never smokes', 'Smokes occasionally', 'Smokes regularly') },
    ],
  },
  {
    key: 'religion',
    title: 'Religious Information',
    icon: 'book',
    fields: [
      { key: 'religion', label: 'Religion', type: 'select', options: RELIGIONS },
      { key: 'caste', label: 'Caste', type: 'text', max: 80, counted: false, placeholder: 'Optional' },
      { key: 'casteNoBar', label: 'Caste no bar', type: 'bool', counted: false },
      { key: 'gothram', label: 'Gothra(m)', type: 'text', max: 60, counted: false, placeholder: 'Optional' },
      { key: 'zodiac', label: 'Zodiac', type: 'select', options: ZODIACS, counted: false },
      { key: 'star', label: 'Star', type: 'select', options: STARS, counted: false },
      { key: 'raasi', label: 'Raasi', type: 'select', options: RAASIS, counted: false },
      { key: 'dosham', label: 'Dosham', type: 'select', options: opts('No', 'Yes', 'Don’t know'), counted: false },
    ],
  },
  {
    key: 'professional',
    title: 'Professional Information',
    icon: 'grad',
    fields: [
      { key: 'educationCategory', label: 'Education Category', type: 'select', options: EDUCATION },
      { key: 'college', label: 'College / Institution', type: 'text', max: 120 },
      { key: 'educationDetail', label: 'Education in Detail', type: 'text', max: 120, counted: false, placeholder: 'e.g. Computer Science and Engineering' },
      { key: 'profession', label: 'Occupation', type: 'text', max: 100, column: true, placeholder: 'e.g. Software Consultant' },
      { key: 'occupationDetail', label: 'Occupation in Detail', type: 'text', max: 120, counted: false },
      { key: 'organization', label: 'Organization', type: 'text', max: 120, counted: false },
      { key: 'employedIn', label: 'Employed In', type: 'select', options: EMPLOYED_IN },
      { key: 'annualIncome', label: 'Annual Income', type: 'select', options: INCOME },
    ],
  },
  {
    key: 'location',
    title: 'Location',
    icon: 'pin',
    fields: [
      { key: 'country', label: 'Country', type: 'text', max: 60, placeholder: 'e.g. India' },
      { key: 'state', label: 'State', type: 'select', options: INDIAN_STATES },
      { key: 'city', label: 'City', type: 'text', max: 80, column: true, required: true },
      { key: 'citizenship', label: 'Citizenship', type: 'text', max: 60, placeholder: 'e.g. India' },
      { key: 'ancestralOrigin', label: 'Ancestral Origin', type: 'text', max: 80, counted: false, placeholder: 'Native place' },
    ],
  },
  {
    key: 'family',
    title: 'Family Details',
    icon: 'family',
    fields: [
      { key: 'familyValues', label: 'Family Values', type: 'select', options: opts('Traditional', 'Moderate', 'Liberal') },
      { key: 'familyType', label: 'Family Type', type: 'select', options: opts('Joint', 'Nuclear') },
      { key: 'familyStatus', label: 'Family Status', type: 'select', options: opts('Middle class', 'Upper middle class', 'Affluent') },
      { key: 'fatherOccupation', label: 'Father’s Occupation', type: 'select', options: PARENT_OCCUPATION },
      { key: 'motherOccupation', label: 'Mother’s Occupation', type: 'select', options: PARENT_OCCUPATION },
      { key: 'brothers', label: 'Brother(s)', type: 'count' },
      { key: 'brothersMarried', label: 'Brother(s) Married', type: 'count', counted: false, upTo: 'brothers' },
      { key: 'sisters', label: 'Sister(s)', type: 'count' },
      { key: 'sistersMarried', label: 'Sister(s) Married', type: 'count', counted: false, upTo: 'sisters' },
    ],
  },
  {
    key: 'aboutFamily',
    title: 'About My Family',
    icon: 'contact',
    fields: [
      { key: 'aboutFamily', label: 'About my family', type: 'longtext', max: 1000, placeholder: 'Where your family is from, what they do, what they value' },
    ],
  },
  {
    key: 'hobbies',
    title: 'Hobbies & Interests',
    icon: 'music',
    fields: [
      { key: 'hobbies', label: 'Hobbies and Interests', type: 'multi', options: HOBBIES },
      { key: 'music', label: 'Music', type: 'multi', options: MUSIC, counted: false },
      { key: 'reading', label: 'Reading', type: 'multi', options: READING, counted: false },
      { key: 'movies', label: 'Movies and TV Shows', type: 'multi', options: MOVIES, counted: false },
      { key: 'sports', label: 'Sports and Fitness', type: 'multi', options: SPORTS, counted: false },
      { key: 'food', label: 'Food', type: 'multi', options: FOOD, counted: false },
      { key: 'spokenLanguages', label: 'Spoken Languages', type: 'multi', options: LANGUAGES },
    ],
  },
];

export const PROFILE_FIELDS = PROFILE_SECTIONS.flatMap((s) => s.fields.map((f) => ({ ...f, section: s.key })));
export const FIELD_BY_KEY = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.key, f]));
export const MAX_MULTI = 10;

// The short "about you" step during onboarding; everything else is filled in afterwards
export const ONBOARDING_DETAIL_KEYS = ['maritalStatus', 'heightCm', 'motherTongue', 'religion', 'educationCategory', 'profession'];
export const ONBOARDING_REQUIRED_KEYS = ['maritalStatus', 'heightCm', 'motherTongue', 'religion'];

// ---------- values ----------

export const isFilled = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

export function formatHeight(cm) {
  if (!cm) return '';
  const totalIn = Math.round(cm / 2.54);
  return `${Math.floor(totalIn / 12)} ft ${totalIn % 12} in / ${cm} cm`;
}
export const formatWeight = (kg) => (kg ? `${kg} kg / ${Math.round(kg * 2.20462)} lbs` : '');
export const HEIGHT_OPTIONS = Array.from({ length: HEIGHT_RANGE.max - HEIGHT_RANGE.min + 1 }, (_, i) => HEIGHT_RANGE.min + i);
export const WEIGHT_OPTIONS = Array.from({ length: WEIGHT_RANGE.max - WEIGHT_RANGE.min + 1 }, (_, i) => WEIGHT_RANGE.min + i);

// Display text for a field's value ('' when empty)
export function formatField(field, value, values = {}) {
  if (!isFilled(value)) return '';
  switch (field.type) {
    case 'height': return formatHeight(value);
    case 'weight': return formatWeight(value);
    case 'multi': return value.join(', ');
    case 'bool': return value ? 'Yes' : 'No';
    case 'count': return String(value);
    default:
      if (field.key === 'caste' && values.casteNoBar) return `${value} (Caste No Bar)`;
      return String(value);
  }
}

// Rows to show for a section: the caste-no-bar flag folds into the caste row; married counts hide with no siblings
export function visibleFields(section, values = {}) {
  return section.fields.filter((f) => {
    if (f.key === 'casteNoBar') return false;
    if (f.upTo) return Number(values[f.upTo]) > 0;
    return true;
  });
}

// ---------- validation (server) ----------

// Validates a partial update. Returns { values, errors }: values maps key -> clean value (null clears it).
export function validateDetails(input) {
  const values = {};
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { values, errors: ['Send the details as an object'] };
  for (const [key, raw] of Object.entries(input)) {
    const f = FIELD_BY_KEY[key];
    if (!f) {
      errors.push(`Unknown field: ${key}`);
      continue;
    }
    const empty = raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0);
    if (empty) {
      if (f.required) errors.push(`${f.label} can’t be empty`);
      else values[key] = null;
      continue;
    }
    switch (f.type) {
      case 'text':
      case 'longtext': {
        if (typeof raw !== 'string') { errors.push(`${f.label} must be text`); break; }
        const v = raw.trim().replace(f.type === 'text' ? /\s+/g : /[ \t]+/g, ' ');
        if (v.length > f.max) errors.push(`${f.label} must be at most ${f.max} characters`);
        else values[key] = v || null;
        if (!v && f.required) errors.push(`${f.label} can’t be empty`);
        break;
      }
      case 'select':
        if (!f.options.includes(raw)) errors.push(`${f.label}: choose one of the listed options`);
        else values[key] = raw;
        break;
      case 'multi': {
        if (!Array.isArray(raw) || raw.some((v) => !f.options.includes(v))) { errors.push(`${f.label}: choose from the listed options`); break; }
        const unique = [...new Set(raw)];
        if (unique.length > MAX_MULTI) errors.push(`${f.label}: pick up to ${MAX_MULTI}`);
        else values[key] = unique;
        break;
      }
      case 'count':
      case 'height':
      case 'weight': {
        const n = Number(raw);
        const [min, max] = f.type === 'height' ? [HEIGHT_RANGE.min, HEIGHT_RANGE.max] : f.type === 'weight' ? [WEIGHT_RANGE.min, WEIGHT_RANGE.max] : [0, 9];
        if (!Number.isInteger(n) || n < min || n > max) errors.push(`${f.label} must be a whole number from ${min} to ${max}`);
        else values[key] = n;
        break;
      }
      case 'bool':
        if (typeof raw !== 'boolean') errors.push(`${f.label} must be true or false`);
        else values[key] = raw;
        break;
      default:
        errors.push(`Unknown field: ${key}`);
    }
  }
  return { values, errors };
}

// Married siblings can't exceed siblings (checked against the merged result)
export function crossFieldErrors(merged) {
  const errors = [];
  for (const f of PROFILE_FIELDS.filter((x) => x.upTo)) {
    if (isFilled(merged[f.key]) && merged[f.key] > (Number(merged[f.upTo]) || 0)) {
      errors.push(`${f.label} can’t be more than ${FIELD_BY_KEY[f.upTo].label}`);
    }
  }
  return errors;
}

// ---------- completion ----------

// Profile completion: every counted personal field plus the essentials from onboarding.
// `values` holds details and column fields (firstName, city, profession) together.
export function profileCompletion(values, { hasBlueprint, photoCount, vibeCount, hasQuote, hasPreferences = false, promptCount = 0 }) {
  const sections = PROFILE_SECTIONS.map((s) => {
    const counted = s.fields.filter((f) => f.counted !== false);
    const filled = counted.filter((f) => isFilled(values[f.key])).length;
    return { key: s.key, title: s.title, filled, total: counted.length, complete: filled === counted.length };
  });
  const extras = [
    { key: 'blueprint', title: 'Blueprint', done: hasBlueprint },
    { key: 'photos', title: 'Add 3 photos', done: photoCount >= 3 },
    { key: 'vibes', title: 'Pick 3 vibes', done: vibeCount >= 3 },
    { key: 'quote', title: 'A line about yourself', done: hasQuote },
    { key: 'preferences', title: 'Set partner preferences', done: hasPreferences },
    { key: 'prompts', title: 'Answer a profile prompt', done: promptCount > 0 },
  ];
  const total = sections.reduce((n, s) => n + s.total, 0) + extras.length;
  const filled = sections.reduce((n, s) => n + s.filled, 0) + extras.filter((e) => e.done).length;
  const percent = Math.round((filled / total) * 100);
  const nextSection = sections.find((s) => !s.complete) || null;
  const nextExtra = extras.find((e) => !e.done) || null;
  return { percent, sections, extras, nextSection: nextSection?.key || null, nextExtra: nextExtra?.key || null };
}
