/** Manuscript mark: a cream page with a folded corner, ink lines, a terracotta progress bar and a sage check. */
export function EpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <path d="M12 8h30l10 10v38a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" fill="#fffcf7" stroke="#1c1917" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M42 8v10h10" fill="#efe6d8" stroke="#1c1917" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="16" y="24" width="24" height="3" rx="1.5" fill="#1c1917" opacity="0.75" />
      <rect x="16" y="32" width="30" height="3" rx="1.5" fill="#1c1917" opacity="0.45" />
      <rect x="16" y="40" width="18" height="3" rx="1.5" fill="#1c1917" opacity="0.3" />
      <rect x="16" y="49" width="30" height="6" rx="3" fill="#efe6d8" />
      <rect x="16" y="49" width="18" height="6" rx="3" fill="#c2410c" />
      <circle cx="50" cy="50" r="7.5" fill="#15803d" />
      <path d="M46.3 50.2l2.6 2.6 4.8-5.2" fill="none" stroke="#f7f1e8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
