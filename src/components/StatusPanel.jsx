import Spinner from './Spinner.jsx';

/* Each failure mode gets its own visibly distinct panel. A dead network
 * never looks like "no results found", and a bad API key says so plainly. */
const SEARCH_STATES = {
  idle: {
    title: 'Search for a movie',
    body: 'Start typing above. Results appear once you stop typing.',
    classes: 'border-slate-700 bg-slate-800/40 text-slate-400',
  },
  'no-results': {
    title: 'No results found',
    body: 'OMDb has no movies matching that title. Check the spelling or try another title.',
    classes: 'border-slate-600 bg-slate-800/60 text-slate-300',
  },
  'too-many': {
    title: 'Too many matches',
    body: 'That search matches too many movies. Type at least three letters of the title.',
    classes: 'border-amber-500/60 bg-amber-950/30 text-amber-200',
  },
  network: {
    title: 'Network problem',
    body: 'The request never reached OMDb. Check your internet connection and try again.',
    classes: 'border-orange-500/60 bg-orange-950/40 text-orange-200',
  },
  apikey: {
    title: 'OMDb API key problem',
    body: 'The OMDb API key is missing, invalid or out of quota. Update OMDB_API_KEY in src/config.js.',
    classes: 'border-red-500/60 bg-red-950/40 text-red-200',
  },
  omdb: {
    title: 'OMDb error',
    body: 'OMDb could not handle that request.',
    classes: 'border-red-500/60 bg-red-950/40 text-red-200',
  },
  empty: {
    title: 'Type something first',
    body: 'Enter a movie title to search. An empty search is never sent.',
    classes: 'border-sky-500/60 bg-sky-950/40 text-sky-200',
  },
  short: {
    title: 'Keep typing',
    body: 'Type at least two characters to search.',
    classes: 'border-sky-500/60 bg-sky-950/40 text-sky-200',
  },
};

export default function StatusPanel({ status, query, onRetry }) {
  if (status.kind === 'loading') {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-slate-300" role="status">
        <div className="flex items-center justify-center gap-3">
          <Spinner />
          <span className="text-sm">Searching OMDb for “{query}”…</span>
        </div>
      </div>
    );
  }

  const config = SEARCH_STATES[status.kind] || SEARCH_STATES.omdb;
  const canRetry = ['network', 'omdb'].includes(status.kind);

  return (
    <div className={`rounded-2xl border px-6 py-10 text-center ${config.classes}`} role="status">
      <p className="mb-1 text-lg font-semibold">{config.title}</p>
      <p className="mx-auto max-w-md text-sm opacity-90">{status.message || config.body}</p>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
        >
          Try again
        </button>
      )}
    </div>
  );
}
