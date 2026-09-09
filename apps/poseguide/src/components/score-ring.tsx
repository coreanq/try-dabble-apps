import type { MatchBand } from "@/lib/match";

/** The 0–100 ring on the viewfinder. Colour follows the band. */
export function ScoreRing({ score, band, label }: { score: number | null; band: MatchBand | null; label: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  const dash = (pct / 100) * c;
  return (
    <div className="pg-ring" data-band={band ?? "none"} role="status" aria-live="polite" aria-label={label}>
      <svg viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <circle cx="28" cy="28" r={r} fill="rgba(255,247,245,0.85)" stroke="rgba(225,29,72,0.18)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span className="pg-ring-value">{score === null ? "–" : `${score}%`}</span>
    </div>
  );
}
