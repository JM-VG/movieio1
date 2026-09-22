/*
 * One error type with a machine-readable `kind`, so the UI can show a
 * distinct on-screen state per failure mode instead of one generic "oops".
 *
 * kind is one of:
 *   'network'    > request never completed (offline, DNS, CORS, timeout)
 *   'apikey'     > OMDb rejected the key (missing / invalid / exhausted)
 *   'no-results' > the request worked, OMDb found nothing
 *   'omdb'       > any other OMDb-side failure
 *   'validation' > the user sent bad input (empty title, rating out of range)
 *   'duplicate'  > the movie is already in the watchlist
 *   'not-found'  > the entry no longer exists in temporary storage
 *   'storage'    > any other temporary-storage failure
 */
export class AppError extends Error {
  constructor(kind, message, cause) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.cause = cause;
  }
}
