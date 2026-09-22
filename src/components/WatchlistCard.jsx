import { posterSrc } from '../utils/helpers.js';
import Stars from './Stars.jsx';
import Spinner from './Spinner.jsx';

/* One saved entry. Like ResultCard, the buttons carry data-action only.
 * The delegated listener on the watchlist grid handles every click. */
export default function WatchlistCard({ entry, pendingAction }) {
  const busy = Boolean(pendingAction);
  const label = (action, text) =>
    pendingAction === action ? <Spinner className="h-3.5 w-3.5" /> : text;

  return (
    <article
      data-id={entry.id}
      aria-busy={busy}
      className={`flex flex-col overflow-hidden rounded-xl border bg-slate-800/60 shadow-lg transition ${
        entry.watched ? 'border-emerald-600/60' : 'border-slate-700'
      } ${busy ? 'opacity-70' : ''}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={posterSrc(entry.poster)}
          alt={`${entry.title} poster`}
          loading="lazy"
          className={`h-full w-full object-cover ${entry.watched ? 'opacity-60' : ''}`}
        />
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
            entry.watched ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-900/80 text-slate-300'
          }`}
        >
          {entry.watched ? 'Watched' : 'To watch'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-tight text-slate-100">{entry.title}</h3>
        <div className="mt-2">
          <Stars rating={entry.rating} />
        </div>
        <p
          className={`mt-2 line-clamp-2 min-h-[2rem] text-xs italic leading-4 ${
            entry.notes ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {entry.notes || 'No notes yet'}
        </p>
        <div className="mt-auto grid grid-cols-3 gap-1.5 pt-3">
          <button
            type="button"
            data-action="toggle"
            disabled={busy}
            className={`flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-semibold transition disabled:cursor-wait ${
              entry.watched
                ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {label('toggle', entry.watched ? 'Unwatch' : 'Watched')}
          </button>
          <button
            type="button"
            data-action="edit"
            disabled={busy}
            className="rounded-lg bg-sky-600/20 px-2 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-600/30
                       disabled:cursor-wait"
          >
            Edit
          </button>
          <button
            type="button"
            data-action="delete"
            disabled={busy}
            className="flex items-center justify-center rounded-lg bg-red-600/20 px-2 py-1.5 text-xs font-semibold text-red-300
                       transition hover:bg-red-600/30 disabled:cursor-wait"
          >
            {label('delete', 'Delete')}
          </button>
        </div>
      </div>
    </article>
  );
}
