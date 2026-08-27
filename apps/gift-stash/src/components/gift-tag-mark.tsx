/**
 * The brand mark: a cream gift tag on a coral string, tied with a ribbon bow.
 * Kept byte-identical to the copy inlined in index.html so the no-JS shell and
 * the mounted masthead do not flicker.
 */
export function GiftTagMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M20 5 H45 A4 4 0 0 1 49 9 V47 A4 4 0 0 1 45 51 H11 A4 4 0 0 1 7 47 V18 Z"
        fill="#fffaf1"
        stroke="#4a2530"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="#eed6cb" stroke="#4a2530" strokeWidth="2" />
      <path
        d="M14 13 C9 7 5 4 1.5 5.5"
        fill="none"
        stroke="#e0574a"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <rect x="7" y="29" width="42" height="7" fill="#e0574a" />
      <ellipse
        cx="21"
        cy="32.5"
        rx="6"
        ry="4.5"
        transform="rotate(-18 21 32.5)"
        fill="#f0907f"
        stroke="#ab3527"
        strokeWidth="1.6"
      />
      <ellipse
        cx="35"
        cy="32.5"
        rx="6"
        ry="4.5"
        transform="rotate(18 35 32.5)"
        fill="#f0907f"
        stroke="#ab3527"
        strokeWidth="1.6"
      />
      <circle cx="28" cy="32.5" r="3.6" fill="#ab3527" />
    </svg>
  );
}
