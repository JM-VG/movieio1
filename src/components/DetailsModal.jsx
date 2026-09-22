import { useState } from 'react';
import { CONFIG } from '../config.js';
import { posterSrc, validateRating, MAX_NOTES } from '../utils/helpers.js';
import Modal from './Modal.jsx';
import Spinner from './Spinner.jsx';

function Fact({ label, value }) {
  if (!value || value === 'N/A') return null;
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{value}</dd>
    </div>
  );
}

/* Add form: controlled inputs, validated before the POST is sent. */
function AddForm({ movie, onAdd, submitting }) {
  const [rating, setRating] = useState('3');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (submitting) return; // USER ERROR HANDLING: block double submit

    const check = validateRating(rating);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (notes.trim().length > MAX_NOTES) {
      setError(`Notes must be ${MAX_NOTES} characters or fewer.`);
      return;
    }

    // onAdd returns a promise. A rejected POST shows its message here.
    try {
      await onAdd({
        imdbID: movie.imdbID,
        title: movie.Title,
        poster: movie.Poster,
        rating: check.value,
        notes: notes.trim(),
      });
    } catch (err) {
      setError(err.message || 'Could not add that movie.');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
      <div>
        <label htmlFor="add-rating" className="mb-1 block text-xs font-semibold text-slate-400">
          Your rating ({CONFIG.MIN_RATING} to {CONFIG.MAX_RATING})
        </label>
        <input
          id="add-rating"
          type="number"
          min={CONFIG.MIN_RATING}
          max={CONFIG.MAX_RATING}
          step="1"
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
        />
      </div>
      <div>
        <label htmlFor="add-notes" className="mb-1 flex justify-between text-xs font-semibold text-slate-400">
          <span>Notes (optional)</span>
          <span className={notes.length > MAX_NOTES ? 'text-red-400' : ''}>
            {notes.length}/{MAX_NOTES}
          </span>
        </label>
        <textarea
          id="add-notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Why do you want to watch this?"
          className="w-full resize-none rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none
                     focus:border-sky-500"
        />
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white
                   transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {submitting ? (<><Spinner className="h-4 w-4" /> Adding…</>) : '+ Add to watchlist'}
      </button>
    </form>
  );
}

export default function DetailsModal({ state, saved, submitting, onAdd, onClose }) {
  const { loading, movie, error } = state;

  let body;
  if (loading) {
    body = (
      <div className="flex items-center justify-center gap-3 py-16 text-slate-400" role="status">
        <Spinner className="h-6 w-6" />
        <span>Loading full details…</span>
      </div>
    );
  } else if (error) {
    body = (
      <div className="px-2 py-12 text-center" role="alert">
        <p className="mb-1 font-semibold text-red-300">Could not load details</p>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  } else if (movie) {
    const plot = movie.Plot && movie.Plot !== 'N/A' ? movie.Plot : 'No plot summary available.';
    const meta = [movie.Year, movie.Rated, movie.Runtime].filter((v) => v && v !== 'N/A').join(', ');
    body = (
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <img
          src={posterSrc(movie.Poster)}
          alt={`${movie.Title} poster`}
          className="mx-auto w-full max-w-[220px] rounded-xl border border-slate-700 object-cover"
        />
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-50">{movie.Title}</h3>
            <p className="text-sm text-slate-400">{meta}</p>
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-slate-300">{plot}</p>
          <dl className="grid grid-cols-2 gap-3">
            <Fact label="Genre" value={movie.Genre} />
            <Fact label="Director" value={movie.Director} />
            <Fact label="Actors" value={movie.Actors} />
            <Fact label="IMDb" value={movie.imdbRating && movie.imdbRating !== 'N/A' ? `${movie.imdbRating} / 10` : ''} />
          </dl>
          {saved ? (
            <div className="rounded-xl border border-emerald-600/50 bg-emerald-950/30 p-4 text-center">
              <p className="font-semibold text-emerald-300">Already in your watchlist</p>
              <p className="text-sm text-emerald-200/70">Edit it from the watchlist below.</p>
            </div>
          ) : (
            <AddForm movie={movie} onAdd={onAdd} submitting={submitting} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal title="Movie details" onClose={onClose} size="max-w-3xl">
      {body}
    </Modal>
  );
}
