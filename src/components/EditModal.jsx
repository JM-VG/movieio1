import { useState } from 'react';
import { CONFIG } from '../config.js';
import { validateRating, MAX_NOTES } from '../utils/helpers.js';
import Modal from './Modal.jsx';
import Spinner from './Spinner.jsx';

/* Edit form for a FULL replacement (PUT): title, rating and notes together. */
export default function EditModal({ entry, submitting, onSave, onClose }) {
  const [title, setTitle] = useState(entry.title || '');
  const [rating, setRating] = useState(String(entry.rating ?? CONFIG.MIN_RATING));
  const [notes, setNotes] = useState(entry.notes || '');
  const [error, setError] = useState('');

  const unchanged =
    title.trim() === entry.title && Number(rating) === Number(entry.rating) && notes.trim() === (entry.notes || '');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (submitting) return;

    // USER ERROR HANDLING: a saved entry may not be given an empty title.
    if (title.trim() === '') {
      setError('The title cannot be empty.');
      return;
    }
    const check = validateRating(rating);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (notes.trim().length > MAX_NOTES) {
      setError(`Notes must be ${MAX_NOTES} characters or fewer.`);
      return;
    }
    // USER ERROR HANDLING: skip a pointless request when nothing changed.
    if (unchanged) {
      onClose();
      return;
    }

    try {
      await onSave(entry.id, { title: title.trim(), rating: check.value, notes: notes.trim() });
    } catch (err) {
      setError(err.message || 'Could not save your changes.');
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-500';

  return (
    <Modal title="Edit entry" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="edit-title" className="mb-1 block text-xs font-semibold text-slate-400">Title</label>
          <input id="edit-title" type="text" maxLength={120} value={title}
                 onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-rating" className="mb-1 block text-xs font-semibold text-slate-400">
            Rating ({CONFIG.MIN_RATING} to {CONFIG.MAX_RATING})
          </label>
          <input id="edit-rating" type="number" min={CONFIG.MIN_RATING} max={CONFIG.MAX_RATING} step="1" value={rating}
                 onChange={(event) => setRating(event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-notes" className="mb-1 flex justify-between text-xs font-semibold text-slate-400">
            <span>Notes</span>
            <span className={notes.length > MAX_NOTES ? 'text-red-400' : ''}>{notes.length}/{MAX_NOTES}</span>
          </label>
          <textarea id="edit-notes" rows={3} value={notes}
                    onChange={(event) => setNotes(event.target.value)} className={`${inputClass} resize-none`} />
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white
                             transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-600">
            {submitting ? (<><Spinner className="h-4 w-4" /> Saving…</>) : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
