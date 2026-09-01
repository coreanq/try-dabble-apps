/**
 * The brand mark: a shelf ticket with a yellow price sticker, read through a
 * scan window with its laser line across the bars.
 */
export function ScanMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 44" aria-hidden="true" focusable="false" className={className}>
      <rect x="1.5" y="1.5" width="61" height="41" rx="3" fill="#101519" stroke="#141a1f" strokeWidth="2.4" />
      <g fill="#ffe01a">
        <rect x="5" y="5" width="10" height="3" />
        <rect x="5" y="5" width="3" height="9" />
        <rect x="49" y="5" width="10" height="3" />
        <rect x="56" y="5" width="3" height="9" />
        <rect x="5" y="36" width="10" height="3" />
        <rect x="5" y="30" width="3" height="9" />
        <rect x="49" y="36" width="10" height="3" />
        <rect x="56" y="30" width="3" height="9" />
      </g>
      <g fill="#f4f7f8">
        <rect x="13" y="13" width="2.6" height="18" />
        <rect x="17.4" y="13" width="1.3" height="18" />
        <rect x="20.5" y="13" width="3.4" height="18" />
        <rect x="25.6" y="13" width="1.3" height="18" />
        <rect x="28.7" y="13" width="2.2" height="18" />
      </g>
      <g transform="translate(34,12) rotate(-4)">
        <rect x="0" y="0" width="20" height="20" rx="2" fill="#ffe01a" stroke="#141a1f" strokeWidth="2.2" />
        <rect x="3.5" y="6" width="13" height="2.6" fill="#1c1600" />
        <rect x="3.5" y="11" width="9" height="2.6" fill="#1c1600" />
      </g>
      <rect x="8" y="21.2" width="48" height="1.8" fill="#ff3b30" />
    </svg>
  );
}
