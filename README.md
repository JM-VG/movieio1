# MovieIo (React version)

Search movies through the public OMDb API and manage a personal watchlist.
This version converts the vanilla JavaScript CRUD app into a React.js
application built with Vite and Tailwind CSS.

Per the activity instructions there is no database. The watchlist lives in a
plain JavaScript array inside `src/api/watchlistStore.js` and clears when the
page refreshes.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Files

| File | Purpose |
|------|---------|
| `src/config.js` | OMDb key, delays, rating limits |
| `src/api/omdb.js` | Every real network call (OMDb search and details) |
| `src/api/watchlistStore.js` | Temporary storage array plus the five verbs |
| `src/utils/AppError.js` | Error class with a `kind` for each failure mode |
| `src/utils/helpers.js` | Debounce, rating validation, poster fallback |
| `src/App.jsx` | State, async flows, the two delegated click handlers |
| `src/components/` | SearchBar, StatusPanel, ResultCard, WatchlistCard, modals, toasts, request log |

## The five HTTP verbs

| Verb | Function in `watchlistStore.js` | Triggered by |
|------|------|------|
| GET | `getWatchlist()` | Page load, Retry button |
| POST | `addToWatchlist()` | Add to watchlist form |
| PUT | `replaceEntry()` | Edit modal, sends every field |
| PATCH | `patchEntry()` | Watched / Unwatch button, sends only `watched` |
| DELETE | `deleteEntry()` | Delete button after the confirm dialog |

The storage is in memory, so these calls do not appear in the Network tab.
Each call prints `[watchlistStore] METHOD /path > status` in the Console and
shows in the Request log panel at the bottom of the page. The OMDb search and
detail requests still appear in the Network tab as GET requests.

## Async patterns

| Pattern | Where |
|---|---|
| Callback-based debounce | `debounce()` in `helpers.js`, used by the search input |
| `new Promise` wrapping `setTimeout` | `simulateRequest()` in `watchlistStore.js` |
| `.then()` chaining | `searchMovies()` in `omdb.js` |
| `async` / `await` | Every CRUD handler in `App.jsx`, `fetchMovieDetails()` |
| `Promise.allSettled` | `fetchDetailsForMany()` and the boot effect in `App.jsx` |
| `AbortController` | Cancels an older search when a newer one starts |
| `try` / `catch` / `finally` | Around every request, `finally` clears loading flags |

## Event handling

Two delegated click handlers cover every movie card: `handleResultsClick` and
`handleWatchlistClick` in `App.jsx`. Cards have no onClick of their own. The
click bubbles up to the grid, which reads `data-action` with `closest()`.
Modals close on a backdrop click only when `event.target === event.currentTarget`.
The Request log Clear button calls `stopPropagation()` so the panel does not collapse.

## User errors handled

Empty and one-letter searches, no results, too many results, network failure,
bad API key, rating outside 1 to 5 or not a whole number, notes over 280
characters, empty title on edit, duplicate movie on add or rename, double
submit while a request is pending, and editing or deleting an entry that no
longer exists.

## Deploy on Vercel

Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
