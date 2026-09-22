/* Controlled search input. The parent owns the value and the debounce. */
export default function SearchBar({ value, onChange, onSubmit, onClear, inputRef }) {
  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2" noValidate role="search">
      <div className="relative flex-1">
        <label htmlFor="search-input" className="sr-only">Search a movie title</label>
        <input
          id="search-input"
          ref={inputRef}
          type="search"
          autoComplete="off"
          maxLength={100}
          placeholder="Search a movie title…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-4 pr-10 text-slate-100
                     placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30
                     [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== '' && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-500 transition
                       hover:bg-slate-800 hover:text-slate-300"
          >
            &times;
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-500
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        Search
      </button>
    </form>
  );
}
