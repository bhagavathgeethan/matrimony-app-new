// Partner preferences: what a member is looking for. Used by the backend (validation, "matches X of Y")
// and both apps (forms and display). Plain ES module with no imports outside shared/.
import {
  MARITAL_STATUS, LANGUAGES, RELIGIONS, EDUCATION, EMPLOYED_IN, INDIAN_STATES, HEIGHT_RANGE, formatHeight, isFilled,
} from './profileFields.js';

const EATING = ['Vegetarian', 'Eggetarian', 'Non vegetarian', 'Vegan'];
const SMOKING = ['Never smokes', 'Smokes occasionally', 'Smokes regularly'];
const DRINKING = ['Never drinks', 'Drinks socially', 'Drinks regularly'];

// type: 'range' (min/max numbers) or 'any' (list; empty = no preference)
export const PREFERENCE_FIELDS = [
  { key: 'age', label: 'Age', type: 'range', min: 18, max: 80, unit: 'yrs' },
  { key: 'height', label: 'Height', type: 'range', min: HEIGHT_RANGE.min, max: HEIGHT_RANGE.max, unit: 'cm', format: formatHeight },
  { key: 'maritalStatus', label: 'Marital status', type: 'any', options: MARITAL_STATUS, detail: 'maritalStatus' },
  { key: 'motherTongue', label: 'Mother tongue', type: 'any', options: LANGUAGES, detail: 'motherTongue' },
  { key: 'religion', label: 'Religion', type: 'any', options: RELIGIONS.filter((r) => r !== 'Prefer not to say'), detail: 'religion' },
  { key: 'education', label: 'Education', type: 'any', options: EDUCATION, detail: 'educationCategory' },
  { key: 'employedIn', label: 'Employed in', type: 'any', options: EMPLOYED_IN, detail: 'employedIn' },
  { key: 'state', label: 'Lives in (state)', type: 'any', options: INDIAN_STATES, detail: 'state' },
  { key: 'eatingHabits', label: 'Eating habits', type: 'any', options: EATING, detail: 'eatingHabits' },
  { key: 'smokingHabits', label: 'Smoking', type: 'any', options: SMOKING, detail: 'smokingHabits' },
  { key: 'drinkingHabits', label: 'Drinking', type: 'any', options: DRINKING, detail: 'drinkingHabits' },
];
export const PREFERENCE_BY_KEY = Object.fromEntries(PREFERENCE_FIELDS.map((f) => [f.key, f]));

// Validates a full or partial preferences object. Range: { min, max } (either may be null). List: array of options.
export function validatePreferences(input) {
  const values = {};
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { values, errors: ['Send preferences as an object'] };
  for (const [key, raw] of Object.entries(input)) {
    const f = PREFERENCE_BY_KEY[key];
    if (!f) { errors.push(`Unknown preference: ${key}`); continue; }
    if (raw === null || (Array.isArray(raw) && raw.length === 0)) { values[key] = null; continue; }
    if (f.type === 'range') {
      if (typeof raw !== 'object' || Array.isArray(raw)) { errors.push(`${f.label}: send { min, max }`); continue; }
      const out = {};
      for (const end of ['min', 'max']) {
        const v = raw[end];
        if (v === undefined || v === null || v === '') continue;
        const n = Number(v);
        if (!Number.isInteger(n) || n < f.min || n > f.max) { errors.push(`${f.label} ${end} must be from ${f.min} to ${f.max}`); continue; }
        out[end] = n;
      }
      if (out.min !== undefined && out.max !== undefined && out.min > out.max) errors.push(`${f.label}: minimum is above maximum`);
      values[key] = Object.keys(out).length ? out : null;
    } else {
      if (!Array.isArray(raw) || raw.some((v) => !f.options.includes(v))) { errors.push(`${f.label}: choose from the listed options`); continue; }
      values[key] = [...new Set(raw)];
    }
  }
  return { values, errors };
}

export function describePreference(f, value) {
  if (!isFilled(value)) return 'Any';
  if (f.type === 'range') {
    const fmt = f.format || ((n) => `${n} ${f.unit}`);
    if (value.min != null && value.max != null) return f.key === 'age' ? `${value.min}–${value.max} yrs` : `${fmt(value.min)} – ${fmt(value.max)}`;
    if (value.min != null) return `${f.key === 'age' ? `${value.min} yrs` : fmt(value.min)} or more`;
    return `Up to ${f.key === 'age' ? `${value.max} yrs` : fmt(value.max)}`;
  }
  return value.join(', ');
}

// How well a person ({ age, details }) fits a set of preferences. Only preferences that were set count.
// A preference on a detail the person hasn't filled in counts as "unknown", not as a miss.
export function preferenceMatch(prefs, person) {
  const items = [];
  for (const f of PREFERENCE_FIELDS) {
    const want = prefs?.[f.key];
    if (!isFilled(want)) continue;
    let value;
    if (f.key === 'age') value = person.age;
    else if (f.key === 'height') value = person.details?.heightCm;
    else value = person.details?.[f.detail];
    let met;
    if (value === undefined || value === null || value === '') met = null;
    else if (f.type === 'range') met = (want.min == null || value >= want.min) && (want.max == null || value <= want.max);
    else met = want.includes(value);
    items.push({ key: f.key, label: f.label, met, wanted: describePreference(f, want) });
  }
  const total = items.length;
  const met = items.filter((i) => i.met === true).length;
  return { met, total, items };
}
