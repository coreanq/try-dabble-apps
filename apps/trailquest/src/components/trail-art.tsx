/**
 * All the pictures in the app, drawn as SVG by hand: the route map with a
 * ridge line, a winding trail and a marker that sits at the reader's
 * progress; the milestone badge (a trail marker post, lit when reached);
 * the small route icon in the picker. No image model anywhere near this.
 */

import { TRAIL, TRAIL_D, TRAIL_LENGTH, pointAt } from "@/lib/trail-path";

export function TrailMap({
  ratio,
  milestoneRatios,
  unlockedCount,
  label,
}: {
  ratio: number;
  /** Where each milestone sits along the trail, 0..1, sorted. */
  milestoneRatios: number[];
  unlockedCount: number;
  label: string;
}) {
  const here = pointAt(ratio);
  const dashLen = TRAIL_LENGTH;
  return (
    <svg viewBox="0 0 320 120" className="tq-trail-art" role="img" aria-label={label} focusable="false">
      <defs>
        <linearGradient id="tq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e4ecf1" />
          <stop offset="100%" stopColor="#f4f1e6" />
        </linearGradient>
        <linearGradient id="tq-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f6b4b" />
          <stop offset="100%" stopColor="#2f5238" />
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill="url(#tq-sky)" />
      {/* far ridge, mist */}
      <path d="M0 74 L34 48 L62 62 L96 34 L130 56 L168 26 L204 50 L236 30 L268 46 L300 22 L320 34 L320 120 L0 120 Z" fill="#b9cbd6" opacity="0.55" />
      {/* near ridge, moss */}
      <path d="M0 92 L28 70 L52 80 L84 56 L112 72 L146 46 L178 66 L214 40 L248 62 L282 36 L320 60 L320 120 L0 120 Z" fill="url(#tq-ridge)" />
      {/* snow caps */}
      <path d="M146 46 L152 52 L140 52 Z" fill="#f7f3e8" opacity="0.9" />
      <path d="M282 36 L288 42 L276 42 Z" fill="#f7f3e8" opacity="0.9" />
      {/* meadow */}
      <path d="M0 104 Q80 96 160 104 T320 100 L320 120 L0 120 Z" fill="#5f8a63" opacity="0.8" />
      {/* trail track: paper, then the walked part in ochre */}
      <path d={TRAIL_D} fill="none" stroke="#f7f3e8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d={TRAIL_D} fill="none" stroke="#c9c0a8" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={TRAIL_D}
        fill="none"
        stroke="#c2883a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashLen}
        strokeDashoffset={dashLen * (1 - Math.max(0, Math.min(1, ratio)))}
        style={{ transition: "stroke-dashoffset 400ms ease" }}
      />
      {/* milestone pins along the way */}
      {milestoneRatios.map((r, i) => {
        const p = pointAt(r);
        const lit = i < unlockedCount;
        return (
          <g key={i} transform={`translate(${p.x},${p.y})`}>
            <circle r="3.6" fill={lit ? "#3f6b4b" : "#ffffff"} stroke={lit ? "#f7f3e8" : "#9a6a2a"} strokeWidth="1.5" />
          </g>
        );
      })}
      {/* the reader: a boot-print marker on a flag post */}
      <g transform={`translate(${here.x},${here.y})`} style={{ transition: "transform 400ms ease" }}>
        <circle r="7" fill="#ffffff" stroke="#3f6b4b" strokeWidth="2" />
        <ellipse cx="-1.4" cy="0.6" rx="1.6" ry="2.4" fill="#3f6b4b" transform="rotate(-18)" />
        <ellipse cx="1.6" cy="-0.8" rx="1.6" ry="2.4" fill="#3f6b4b" transform="rotate(-18)" />
        <circle cx="-1.6" cy="-2.9" r="0.7" fill="#3f6b4b" />
        <circle cx="1.5" cy="-4.2" r="0.7" fill="#3f6b4b" />
      </g>
      {/* start and finish posts */}
      <g transform={`translate(${TRAIL[0][0]},${TRAIL[0][1]})`}>
        <rect x="-1" y="-14" width="2" height="12" fill="#5f6f61" />
        <path d="M1 -14 L9 -11 L1 -8 Z" fill="#3f6b4b" />
      </g>
      <g transform={`translate(${TRAIL[TRAIL.length - 1][0]},${TRAIL[TRAIL.length - 1][1]})`}>
        <rect x="-1" y="-16" width="2" height="14" fill="#5f6f61" />
        <path d="M1 -16 L11 -12 L1 -8 Z" fill="#c2883a" />
      </g>
    </svg>
  );
}

/** A trail-marker post: moss and lit when reached, paper and dim when not. */
export function MilestoneBadge({ unlocked, className }: { unlocked: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill={unlocked ? "#3f6b4b" : "#efe8d6"} stroke={unlocked ? "#2f5238" : "#c9c0a8"} strokeWidth="2" />
      {/* post */}
      <rect x="18.5" y="16" width="3" height="14" rx="1" fill={unlocked ? "#f7f3e8" : "#c9c0a8"} />
      {/* blaze / sign */}
      <path d="M13 10 h14 l3 4 l-3 4 h-14 z" fill={unlocked ? "#c2883a" : "#dcd5c2"} stroke={unlocked ? "#f7f3e8" : "#c9c0a8"} strokeWidth="1.2" />
      {unlocked && <path d="M16 14 l2.4 2.4 l4.6 -4.8" fill="none" stroke="#fff8ec" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {/* ground */}
      <path d="M11 30 q9 -3 18 0" fill="none" stroke={unlocked ? "#f7f3e8" : "#c9c0a8"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Small route icon for the picker: a mountain pair on a disc. */
export function RouteIcon({ custom, className }: { custom: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill={custom ? "#f3e3c6" : "#dfeadf"} />
      <path d="M6 29 L15 15 L20 22 L26 12 L34 29 Z" fill={custom ? "#c2883a" : "#3f6b4b"} />
      <path d="M26 12 L28.5 16 L23.5 17 Z" fill="#f7f3e8" />
      <path d="M8 31 q12 -4 24 0" fill="none" stroke={custom ? "#9a6a2a" : "#2f5238"} strokeWidth="1.6" strokeDasharray="2 2" strokeLinecap="round" />
    </svg>
  );
}
