/** The book itself: a cloth board, a ruled page and the thumb tabs you flick
 *  to. Kept in sync with the inline copy in index.html by hand — the no-JS
 *  shell must look like the mounted app. */
export function BookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="4" y="6" width="46" height="44" rx="3" fill="#2c4a7c" stroke="#1f2a44" strokeWidth="2.5" />
      <rect x="10" y="10" width="38" height="36" rx="2" fill="#fdfaf2" stroke="#1f2a44" strokeWidth="2" />
      <path d="M13.5 11 V45" stroke="#b8574f" strokeWidth="1.6" />
      <path d="M17 20 h22 M17 27 h25 M17 34 h16" stroke="#62708c" strokeWidth="2" strokeLinecap="round" />
      <rect x="47" y="13" width="11" height="8" rx="1.5" fill="#cfd9e5" stroke="#1f2a44" strokeWidth="2" />
      <rect x="47" y="24" width="11" height="8" rx="1.5" fill="#a98634" stroke="#1f2a44" strokeWidth="2" />
      <rect x="47" y="35" width="11" height="8" rx="1.5" fill="#cfd9e5" stroke="#1f2a44" strokeWidth="2" />
    </svg>
  );
}
