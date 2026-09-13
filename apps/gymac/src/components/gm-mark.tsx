/** The brand mark: a flat dumbbell on a coral tile. Same art as the no-JS shell in index.html. */
export function GmMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#e85d4c" />
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#fff8f3" />
      <rect x="26" y="30" width="12" height="4" rx="2" fill="#2a1f1a" />
      <rect x="16" y="24" width="7" height="16" rx="2.5" fill="#0d9488" />
      <rect x="41" y="24" width="7" height="16" rx="2.5" fill="#0d9488" />
      <rect x="12" y="27" width="4" height="10" rx="1.5" fill="#e85d4c" />
      <rect x="48" y="27" width="4" height="10" rx="1.5" fill="#e85d4c" />
    </svg>
  );
}
