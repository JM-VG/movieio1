import { CONFIG } from '../config.js';

/* A 1-5 rating drawn as filled / empty stars. */
export default function Stars({ rating }) {
  const value = Math.max(0, Math.min(CONFIG.MAX_RATING, Number(rating) || 0));
  return (
    <span aria-label={`${value} out of ${CONFIG.MAX_RATING} stars`} className="text-sm leading-none">
      {Array.from({ length: CONFIG.MAX_RATING }, (_, i) => (
        <span key={i} className={i < value ? 'text-amber-400' : 'text-slate-600'}>
          &#9733;
        </span>
      ))}
    </span>
  );
}
