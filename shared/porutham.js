// Traditional Tamil star matching (10 poruthams) from the bride's and groom's star and raasi.
// Opt-in, shown separately from the values score, and only a traditional guide — families usually confirm with an astrologer.
// Plain ES module.
import { STARS, RAASIS } from './profileFields.js';

const GANA = ['D', 'M', 'R', 'M', 'D', 'M', 'D', 'D', 'R', 'R', 'M', 'M', 'D', 'R', 'D', 'R', 'D', 'R', 'R', 'M', 'M', 'D', 'R', 'R', 'M', 'M', 'D'];
const YONI = [
  'horse', 'elephant', 'sheep', 'serpent', 'serpent', 'dog', 'cat', 'sheep', 'cat', 'rat', 'rat', 'cow', 'buffalo', 'tiger',
  'buffalo', 'tiger', 'deer', 'deer', 'dog', 'monkey', 'mongoose', 'monkey', 'lion', 'horse', 'lion', 'cow', 'elephant',
];
const YONI_ENEMIES = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
// Rajju repeats feet, waist, navel, neck, head, neck, navel, waist, feet across each group of nine stars
const RAJJU_CYCLE = ['Paada (feet)', 'Kati (waist)', 'Nabhi (navel)', 'Kanta (neck)', 'Siro (head)', 'Kanta (neck)', 'Nabhi (navel)', 'Kati (waist)', 'Paada (feet)'];
const VEDHA_PAIRS = [
  ['Ashwini', 'Jyeshtha'], ['Bharani', 'Anuradha'], ['Krittika', 'Vishakha'], ['Rohini', 'Swati'], ['Ardra', 'Shravana'],
  ['Punarvasu', 'Uttara Ashadha'], ['Pushya', 'Purva Ashadha'], ['Ashlesha', 'Mula'], ['Magha', 'Revati'],
  ['Purva Phalguni', 'Uttara Bhadrapada'], ['Uttara Phalguni', 'Purva Bhadrapada'], ['Hasta', 'Shatabhisha'],
  ['Mrigashira', 'Dhanishta'], ['Mrigashira', 'Chitra'], ['Chitra', 'Dhanishta'],
];
// Raasi lords, Mesham → Meenam
const LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const FRIENDS = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'], Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'],
};
const ENEMIES = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'], Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'],
};
// Vasya: raasis "attracted" to each raasi, by index
const VASYA = [[4, 7], [3, 6], [5], [7, 8], [6], [1, 11], [9, 5], [3], [11], [10, 0], [0], [9]];

const good = (name, note) => ({ name, result: 'good', note });
const ok = (name, note) => ({ name, result: 'average', note });
const bad = (name, note) => ({ name, result: 'not matching', note });

/**
 * bride / groom: { star, raasi } using the labels from profileFields (e.g. 'Rohini', 'Rishabam (Taurus)').
 * Returns null when either star or raasi is missing.
 */
export function porutham(bride, groom) {
  const g = STARS.indexOf(bride?.star);
  const b = STARS.indexOf(groom?.star);
  const rg = RAASIS.indexOf(bride?.raasi);
  const rb = RAASIS.indexOf(groom?.raasi);
  if (g < 0 || b < 0 || rg < 0 || rb < 0) return null;

  const count = ((b - g + 27) % 27) + 1; // groom's star counted from the bride's
  const rasiCount = ((rb - rg + 12) % 12) + 1;
  const items = [];

  items.push([0, 2, 4, 6, 8].includes(count % 9) ? good('Dina', 'Day-to-day harmony') : bad('Dina', 'Day-to-day harmony'));

  const gg = GANA[g];
  const gb = GANA[b];
  if (gg === gb || (gg === 'M' && gb === 'D')) items.push(good('Gana', 'Temperament'));
  else if (gg === 'D' && gb === 'M') items.push(ok('Gana', 'Temperament'));
  else items.push(bad('Gana', 'Temperament'));

  items.push([4, 7, 10, 13, 16, 19, 22, 25].includes(count) ? good('Mahendra', 'Prosperity and children') : bad('Mahendra', 'Prosperity and children'));

  if (count > 13) items.push(good('Stree Deergha', 'Long, happy married life'));
  else if (count >= 7) items.push(ok('Stree Deergha', 'Long, happy married life'));
  else items.push(bad('Stree Deergha', 'Long, happy married life'));

  const yg = YONI[g];
  const yb = YONI[b];
  if (yg === yb) items.push(good('Yoni', 'Physical compatibility'));
  else if (YONI_ENEMIES.some(([x, y]) => (x === yg && y === yb) || (x === yb && y === yg))) items.push(bad('Yoni', 'Physical compatibility'));
  else items.push(ok('Yoni', 'Physical compatibility'));

  items.push([2, 6, 8, 12].includes(rasiCount) ? bad('Rasi', 'Family growth') : good('Rasi', 'Family growth'));

  const lg = LORD[rg];
  const lb = LORD[rb];
  if (lg === lb || (FRIENDS[lg].includes(lb) && FRIENDS[lb].includes(lg))) items.push(good('Rasi Adhipathi', 'Understanding between families'));
  else if (ENEMIES[lg].includes(lb) || ENEMIES[lb].includes(lg)) items.push(bad('Rasi Adhipathi', 'Understanding between families'));
  else items.push(ok('Rasi Adhipathi', 'Understanding between families'));

  items.push(VASYA[rg].includes(rb) || VASYA[rb].includes(rg) ? good('Vasya', 'Mutual attraction') : ok('Vasya', 'Mutual attraction'));

  const rajjuG = RAJJU_CYCLE[g % 9];
  const rajjuB = RAJJU_CYCLE[b % 9];
  items.push(rajjuG === rajjuB ? bad('Rajju', `Both ${rajjuG} — traditionally considered the most important`) : good('Rajju', 'Longevity of the marriage'));

  const vedha = VEDHA_PAIRS.some(([x, y]) => (x === STARS[g] && y === STARS[b]) || (x === STARS[b] && y === STARS[g]));
  items.push(vedha ? bad('Vedha', 'Freedom from affliction') : good('Vedha', 'Freedom from affliction'));

  const matched = items.filter((i) => i.result === 'good').length;
  const rajjuOk = rajjuG !== rajjuB;
  return {
    matched,
    total: items.length,
    rajjuOk,
    items,
    summary: `${matched}/10 poruthams${rajjuOk ? '' : ' · Rajju does not match'}`,
    disclaimer: 'A traditional guide only. It never changes your values score; many families confirm with an astrologer.',
  };
}
