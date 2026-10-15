import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, TrendingUp, Check, Send, Search, X, SlidersHorizontal, History, UserX, RotateCw, MapPin, Heart, Bookmark, Bell, BellOff } from 'lucide-react';
import {
  PILLARS, TIMELINES, ALL_VIBES, SEARCH_SORTS, MIN_SCORE_OPTIONS, SEARCH_AGE_LIMITS, DEFAULT_SEARCH_FILTERS, activeFilterChips,
} from '@shared/constants';
import { useStore } from '../../store';
import { Button, Empty, Modal, Toggle, cx } from '../../components/ui';
import { ShareModal } from '../../components/domain';
import { ProfileTile } from '../../components/tiles';
import { t } from '@shared/i18n';

const QUICK = [
  ['80%+', TrendingUp, (f) => f.minScore >= 80, (f) => ({ minScore: f.minScore >= 80 ? 0 : 80 })],
  ['Verified', BadgeCheck, (f) => f.verified, (f) => ({ verified: !f.verified })],
  ['Not contacted', UserX, (f) => f.notContacted, (f) => ({ notContacted: !f.notContacted })],
  ['Fits my preferences', Heart, (f) => f.matchesPreferences, (f) => ({ matchesPreferences: !f.matchesPreferences })],
];
const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function BrowsePage() {
  const {
    user, search, recentSearches, runSearch, loadMoreSearch, applySearch, rememberSearch, clearRecentSearches,
    savedSearches, loadSavedSearches, saveCurrentSearch, updateSavedSearch, deleteSavedSearch, runSavedSearch,
  } = useStore();
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);
  const navigate = useNavigate();
  const { filters, results, total, nextOffset, facets, status, error } = search;
  const [q, setQ] = useState(filters.q);
  const [selected, setSelected] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const seeking = user?.gender === 'man' ? 'Brides' : user?.gender === 'woman' ? 'Grooms' : 'Profiles';
  const chips = activeFilterChips(filters);
  const typed = useRef(false);

  // First visit: load everyone, best fit first
  useEffect(() => {
    if (status === 'idle') runSearch();
  }, [status, runSearch]);

  // Typing searches after a short pause; a longer pause saves it to recent searches
  useEffect(() => {
    if (!typed.current) return undefined;
    const run = setTimeout(() => runSearch({ q }), 300);
    const remember = setTimeout(() => q.trim().length >= 2 && rememberSearch(), 1500);
    return () => {
      clearTimeout(run);
      clearTimeout(remember);
    };
  }, [q, runSearch, rememberSearch]);

  const onType = (value) => {
    typed.current = true;
    setQ(value);
  };
  const apply = (patch) => {
    runSearch(patch).then(rememberSearch);
  };
  const pickRecent = (r) => {
    typed.current = false;
    setQ(r.filters.q || '');
    applySearch(r.filters);
  };
  const clearAll = () => {
    typed.current = false;
    setQ('');
    applySearch(DEFAULT_SEARCH_FILTERS);
  };

  const chosen = results.filter((c) => selected.includes(c.id));
  const toggle = (id) => setSelected((s) => toggleIn(s, id));
  const loading = status === 'loading';
  const showRecent = recentSearches.length > 0 && !q && chips.length === 0;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          <span className="eyebrow">{t('Search & browse')}</span>
          <h1 className="h1">{seeking} for you</h1>
          <span className="small muted" aria-live="polite">
            {loading ? 'Searching…' : `${total} ${total === 1 ? 'profile' : 'profiles'} · ${SEARCH_SORTS.find(([k]) => k === filters.sort)?.[1].toLowerCase()}`}
          </span>
        </div>
      </div>

      <div className="search-bar">
        <label className="search-input">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by name, city, profession or vibe"
            value={q}
            maxLength={80}
            aria-label="Search profiles"
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                typed.current = false;
                apply({ q });
              }
            }}
          />
          {q && (
            <button className="icon-btn sm" aria-label="Clear search" onClick={() => { typed.current = false; setQ(''); apply({ q: '' }); }}>
              <X size={16} />
            </button>
          )}
        </label>
        <select className="input sort-select" aria-label="Sort by" value={filters.sort} onChange={(e) => apply({ sort: e.target.value })}>
          {SEARCH_SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setShowFilters(true)}>
          Filters{chips.length > 0 && <span className="filter-count">{chips.length}</span>}
        </Button>
        {(chips.length > 0 || q.trim()) && (
          <Button variant="ghost" icon={Bookmark} onClick={() => setSaving(true)}>Save search</Button>
        )}
      </div>

      {savedSearches.length > 0 && (
        <div className="row wrap" style={{ '--gap': '8px', alignItems: 'center' }} aria-label="Saved searches">
          <span className="small muted row" style={{ '--gap': '5px' }}><Bookmark size={14} /> Saved</span>
          {savedSearches.map((sv) => (
            <span key={sv.id} className="saved-chip">
              <button className="chip sm" onClick={() => { typed.current = false; setQ(sv.filters.q || ''); runSavedSearch(sv); }}>{sv.name}</button>
              <button className="icon-btn sm" aria-label={sv.alerts ? `Turn off alerts for ${sv.name}` : `Turn on alerts for ${sv.name}`} onClick={() => updateSavedSearch(sv.id, { alerts: !sv.alerts })}>
                {sv.alerts ? <Bell size={13} /> : <BellOff size={13} />}
              </button>
              <button className="icon-btn sm" aria-label={`Delete saved search ${sv.name}`} onClick={() => deleteSavedSearch(sv.id)}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="row wrap" style={{ '--gap': '8px' }}>
        {QUICK.map(([label, Icon, on, flip]) => (
          <button key={label} className={cx('chip', on(filters) && 'active')} onClick={() => apply(flip(filters))}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {chips.length > 0 && (
        <div className="row wrap" style={{ '--gap': '8px' }} aria-label="Active filters">
          {chips.map((c) => (
            <button key={c.key} className="chip filter-chip" onClick={() => apply(c.clear)} aria-label={`Remove filter ${c.label}`}>
              {c.label} <X size={13} />
            </button>
          ))}
          <button className="link-btn small" onClick={clearAll}>Clear all</button>
        </div>
      )}

      {showRecent && (
        <div className="row wrap" style={{ '--gap': '8px', alignItems: 'center' }}>
          <span className="small muted row" style={{ '--gap': '5px' }}><History size={14} /> Recent</span>
          {recentSearches.map((r) => (
            <button key={r.label} className="chip" onClick={() => pickRecent(r)}>{r.label}</button>
          ))}
          <button className="link-btn small" onClick={clearRecentSearches}>Clear</button>
        </div>
      )}

      {status === 'error' ? (
        <Empty icon={RotateCw} title="Search didn’t load">
          <span className="small">{error}</span>
          <Button size="sm" variant="soft" onClick={() => runSearch()}>Try again</Button>
        </Empty>
      ) : !loading && results.length === 0 && status !== 'idle' ? (
        <Empty icon={Search} title="No profiles match this search">
          <span className="small">Try fewer filters or a different word.</span>
          {(chips.length > 0 || q) && <Button size="sm" variant="soft" onClick={clearAll}>Clear search</Button>}
        </Empty>
      ) : (
        <div className={cx('browse-grid', loading && 'is-loading')}>
          {results.map((c) => (
            <ProfileTile
              key={c.id}
              c={c}
              selected={selected.includes(c.id)}
              onToggleSelect={() => toggle(c.id)}
              onOpen={() => navigate(`/matches?focus=${c.id}`)}
            />
          ))}
        </div>
      )}

      {nextOffset != null && status !== 'error' && (
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button variant="secondary" loading={status === 'loadingMore'} onClick={loadMoreSearch}>
            Show more ({total - results.length} left)
          </Button>
        </div>
      )}

      {chosen.length > 0 && (
        <div className="batch-bar fade-in">
          <div className="grow">
            <div className="h3">{chosen.length} selected</div>
            <div className="tiny" style={{ color: 'rgba(255,246,238,0.7)' }}>Send them to family together</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setSelected([])}>Clear</Button>
          <Button variant="gold" size="sm" icon={Send} onClick={() => setSharing(true)}>Send to family</Button>
        </div>
      )}

      {sharing && (
        <ShareModal candidates={chosen} onClose={() => setSharing(false)} onShared={() => setSelected([])} />
      )}

      {saving && <SaveSearchModal onClose={() => setSaving(false)} onSave={saveCurrentSearch} />}

      {showFilters && (
        <FiltersModal
          filters={filters}
          cities={facets.cities}
          onClose={() => setShowFilters(false)}
          onApply={(next) => {
            setShowFilters(false);
            apply(next);
          }}
        />
      )}
    </div>
  );
}

function SaveSearchModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [alerts, setAlerts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await onSave(name.trim(), alerts);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
  };
  return (
    <Modal title="Save this search" onClose={onClose} width={460}>
      <form className="stack" onSubmit={submit}>
        <input className="input" placeholder="Name, e.g. Chennai 80%+" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} aria-label="Search name" autoFocus />
        <div className="row between"><span className="h3">Alert me when someone new fits</span><Toggle label="Alert me when someone new fits" value={alerts} onChange={setAlerts} /></div>
        {error && <span className="error-text">{error}</span>}
        <div className="row between">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Bookmark} loading={busy} disabled={!name.trim() || busy}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

function FiltersModal({ filters, cities, onClose, onApply }) {
  const [d, setD] = useState(filters);
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const age = (key, value) => {
    const n = value === '' ? null : Math.round(Number(value));
    set({ [key]: Number.isFinite(n) ? n : null });
  };
  const ageError =
    [d.ageMin, d.ageMax].some((a) => a != null && (a < SEARCH_AGE_LIMITS.min || a > SEARCH_AGE_LIMITS.max))
      ? `Ages must be between ${SEARCH_AGE_LIMITS.min} and ${SEARCH_AGE_LIMITS.max}`
      : d.ageMin != null && d.ageMax != null && d.ageMin > d.ageMax
        ? 'Minimum age is above the maximum'
        : null;
  const reset = { ...DEFAULT_SEARCH_FILTERS, q: filters.q, sort: filters.sort };

  return (
    <Modal title="Filters" onClose={onClose} width={620}>
      <div className="filter-section">
        <span className="label">Age</span>
        <div className="row" style={{ '--gap': '10px' }}>
          <input className="input grow" type="number" inputMode="numeric" placeholder="From" aria-label="Minimum age"
            min={SEARCH_AGE_LIMITS.min} max={SEARCH_AGE_LIMITS.max} value={d.ageMin ?? ''} onChange={(e) => age('ageMin', e.target.value)} />
          <span className="muted">to</span>
          <input className="input grow" type="number" inputMode="numeric" placeholder="To" aria-label="Maximum age"
            min={SEARCH_AGE_LIMITS.min} max={SEARCH_AGE_LIMITS.max} value={d.ageMax ?? ''} onChange={(e) => age('ageMax', e.target.value)} />
        </div>
        {ageError && <span className="small" style={{ color: 'var(--accent)' }}>{ageError}</span>}
      </div>

      <div className="filter-section">
        <span className="label">City</span>
        <input className="input" placeholder="Any city" aria-label="City" maxLength={80} value={d.city} onChange={(e) => set({ city: e.target.value })} />
        {cities.length > 0 && (
          <div className="row wrap" style={{ '--gap': '6px' }}>
            {cities.map((c) => (
              <button key={c.city} className={cx('chip sm', d.city.toLowerCase() === c.city.toLowerCase() && 'active')}
                onClick={() => set({ city: d.city.toLowerCase() === c.city.toLowerCase() ? '' : c.city })}>
                <MapPin size={12} /> {c.city} <span className="muted-count">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="filter-section">
        <span className="label">Minimum alignment</span>
        <div className="row wrap" style={{ '--gap': '6px' }}>
          {MIN_SCORE_OPTIONS.map(([v, label]) => (
            <button key={v} className={cx('chip sm', d.minScore === v && 'active')} onClick={() => set({ minScore: v })}>{label}</button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <span className="label">Strongly aligned on</span>
        <div className="row wrap" style={{ '--gap': '6px' }}>
          {PILLARS.map((p) => (
            <button key={p.key} className={cx('chip sm', d.strongOn.includes(p.key) && 'active')} onClick={() => set({ strongOn: toggleIn(d.strongOn, p.key) })}>
              {p.label}
            </button>
          ))}
        </div>
        <span className="tiny muted">Each chosen pillar must be 80% or closer to yours.</span>
      </div>

      <div className="filter-section">
        <span className="label">Marriage timeline</span>
        <div className="row wrap" style={{ '--gap': '6px' }}>
          {TIMELINES.map(([t, label]) => (
            <button key={t} className={cx('chip sm', d.timelines.includes(t) && 'active')} onClick={() => set({ timelines: toggleIn(d.timelines, t) })}>{label}</button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <span className="label">Shares any of these vibes</span>
        <div className="row wrap" style={{ '--gap': '6px' }}>
          {ALL_VIBES.map((v) => (
            <button key={v} className={cx('chip sm', d.vibes.includes(v) && 'active')} onClick={() => set({ vibes: toggleIn(d.vibes, v) })}>{v}</button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="row between"><span className="h3">Verified profiles only</span><Toggle value={d.verified} onChange={(v) => set({ verified: v })} label="Verified profiles only" /></div>
        <div className="row between"><span className="h3">Hide people I’ve messaged</span><Toggle value={d.notContacted} onChange={(v) => set({ notContacted: v })} label="Hide people I’ve messaged" /></div>
      </div>

      <div className="row between" style={{ position: 'sticky', bottom: -28, background: 'var(--bg)', padding: '12px 0 0' }}>
        <Button variant="ghost" onClick={() => setD(reset)}>Reset</Button>
        <Button disabled={!!ageError} onClick={() => onApply(d)}>Show results</Button>
      </div>
    </Modal>
  );
}
