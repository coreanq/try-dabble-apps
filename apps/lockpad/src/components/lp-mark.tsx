/** Parchment page with a brass padlock over its lines. Same paths as the index.html shell. */
export function LpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="10" y="5" width="44" height="54" rx="7" fill="#fbf7f0" stroke="#1a1625" strokeWidth="2" />
      <rect x="18" y="14" width="28" height="3" rx="1.5" fill="#a8a29e" />
      <rect x="18" y="22" width="20" height="3" rx="1.5" fill="#a8a29e" />
      <rect x="18" y="30" width="24" height="3" rx="1.5" fill="#d6d3d1" />
      <path d="M24 42v-7a8 8 0 0 1 16 0v7" fill="none" stroke="#b45309" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="19" y="40" width="26" height="18" rx="5" fill="#b45309" />
      <circle cx="32" cy="48" r="2.4" fill="#f5efe6" />
      <rect x="31" y="49" width="2" height="4.5" rx="1" fill="#f5efe6" />
    </svg>
  );
}
