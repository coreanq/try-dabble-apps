/**
 * The picture vocabulary of the whole tray: six painted wooden shapes in six
 * pastel colours. Every game draws from this same set, so a person who has
 * learned "circle" in pair matching already knows it in the sorting game.
 */

export type ShapeKind = "circle" | "square" | "triangle" | "star" | "heart" | "flower";

export const SHAPES: ShapeKind[] = ["circle", "square", "triangle", "star", "heart", "flower"];

export type ToneKey = "sun" | "sky" | "mint" | "peach" | "lilac" | "grass";

export const TONES: Record<ToneKey, string> = {
  sun: "#ffcf5c",
  sky: "#8fcfe8",
  mint: "#9fdcc0",
  peach: "#ffb59d",
  lilac: "#c9b3f0",
  grass: "#7cc79a",
};

export const TONE_KEYS: ToneKey[] = ["sun", "sky", "mint", "peach", "lilac", "grass"];

const INK = "#4b3a26";

const PATHS: Record<ShapeKind, string> = {
  square: "M14 14 h44 a6 6 0 0 1 6 6 v32 a6 6 0 0 1 -6 6 h-44 a6 6 0 0 1 -6 -6 v-32 a6 6 0 0 1 6 -6 z",
  triangle: "M36 10 L64 60 a4 4 0 0 1 -3.4 6 H11.4 A4 4 0 0 1 8 60 Z",
  star: "M36 8 L45 28 L67 31 L51 46 L55 68 L36 57 L17 68 L21 46 L5 31 L27 28 Z",
  heart: "M36 65 C10 47 8 33 8 26 A16 16 0 0 1 36 18 A16 16 0 0 1 64 26 C64 33 62 47 36 65 Z",
  flower: "",
  circle: "",
};

/** One painted shape, sized by the caller. Always outlined so it reads on any block. */
export function Shape({
  kind,
  tone,
  size = 44,
  className,
}: {
  kind: ShapeKind;
  tone: ToneKey;
  size?: number;
  className?: string;
}) {
  const fill = TONES[tone];
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {kind === "circle" ? (
        <circle cx="36" cy="36" r="27" fill={fill} stroke={INK} strokeWidth="4" />
      ) : kind === "flower" ? (
        <g>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="36"
              cy="17"
              rx="10"
              ry="14"
              fill={fill}
              stroke={INK}
              strokeWidth="3.4"
              transform={`rotate(${deg} 36 36)`}
            />
          ))}
          <circle cx="36" cy="36" r="9" fill="#fffdf6" stroke={INK} strokeWidth="3.4" />
        </g>
      ) : (
        <path
          d={PATHS[kind]}
          fill={fill}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** The little brand mark: three blocks lined up in a tray, ready to go. */
export function ToyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 68 48" aria-hidden="true" focusable="false" className={className}>
      <rect x="2" y="10" width="64" height="34" rx="9" fill="#fff4dd" stroke={INK} strokeWidth="3" />
      <rect x="8" y="17" width="16" height="20" rx="5" fill="#ffcf5c" stroke={INK} strokeWidth="2.6" />
      <circle cx="34" cy="27" r="9" fill="#8fcfe8" stroke={INK} strokeWidth="2.6" />
      <path d="M52 17 L61 36 H43 Z" fill="#9fdcc0" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M22 6 h24" stroke="#ffb59d" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
