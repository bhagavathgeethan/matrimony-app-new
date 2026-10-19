import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Check, Trash2, Plus } from 'lucide-react';
import { PREFERENCE_FIELDS } from '@shared/preferences';
import { PROFILE_PROMPTS, MAX_PROMPTS, PROMPT_ANSWER_MAX } from '@shared/engagement';
import { useStore } from '../../store';
import { Button, cx } from '../../components/ui';
import { Select } from '../../components/Select';
import { t } from '@shared/i18n';

function RangeField({ f, value, onChange }) {
  const v = value || {};
  const opts = Array.from({ length: f.max - f.min + 1 }, (_, i) => f.min + i);
  const fmt = (n) => (f.format ? f.format(n) : `${n} ${f.unit}`);
  const set = (end, raw) => {
    const next = { ...v, [end]: raw === '' ? null : Number(raw) };
    onChange(next.min == null && next.max == null ? null : next);
  };
  return (
    <div className="row" style={{ '--gap': '10px' }}>
      {['min', 'max'].map((end) => (
        <Select key={end} className="grow" aria-label={t(end === 'min' ? '{field} from' : '{field} to', { field: t(f.label) })} value={v[end] ?? ''} onChange={(x) => set(end, x)}
          placeholder={t(end === 'min' ? 'From — any' : 'To — any')}
          options={[['', t(end === 'min' ? 'From — any' : 'To — any')], ...opts.map((n) => [n, fmt(n)])]} />
      ))}
    </div>
  );
}

function AnyField({ f, value, onChange }) {
  const list = value || [];
  return (
    <div className="row wrap" style={{ '--gap': '6px' }} role="group" aria-label={t(f.label)}>
      {f.options.map((o) => {
        const on = list.includes(o);
        return (
          <button key={o} type="button" className={cx('chip sm', on && 'active')} aria-pressed={on}
            onClick={() => onChange(on ? list.filter((x) => x !== o) : [...list, o])}>
            {on && <Check size={12} />} {t(o)}
          </button>
        );
      })}
    </div>
  );
}

// Partner preferences and profile prompts
export function PreferencesPage() {
  const { user, updatePreferences, updatePrompts } = useStore();
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [prompts, setPrompts] = useState(user?.prompts || []);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const savePrefs = async () => {
    setBusy('prefs');
    const body = Object.fromEntries(PREFERENCE_FIELDS.map((f) => {
      const v = prefs[f.key];
      return [f.key, v == null || (Array.isArray(v) && !v.length) ? null : v];
    }));
    const res = await updatePreferences(body);
    setBusy(null);
    setMsg(res.ok ? ['prefs', t('Preferences saved')] : ['prefs', res.error]);
  };
  const savePrompts = async () => {
    setBusy('prompts');
    const res = await updatePrompts(prompts.filter((p) => p.a.trim()).map((p) => ({ q: p.q, a: p.a.trim() })));
    setBusy(null);
    setMsg(res.ok ? ['prompts', t('Prompts saved')] : ['prompts', res.error]);
    if (res.ok) setPrompts(res.data.prompts);
  };
  const unused = PROFILE_PROMPTS.filter((q) => !prompts.some((p) => p.q === q));

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link to="/profile" className="row small muted" style={{ '--gap': '4px' }}><ChevronLeft size={15} />{' '}{t('Profile')}</Link>
      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('What you’re looking for')}</span>
        <h1 className="h1">{t('Partner preferences')}</h1>
        <span className="small muted">{t('Shown on your profile and used to say how well each match fits. Leave anything as “any”. They never hide people from you unless you filter search by them.')}</span>
      </div>
      <div className="card stack" style={{ '--gap': '18px' }}>
        {PREFERENCE_FIELDS.map((f) => (
          <div key={f.key} className="field">
            <span className="label">{t(f.label)}</span>
            {f.type === 'range'
              ? <RangeField f={f} value={prefs[f.key]} onChange={(v) => setPrefs((p) => ({ ...p, [f.key]: v }))} />
              : <AnyField f={f} value={prefs[f.key]} onChange={(v) => setPrefs((p) => ({ ...p, [f.key]: v }))} />}
          </div>
        ))}
        {msg?.[0] === 'prefs' && <span className="small" style={{ fontWeight: 700 }}>{msg[1]}</span>}
        <Button loading={busy === 'prefs'} disabled={!!busy} onClick={savePrefs}>{t('Save preferences')}</Button>
      </div>

      <div className="stack" style={{ '--gap': '6px' }}>
        <span className="eyebrow">{t('In your words')}</span>
        <h2 className="h2">{t('Profile prompts')}</h2>
        <span className="small muted">{t('Answer up to {MAX_PROMPTS}. They show on your card and make first messages easier.', { MAX_PROMPTS })}</span>
      </div>
      <div className="card stack">
        {prompts.map((p, i) => (
          <div key={p.q} className="field">
            <div className="row between"><span className="h3">{t(p.q)}</span>
              <button className="icon-btn sm" aria-label={t('Remove “{q}”', { q: p.q })} onClick={() => setPrompts((list) => list.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
            </div>
            <textarea className="input" rows={2} maxLength={PROMPT_ANSWER_MAX} value={p.a} aria-label={t(p.q)}
              onChange={(e) => setPrompts((list) => list.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
          </div>
        ))}
        {prompts.length < MAX_PROMPTS && (
          <Select value="" aria-label={t('Add a prompt')} placeholder={t('Add a prompt…')} icon={Plus}
            onChange={(q) => q && setPrompts((list) => [...list, { q, a: '' }])} options={unused.map((q) => [q, t(q)])} />
        )}
        {msg?.[0] === 'prompts' && <span className="small" style={{ fontWeight: 700 }}>{msg[1]}</span>}
        <Button loading={busy === 'prompts'} disabled={!!busy} onClick={savePrompts}>{t('Save prompts')}</Button>
      </div>
    </div>
  );
}
