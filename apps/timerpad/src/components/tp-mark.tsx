export function TpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <circle cx="32" cy="32" r="28" fill="#2f6fed" />
      <circle cx="32" cy="32" r="22" fill="#eef3f8" />
      <circle cx="32" cy="32" r="3" fill="#1a2332" />
      <rect x="30.6" y="16" width="2.8" height="16" rx="1.4" fill="#1a2332" />
      <rect x="32" y="30.6" width="12" height="2.8" rx="1.4" fill="#e05a33" />
    </svg>
  );
}
