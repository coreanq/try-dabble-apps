/** A lit GO key under a followspot: the mark, and the whole product in one glyph. */
export function CueMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" focusable="false" className={className}>
      <path d="M36 2 L58 26 H14 Z" fill="#ffb020" opacity="0.22" />
      <rect x="28" y="0" width="16" height="7" rx="2" fill="#3b2a58" />
      <circle cx="36" cy="6" r="2.6" fill="#ffd487" />
      <rect x="8" y="28" width="56" height="24" rx="9" fill="#0c6c3d" />
      <rect x="8" y="26" width="56" height="24" rx="9" fill="#35e07d" />
      <rect x="13" y="29" width="46" height="8" rx="4" fill="#9bffcb" opacity="0.55" />
      <path
        d="M31.5 33.5h-4.2v3.2h1.6a2.2 2.2 0 1 1-2.2-2.9"
        fill="none"
        stroke="#04240f"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="41.5" cy="36.5" r="4.6" fill="none" stroke="#04240f" strokeWidth="2.6" />
      <circle cx="8" cy="18" r="3" fill="#ff2f8e" />
      <circle cx="64" cy="18" r="3" fill="#3ad7f0" />
    </svg>
  );
}
