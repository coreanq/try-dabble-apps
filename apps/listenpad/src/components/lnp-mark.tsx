/** Listening-booth mark: a navy tile, teal headphones and an amber short-rewind glyph. */
export function LnpMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="#0f172a" />
      <path d="M17 40v-8a15 15 0 0 1 30 0v8" fill="none" stroke="#14b8a6" strokeWidth="4" strokeLinecap="round" />
      <rect x="13" y="35" width="10" height="15" rx="4" fill="#14b8a6" />
      <rect x="41" y="35" width="10" height="15" rx="4" fill="#14b8a6" />
      <path d="M31 46l-6 4.5 6 4.5zM38 46l-6 4.5 6 4.5z" fill="#f59e0b" />
    </svg>
  );
}
