// Personal details: read-only sections (own profile and other members), field inputs and the section editor.
// Field definitions come from ../../shared/profileFields.js.
import React, { useState } from 'react';
import { PenLine, FileText, BookOpen, GraduationCap, MapPin, Users, Contact, Headphones, Pencil, Plus, Check } from 'lucide-react';
import {
  PROFILE_SECTIONS, HEIGHT_OPTIONS, WEIGHT_OPTIONS, MAX_MULTI, formatField, formatHeight, formatWeight, visibleFields, isFilled,
} from '@shared/profileFields';
import { useStore } from '../store';
import { Button, Modal, Toggle, cx } from './ui';
import { t } from '@shared/i18n';

export const SECTION_ICONS = { pen: PenLine, id: FileText, book: BookOpen, grad: GraduationCap, pin: MapPin, family: Users, contact: Contact, music: Headphones };
const ICON_TONES = { pen: '#5b8fd6', id: '#e0646a', book: '#2bb3b1', grad: '#6c7fd8', pin: '#d36bd1', family: '#6aa84f', contact: '#e8913a', music: '#2bb3c9' };

// Option values are stored in English; show them in the interface language
export function displayValue(f, v, values) {
  if (f.type === 'select') return t(v);
  if (f.type === 'multi') return v.map((x) => t(x)).join(', ');
  return formatField(f, v, values);
}

// The values shown/edited: details plus name and age from the profile
export const valuesOf = (person) => ({ ...(person?.details || {}), firstName: person?.firstName ?? person?.details?.firstName });

// Sections in the screenshot style. own=true shows "+ Add details" for empty fields and an edit pencil.
export function DetailsSections({ person, own = false, onEdit, sections = PROFILE_SECTIONS }) {
  const values = valuesOf(person);
  return (
    <div className="details-list">
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.icon];
        const fields = visibleFields(section, values);
        const filled = fields.filter((f) => isFilled(values[f.key]));
        if (!own && filled.length === 0) return null;
        const single = fields.length === 1 && fields[0].type === 'longtext';
        return (
          <section key={section.key} className="details-section" aria-label={section.title}>
            <div className="details-head">
              <Icon size={20} color={ICON_TONES[section.icon]} />
              <h3 className="h3 grow">{t(section.title)}</h3>
              {own && (
                <button className="icon-btn sm" onClick={() => onEdit(section.key)} aria-label={`Edit ${section.title}`}>
                  <Pencil size={15} />
                </button>
              )}
            </div>
            {single ? (
              isFilled(values[fields[0].key]) ? (
                <p className="details-text">{values[fields[0].key]}</p>
              ) : (
                <button className="add-details" onClick={() => onEdit(section.key)}><Plus size={14} /> {t('Add details')}</button>
              )
            ) : (
              <dl className="details-rows">
                {(own ? fields : filled).map((f) => (
                  <React.Fragment key={f.key}>
                    <dt>{t(f.label)}</dt>
                    <dd>
                      {isFilled(values[f.key]) ? displayValue(f, values[f.key], values) : (
                        <button className="add-details" onClick={() => onEdit(section.key)}><Plus size={14} /> {t('Add details')}</button>
                      )}
                    </dd>
                    {section.key === 'basic' && f.key === 'firstName' && person?.age != null && (
                      <><dt>{t('Age')}</dt><dd>{person.age} yrs</dd></>
                    )}
                  </React.Fragment>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function FieldInput({ field, value, onChange, values = {} }) {
  const id = `f-${field.key}`;
  switch (field.type) {
    case 'longtext':
      return (
        <textarea id={id} className="input" rows={5} maxLength={field.max} placeholder={field.placeholder}
          value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      );
    case 'text':
      return (
        <input id={id} className="input" maxLength={field.max} placeholder={field.placeholder}
          value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      );
    case 'select':
      return (
        <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">{t('Select')}</option>
          {field.options.map((o) => <option key={o} value={o}>{t(o)}</option>)}
        </select>
      );
    case 'height':
    case 'weight': {
      const list = field.type === 'height' ? HEIGHT_OPTIONS : WEIGHT_OPTIONS;
      const fmt = field.type === 'height' ? formatHeight : formatWeight;
      return (
        <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Select</option>
          {list.map((n) => <option key={n} value={n}>{fmt(n)}</option>)}
        </select>
      );
    }
    case 'count': {
      const max = field.upTo ? Number(values[field.upTo]) || 0 : 9;
      return (
        <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">Select</option>
          {Array.from({ length: max + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
        </select>
      );
    }
    case 'bool':
      return <Toggle value={Boolean(value)} onChange={onChange} label={field.label} />;
    case 'multi': {
      const list = value || [];
      return (
        <div className="row wrap" style={{ '--gap': '6px' }} role="group" aria-label={field.label}>
          {field.options.map((o) => {
            const on = list.includes(o);
            return (
              <button key={o} type="button" className={cx('chip sm', on && 'active')} aria-pressed={on}
                disabled={!on && list.length >= MAX_MULTI}
                onClick={() => onChange((prev) => {
                  const cur = prev || [];
                  if (cur.includes(o)) return cur.filter((x) => x !== o);
                  return cur.length < MAX_MULTI ? [...cur, o] : cur;
                })}>
                {on && <Check size={12} />} {t(o)}
              </button>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
}

// Only the fields that changed, with empty values sent as null (clears them)
export function changedValues(fields, draft, original) {
  const out = {};
  for (const f of fields) {
    const before = original[f.key] ?? null;
    let after = draft[f.key] ?? null;
    if (typeof after === 'string') after = after.trim() || null;
    if (Array.isArray(after) && !after.length) after = null;
    if (JSON.stringify(before) !== JSON.stringify(after)) out[f.key] = after;
  }
  return out;
}

export function FieldRow({ field, draft, set }) {
  if (field.type === 'bool') {
    return (
      <div className="row between">
        <span className="h3">{t(field.label)}</span>
        <FieldInput field={field} value={draft[field.key]} values={draft} onChange={(v) => set(field.key, v)} />
      </div>
    );
  }
  return (
    <div className="field">
      <label className="label" htmlFor={`f-${field.key}`}>{t(field.label)}</label>
      <FieldInput field={field} value={draft[field.key]} values={draft} onChange={(v) => set(field.key, v)} />
    </div>
  );
}

// values/save let the parent portal reuse this editor (save returns { ok, error }); exclude hides fields
export function SectionEditModal({ sectionKey, onClose, values, save: saveFn, exclude = [] }) {
  const { user, updateDetails } = useStore();
  const section = PROFILE_SECTIONS.find((s) => s.key === sectionKey);
  const original = values || valuesOf(user);
  const persist = saveFn || updateDetails;
  const [draft, setDraft] = useState(original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fields = section.fields.filter((f) => (!f.upTo || Number(draft[f.upTo]) > 0) && !exclude.includes(f.key));

  // v may be a function of the previous value (multi-select chips)
  const set = (key, v) => setDraft((d) => {
    const next = { ...d, [key]: typeof v === 'function' ? v(d[key]) : v };
    // Keep married counts within the sibling count
    for (const f of section.fields.filter((x) => x.upTo === key)) {
      if (next[f.key] != null && next[f.key] > (Number(v) || 0)) next[f.key] = null;
    }
    return next;
  });

  const save = async (e) => {
    e.preventDefault();
    const changes = changedValues(section.fields.filter((f) => !exclude.includes(f.key)), draft, original);
    if (!Object.keys(changes).length) return onClose();
    setBusy(true);
    setError(null);
    const res = await persist(changes);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
  };

  return (
    <Modal title={t(section.title)} onClose={onClose} width={600}>
      <form className="stack" onSubmit={save}>
        {fields.map((f) => <FieldRow key={f.key} field={f} draft={draft} set={set} />)}
        {error && <span className="error-text">{error}</span>}
        <div className="row between modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>{t('Cancel')}</Button>
          <Button type="submit" loading={busy} disabled={busy}>{t('Save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
