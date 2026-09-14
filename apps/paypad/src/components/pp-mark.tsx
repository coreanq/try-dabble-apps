/** Envelope with a gold coin peeking out. Same paths as the no-JS shell in index.html. */
export function PpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="16" width="52" height="38" rx="7" fill="#0f766e" />
      <path d="M10 20h44v12L32 44 10 32z" fill="#bbf7d0" />
      <path d="M10 22l22 16 22-16" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="6" width="28" height="18" rx="3" fill="#f7f5ef" stroke="#1e293b" strokeWidth="2" />
      <circle cx="36" cy="15" r="5" fill="#ca8a04" />
    </svg>
  );
}
