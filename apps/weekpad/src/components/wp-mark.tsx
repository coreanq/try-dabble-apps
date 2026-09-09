/**
 * The masthead mark: a teal planner page with a spiral top and two rails, the
 * second one part-filled. Identical to the inline SVG in index.html so the
 * no-JS shell and the mounted app show the same picture.
 */
export function WpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="8" y="10" width="48" height="46" rx="9" fill="#0d9488" />
      <rect x="8" y="10" width="48" height="14" rx="9" fill="#0f766e" />
      <rect x="8" y="18" width="48" height="6" fill="#0f766e" />
      <rect x="12" y="26" width="40" height="26" rx="6" fill="#f2faf7" />
      <circle cx="20" cy="9" r="3.2" fill="#f2faf7" />
      <circle cx="44" cy="9" r="3.2" fill="#f2faf7" />
      <rect x="17" y="32" width="13" height="4" rx="2" fill="#0d9488" />
      <rect x="17" y="40" width="30" height="4" rx="2" fill="#a7e6d7" />
      <rect x="17" y="40" width="19" height="4" rx="2" fill="#0d9488" />
    </svg>
  );
}
