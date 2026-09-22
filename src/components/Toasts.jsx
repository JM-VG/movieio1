const PALETTE = {
  success: 'border-emerald-500/60 bg-emerald-950/90 text-emerald-200',
  error: 'border-red-500/60 bg-red-950/90 text-red-200',
  info: 'border-sky-500/60 bg-sky-950/90 text-sky-200',
};

export default function Toasts({ toasts }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-in rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl ${PALETTE[toast.type] || PALETTE.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
