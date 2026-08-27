/**
 * The gold coin stamped beside the masthead title: a milled rim, an engraved
 * "1" over a use tally, and a struck highlight. It is the app's mark — one
 * coin, divided by the days and the uses it buys.
 */
export function CoinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false" className={className}>
      <circle cx="28" cy="29" r="23" fill="rgba(16,48,31,0.55)" />
      <circle cx="28" cy="27" r="23" fill="#8a6211" />
      <circle cx="28" cy="27" r="23" fill="none" stroke="#f7e8bd" strokeWidth="1.4" opacity="0.5" />
      {/* milled rim */}
      <g stroke="#f7e8bd" strokeWidth="1.5" opacity="0.55">
        <path d="M28 4 L28 8" />
        <path d="M45 10 L42.5 12.8" />
        <path d="M51 27 L47 27" />
        <path d="M45 44 L42.5 41.2" />
        <path d="M28 50 L28 46" />
        <path d="M11 44 L13.5 41.2" />
        <path d="M5 27 L9 27" />
        <path d="M11 10 L13.5 12.8" />
      </g>
      <circle cx="28" cy="27" r="18" fill="#d9a52c" />
      <circle cx="28" cy="27" r="18" fill="none" stroke="#6d4c09" strokeWidth="1.2" />
      <path d="M13 15 A 18 18 0 0 1 40 13" fill="none" stroke="#f7e8bd" strokeWidth="2.6" opacity="0.6" strokeLinecap="round" />
      {/* engraved 1 over a division rule */}
      <g fill="#5c3f07">
        <path d="M25.5 18.5 L30 16.5 L30 30 L33 30 L33 32.5 L22.8 32.5 L22.8 30 L26.4 30 L26.4 20.6 Z" />
      </g>
      <rect x="16.5" y="35.4" width="23" height="2" rx="1" fill="#5c3f07" />
      {/* the tally of uses beneath the rule */}
      <g stroke="#5c3f07" strokeWidth="2" strokeLinecap="round">
        <path d="M19.5 40.5 L19.5 45" />
        <path d="M24 40.5 L24 45" />
        <path d="M28.5 40.5 L28.5 45" />
        <path d="M33 40.5 L33 45" />
        <path d="M17.8 45.6 L34.8 39.8" />
      </g>
    </svg>
  );
}
