import { CONFIG } from '../config.js';

/* ASYNC PATTERN: CALLBACK-BASED DEBOUNCE
 * Takes a callback plus a delay and returns a wrapped function. Each call
 * clears the previous timer, so the callback runs only once the user has
 * stopped typing for `delay` milliseconds. One search per pause, not one
 * per keystroke. */
export function debounce(callback, delay) {
  let timerId = null;
  function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      callback(...args); // the callback fires only after the pause
    }, delay);
  }
  debounced.cancel = () => clearTimeout(timerId);
  return debounced;
}

/* Normalised key used to detect "this movie is already in the watchlist". */
export function titleKey(title) {
  return String(title || '').trim().toLowerCase();
}

/* OMDb sends the string "N/A" when a film has no poster on file. */
const PLACEHOLDER_POSTER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="444">' +
      '<rect width="300" height="444" fill="#1e293b"/>' +
      '<text x="150" y="222" font-family="system-ui,sans-serif" font-size="18" fill="#64748b" ' +
      'text-anchor="middle">No poster</text></svg>'
  );

export function posterSrc(poster) {
  return !poster || poster === 'N/A' ? PLACEHOLDER_POSTER : poster;
}

/* USER ERROR HANDLING: ratings are restricted to CONFIG.MIN..MAX (1-5). */
export function validateRating(rawValue) {
  const min = CONFIG.MIN_RATING;
  const max = CONFIG.MAX_RATING;

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return { ok: false, message: `Give the movie a rating from ${min} to ${max}.` };
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    return { ok: false, message: 'The rating must be a number.' };
  }
  if (!Number.isInteger(value)) {
    return { ok: false, message: `The rating must be a whole number from ${min} to ${max}.` };
  }
  if (value < min || value > max) {
    return { ok: false, message: `The rating must be between ${min} and ${max}.` };
  }
  return { ok: true, value };
}

/* USER ERROR HANDLING: notes are optional but capped in length. */
export const MAX_NOTES = 280;
