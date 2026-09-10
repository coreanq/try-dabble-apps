/**
 * The masthead mark: a cream disc with a moss ridge, an ochre trail winding
 * across the foot of it and one marker on the path. Identical to the inline
 * SVG in index.html so the no-JS shell and the mounted app show the same
 * picture. Hand-drawn vector; nothing generated.
 */
export function TqMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <circle cx="32" cy="32" r="30" fill="#f7f3e8" />
      <path d="M6 44 L20 24 L28 34 L38 18 L52 38 L58 44 Z" fill="#3f6b4b" />
      <path d="M38 18 L42 24 L36 26 Z" fill="#f7f3e8" />
      <path d="M6 44 Q22 40 30 48 T58 44 L58 50 Q40 56 30 52 T6 50 Z" fill="#c2883a" />
      <path d="M8 49 Q22 44 30 51 T56 48" fill="none" stroke="#f7f3e8" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
      <circle cx="46" cy="45" r="4" fill="#f7f3e8" stroke="#3f6b4b" strokeWidth="2" />
    </svg>
  );
}
