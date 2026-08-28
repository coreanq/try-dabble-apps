/** Two pad sheets torn along a perforation, the top one already fading, with a
 *  stamped clock face in the corner. Drawn inline so the no-JS shell in
 *  index.html can carry the identical markup. */
export function PadMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="20" y="8" width="42" height="40" rx="2" fill="#fbefbe" stroke="#c9ae5c" strokeWidth="1.5" />
      <rect x="9" y="3" width="42" height="44" rx="2" fill="#fdf5d0" stroke="#b79a45" strokeWidth="2" />
      <path d="M9 12 H51" stroke="#b79a45" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M17 3 V47" stroke="#cf4a3c" strokeWidth="1.5" />
      <path d="M22 21 H44 M22 28 H44 M22 35 H37" stroke="#9db4cf" strokeWidth="2" strokeLinecap="round" />
      <circle cx="52" cy="41" r="11" fill="#f7dcd6" stroke="#b23a2e" strokeWidth="2.5" />
      <path d="M52 35 V41 L57 44" fill="none" stroke="#b23a2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
