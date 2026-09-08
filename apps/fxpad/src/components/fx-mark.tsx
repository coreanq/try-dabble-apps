/**
 * The masthead mark: a mint rate pad with a rising line and a small sky
 * badge with a paper plane. Identical to the inline SVG in index.html so the
 * no-JS shell and the mounted app show the same picture.
 */
export function FxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="8" y="12" width="48" height="40" rx="8" fill="#1f8a6b" />
      <rect x="12" y="16" width="40" height="32" rx="6" fill="#eaf6f1" />
      <path
        d="M20 40 L28 30 L34 35 L44 24"
        fill="none"
        stroke="#1f8a6b"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39 24 h5 v5"
        fill="none"
        stroke="#1f8a6b"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="14" r="8" fill="#4ea3d8" />
      <path
        d="M46.5 14.5 l2.2 -3.5 l3.8 2.1 l-1.5 3.9"
        fill="none"
        stroke="#f7fbfd"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
