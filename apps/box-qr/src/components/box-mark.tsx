/** The taped box with a QR label on its face — same drawing as the no-JS
 *  shell in index.html, so the masthead does not flicker on mount. */
export function BoxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 56" aria-hidden="true" focusable="false" className={className}>
      <ellipse cx="36" cy="50" rx="26" ry="3.4" fill="rgba(28,20,8,0.22)" />
      <polygon points="12,18 36,8 60,18 36,30" fill="#e0b36a" />
      <polygon points="12,18 36,30 36,50 12,38" fill="#a56b32" />
      <polygon points="36,30 60,18 60,38 36,50" fill="#c48a48" />
      <rect
        x="15.5"
        y="25.5"
        width="17"
        height="13"
        rx="1"
        fill="#f7f1e2"
        stroke="#1c1408"
        strokeWidth="0.8"
      />
      <g fill="#1c1408">
        <rect x="17.2" y="27.2" width="2.4" height="2.4" />
        <rect x="20.4" y="27.2" width="2.4" height="2.4" />
        <rect x="26.8" y="27.2" width="2.4" height="2.4" />
        <rect x="17.2" y="30.4" width="2.4" height="2.4" />
        <rect x="23.6" y="30.4" width="2.4" height="2.4" />
        <rect x="29.8" y="30.4" width="2.4" height="2.4" />
        <rect x="17.2" y="33.6" width="2.4" height="2.4" />
        <rect x="20.4" y="33.6" width="2.4" height="2.4" />
        <rect x="26.8" y="33.6" width="2.4" height="2.4" />
      </g>
      <rect
        x="42"
        y="33"
        width="15"
        height="8"
        rx="1"
        fill="#f0b429"
        stroke="#1c1408"
        strokeWidth="0.8"
      />
      <path d="M12 18 L36 8 L60 18" fill="none" stroke="#7a4c22" strokeWidth="1.1" />
    </svg>
  );
}
