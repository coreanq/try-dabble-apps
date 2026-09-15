/** Greenhouse mark: a cream tile with two soft leaves over a clay progress bar. Same paths as the index.html shell. */
export function PpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#fafaf9" stroke="#14532d" strokeWidth="2.2" />
      <path d="M20 46c0-9 4-15 12-18" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 28c-6-1-10-6-10-12 6 0 10 4 10 12z" fill="#4ade80" stroke="#16a34a" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M32 34c6-1 11-5 12-11-6-1-11 3-12 11z" fill="#4ade80" stroke="#16a34a" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="14" y="46" width="36" height="7" rx="3.5" fill="#e7e5e4" />
      <rect x="14" y="46" width="24" height="7" rx="3.5" fill="#b45309" />
    </svg>
  );
}
