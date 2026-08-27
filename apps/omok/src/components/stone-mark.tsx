/**
 * The app's mark: a corner of the goban's grid with a slate stone seated on
 * the star point and a shell stone answering it. Same drawing as the icon.
 */
export function StoneMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="2" y="4" width="60" height="48" rx="3" fill="#e9c383" />
      <rect x="2" y="4" width="60" height="48" rx="3" fill="none" stroke="#4a2c11" strokeWidth="2.5" />
      <g stroke="#5a3b17" strokeWidth="1.2">
        <line x1="14" y1="14" x2="50" y2="14" />
        <line x1="14" y1="28" x2="50" y2="28" />
        <line x1="14" y1="42" x2="50" y2="42" />
        <line x1="14" y1="14" x2="14" y2="42" />
        <line x1="32" y1="14" x2="32" y2="42" />
        <line x1="50" y1="14" x2="50" y2="42" />
      </g>
      <circle cx="32" cy="28" r="2" fill="#5a3b17" />
      <circle cx="14" cy="28" r="8" fill="#0d0d0d" />
      <ellipse cx="11.5" cy="25" rx="2.6" ry="1.7" fill="rgba(255,255,255,0.4)" />
      <circle cx="32" cy="42" r="8" fill="#fbf8f1" stroke="#c7bda9" strokeWidth="1" />
      <ellipse cx="29.5" cy="39" rx="2.6" ry="1.7" fill="#ffffff" />
    </svg>
  );
}
