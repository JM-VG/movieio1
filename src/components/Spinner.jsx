export default function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-slate-500 border-t-sky-400 ${className}`}
    />
  );
}
