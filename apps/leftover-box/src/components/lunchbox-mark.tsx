/** The header lunchbox: chili lid, kraft body, three compartments. */
export function LunchboxMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 56"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="12" y="3" width="48" height="11" rx="3" fill="#c45c26" />
      <rect x="20" y="6" width="24" height="5" rx="1.5" fill="#e8a06a" />
      <rect x="6" y="13" width="60" height="39" rx="6" fill="#d9a15a" />
      <rect x="10" y="17" width="52" height="31" rx="4" fill="#fff8ee" />
      <rect x="13" y="20" width="22" height="14" rx="2" fill="#e8c96a" />
      <rect x="37" y="20" width="22" height="14" rx="2" fill="#c0392b" />
      <rect x="13" y="36" width="46" height="9" rx="2" fill="#5d7a58" />
      <circle cx="24" cy="27" r="3" fill="#fff4d6" />
      <circle cx="48" cy="27" r="2.5" fill="#f8ddd6" />
    </svg>
  );
}
