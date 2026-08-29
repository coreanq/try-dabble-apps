/** The pad itself: a slip torn along a perforation, with the yellow and pink
 *  carbon copies showing behind it and a PAID tick stamped on the corner. */
export function PadMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 42" aria-hidden="true" focusable="false" className={className}>
      <rect x="12" y="10" width="46" height="30" rx="2" fill="#f0cec9" stroke="#221f2c" stroke-width="2.2" />
      <rect x="8" y="7" width="46" height="30" rx="2" fill="#f2e2a0" stroke="#221f2c" stroke-width="2.2" />
      <rect x="4" y="4" width="46" height="30" rx="2" fill="#fffdf7" stroke="#221f2c" stroke-width="2.4" />
      <path d="M4 9 h46" stroke="#33306e" stroke-width="3" />
      <path d="M9 17 h26 M9 23 h20 M9 29 h14" stroke="#221f2c" stroke-width="2" opacity="0.5" />
      <g transform="translate(31,17) rotate(-8)">
        <rect x="0" y="0" width="22" height="14" rx="2" fill="#d9ebdf" stroke="#1f6b4a" stroke-width="2.4" />
        <path d="M5 7.5 l3.5 3.5 L17 3.5" fill="none" stroke="#1f6b4a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  );
}
