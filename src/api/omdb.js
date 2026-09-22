/* omdb.js: every call to the public OMDb API lives in this file.
 * This is the only part of the app that uses the real network.
 * Open DevTools > Network and filter by "omdbapi" to see these GET requests. */
import { CONFIG } from '../config.js';
import { AppError } from '../utils/AppError.js';

/* Build an OMDb URL with the key from config.js already applied. */
function omdbUrl(params) {
  const url = new URL(CONFIG.OMDB_BASE_URL);
  url.searchParams.set('apikey', CONFIG.OMDB_API_KEY || '');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

/* OMDb answers 200 OK for "not found" and 401 for a bad key, so the body
 * has to be inspected rather than trusting the status code alone. */
function interpretOmdbBody(data, response) {
  if (data && data.Response === 'False') {
    const reason = String(data.Error || '').toLowerCase();
    if (response.status === 401 || reason.includes('api key')) {
      throw new AppError('apikey', 'The OMDb API key was rejected. Check OMDB_API_KEY in src/config.js.');
    }
    if (reason.includes('not found')) {
      throw new AppError('no-results', data.Error);
    }
    if (reason.includes('too many results')) {
      throw new AppError('too-many', 'That search matches too many movies. Type a longer title.');
    }
    throw new AppError('omdb', data.Error || 'OMDb could not handle that request.');
  }
  if (!response.ok) {
    throw new AppError('omdb', `OMDb responded with HTTP ${response.status}.`);
  }
  return data;
}

/**
 * ASYNC PATTERN: .then() PROMISE CHAINING
 * The one deliberately non-await fetch in the app, kept so the chaining
 * style is easy to point at in the video.
 * The optional AbortSignal cancels an older search when a newer one starts.
 */
export function searchMovies(query, signal) {
  return fetch(omdbUrl({ s: query, type: 'movie' }), { signal })
    .then((response) =>
      // .then() link 1: parse JSON, keep the response for status checks
      response.json().then((data) => ({ data, response }))
    )
    .then(({ data, response }) => {
      // .then() link 2: translate OMDb's success/failure shape
      const clean = interpretOmdbBody(data, response);
      const hits = Array.isArray(clean.Search) ? clean.Search : [];
      if (hits.length === 0) {
        throw new AppError('no-results', 'No movies matched that search.');
      }
      return hits;
    })
    .catch((err) => {
      // .catch() link: a rejected fetch() means the request never completed
      if (err instanceof AppError) throw err;
      if (err.name === 'AbortError') throw new AppError('aborted', 'Search cancelled.', err);
      throw new AppError('network', 'Could not reach OMDb. Check your connection.', err);
    });
}

/**
 * ASYNC PATTERN: async/await + try/catch
 * Full record for one movie (plot, genre, runtime, imdbRating).
 */
export async function fetchMovieDetails(imdbID) {
  try {
    const response = await fetch(omdbUrl({ i: imdbID, plot: 'full' }));
    const data = await response.json();
    return interpretOmdbBody(data, response);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('network', 'Could not reach OMDb for movie details.', err);
  }
}

/**
 * ASYNC PATTERN: Promise.all / Promise.allSettled
 * Fetches details for MANY movies in parallel instead of one by one.
 * allSettled means one bad title cannot blank the whole results grid.
 */
export async function fetchDetailsForMany(imdbIDs) {
  try {
    const settled = await Promise.allSettled(imdbIDs.map((id) => fetchMovieDetails(id)));
    const byId = {};
    settled.forEach((outcome) => {
      if (outcome.status === 'fulfilled' && outcome.value?.imdbID) {
        byId[outcome.value.imdbID] = outcome.value;
      }
    });
    return byId;
  } catch (err) {
    console.warn('Parallel detail fetch failed:', err);
    return {};
  }
}
