import { useEffect, useRef } from 'react';

/* Shared modal shell.
 * EVENT PROPAGATION: the backdrop closes the modal only when the click
 * target IS the backdrop. Clicks inside the dialog bubble up to the
 * backdrop too, but event.target then points at the inner element, so the
 * check filters them out. */
export default function Modal({ title, onClose, children, size = 'max-w-md' }) {
  const dialogRef = useRef(null);

  // Move keyboard focus into the dialog when it opens.
  useEffect(() => {
    dialogRef.current?.focus();
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, []);

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`max-h-[90vh] w-full ${size} overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5
                    shadow-2xl outline-none sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2.5 py-1 text-xl text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
