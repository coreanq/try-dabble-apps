/**
 * The brand mark: a stamped square — seafoam sky, sand headland, a postmark
 * red pin — with a cancellation ring struck over its corner.
 */
export function StampMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="4" y="6" width="42" height="42" rx="2" fill="#fffdf7" stroke="#15384c" strokeWidth="2" />
      <rect x="8" y="10" width="34" height="34" fill="#d7e8f0" />
      <path d="M8 34 L18 24 L26 31 L34 20 L42 34 V44 H8 Z" fill="#35a68a" />
      <circle cx="15" cy="17" r="4" fill="#f0b429" />
      <path
        d="M25 18 C29.4 18 33 21.6 33 26 C33 31.6 25 39 25 39 C25 39 17 31.6 17 26 C17 21.6 20.6 18 25 18 Z"
        fill="#b23a2e"
        stroke="#fffdf7"
        strokeWidth="1.6"
      />
      <circle cx="25" cy="25.5" r="2.8" fill="#fffdf7" />
      <g transform="rotate(-14 44 38)" opacity="0.85">
        <circle cx="44" cy="38" r="13" fill="none" stroke="#b23a2e" strokeWidth="2" />
        <circle cx="44" cy="38" r="9.5" fill="none" stroke="#b23a2e" strokeWidth="1" />
        <path d="M35 34.5 H53 M35 41.5 H53" stroke="#b23a2e" strokeWidth="1.4" />
      </g>
    </svg>
  );
}
