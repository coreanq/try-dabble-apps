/** Punch-card mark: indigo timesheet card, a clock face, an amber break hand, a teal bank chip. */
export function HpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="8" width="52" height="48" rx="8" fill="#3730a3" />
      <rect x="12" y="14" width="40" height="5" rx="2.5" fill="#eef2f7" opacity="0.55" />
      <circle cx="28" cy="36" r="13" fill="#eef2f7" />
      <path d="M28 27v9l6 4" fill="none" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 36l-5 -3" fill="none" stroke="#d97706" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="28" cy="36" r="1.8" fill="#1e293b" />
      <rect x="44" y="40" width="10" height="10" rx="3" fill="#0f766e" />
      <path d="M46.5 45l2 2 3.5 -4" fill="none" stroke="#ccfbf1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
