// Server-side translation: loads every interface language from shared/locales so notifications can be
// written in each member's language. tx() marks text for translation: tx('{name} accepted your interest', { name }).
const { registerLanguage, translate, LANGUAGE_CODES } = require('../../../shared/i18n.js');

for (const code of LANGUAGE_CODES) {
  if (code !== 'en') registerLanguage(code, require(`../../../shared/locales/${code}.js`).default);
}

const tx = (key, vars) => ({ key, vars });
const isTx = (v) => Boolean(v && typeof v === 'object' && typeof v.key === 'string');
// Plain text, or a tx() in the given language (with app terms inside it, like a plan name, translated too)
const render = (lang, v) => (isTx(v) ? translate(lang, v.key, translateVars(lang, v.vars)) : v);
function translateVars(lang, vars) {
  if (!vars) return vars;
  return Object.fromEntries(Object.entries(vars).map(([k, x]) => [k, typeof x === 'string' ? translate(lang, x) : x]));
}

module.exports = { tx, isTx, render };
