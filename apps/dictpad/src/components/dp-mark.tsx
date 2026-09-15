/** Notepad mark: a cream sheet with sky ruled lines, a sky mic and a coral record dot. */
export function DpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="8" y="6" width="48" height="52" rx="8" fill="#0369a1" />
      <rect x="12" y="10" width="40" height="44" rx="5" fill="#faf7f0" />
      <path d="M18 22h28M18 30h28M18 38h16" stroke="#bae6fd" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="38" y="30" width="10" height="16" rx="5" fill="#0369a1" />
      <path d="M35 42a8 8 0 0 0 16 0M43 50v4" fill="none" stroke="#0369a1" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21" cy="47" r="5" fill="#e11d48" />
      <circle cx="21" cy="47" r="2" fill="#ffe4e6" />
    </svg>
  );
}
