/** The masthead mark: a rose viewfinder with a small figure inside. Same
 *  drawing as the icon job in contain-og.js. */
export function PgMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="10" width="52" height="44" rx="10" fill="#e11d48" />
      <rect x="10" y="14" width="44" height="36" rx="7" fill="#fff7f5" />
      <path d="M14 22 v-4 h4 M46 18 h4 v4 M14 42 v4 h4 M46 46 h4 v-4" fill="none" stroke="#e11d48" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="24" r="4.2" fill="#e11d48" />
      <path d="M32 29 v9 M32 31 l-7 5 M32 31 l7 -5 M32 38 l-5 8 M32 38 l5 8" fill="none" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
