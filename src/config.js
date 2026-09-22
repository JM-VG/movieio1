/* Every tunable value lives here, and ONLY here. */
export const CONFIG = {
  // OMDb (public movie API, read-only search + details)
  OMDB_API_KEY: '56e99e70',
  OMDB_BASE_URL: 'https://www.omdbapi.com/',

  // Temporary storage (plain JavaScript array, see src/api/watchlistStore.js)
  STORE_DELAY_MS: 400, // fake latency so loading states stay visible in the demo

  DEBOUNCE_MS: 450,      // how long the user must stop typing before we search
  DETAIL_FETCH_LIMIT: 8, // how many search hits get enriched via Promise.allSettled
  MIN_RATING: 1,
  MAX_RATING: 5,

  // Shown on first load, fetched in parallel with the watchlist
  POPULAR_IDS: ['tt3896198', 'tt0111161', 'tt0468569', 'tt1375666', 'tt0816692'],
};
