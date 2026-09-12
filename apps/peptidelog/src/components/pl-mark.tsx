/** The brand mark: a small vial with a lavender cap on a teal tile. Same art as the no-JS shell in index.html. */
export function PlMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#2a7a8c" />
      <rect x="10" y="10" width="44" height="44" rx="11" fill="#f4f7fb" />
      <rect x="24" y="16" width="16" height="5" rx="2" fill="#b9a8f2" />
      <rect x="26" y="21" width="12" height="4" fill="#d9e6ef" />
      <rect x="21" y="25" width="22" height="24" rx="5" fill="#ffffff" stroke="#2a7a8c" strokeWidth="2" />
      <rect x="23" y="36" width="18" height="11" rx="3" fill="#8fd0dc" />
      <rect x="26" y="29" width="3" height="14" rx="1.5" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
