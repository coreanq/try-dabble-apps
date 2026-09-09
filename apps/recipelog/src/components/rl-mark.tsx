/**
 * The masthead mark: a terracotta recipe card with a sage tab, a plate and two
 * ruled lines. Identical to the inline SVG in index.html so the no-JS shell
 * and the mounted app show the same picture.
 */
export function RlMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="10" y="8" width="44" height="48" rx="8" fill="#c45c26" />
      <rect x="15" y="13" width="34" height="38" rx="5" fill="#fffdf8" />
      <circle cx="32" cy="27" r="9" fill="#e3ebdf" />
      <circle cx="32" cy="27" r="5.5" fill="#c45c26" />
      <rect x="21" y="41" width="22" height="2.6" rx="1.3" fill="#7f9a7a" />
      <rect x="21" y="46" width="15" height="2.6" rx="1.3" fill="#7f9a7a" />
      <rect x="4" y="18" width="6" height="28" rx="3" fill="#7f9a7a" />
    </svg>
  );
}
