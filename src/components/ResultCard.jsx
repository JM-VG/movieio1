import { posterSrc } from '../utils/helpers.js';

/* One search result. It has NO onClick of its own: the data-action and
 * data-imdbid attributes are read by the ONE delegated listener on the
 * results grid in App.jsx after the click bubbles up. */
export default function ResultCard({ hit, detail, saved }) {
  const imdbRating = detail?.imdbRating && detail.imdbRating !== 'N/A' ? detail.imdbRating : '';
  const genre = detail?.Genre && detail.Genre !== 'N/A' ? detail.Genre : '';

  return (
    <article
      data-imdbid={hit.imdbID}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60 shadow-lg
                 transition hover:border-sky-500/70"
    >
      <button
        type="button"
        data-action="details"
        className="relative block aspect-[2/3] w-full overflow-hidden bg-slate-900 text-left focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <img
          src={posterSrc(hit.Poster)}
          alt={`${hit.Title} poster`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-3 py-2 text-xs
                     font-medium text-sky-300 opacity-0 transition group-hover:opacity-100"
        >
          View details
        </span>
      </button>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-tight text-slate-100">{hit.Title}</h3>
        <div className="mt-2 flex min-h-[1.25rem] items-center gap-2 text-xs text-slate-400">
          <span>{hit.Year}</span>
          {imdbRating && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">&#9733; {imdbRating}</span>
          )}
        </div>
        <p className="mt-1 min-h-[1rem] truncate text-xs text-slate-500">{genre}</p>
        <div className="mt-auto pt-3">
          {saved ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-400"
            >
              In watchlist
            </button>
          ) : (
            <button
              type="button"
              data-action="add"
              className="w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
