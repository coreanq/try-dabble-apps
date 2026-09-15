/**
 * The optional stage picture. Five stages (0 / 25 / 50 / 75 / 100%+) drawn
 * from progress alone: a seed, a sprout, leaves, a bud, a bloom — or five
 * stacked clay blocks. It only ever grows. There is no wilted, dead or
 * "missed a day" variant on purpose, and turning it off keeps every log.
 */
import type { StageVisual as Visual } from "@/lib/store";

const LEAF = "#4ade80";
const LEAF_DEEP = "#16a34a";
const INK = "#14532d";
const CLAY = "#b45309";
const CLAY_SOFT = "#fdebd8";
const STONE = "#e7e5e4";
const SKY = "#bae6fd";

function Plant({ stage }: { stage: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" data-stage={stage}>
      {/* pot */}
      <path d="M28 66h40l-4 22H32z" fill={CLAY} />
      <rect x="24" y="60" width="48" height="8" rx="4" fill="#d97706" />
      <ellipse cx="48" cy="60" rx="24" ry="4" fill="#c2410c" />
      {/* soil */}
      <ellipse cx="48" cy="61" rx="19" ry="2.6" fill="#78350f" />
      {stage === 0 && (
        <>
          <ellipse cx="48" cy="58" rx="4" ry="3" fill="#a16207" />
          <path d="M48 56v-4" stroke={LEAF_DEEP} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {stage >= 1 && <path d="M48 60V42" stroke={LEAF_DEEP} strokeWidth="3" strokeLinecap="round" />}
      {stage >= 1 && (
        <>
          <path d="M48 50c-8 0-12-5-12-11 7 0 12 4 12 11z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M48 46c8-1 12-6 12-12-7 0-12 5-12 12z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
      {stage >= 2 && (
        <>
          <path d="M48 42V26" stroke={LEAF_DEEP} strokeWidth="3" strokeLinecap="round" />
          <path d="M48 36c-9 0-14-5-14-12 8 0 14 5 14 12z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M48 32c9-1 14-6 14-13-8 0-14 5-14 13z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
      {stage === 3 && (
        <>
          <path d="M48 26V18" stroke={LEAF_DEEP} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="48" cy="14" rx="5.5" ry="7" fill="#fb923c" stroke="#c2410c" strokeWidth="1.5" />
        </>
      )}
      {stage >= 4 && (
        <>
          <path d="M48 26V16" stroke={LEAF_DEEP} strokeWidth="3" strokeLinecap="round" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse key={deg} cx="48" cy="6" rx="4.5" ry="7" fill="#fb923c" stroke="#c2410c" strokeWidth="1.2" transform={`rotate(${deg} 48 14)`} />
          ))}
          <circle cx="48" cy="14" r="4.5" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

function Blocks({ stage }: { stage: 0 | 1 | 2 | 3 | 4 }) {
  const rows = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false" data-stage={stage}>
      <rect x="14" y="84" width="68" height="6" rx="3" fill={STONE} />
      {rows.map((i) => {
        const filled = i < stage;
        const top = i === stage - 1 && stage < 5;
        const y = 70 - i * 14;
        return (
          <g key={i}>
            <rect x={22 + (4 - i) * 2} y={y} width={52 - (4 - i) * 4} height="12" rx="4" fill={filled ? CLAY : CLAY_SOFT} stroke={filled ? "#92400e" : "#f6d3b1"} strokeWidth="1.5" />
            {filled && top && <rect x={22 + (4 - i) * 2 + 4} y={y + 2} width={52 - (4 - i) * 4 - 8} height="3" rx="1.5" fill="#fbbf24" opacity="0.8" />}
          </g>
        );
      })}
      {stage >= 4 && (
        <>
          <path d="M48 12c-6 0-9-4-9-9 5 0 9 3 9 9z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.3" />
          <path d="M48 12c6 0 9-4 9-9-5 0-9 3-9 9z" fill={LEAF} stroke={LEAF_DEEP} strokeWidth="1.3" />
        </>
      )}
      {stage === 0 && <circle cx="48" cy="52" r="5" fill={SKY} stroke={INK} strokeWidth="1.2" opacity="0.7" />}
    </svg>
  );
}

export function StageVisual({ visual, stage, name }: { visual: Exclude<Visual, "off">; stage: 0 | 1 | 2 | 3 | 4; name: string }) {
  return (
    <div className="pp-stage" id="stage-visual" data-visual={visual} data-stage={stage}>
      {visual === "plant" ? <Plant stage={stage} /> : <Blocks stage={stage} />}
      <span className="pp-stage-name" id="stage-name">
        {name}
      </span>
    </div>
  );
}
