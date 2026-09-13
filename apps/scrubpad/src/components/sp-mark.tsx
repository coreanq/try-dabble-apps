/** Brand mark: a rice-paper sheet with a cinnabar redaction stamp. */
export function SpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="4" width="52" height="56" rx="8" fill="#1b5e4a" />
      <rect x="11" y="9" width="42" height="46" rx="5" fill="#f4efe4" />
      <rect x="17" y="18" width="30" height="3.5" rx="1.75" fill="#1f2a26" />
      <rect x="17" y="27" width="18" height="3.5" rx="1.75" fill="#1f2a26" />
      <rect x="38" y="25.5" width="12" height="6.5" rx="2" fill="#c23b22" />
      <rect x="17" y="36" width="30" height="3.5" rx="1.75" fill="#1f2a26" />
      <rect x="17" y="45" width="11" height="3.5" rx="1.75" fill="#1f2a26" />
      <rect x="31" y="43.5" width="17" height="6.5" rx="2" fill="#f0c05a" />
    </svg>
  );
}
