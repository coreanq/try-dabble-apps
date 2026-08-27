/**
 * Brand mark: a wire desk tray with letters stacked in it, the top one already
 * stamped teal. Kept byte-identical to the copy inlined in index.html so the
 * no-JS shell and the mounted masthead look the same.
 */
export function TrayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="18" y="5" width="40" height="13" rx="2" fill="#f3e8ca" stroke="#c9b177" strokeWidth="1.5" />
      <rect x="12" y="14" width="47" height="15" rx="2" fill="#fffdf6" stroke="#c9b177" strokeWidth="1.5" />
      <rect x="45" y="16.5" width="10" height="8" rx="1" fill="#0d7d72" />
      <path d="M12 14 L35.5 26 L59 14" fill="none" stroke="#c9b177" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 29 L9 47 H63 L67 29" fill="#e6d2a0" stroke="#075e56" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M5 29 H67" stroke="#075e56" strokeWidth="3" strokeLinecap="round" />
      <path d="M21 33 V43 M36 33 V43 M51 33 V43" stroke="#c9b177" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 47 V51 M59 47 V51" stroke="#075e56" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
