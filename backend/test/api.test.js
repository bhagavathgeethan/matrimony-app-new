// Unit tests for the 4-pillar compatibility engine and pure helpers
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculatePillarOverlap,
  computeMatchScore,
  synthesizeArchetype,
} = require('../src/services/blueprintEngine');

const ananya = {
  money: 72, moneyFlexibility: 'open',
  roots: 31, rootsFlexibility: 'firm',
  kids: 58, kidsFlexibility: 'open',
  ambition: 84, ambitionFlexibility: 'firm',
};

test('pillar overlap is 100 minus the gap', () => {
  assert.equal(calculatePillarOverlap(72, 75, 'open'), 97);
  assert.equal(calculatePillarOverlap(50, 50, 'open'), 100);
  assert.equal(calculatePillarOverlap(0, 100, 'open'), 0);
});

test('firm pillars subtract 15 only when the gap exceeds 25', () => {
  assert.equal(calculatePillarOverlap(50, 75, 'firm'), 75, 'gap of exactly 25 is not penalised');
  assert.equal(calculatePillarOverlap(50, 76, 'firm'), 59, '74 - 15');
  assert.equal(calculatePillarOverlap(50, 76, 'open'), 74);
  assert.equal(calculatePillarOverlap(0, 95, 'firm'), 0, 'never below 0');
});

test('overall score uses 30/25/25/20 weights', () => {
  const scores = computeMatchScore(ananya, { money: 75, roots: 35, kids: 60, ambition: 80 });
  assert.deepEqual(scores, { overall: 97, money: 97, roots: 96, kids: 98, ambition: 96 });

  const identical = computeMatchScore(ananya, ananya);
  assert.equal(identical.overall, 100);
});

test('dealbreaker penalty lowers the overall score (Nikhil: roots 31 vs 80, firm)', () => {
  const scores = computeMatchScore(ananya, { money: 62, roots: 80, kids: 50, ambition: 75 });
  assert.equal(scores.roots, 36, '100 - 49 - 15');
  assert.equal(scores.overall, Math.round(90 * 0.3 + 36 * 0.25 + 92 * 0.25 + 91 * 0.2));
});

test('archetype summary follows pillar thresholds', () => {
  assert.equal(
    synthesizeArchetype(ananya),
    'In short: a saver who’d move cities for the right role, wants kids within a few years, and won’t apologise for ambition.'
  );
  assert.equal(
    synthesizeArchetype({ money: 30, roots: 80, kids: 20, ambition: 40 }),
    'In short: a spender who lives for now anchored to family roots, focused on shared partnership, and protects evening work-life balance.'
  );
  // Answers near the middle are described as balanced, not pushed to one side
  assert.equal(
    synthesizeArchetype({ money: 55, roots: 50, kids: 50, ambition: 50 }),
    'In short: a balanced saver-spender flexible about where to live, open on when to have kids, and balances career and home.'
  );
});

test('phone numbers normalise to E.164', () => {
  const { normalizePhone } = require('../src/lib/util');
  assert.equal(normalizePhone('98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+91 98765-43210'), '+919876543210');
  assert.equal(normalizePhone('919876543210'), '+919876543210');
  assert.equal(normalizePhone('+44 7700 900123'), '+447700900123');
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone('5876543210'), null, 'Indian mobiles start with 6-9');
  assert.equal(normalizePhone(undefined), null);
});

test('phone masking hides the middle digits', () => {
  const { maskPhone } = require('../src/lib/util');
  assert.equal(maskPhone('+919845512210'), '+91 98••• ••210');
});

test('birth month parsing and age', () => {
  const { parseBirthYearMonth, formatBirthYearMonth, ageFrom } = require('../src/lib/util');
  assert.deepEqual(parseBirthYearMonth('Mar 1997'), { year: 1997, month: 3 });
  assert.deepEqual(parseBirthYearMonth('march 1997'), { year: 1997, month: 3 });
  assert.deepEqual(parseBirthYearMonth('03/1997'), { year: 1997, month: 3 });
  assert.deepEqual(parseBirthYearMonth('1997-03'), { year: 1997, month: 3 });
  assert.equal(parseBirthYearMonth('yesterday'), null);
  assert.equal(formatBirthYearMonth(1997, 3), 'Mar 1997');
  const oct2026 = new Date('2026-10-14T00:00:00Z');
  assert.equal(ageFrom(1997, 3, oct2026), 29);
  assert.equal(ageFrom(1997, 11, oct2026), 28, 'birthday month not reached yet');
});

test('relative times are computed from timestamps', () => {
  const { relativeTime } = require('../src/lib/util');
  const now = Date.parse('2026-10-14T12:00:00Z');
  const ago = (ms) => new Date(now - ms);
  assert.equal(relativeTime(ago(10 * 1000), now), 'Just now');
  assert.equal(relativeTime(ago(5 * 60000), now), '5m ago');
  assert.equal(relativeTime(ago(3 * 3600000), now), '3h ago');
  assert.equal(relativeTime(ago(26 * 3600000), now), 'Yesterday');
  assert.equal(relativeTime(ago(3 * 86400000), now), '3 days ago');
  assert.equal(relativeTime(ago(8 * 86400000), now), 'Last week');
  assert.equal(relativeTime(null, now), null);
});

test('every interface language has the same keys as Tamil and keeps placeholders', () => {
  const { UI_LANGUAGES, translate } = require('../../shared/i18n.js');
  require('../src/lib/i18n'); // registers every locale
  const load = (code) => require(`../../shared/locales/${code}.js`).default;
  const reference = Object.keys(load('ta')).sort();
  const slots = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [code] of UI_LANGUAGES.filter(([c]) => c !== 'en')) {
    const dict = load(code);
    assert.deepEqual(Object.keys(dict).sort(), reference, `${code} keys differ from ta`);
    for (const key of reference) {
      assert.ok(dict[key].trim(), `${code} has an empty translation for "${key}"`);
      assert.equal(slots(dict[key]), slots(key), `${code} lost a placeholder in "${key}"`);
    }
  }
  assert.equal(translate('hi', 'Your profile is {n}% complete', { n: 40 }), 'आपकी प्रोफ़ाइल 40% पूरी है');
  assert.equal(translate('hi', 'Untranslated sentence'), 'Untranslated sentence');
  assert.equal(translate('en', 'Your profile is {n}% complete', { n: 40 }), 'Your profile is 40% complete');
});

test('every literal t() and tx() string in the apps has a translation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..', '..');
  const ta = require('../../shared/locales/ta.js').default;
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'locales') walk(p); }
      else if (/\.(jsx?|mjs)$/.test(e.name)) files.push(p);
    }
  };
  for (const dir of ['web/src', 'frontend/src', 'shared', 'backend/src']) walk(path.join(root, dir));
  const missing = new Set();
  const call = /\b(?:t|tx)\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*[,)]/g;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(call)) {
      const key = m[2].replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
      if (!(key in ta)) missing.add(`${path.relative(root, file)}: ${key}`);
    }
  }
  assert.deepEqual([...missing], []);
});

