/** A faded cassette with the two reels half-wound: the mark on the J-card. */
export function CassetteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 42" aria-hidden="true" focusable="false" className={className}>
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="37"
        rx="3"
        fill="#f6ece1"
        stroke="#2e2733"
        strokeWidth="2.5"
      />
      <rect x="8" y="7" width="48" height="13" rx="1.5" fill="#e8e0f5" stroke="#57407f" strokeWidth="1.6" />
      <circle cx="22" cy="27" r="7.5" fill="#fdf8f2" stroke="#2e2733" strokeWidth="2.2" />
      <circle cx="42" cy="27" r="7.5" fill="#fdf8f2" stroke="#2e2733" strokeWidth="2.2" />
      <circle cx="22" cy="27" r="2.6" fill="#7a5a3c" />
      <circle cx="42" cy="27" r="2.6" fill="#7a5a3c" />
      <path d="M29.5 27 h5" stroke="#7a5a3c" strokeWidth="3" />
      <rect x="14" y="33.5" width="36" height="4" rx="1" fill="#a83454" opacity="0.55" />
    </svg>
  );
}
