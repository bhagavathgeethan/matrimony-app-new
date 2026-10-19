// Styled dropdown used in place of the browser's <select>. Opens a list under (or above) the field,
// with keyboard support, a search box for long lists and a check on the chosen option.
// options: [{ value, label, hint? }] or [value, label] pairs.
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { t } from '@shared/i18n';
import { cx } from './ui';

const SEARCH_FROM = 12;
const MENU_MAX = 320;

const normalise = (options) => options.map((o) => (Array.isArray(o) ? { value: o[0], label: o[1] } : o));

export function Select({
  value, onChange, options, placeholder, id, className, style, disabled, icon: Icon, size, tone, menuWidth,
  'aria-label': ariaLabel,
}) {
  const list = useMemo(() => normalise(options), [options]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  const selected = list.find((o) => String(o.value) === String(value ?? ''));
  const empty = !selected || selected.value === '';
  const searchable = list.length >= SEARCH_FROM;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? list.filter((o) => String(o.label).toLowerCase().includes(q)) : list;
  }, [list, query]);

  const place = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const up = below < Math.min(MENU_MAX, 220) && r.top > below;
    const width = Math.max(r.width, menuWidth || 220);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ left, width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }), maxHeight: Math.min(MENU_MAX, (up ? r.top : below) - 12) });
  };

  const openMenu = () => {
    if (disabled) return;
    setQuery('');
    setActive(Math.max(0, list.findIndex((o) => o === selected)));
    place();
    setOpen(true);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) trigger.current?.focus();
  };
  const choose = (o) => {
    if (!o) return;
    onChange(o.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const onScroll = (e) => { if (!menu.current?.contains(e.target)) place(); };
    const onDown = (e) => {
      if (!menu.current?.contains(e.target) && !trigger.current?.contains(e.target)) close(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // keep the highlighted option in view
  useEffect(() => {
    if (open) menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKey = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    const last = shown.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(last, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || (e.key === ' ' && !searchable)) { e.preventDefault(); choose(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close(false);
    else if (!searchable && e.key.length === 1) {
      // type-ahead: jump to the first option starting with the typed letters
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase(), at: now };
      const i = shown.findIndex((o) => String(o.label).toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        id={id}
        className={cx('select-trigger', size === 'sm' && 'sm', tone === 'dark' && 'dark', open && 'open', className)}
        style={style}
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
        data-value={value ?? ''}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKey}
      >
        {Icon && <Icon size={16} className="select-icon" aria-hidden="true" />}
        <span className={cx('select-value', empty && 'placeholder')}>{empty ? (placeholder ?? t('Select')) : selected.label}</span>
        <ChevronDown size={16} className="select-chevron" aria-hidden="true" />
      </button>
      {open && pos && createPortal(
        <div ref={menu} className="select-menu" style={pos} onKeyDown={onKey}>
          {searchable && (
            <label className="select-search">
              <Search size={15} aria-hidden="true" />
              <input
                autoFocus
                value={query}
                placeholder={t('Search')}
                aria-label={t('Search')}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              />
            </label>
          )}
          <ul id={listId} role="listbox" aria-label={ariaLabel} className="select-options">
            {shown.map((o, i) => {
              const on = selected === o;
              return (
                <li
                  key={String(o.value)}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={on}
                  data-index={i}
                  data-value={o.value ?? ''}
                  lang={o.lang}
                  className={cx('select-option', i === active && 'active', on && 'on')}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                >
                  <span className="grow">
                    {o.label}
                    {o.hint && <span className="select-hint">{o.hint}</span>}
                  </span>
                  {on && <Check size={16} aria-hidden="true" />}
                </li>
              );
            })}
            {shown.length === 0 && <li className="select-empty">{t('No matches')}</li>}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}
