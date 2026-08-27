/**
 * The brand mark: a crop frame ruled around a passport headshot, the marks
 * pulled off the corners the way a lab ticks a print before trimming.
 * Drawn for the indigo masthead, so the frame is white and the print is paper.
 */
export function CropFrameMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false" className={className}>
      <rect x="12" y="9" width="32" height="38" fill="#f2f4ff" />
      <rect x="12" y="9" width="32" height="26" fill="#c9cff5" />
      <circle cx="28" cy="24" r="8" fill="#39409f" />
      <path d="M15 47 C17 35, 39 35, 41 47 Z" fill="#1f2578" />
      <g fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="square">
        <path d="M5 15 L5 5 L15 5" />
        <path d="M41 5 L51 5 L51 15" />
        <path d="M5 41 L5 51 L15 51" />
        <path d="M41 51 L51 51 L51 41" />
      </g>
      <g stroke="#ffffff" strokeWidth="1.2" opacity="0.75">
        <path d="M12 9 L12 3" />
        <path d="M44 9 L44 3" />
        <path d="M12 47 L12 53" />
        <path d="M44 47 L44 53" />
      </g>
    </svg>
  );
}
