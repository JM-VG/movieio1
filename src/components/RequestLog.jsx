/* Live list of the simulated requests sent to the temporary storage.
 * The storage never touches the network, so this panel (and the console)
 * shows each GET, POST, PUT, PATCH and DELETE instead of the Network tab. */
const VERB_COLORS = {
  GET: 'bg-sky-500/20 text-sky-300',
  POST: 'bg-emerald-500/20 text-emerald-300',
  PUT: 'bg-amber-500/20 text-amber-300',
  PATCH: 'bg-violet-500/20 text-violet-300',
  DELETE: 'bg-red-500/20 text-red-300',
};

export default function RequestLog({ entries, onClear }) {
  return (
    <details className="rounded-xl border border-slate-800 bg-slate-900/50" open>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300">
        <span>Request log ({entries.length})</span>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={(event) => {
              // EVENT PROPAGATION: stop the click reaching <summary>,
              // or the panel would also collapse.
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            Clear
          </button>
        )}
      </summary>
      <ol className="max-h-48 overflow-y-auto border-t border-slate-800 px-4 py-2 text-xs">
        {entries.length === 0 && <li className="py-2 text-slate-500">No requests yet. Add, edit or remove a movie.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-1.5">
            <span className={`w-16 shrink-0 rounded px-1.5 py-0.5 text-center font-semibold ${VERB_COLORS[entry.method]}`}>
              {entry.method}
            </span>
            <span className="flex-1 truncate text-slate-300">{entry.path}</span>
            <span className={entry.status >= 400 ? 'text-red-400' : 'text-emerald-400'}>{entry.status}</span>
            <span className="w-12 text-right text-slate-500">{entry.ms} ms</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
