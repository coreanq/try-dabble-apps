import { BONES, type Keypoint, type KeypointName } from "@/lib/poses";

/**
 * The silhouette: a soft rose figure drawn from the pose's keypoints — head
 * circle, filled torso, thick rounded limbs — sized to the viewfinder. When
 * Match is on, the live skeleton is drawn on top, each bone tinted by how
 * close it is (green → amber → rose).
 */
export function GhostOverlay({
  keypoints,
  opacity,
  live,
  perJoint,
  mirror,
}: {
  keypoints: Keypoint[];
  opacity: number;
  live?: { name: string; x: number; y: number; score?: number }[] | null;
  perJoint?: Partial<Record<KeypointName, number>>;
  mirror: boolean;
}) {
  const pt = (name: KeypointName) => keypoints.find((k) => k.name === name)!;
  const ls = pt("left_shoulder");
  const rs = pt("right_shoulder");
  const lh = pt("left_hip");
  const rh = pt("right_hip");
  const nose = pt("nose");
  const neckY = (ls.y + rs.y) / 2;
  const headR = Math.max(0.045, (neckY - nose.y) * 0.9);
  const headCy = nose.y - headR * 0.2;

  const liveMap = new Map<string, { x: number; y: number; score?: number }>();
  for (const k of live ?? []) liveMap.set(k.name, k);

  const tint = (acc: number | undefined) => {
    if (acc === undefined) return "#fda4af";
    if (acc >= 0.75) return "#16a34a";
    if (acc >= 0.45) return "#f59e0b";
    return "#e11d48";
  };

  return (
    <svg
      className="pg-ghost"
      viewBox="0 0 100 133"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      style={{ transform: mirror ? "scaleX(-1)" : undefined }}
    >
      <g className="pg-ghost-body" style={{ opacity }}>
        <circle cx={nose.x * 100} cy={headCy * 133} r={headR * 100} fill="#e11d48" />
        <polygon
          points={`${ls.x * 100},${ls.y * 133} ${rs.x * 100},${rs.y * 133} ${rh.x * 100},${rh.y * 133} ${lh.x * 100},${lh.y * 133}`}
          fill="#e11d48"
          stroke="#e11d48"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        {BONES.map(([a, b]) => {
          const p = pt(a);
          const q = pt(b);
          return (
            <line
              key={`${a}-${b}`}
              x1={p.x * 100}
              y1={p.y * 133}
              x2={q.x * 100}
              y2={q.y * 133}
              stroke="#e11d48"
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      {live && live.length > 0 && (
        <g className="pg-live">
          {BONES.map(([a, b]) => {
            const p = liveMap.get(a);
            const q = liveMap.get(b);
            if (!p || !q || (p.score ?? 0) < 0.3 || (q.score ?? 0) < 0.3) return null;
            const acc = Math.min(perJoint?.[a] ?? 1, perJoint?.[b] ?? 1);
            return (
              <line
                key={`live-${a}-${b}`}
                x1={p.x * 100}
                y1={p.y * 133}
                x2={q.x * 100}
                y2={q.y * 133}
                stroke={tint(perJoint ? acc : undefined)}
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.95"
              />
            );
          })}
          {live.map((k) =>
            (k.score ?? 0) < 0.3 ? null : (
              <circle
                key={`kp-${k.name}`}
                cx={k.x * 100}
                cy={k.y * 133}
                r="1.6"
                fill={tint(perJoint ? perJoint[k.name as KeypointName] : undefined)}
              />
            ),
          )}
        </g>
      )}
    </svg>
  );
}
