/* App.jsx: application state, the async flows and ALL event handlers.
 *
 * Event strategy: exactly TWO delegated click handlers cover every movie
 * card, one on the results grid and one on the watchlist grid. No card has
 * its own onClick. Clicks on nested elements (the poster, a button label)
 * bubble up to the grid, which reads data-action with closest(). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from './config.js';
import { AppError } from './utils/AppError.js';
import { debounce, titleKey } from './utils/helpers.js';
import * as omdb from './api/omdb.js';
import * as store from './api/watchlistStore.js';

import SearchBar from './components/SearchBar.jsx';
import StatusPanel from './components/StatusPanel.jsx';
import ResultCard from './components/ResultCard.jsx';
import WatchlistCard from './components/WatchlistCard.jsx';
import DetailsModal from './components/DetailsModal.jsx';
import EditModal from './components/EditModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import Toasts from './components/Toasts.jsx';
import RequestLog from './components/RequestLog.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'to-watch', label: 'To watch' },
  { id: 'watched', label: 'Watched' },
];

export default function App() {
  /* ---------- STATE (replaces the old `state` object and DOM writes) ---------- */
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [results, setResults] = useState([]);
  const [detailsById, setDetailsById] = useState({});
  const [resultsHeading, setResultsHeading] = useState('Search results');
  const [searchStatus, setSearchStatus] = useState({ kind: 'idle' });

  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState('');
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState({}); // { [entryId]: 'toggle' | 'delete' }

  const [details, setDetails] = useState(null); // { loading, movie, error }
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);  // entry being edited
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(null); // entry to delete

  const [toasts, setToasts] = useState([]);
  const [requestLog, setRequestLog] = useState([]);

  const searchInputRef = useRef(null);
  const searchToken = useRef(0);          // guards against out-of-order responses
  const abortRef = useRef(null);          // cancels the previous search fetch

  // Derived data: recomputed only when the watchlist changes.
  const savedTitles = useMemo(() => new Set(watchlist.map((e) => titleKey(e.title))), [watchlist]);
  const savedIds = useMemo(() => new Set(watchlist.map((e) => e.imdbID).filter(Boolean)), [watchlist]);
  // A movie counts as saved if its IMDb ID or its title is already stored,
  // so renaming an entry with PUT does not let the same movie be added twice.
  const isSaved = (imdbID, title) => savedIds.has(imdbID) || savedTitles.has(titleKey(title));
  const visibleWatchlist = useMemo(() => {
    if (filter === 'watched') return watchlist.filter((e) => e.watched);
    if (filter === 'to-watch') return watchlist.filter((e) => !e.watched);
    return watchlist;
  }, [watchlist, filter]);
  const watchedCount = watchlist.filter((e) => e.watched).length;

  /* ---------- TOASTS ---------- */
  const showToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);

  /* ---------- SEARCH ---------- */
  const runSearch = useCallback(async (rawQuery) => {
    const text = String(rawQuery || '').trim();
    abortRef.current?.abort(); // cancel any older request still in flight

    // USER ERROR HANDLING: block empty and one-letter searches.
    if (text === '') {
      searchToken.current++;
      setSearchStatus({ kind: 'idle' });
      return;
    }
    if (text.length < 2) {
      searchToken.current++;
      setSearchStatus({ kind: 'short' });
      return;
    }
    // USER ERROR HANDLING: a missing key is caught before wasting a request.
    if (!CONFIG.OMDB_API_KEY) {
      setSearchStatus({ kind: 'apikey' });
      return;
    }

    const token = ++searchToken.current;
    const controller = new AbortController();
    abortRef.current = controller;

    setLastQuery(text);
    setResultsHeading('Search results');
    setSearchStatus({ kind: 'loading' }); // LOADING STATE while the fetch is pending

    // ASYNC PATTERN: try/catch around an awaited .then() chain.
    try {
      const hits = await omdb.searchMovies(text, controller.signal);
      if (token !== searchToken.current) return; // a newer search started

      setResults(hits);
      setDetailsById({});
      setSearchStatus({ kind: 'results' });

      // ASYNC PATTERN: Promise.allSettled, enrich cards in parallel.
      const ids = hits.slice(0, CONFIG.DETAIL_FETCH_LIMIT).map((hit) => hit.imdbID);
      const byId = await omdb.fetchDetailsForMany(ids);
      if (token !== searchToken.current) return;
      setDetailsById(byId);
    } catch (err) {
      if (token !== searchToken.current || err.kind === 'aborted') return;
      setSearchStatus({ kind: err.kind || 'omdb', message: err.kind === 'omdb' ? err.message : undefined });
    }
  }, []);

  // The debounced wrapper is created ONCE and reused for every keystroke.
  const debouncedSearch = useMemo(() => debounce(runSearch, CONFIG.DEBOUNCE_MS), [runSearch]);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  function handleQueryChange(value) {
    setQuery(value);
    debouncedSearch(value); // fires only after the user stops typing
  }

  function handleSearchSubmit(value) {
    debouncedSearch.cancel(); // submit searches now, skipping the debounce
    if (value.trim() === '') {
      setSearchStatus({ kind: 'empty' }); // USER ERROR HANDLING
      searchInputRef.current?.focus();
      return;
    }
    runSearch(value);
  }

  function handleClearSearch() {
    debouncedSearch.cancel();
    abortRef.current?.abort();
    searchToken.current++;
    setQuery('');
    setSearchStatus({ kind: 'idle' });
    searchInputRef.current?.focus();
  }

  /* ---------- WATCHLIST: the five HTTP verbs ---------- */

  // HTTP VERB: GET
  const loadWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    try {
      const items = await store.getWatchlist();
      setWatchlist(items);
      setWatchlistError('');
      return items;
    } catch (err) {
      setWatchlistError(err.message || 'The watchlist could not be loaded.');
      throw err;
    } finally {
      setWatchlistLoading(false);
    }
  }, []);

  // HTTP VERB: POST
  async function addMovie(payload) {
    // USER ERROR HANDLING: never POST a movie that is already saved.
    if (isSaved(payload.imdbID, payload.title)) {
      throw new AppError('duplicate', 'That movie is already in your watchlist.');
    }
    setAdding(true); // disables the button so a double click cannot POST twice
    try {
      const created = await store.addToWatchlist(payload);
      setWatchlist((list) => [...list, created]);
      setDetails(null);
      showToast(`"${created.title}" added to your watchlist.`, 'success');
    } finally {
      setAdding(false);
    }
  }

  // HTTP VERB: PUT (full edit: every field is sent)
  async function saveEdit(id, fields) {
    const existing = watchlist.find((e) => e.id === id);
    if (!existing) throw new AppError('not-found', 'That entry no longer exists.');
    setSaving(true);
    try {
      const updated = await store.replaceEntry(id, { ...existing, ...fields });
      setWatchlist((list) => list.map((e) => (e.id === id ? updated : e)));
      setEditing(null);
      showToast('Changes saved.', 'success');
    } finally {
      setSaving(false);
    }
  }

  // HTTP VERB: PATCH (only the `watched` field)
  async function toggleWatched(entry) {
    setPending((p) => ({ ...p, [entry.id]: 'toggle' }));
    try {
      const updated = await store.patchEntry(entry.id, { watched: !entry.watched });
      setWatchlist((list) => list.map((e) => (e.id === entry.id ? updated : e)));
      showToast(updated.watched ? 'Marked as watched.' : 'Moved back to "To watch".', 'info');
    } catch (err) {
      showToast(err.message || 'Could not update the watched status.', 'error');
    } finally {
      setPending(({ [entry.id]: _done, ...rest }) => rest);
    }
  }

  // HTTP VERB: DELETE
  async function removeMovie(entry) {
    setConfirming(null);
    setPending((p) => ({ ...p, [entry.id]: 'delete' }));
    try {
      await store.deleteEntry(entry.id);
      setWatchlist((list) => list.filter((e) => e.id !== entry.id));
      showToast(`"${entry.title}" removed.`, 'info');
    } catch (err) {
      showToast(err.message || 'Could not remove that entry.', 'error');
    } finally {
      setPending(({ [entry.id]: _done, ...rest }) => rest);
    }
  }

  /* ---------- DETAILS MODAL ---------- */
  async function openDetails(imdbID) {
    setDetails({ loading: true }); // LOADING STATE while details are fetched
    try {
      const movie = await omdb.fetchMovieDetails(imdbID);
      setDetails({ loading: false, movie });
    } catch (err) {
      setDetails({ loading: false, error: err.message || 'Could not load the movie details.' });
    }
  }

  /* ---------- DELEGATED LISTENER 1 of 2: results grid ---------- */
  function handleResultsClick(event) {
    const trigger = event.target.closest('[data-action]'); // element that was hit
    const card = event.target.closest('[data-imdbid]');    // parent card
    if (!trigger || !card) return;
    // Both "details" and "add" open the modal, so a rating is picked before the POST.
    openDetails(card.dataset.imdbid);
  }

  /* ---------- DELEGATED LISTENER 2 of 2: watchlist grid ---------- */
  function handleWatchlistClick(event) {
    const trigger = event.target.closest('[data-action]');
    const card = event.target.closest('[data-id]');
    if (!trigger || !card || trigger.disabled) return;

    const entry = watchlist.find((e) => e.id === card.dataset.id);
    if (!entry || pending[entry.id]) return; // USER ERROR HANDLING: one request per card

    const action = trigger.dataset.action;
    if (action === 'toggle') toggleWatched(entry);   // PATCH
    if (action === 'edit') setEditing(entry);        // PUT (after the form)
    if (action === 'delete') setConfirming(entry);   // DELETE (after confirm)
  }

  /* ---------- GLOBAL KEYBOARD: Escape closes the top modal ---------- */
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      setConfirming(null);
      setEditing(null);
      setDetails(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---------- REQUEST LOG subscription ---------- */
  useEffect(() => store.onRequest((entry) => setRequestLog((log) => [entry, ...log].slice(0, 50))), []);

  /* ---------- BOOT ---------- */
  useEffect(() => {
    let cancelled = false;

    // ASYNC PATTERN: Promise.allSettled at start-up. The watchlist GET and
    // the "popular picks" OMDb lookups run CONCURRENTLY, and a failure in
    // one side does not stop the other from rendering.
    async function init() {
      const [watchlistOutcome, popularOutcome] = await Promise.allSettled([
        loadWatchlist(),
        omdb.fetchDetailsForMany(CONFIG.POPULAR_IDS),
      ]);
      if (cancelled) return;

      if (watchlistOutcome.status === 'rejected') {
        console.warn('Watchlist failed to load:', watchlistOutcome.reason);
      }
      if (popularOutcome.status === 'fulfilled') {
        const movies = CONFIG.POPULAR_IDS.map((id) => popularOutcome.value[id]).filter(Boolean);
        if (movies.length > 0 && searchToken.current === 0) {
          setResults(movies.map(({ imdbID, Title, Year, Poster }) => ({ imdbID, Title, Year, Poster })));
          setDetailsById(popularOutcome.value);
          setResultsHeading('Popular picks');
          setSearchStatus({ kind: 'results' });
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [loadWatchlist]);

  /* ---------- RENDER ---------- */
  const detailsSaved = details?.movie ? isSaved(details.movie.imdbID, details.movie.Title) : false;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-50">MovieIo</h1>
            <p className="text-sm text-slate-500">Find movies on OMDb and keep a watchlist</p>
          </div>
          <SearchBar
            value={query}
            inputRef={searchInputRef}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        {/* SEARCH RESULTS */}
        <section aria-labelledby="results-heading">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="results-heading" className="text-lg font-semibold text-slate-100">{resultsHeading}</h2>
            {searchStatus.kind === 'results' && (
              <span className="text-sm text-slate-500">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
            )}
          </div>

          {searchStatus.kind === 'results' ? (
            <div
              onClick={handleResultsClick}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {results.map((hit) => (
                <ResultCard
                  key={hit.imdbID}
                  hit={hit}
                  detail={detailsById[hit.imdbID]}
                  saved={isSaved(hit.imdbID, hit.Title)}
                />
              ))}
            </div>
          ) : (
            <StatusPanel status={searchStatus} query={lastQuery} onRetry={() => runSearch(lastQuery)} />
          )}
        </section>

        {/* WATCHLIST */}
        <section aria-labelledby="watchlist-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 id="watchlist-heading" className="text-lg font-semibold text-slate-100">My watchlist</h2>
              <span className="text-sm text-slate-500">
                {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'}, {watchedCount} watched
              </span>
            </div>
            <div role="tablist" aria-label="Filter watchlist" className="flex rounded-lg border border-slate-800 p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                    filter === f.id ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {watchlistError && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-fuchsia-500/60 bg-fuchsia-950/40 px-4 py-3 text-fuchsia-200">
              <div>
                <p className="font-semibold">Watchlist storage error</p>
                <p className="text-sm opacity-90">{watchlistError}</p>
              </div>
              <button
                type="button"
                onClick={() => loadWatchlist().catch(() => {})}
                className="ml-auto shrink-0 rounded-lg bg-fuchsia-500/20 px-3 py-1.5 text-sm font-semibold transition hover:bg-fuchsia-500/30"
              >
                Retry
              </button>
            </div>
          )}

          {watchlistLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-700 bg-slate-800/40">
                  <div className="aspect-[2/3] w-full rounded-t-xl bg-slate-700/50" />
                  <div className="space-y-2 p-3">
                    <div className="h-9 rounded bg-slate-700/50" />
                    <div className="h-4 w-1/2 rounded bg-slate-700/50" />
                    <div className="h-8 rounded-lg bg-slate-700/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleWatchlist.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center text-slate-400">
              {watchlist.length === 0 ? (
                <>
                  <p className="mb-1 text-lg font-semibold text-slate-300">Your watchlist is empty</p>
                  <p className="text-sm">Search for a movie, open it, and add it with a rating.</p>
                </>
              ) : (
                <>
                  <p className="mb-1 text-lg font-semibold text-slate-300">Nothing here yet</p>
                  <p className="text-sm">No movies match this filter. Pick “All” to see every movie.</p>
                </>
              )}
            </div>
          ) : (
            <div
              onClick={handleWatchlistClick}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {visibleWatchlist.map((entry) => (
                <WatchlistCard key={entry.id} entry={entry} pendingAction={pending[entry.id]} />
              ))}
            </div>
          )}
        </section>

        <RequestLog entries={requestLog} onClear={() => setRequestLog([])} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-center text-xs text-slate-600">
        Movie data from OMDb. Your watchlist lives in memory and clears when you refresh the page.
      </footer>

      {details && (
        <DetailsModal
          state={details}
          saved={detailsSaved}
          submitting={adding}
          onAdd={addMovie}
          onClose={() => setDetails(null)}
        />
      )}
      {editing && (
        <EditModal
          key={editing.id}
          entry={editing}
          submitting={saving}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}
      {confirming && (
        <ConfirmModal entry={confirming} onConfirm={() => removeMovie(confirming)} onClose={() => setConfirming(null)} />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
