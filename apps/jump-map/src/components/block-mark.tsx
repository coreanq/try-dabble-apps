/** Three stacked blocks and a jumper mid-hop — the marquee's only picture. */
export function BlockMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className="pj-mark">
      <rect width="32" height="32" fill="#0b0b1c" />
      <g fill="#c2703a">
        <rect x="1" y="24" width="12" height="7" />
        <rect x="19" y="18" width="12" height="7" />
      </g>
      <g fill="#6cd47c">
        <rect x="1" y="24" width="12" height="2" />
        <rect x="19" y="18" width="12" height="2" />
      </g>
      <g fill="#f0688a">
        <rect x="14" y="29" width="2" height="2" />
        <rect x="17" y="29" width="2" height="2" />
      </g>
      <g fill="#ffd23f">
        <rect x="24" y="7" width="4" height="4" />
      </g>
      <g fill="#59a5ff">
        <rect x="10" y="12" width="6" height="6" />
        <rect x="9" y="18" width="2" height="4" />
        <rect x="15" y="18" width="2" height="4" />
      </g>
      <g fill="#eef1ff">
        <rect x="11" y="14" width="2" height="2" />
        <rect x="14" y="14" width="1" height="2" />
        <rect x="4" y="6" width="1" height="1" />
        <rect x="28" y="26" width="1" height="1" />
      </g>
    </svg>
  );
}
