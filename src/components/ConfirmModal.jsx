import Modal from './Modal.jsx';

/* Replaces window.confirm() with a React dialog before a DELETE. */
export default function ConfirmModal({ entry, onConfirm, onClose }) {
  return (
    <Modal title="Remove movie" onClose={onClose}>
      <p className="text-sm text-slate-300">
        Remove “{entry.title}” from your watchlist? You cannot undo this.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose}
                className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800">
          Keep it
        </button>
        <button type="button" onClick={onConfirm}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-500">
          Remove
        </button>
      </div>
    </Modal>
  );
}
