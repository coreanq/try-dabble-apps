/** The mark: a stall under a striped awning, with a price tag hung on it. */
export function ShopMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 42" aria-hidden="true" focusable="false" className={className}>
      <rect x="3" y="14" width="58" height="25" rx="2" fill="#fffdf3" stroke="#23291f" stroke-width="2.4" />
      <path d="M2 13 L8 3 h48 l6 10 Z" fill="#1d5c3f" stroke="#23291f" stroke-width="2.4" strokeLinejoin="round" />
      <path d="M17 3 L13 13 M31 3 L29 13 M45 3 L45 13" stroke="#fffdf3" stroke-width="2.6" />
      <rect x="9" y="21" width="21" height="14" rx="1.5" fill="#ffe89a" stroke="#23291f" stroke-width="2" />
      <path d="M13 26 h13 M13 30 h9" stroke="#23291f" stroke-width="1.6" opacity="0.55" />
      <g transform="translate(36,20) rotate(-6)">
        <path d="M2 2 h15 l6 6 -6 6 H2 Z" fill="#fbe3dd" stroke="#bf3b2c" stroke-width="2" strokeLinejoin="round" />
        <circle cx="17.5" cy="8" r="1.7" fill="#bf3b2c" />
      </g>
    </svg>
  );
}
