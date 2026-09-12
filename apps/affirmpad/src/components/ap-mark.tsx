/** The brand mark: a sunrise over a cream page. Same art as the no-JS shell in index.html. */
export function ApMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#a78bfa" />
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#faf7f2" />
      <circle cx="32" cy="36" r="11" fill="#f6c8d0" />
      <circle cx="32" cy="36" r="7" fill="#f5c65b" />
      <rect x="14" y="36" width="36" height="12" rx="2" fill="#faf7f2" />
      <rect x="16" y="38" width="32" height="2.5" rx="1.25" fill="#a78bfa" />
      <rect x="16" y="43" width="22" height="2.5" rx="1.25" fill="#d4c6e6" />
      <rect x="16" y="48" width="27" height="2.5" rx="1.25" fill="#d4c6e6" />
    </svg>
  );
}
