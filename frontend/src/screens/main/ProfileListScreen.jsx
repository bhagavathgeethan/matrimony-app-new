import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { BadgeCheck, TrendingUp, Send, Search, X, SlidersHorizontal, UserX, History, Heart, Bookmark, Bell, BellOff } from 'lucide-react';
import { Sheet } from '../../components/details/DetailsUI';
import { Capacitor } from '@capacitor/core';
import { SEARCH_SORTS, DEFAULT_SEARCH_FILTERS, activeFilterChips } from '@shared/constants';
import { theme } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ProfileThumbnailRow } from '../../components/feed/ProfileThumbnailRow';
import { ScopedShareSheet } from '../../components/family/ScopedShareSheet';
import { SearchFilterSheet } from '../../components/search/SearchFilterSheet';
import { Screen, FadeIn, Eyebrow, Heading, Body, Chip, Card, Button } from '../../components/ui/kit';

const isNativeApp = Capacitor.isNativePlatform();
const { colors, fonts, gradients, shadows } = theme;

const QUICK = [
  ['80%+', TrendingUp, (f) => f.minScore >= 80, (f) => ({ minScore: f.minScore >= 80 ? 0 : 80 })],
  ['Verified', BadgeCheck, (f) => f.verified, (f) => ({ verified: !f.verified })],
  ['Not contacted', UserX, (f) => f.notContacted, (f) => ({ notContacted: !f.notContacted })],
  ['Fits my preferences', Heart, (f) => f.matchesPreferences, (f) => ({ matchesPreferences: !f.matchesPreferences })],
];

export const ProfileListScreen = () => {
  const {
    user, search, recentSearches, runSearch, loadMoreSearch, applySearch, rememberSearch, clearRecentSearches,
    setCurrentScreen, setActiveTab, setFocusedCandidateId, shareWithFamily,
    savedSearches, loadSavedSearches, saveCurrentSearch, updateSavedSearch, deleteSavedSearch, runSavedSearch,
  } = useApp();
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveError, setSaveError] = useState(null);
  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);
  const doSave = async () => {
    const res = await saveCurrentSearch(saveName.trim(), true);
    if (!res.ok) return setSaveError(res.error);
    setSaving(false);
    setSaveName('');
    setSaveError(null);
  };
  const { filters, results, total, nextOffset, facets, status, error } = search;
  const seeking = user?.gender === 'man' ? 'Brides' : user?.gender === 'woman' ? 'Grooms' : 'Profiles';

  const [q, setQ] = useState(filters.q);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const typed = useRef(false);
  const chips = activeFilterChips(filters);

  // First visit: everyone, best fit first
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

  const apply = (patch) => runSearch(patch).then(rememberSearch);
  const setQuery = (value, { now = false } = {}) => {
    typed.current = !now;
    setQ(value);
    if (now) apply({ q: value });
  };
  const replaceSearch = (next) => {
    typed.current = false;
    setQ(next.q || '');
    applySearch(next);
  };

  const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectedCandidates = results.filter((c) => selectedIds.includes(c.id));
  const loading = status === 'loading';
  const sortLabel = SEARCH_SORTS.find(([k]) => k === filters.sort)?.[1].toLowerCase();
  const showRecent = recentSearches.length > 0 && !q && chips.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <FadeIn>
          <View style={{ gap: 6, marginTop: 4 }}>
            <Eyebrow>Search & browse</Eyebrow>
            <Heading size={36}>{seeking} for you</Heading>
            <Body size={14}>{loading ? 'Searching…' : `${total} ${total === 1 ? 'profile' : 'profiles'} · ${sortLabel}`}</Body>
          </View>
        </FadeIn>

        <FadeIn delay={40}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Name, city, profession, vibe"
                placeholderTextColor={colors.textLight}
                value={q}
                maxLength={80}
                returnKeyType="search"
                accessibilityLabel="Search profiles"
                onChangeText={(t) => setQuery(t)}
                onSubmitEditing={() => setQuery(q, { now: true })}
              />
              {q ? (
                <TouchableOpacity onPress={() => setQuery('', { now: true })} style={styles.clearBtn} accessibilityLabel="Clear search">
                  <X size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterBtn} accessibilityLabel={`Filters${chips.length ? `, ${chips.length} on` : ''}`}>
              <SlidersHorizontal size={19} color={colors.textPrimary} />
              {chips.length > 0 && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>{chips.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={styles.chipRow}>
            {QUICK.map(([label, icon, on, flip]) => (
              <Chip key={label} label={label} icon={icon} active={on(filters)} onPress={() => apply(flip(filters))} />
            ))}
          </View>
        </FadeIn>

        {savedSearches.length > 0 && (
          <View style={styles.chipRow} accessibilityLabel="Saved searches">
            <View style={styles.recentLabel}>
              <Bookmark size={13} color={colors.textMuted} />
              <Text style={styles.hint}>Saved</Text>
            </View>
            {savedSearches.map((sv) => (
              <View key={sv.id} style={styles.savedChip}>
                <TouchableOpacity onPress={() => { typed.current = false; setQ(sv.filters.q || ''); runSavedSearch(sv); }}>
                  <Text style={styles.activeChipText}>{sv.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => updateSavedSearch(sv.id, { alerts: !sv.alerts })} accessibilityLabel={sv.alerts ? `Turn off alerts for ${sv.name}` : `Turn on alerts for ${sv.name}`}>
                  {sv.alerts ? <Bell size={13} color={colors.accent} /> : <BellOff size={13} color={colors.textMuted} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSavedSearch(sv.id)} accessibilityLabel={`Delete saved search ${sv.name}`}>
                  <X size={13} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {chips.length > 0 && (
          <View style={styles.chipRow}>
            <TouchableOpacity onPress={() => setSaving(true)} style={styles.activeChip} accessibilityLabel="Save search">
              <Bookmark size={12} color={colors.accent} />
              <Text style={styles.activeChipText}>Save search</Text>
            </TouchableOpacity>
            {chips.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => apply(c.clear)} style={styles.activeChip} accessibilityLabel={`Remove filter ${c.label}`}>
                <Text style={styles.activeChipText}>{c.label}</Text>
                <X size={12} color={colors.accent} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => replaceSearch(DEFAULT_SEARCH_FILTERS)}>
              <Text style={styles.link}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {showRecent && (
          <View style={styles.chipRow}>
            <View style={styles.recentLabel}>
              <History size={13} color={colors.textMuted} />
              <Text style={styles.hint}>Recent</Text>
            </View>
            {recentSearches.map((r) => (
              <Chip key={r.label} label={r.label} onPress={() => replaceSearch(r.filters)} />
            ))}
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.link}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {results.length > 0 && <Text style={styles.selectHint}>Tap ◯ to select for family</Text>}

        {status === 'error' ? (
          <Card variant="tinted" style={{ gap: 12, alignItems: 'center' }}>
            <Body style={{ textAlign: 'center' }}>Search didn’t load. {error}</Body>
            <Button small variant="secondary" label="Try again" onPress={() => runSearch()} />
          </Card>
        ) : loading && results.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : results.length === 0 && status !== 'idle' ? (
          <Card variant="tinted" style={{ gap: 12, alignItems: 'center' }}>
            <Body style={{ textAlign: 'center' }}>No profiles match this search. Try fewer filters or a different word.</Body>
            {(chips.length > 0 || q) ? (
              <Button small variant="secondary" label="Clear search" onPress={() => replaceSearch(DEFAULT_SEARCH_FILTERS)} />
            ) : null}
          </Card>
        ) : (
          <View style={[styles.grid, loading && { opacity: 0.55 }]}>
            {results.map((candidate) => (
              <ProfileThumbnailRow
                key={candidate.id}
                candidate={candidate}
                selected={selectedIds.includes(candidate.id)}
                onToggleSelect={() => toggleSelect(candidate.id)}
                onPressCard={() => {
                  setFocusedCandidateId(candidate.id);
                  setActiveTab('feed');
                  setCurrentScreen('feed');
                }}
              />
            ))}
          </View>
        )}

        {nextOffset != null && status !== 'error' && (
          <Button
            variant="secondary"
            label={status === 'loadingMore' ? 'Loading…' : `Show more (${total - results.length} left)`}
            disabled={status === 'loadingMore'}
            onPress={loadMoreSearch}
            style={{ marginTop: 16 }}
          />
        )}
      </Screen>

      {/* Floating batch action bar */}
      {selectedCandidates.length > 0 && (
        <View style={styles.batchWrap} pointerEvents="box-none">
          <View style={[styles.batchBar, isNativeApp && { maxWidth: '100%' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchTitle}>{selectedCandidates.length} selected</Text>
              <Text style={styles.batchSub}>Send to family or express interest</Text>
            </View>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setShowBatchModal(true)} style={styles.sendBtn}>
              <Send size={15} color={colors.surfaceDark} />
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showBatchModal && (
        <ScopedShareSheet
          batchCandidates={selectedCandidates}
          onClose={() => setShowBatchModal(false)}
          onSend={async (batch) => {
            const result = await shareWithFamily(batch);
            if (result.ok) {
              setShowBatchModal(false);
              setSelectedIds([]);
            }
            return result;
          }}
        />
      )}

      {saving && (
        <Sheet
          title="Save this search"
          onClose={() => setSaving(false)}
          footer={<Button label="Save" disabled={!saveName.trim()} onPress={doSave} />}
        >
          <TextInput value={saveName} onChangeText={setSaveName} placeholder="Name, e.g. Chennai 80%+" placeholderTextColor={colors.textLight}
            maxLength={80} style={styles.saveInput} accessibilityLabel="Search name" />
          <Text style={styles.hint}>We’ll notify you when someone new fits this search.</Text>
          {saveError && <Text style={[styles.hint, { color: colors.accent }]}>{saveError}</Text>}
        </Sheet>
      )}

      {showFilters && (
        <SearchFilterSheet
          filters={filters}
          cities={facets.cities}
          onClose={() => setShowFilters(false)}
          onApply={(next) => {
            setShowFilters(false);
            apply(next);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card },
  saveInput: { height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, outlineStyle: 'none' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  searchBox: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  activeChipText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.accent,
  },
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  recentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  selectHint: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 14,
    marginBottom: 8,
  },
  loading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  batchWrap: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 104,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 41,
  },
  batchBar: {
    width: '100%',
    maxWidth: 408,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 18,
    paddingRight: 12,
    borderRadius: 22,
    backgroundImage: gradients.hero,
    boxShadow: shadows.raised,
  },
  batchTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '800',
    color: colors.onDark,
  },
  batchSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: 'rgba(255,246,238,0.7)',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundImage: gradients.gold,
  },
  sendText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '800',
    color: colors.surfaceDark,
  },
});
