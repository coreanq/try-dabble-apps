/** The brand mark: a door leaf with a sage check badge. Same paths as the
 *  no-JS shell in index.html so the masthead never jumps on mount. */
export function DoorMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="14" y="8" width="30" height="50" rx="4" fill="#3f5566" />
      <rect x="18" y="12" width="22" height="42" rx="2" fill="#dbe6ec" />
      <circle cx="35" cy="34" r="3" fill="#3f5566" />
      <circle cx="50" cy="16" r="7" fill="#4f8a6e" />
      <path
        d="M46.5 16.2l2.4 2.4 4.6-4.8"
        fill="none"
        stroke="#f4faf6"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
