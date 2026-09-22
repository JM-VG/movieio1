/* watchlistStore.js: TEMPORARY STORAGE for the watchlist.
 *
 * Per the activity instructions there is no database. The data lives in a
 * plain JavaScript array below. It resets when you refresh the page.
 *
 * Each function behaves like the MockAPI endpoint from the previous version:
 * it is asynchronous, answers after a short delay, and follows the meaning
 * of one HTTP verb (GET, POST, PUT, PATCH, DELETE). The rest of the app
 * talks to it with async/await, exactly as it would talk to a real server.
 */
import { CONFIG } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { titleKey, validateRating, MAX_NOTES } from '../utils/helpers.js';

// THE TEMPORARY STORAGE: a normal array of objects.
let watchlistDB = [];
let nextId = 1;
let requestCount = 0;

// Every simulated request is recorded here so the UI can show a request log.
const listeners = new Set();
export function onRequest(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* Copy data on the way in and out, so React state never shares objects
 * with the "server" array. Same idea as JSON crossing the network. */
const copy = (value) => (value === undefined ? value : structuredClone(value));

/**
 * ASYNC PATTERN: new Promise() WRAPPING A setTimeout CALLBACK
 * Turns callback-style timing into a Promise, so the caller can await it.
 * `work` runs inside the timer; a thrown error becomes a rejection.
 */
function simulateRequest(method, path, work) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    setTimeout(() => {
      const log = (status) => {
        const entry = { id: ++requestCount, method, path, status, ms: Math.round(performance.now() - started), at: Date.now() };
        console.info(`[watchlistStore] ${method} ${path} > ${status}`);
        listeners.forEach((fn) => fn(entry));
      };
      try {
        const result = work();
        log(method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200);
        resolve(copy(result));
      } catch (err) {
        const status = { validation: 400, 'not-found': 404, duplicate: 409 }[err.kind] || 500;
        log(status);
        reject(err instanceof AppError ? err : new AppError('storage', 'Temporary storage failed.', err));
      }
    }, CONFIG.STORE_DELAY_MS);
  });
}

/* Server-side checks. The UI validates too, but the store never trusts it. */
function findIndexOrThrow(id) {
  const index = watchlistDB.findIndex((item) => String(item.id) === String(id));
  if (index === -1) {
    throw new AppError('not-found', 'That entry no longer exists in the watchlist.');
  }
  return index;
}

function cleanFields(fields) {
  const title = String(fields.title ?? '').trim();
  if (title === '') throw new AppError('validation', 'The title cannot be empty.');

  const rating = validateRating(fields.rating);
  if (!rating.ok) throw new AppError('validation', rating.message);

  const notes = String(fields.notes ?? '').trim();
  if (notes.length > MAX_NOTES) {
    throw new AppError('validation', `Notes must be ${MAX_NOTES} characters or fewer.`);
  }
  return { title, rating: rating.value, notes };
}

function assertNoDuplicate(title, ignoreId, imdbID) {
  const key = titleKey(title);
  const clash = watchlistDB.some(
    (item) =>
      String(item.id) !== String(ignoreId) &&
      (titleKey(item.title) === key || (imdbID && item.imdbID === imdbID))
  );
  if (clash) throw new AppError('duplicate', `"${title}" is already in your watchlist.`);
}

/* HTTP VERB 1 of 5: GET, read the whole watchlist. */
export function getWatchlist() {
  return simulateRequest('GET', '/watchlist', () => watchlistDB);
}

/* HTTP VERB 2 of 5: POST, create a new entry. */
export function addToWatchlist(entry) {
  const payload = copy(entry);
  return simulateRequest('POST', '/watchlist', () => {
    const fields = cleanFields(payload);
    assertNoDuplicate(fields.title, null, payload.imdbID);
    const created = {
      id: String(nextId++),
      imdbID: payload.imdbID || '',
      poster: payload.poster || '',
      watched: false,
      createdAt: new Date().toISOString(),
      ...fields,
    };
    watchlistDB.push(created);
    return created;
  });
}

/* HTTP VERB 3 of 5: PUT, FULL replacement. Every field is sent and stored. */
export function replaceEntry(id, entry) {
  const payload = copy(entry);
  return simulateRequest('PUT', `/watchlist/${id}`, () => {
    const index = findIndexOrThrow(id);
    const fields = cleanFields(payload);
    assertNoDuplicate(fields.title, id);
    const replaced = {
      id: watchlistDB[index].id,
      imdbID: payload.imdbID || '',
      poster: payload.poster || '',
      watched: Boolean(payload.watched),
      createdAt: watchlistDB[index].createdAt,
      ...fields,
    };
    watchlistDB[index] = replaced;
    return replaced;
  });
}

/* HTTP VERB 4 of 5: PATCH, PARTIAL update. Only the sent fields change.
 * With no MockAPI in the way, a real PATCH works again. */
export function patchEntry(id, changes) {
  const payload = copy(changes);
  return simulateRequest('PATCH', `/watchlist/${id}`, () => {
    const index = findIndexOrThrow(id);
    const allowed = {};
    if ('watched' in payload) allowed.watched = Boolean(payload.watched);
    if (Object.keys(allowed).length === 0) {
      throw new AppError('validation', 'Nothing to update.');
    }
    watchlistDB[index] = { ...watchlistDB[index], ...allowed };
    return watchlistDB[index];
  });
}

/* HTTP VERB 5 of 5: DELETE, remove an entry. */
export function deleteEntry(id) {
  return simulateRequest('DELETE', `/watchlist/${id}`, () => {
    const index = findIndexOrThrow(id);
    watchlistDB.splice(index, 1);
    return null;
  });
}
