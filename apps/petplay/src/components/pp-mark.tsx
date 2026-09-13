/** The brand mark: a round cat face on a blush tile. Same art as the no-JS shell in index.html. */
export function PpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="16" fill="#ffd6e0" />
      <polygon points="18,30 22,12 34,24" fill="#fb7185" />
      <polygon points="46,30 42,12 30,24" fill="#fb7185" />
      <circle cx="32" cy="34" r="17" fill="#fff5f0" stroke="#fb7185" strokeWidth="2.5" />
      <circle cx="26" cy="32" r="2.4" fill="#3b2a2a" />
      <circle cx="38" cy="32" r="2.4" fill="#3b2a2a" />
      <path d="M27 39 q5 5 10 0" fill="none" stroke="#3b2a2a" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="47" cy="47" r="6" fill="#2dd4bf" />
    </svg>
  );
}
