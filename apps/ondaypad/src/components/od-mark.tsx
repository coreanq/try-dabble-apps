/** Warm sepia calendar mark: a cream page with two terracotta binder rings and a gold "today" ring. Same paths as the index.html shell. */
export function OdMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="10" width="52" height="48" rx="10" fill="#fefce8" stroke="#9a3412" strokeWidth="2.2" />
      <path d="M6 24h52v-4a10 10 0 0 0-10-10H16A10 10 0 0 0 6 20z" fill="#c4a484" />
      <rect x="16" y="4" width="6" height="12" rx="3" fill="#9a3412" />
      <rect x="42" y="4" width="6" height="12" rx="3" fill="#9a3412" />
      <circle cx="18" cy="36" r="2.6" fill="#a18072" />
      <circle cx="46" cy="36" r="2.6" fill="#a18072" />
      <circle cx="18" cy="50" r="2.6" fill="#fb7185" />
      <circle cx="32" cy="42" r="9" fill="#fbbf24" stroke="#9a3412" strokeWidth="1.6" />
    </svg>
  );
}
