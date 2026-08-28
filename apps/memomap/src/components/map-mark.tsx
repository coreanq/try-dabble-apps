/** A folded paper map with a red pin standing in it and a compass star in the
 *  corner. Drawn inline so the no-JS shell in index.html can carry the
 *  identical markup. */
export function MapMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" focusable="false" className={className}>
      <path d="M4 12 L25 5 L47 12 L68 5 V44 L47 51 L25 44 L4 51 Z" fill="#f6ecd8" stroke="#33291d" strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 5 V44 M47 12 V51" stroke="#33291d" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M8 27 C18 20, 30 34, 43 25 S60 20, 65 26" fill="none" stroke="#2f6b62" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      <path d="M56 12 l2.6 5.6 5.6 2.6 -5.6 2.6 -2.6 5.6 -2.6 -5.6 -5.6 -2.6 5.6 -2.6 Z" fill="#b98a2c" />
      <path d="M17 20 c5 0 9 4 9 9 0 6.5 -9 15 -9 15 s-9 -8.5 -9 -15 c0 -5 4 -9 9 -9 Z" fill="#b4472e" stroke="#8f3520" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="17" cy="29" r="3.2" fill="#f6ecd8" />
    </svg>
  );
}
