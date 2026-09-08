/** The brand mark: an indigo disc with an amber note. Same art as index.html. */
export function DiscMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <circle cx="32" cy="32" r="28" fill="#3b3a8f" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#8a86e6" strokeWidth="1.5" opacity="0.7" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="#8a86e6" strokeWidth="1.5" opacity="0.5" />
      <circle cx="32" cy="32" r="8" fill="#f7f3ea" />
      <circle cx="32" cy="32" r="2.6" fill="#3b3a8f" />
      <path d="M40 8.5l8 3.5v18a5 5 0 1 1-3-4.6V15.3l-5-2.1z" fill="#f2b84b" />
    </svg>
  );
}
