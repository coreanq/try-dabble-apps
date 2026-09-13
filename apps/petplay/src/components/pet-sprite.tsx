import type { Mood } from "@/lib/needs";
import type { Pet } from "@/lib/pet";

/**
 * The pet, drawn from parts. Pure SVG: a fixed set of shapes for species,
 * ears, eyes, body, tail and accessory, coloured with the pet's three
 * colours. No raster, no model, no network. A photo sprite (cropped and
 * tinted on this device) is shown instead when the pet has one.
 */

const INK = "#3b2a2a";
const WHITE = "#ffffff";
const EDGE = "rgba(59,42,42,0.14)";

const BODY_GEOM = {
  round: { cy: 142, rx: 42, ry: 36, headCy: 84, headR: 42 },
  tall: { cy: 148, rx: 36, ry: 42, headCy: 76, headR: 40 },
  chunky: { cy: 146, rx: 50, ry: 38, headCy: 84, headR: 44 },
} as const;

function shade(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount)));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function Ears({ kind, r, primary, secondary, accent }: { kind: Pet["parts"]["ears"]; r: number; primary: string; secondary: string; accent: string }) {
  const x = r * 0.62;
  const y = -r * 0.62;
  switch (kind) {
    case "round":
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={s * x} cy={y} r={r * 0.36} fill={primary} stroke={EDGE} />
              <circle cx={s * x} cy={y} r={r * 0.2} fill={secondary} />
            </g>
          ))}
        </g>
      );
    case "pointy":
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`scale(${s},1)`}>
              <polygon points={`${x - r * 0.42},${y + r * 0.35} ${x - r * 0.05},${y - r * 0.85} ${x + r * 0.32},${y + r * 0.1}`} fill={primary} stroke={EDGE} strokeLinejoin="round" />
              <polygon points={`${x - r * 0.26},${y + r * 0.22} ${x - r * 0.04},${y - r * 0.5} ${x + r * 0.16},${y + r * 0.08}`} fill={secondary} />
            </g>
          ))}
        </g>
      );
    case "floppy":
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * r * 0.86},${-r * 0.15}) rotate(${s * 14})`}>
              <ellipse cx="0" cy={r * 0.3} rx={r * 0.3} ry={r * 0.62} fill={primary} stroke={EDGE} />
              <ellipse cx="0" cy={r * 0.36} rx={r * 0.15} ry={r * 0.4} fill={secondary} opacity="0.8" />
            </g>
          ))}
        </g>
      );
    case "long":
      return (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * r * 0.42},${-r * 0.95}) rotate(${s * -10})`}>
              <ellipse cx="0" cy="0" rx={r * 0.25} ry={r * 0.8} fill={primary} stroke={EDGE} />
              <ellipse cx="0" cy={r * 0.05} rx={r * 0.13} ry={r * 0.6} fill={secondary} />
            </g>
          ))}
        </g>
      );
    case "tuft":
      return (
        <g>
          {[-22, 0, 22].map((deg, i) => (
            <ellipse key={deg} cx="0" cy={-r * 0.9} rx={r * 0.13} ry={r * 0.42} fill={i === 1 ? accent : shade(accent, 30)} stroke={EDGE} transform={`rotate(${deg} 0 ${-r * 0.55})`} />
          ))}
        </g>
      );
  }
}

function Eyes({ kind, r, accent, sleepy }: { kind: Pet["parts"]["eyes"]; r: number; accent: string; sleepy: boolean }) {
  const dx = r * 0.4;
  const y = -r * 0.05;
  const k = sleepy ? "sleepy" : kind;
  return (
    <g>
      {[-1, 1].map((s) => {
        const x = s * dx;
        switch (k) {
          case "dot":
            return <circle key={s} cx={x} cy={y} r={r * 0.1} fill={INK} />;
          case "round":
            return (
              <g key={s}>
                <circle cx={x} cy={y} r={r * 0.17} fill={INK} />
                <circle cx={x + r * 0.06} cy={y - r * 0.06} r={r * 0.06} fill={WHITE} />
              </g>
            );
          case "happy":
            return <path key={s} d={`M${x - r * 0.18} ${y + r * 0.04} q${r * 0.18} ${-r * 0.24} ${r * 0.36} 0`} fill="none" stroke={INK} strokeWidth={r * 0.075} strokeLinecap="round" />;
          case "sleepy":
            return (
              <g key={s}>
                <path d={`M${x - r * 0.18} ${y - r * 0.02} q${r * 0.18} ${r * 0.2} ${r * 0.36} 0`} fill="none" stroke={INK} strokeWidth={r * 0.075} strokeLinecap="round" />
                <path d={`M${x - r * 0.2} ${y - r * 0.14} q${r * 0.2} ${-r * 0.1} ${r * 0.4} 0`} fill="none" stroke={INK} strokeWidth={r * 0.05} strokeLinecap="round" opacity="0.5" />
              </g>
            );
          case "star": {
            const pts = Array.from({ length: 10 }, (_, i) => {
              const rad = (Math.PI / 5) * i - Math.PI / 2;
              const rr = i % 2 === 0 ? r * 0.2 : r * 0.085;
              return `${x + Math.cos(rad) * rr},${y + Math.sin(rad) * rr}`;
            }).join(" ");
            return <polygon key={s} points={pts} fill={accent} stroke={INK} strokeWidth={r * 0.03} strokeLinejoin="round" />;
          }
        }
      })}
    </g>
  );
}

function Mouth({ mood, r, species, accent }: { mood: Mood; r: number; species: Pet["species"]; accent: string }) {
  const y = r * 0.36;
  const w = r * 0.4;
  if (species === "bird") {
    const open = mood === "hungry" || mood === "happy";
    return (
      <g>
        <polygon points={`${-r * 0.22},${r * 0.12} ${r * 0.22},${r * 0.12} 0,${r * 0.32}`} fill={accent} stroke={EDGE} strokeLinejoin="round" />
        {open && <polygon points={`${-r * 0.18},${r * 0.14} ${r * 0.18},${r * 0.14} 0,${r * 0.24}`} fill={shade(accent, -40)} />}
      </g>
    );
  }
  switch (mood) {
    case "happy":
      return <path d={`M${-w / 2} ${y - r * 0.02} q${w / 2} ${r * 0.22} ${w} 0`} fill="none" stroke={INK} strokeWidth={r * 0.06} strokeLinecap="round" />;
    case "hungry":
      return <ellipse cx="0" cy={y + r * 0.06} rx={r * 0.13} ry={r * 0.15} fill={INK} />;
    case "sad":
    case "bored":
    case "dirty":
      return <path d={`M${-w / 2} ${y + r * 0.12} q${w / 2} ${-r * 0.2} ${w} 0`} fill="none" stroke={INK} strokeWidth={r * 0.06} strokeLinecap="round" />;
    case "sleepy":
      return <ellipse cx="0" cy={y + r * 0.04} rx={r * 0.08} ry={r * 0.1} fill={INK} />;
    default:
      return <path d={`M${-w / 2} ${y + r * 0.04} h${w}`} fill="none" stroke={INK} strokeWidth={r * 0.06} strokeLinecap="round" />;
  }
}

function Face({ species, r, secondary, accent, mood }: { species: Pet["species"]; r: number; secondary: string; accent: string; mood: Mood }) {
  switch (species) {
    case "dog":
      return (
        <g>
          <ellipse cx="0" cy={r * 0.3} rx={r * 0.34} ry={r * 0.24} fill={secondary} />
          <ellipse cx="0" cy={r * 0.2} rx={r * 0.11} ry={r * 0.085} fill={INK} />
          {mood === "happy" && <ellipse cx="0" cy={r * 0.5} rx={r * 0.09} ry={r * 0.12} fill="#fb7185" />}
        </g>
      );
    case "cat":
      return (
        <g>
          <polygon points={`${-r * 0.08},${r * 0.18} ${r * 0.08},${r * 0.18} 0,${r * 0.28}`} fill="#f9a8b8" />
          {[-1, 1].map((s) => (
            <g key={s} stroke={INK} strokeWidth={r * 0.03} strokeLinecap="round" opacity="0.75">
              <line x1={s * r * 0.3} y1={r * 0.24} x2={s * r * 0.85} y2={r * 0.16} />
              <line x1={s * r * 0.3} y1={r * 0.32} x2={s * r * 0.85} y2={r * 0.36} />
            </g>
          ))}
        </g>
      );
    case "bunny":
      return (
        <g>
          <ellipse cx="0" cy={r * 0.22} rx={r * 0.07} ry={r * 0.05} fill="#f9a8b8" />
          <rect x={-r * 0.09} y={r * 0.42} width={r * 0.18} height={r * 0.16} rx={r * 0.03} fill={WHITE} stroke={EDGE} />
          <line x1="0" y1={r * 0.42} x2="0" y2={r * 0.58} stroke={EDGE} strokeWidth={r * 0.02} />
          {[-1, 1].map((s) => (
            <circle key={s} cx={s * r * 0.62} cy={r * 0.24} r={r * 0.11} fill={secondary} opacity="0.9" />
          ))}
        </g>
      );
    case "bird":
      return (
        <g>
          {[-1, 1].map((s) => (
            <circle key={s} cx={s * r * 0.6} cy={r * 0.22} r={r * 0.1} fill="#fb7185" opacity="0.55" />
          ))}
        </g>
      );
    case "fox":
      return (
        <g>
          <path d={`M${-r * 0.5} ${r * 0.1} q${r * 0.5} ${r * 0.75} ${r} 0 q${-r * 0.2} ${r * 0.1} ${-r * 0.5} ${r * 0.12} q${-r * 0.3} ${-r * 0.02} ${-r * 0.5} ${-r * 0.12} z`} fill={secondary} />
          <ellipse cx="0" cy={r * 0.4} rx={r * 0.1} ry={r * 0.08} fill={INK} />
          <circle cx={-r * 0.62} cy={r * 0.16} r={r * 0.09} fill={accent} opacity="0.25" />
          <circle cx={r * 0.62} cy={r * 0.16} r={r * 0.09} fill={accent} opacity="0.25" />
        </g>
      );
  }
}

function Tail({ kind, primary, secondary, cx, cy, rx }: { kind: Pet["parts"]["tail"]; primary: string; secondary: string; cx: number; cy: number; rx: number }) {
  const x = cx + rx * 0.7;
  switch (kind) {
    case "curl":
      return <path d={`M${x} ${cy + 8} q34 -18 10 -46`} fill="none" stroke={primary} strokeWidth="11" strokeLinecap="round" />;
    case "straight":
      return (
        <g>
          <path d={`M${x} ${cy + 10} l30 -30`} fill="none" stroke={primary} strokeWidth="11" strokeLinecap="round" />
          <circle cx={x + 30} cy={cy - 20} r="6" fill={secondary} />
        </g>
      );
    case "fluffy":
      return (
        <g transform={`translate(${x + 12},${cy - 8}) rotate(-38)`}>
          <ellipse cx="0" cy="0" rx="17" ry="30" fill={primary} stroke={EDGE} />
          <ellipse cx="0" cy="-16" rx="11" ry="12" fill={secondary} />
        </g>
      );
    case "short":
      return <circle cx={x + 4} cy={cy + 8} r="10" fill={secondary} stroke={EDGE} />;
  }
}

function Accessory({ kind, accent, secondary, neckY, headCy, headR }: { kind: Pet["parts"]["accessory"]; accent: string; secondary: string; neckY: number; headCy: number; headR: number }) {
  switch (kind) {
    case "none":
      return null;
    case "bow":
      return (
        <g transform={`translate(${100 - headR * 0.55},${neckY - 2})`}>
          <polygon points="-12,-8 0,0 -12,8" fill={accent} stroke={EDGE} strokeLinejoin="round" />
          <polygon points="12,-8 0,0 12,8" fill={accent} stroke={EDGE} strokeLinejoin="round" />
          <circle cx="0" cy="0" r="3.2" fill={shade(accent, -40)} />
        </g>
      );
    case "collar":
      return (
        <g>
          <rect x={100 - headR * 0.78} y={neckY - 4} width={headR * 1.56} height="8" rx="4" fill={accent} stroke={EDGE} />
          <circle cx="100" cy={neckY + 7} r="4.5" fill="#f5c65b" stroke={EDGE} />
        </g>
      );
    case "scarf":
      return (
        <g>
          <rect x={100 - headR * 0.8} y={neckY - 6} width={headR * 1.6} height="12" rx="6" fill={accent} stroke={EDGE} />
          <rect x={100 + headR * 0.15} y={neckY} width="11" height="24" rx="5" fill={accent} stroke={EDGE} />
          <rect x={100 + headR * 0.15} y={neckY + 16} width="11" height="8" rx="3" fill={secondary} opacity="0.7" />
        </g>
      );
    case "hat":
      return (
        <g transform={`translate(100,${headCy - headR})`}>
          <path d={`M-24 6 q24 -40 48 0 z`} fill={accent} stroke={EDGE} strokeLinejoin="round" />
          <rect x="-26" y="2" width="52" height="8" rx="4" fill={shade(accent, -30)} />
          <circle cx="0" cy="-14" r="5" fill={secondary} stroke={EDGE} />
        </g>
      );
  }
}

export function PetSprite({ pet, mood, className, id }: { pet: Pet; mood: Mood; className?: string; id?: string }) {
  if (pet.photoSprite) {
    return (
      <svg viewBox="0 0 200 200" className={className} id={id} role="img" aria-label={pet.name} data-sprite="photo" data-mood={mood}>
        <defs>
          <clipPath id="pp-photo-clip">
            <rect x="16" y="16" width="168" height="168" rx="38" />
          </clipPath>
        </defs>
        <rect x="12" y="12" width="176" height="176" rx="42" fill={pet.colors.secondary} stroke={EDGE} />
        <image href={pet.photoSprite.dataUrl} x="16" y="16" width="168" height="168" clipPath="url(#pp-photo-clip)" preserveAspectRatio="xMidYMid slice" />
      </svg>
    );
  }
  const { primary, secondary, accent } = pet.colors;
  const g = BODY_GEOM[pet.parts.body];
  const neckY = g.headCy + g.headR * 0.82;
  const sleepy = mood === "sleepy";
  const dirty = mood === "dirty";
  return (
    <svg viewBox="0 0 200 200" className={className} id={id} role="img" aria-label={pet.name} data-sprite="parts" data-species={pet.species} data-mood={mood}>
      {/* shadow */}
      <ellipse cx="100" cy={g.cy + g.ry + 6} rx={g.rx + 6} ry="7" fill="rgba(59,42,42,0.10)" />
      <Tail kind={pet.parts.tail} primary={primary} secondary={secondary} cx={100} cy={g.cy} rx={g.rx} />
      {/* body */}
      <ellipse cx="100" cy={g.cy} rx={g.rx} ry={g.ry} fill={primary} stroke={EDGE} />
      <ellipse cx="100" cy={g.cy + g.ry * 0.18} rx={g.rx * 0.55} ry={g.ry * 0.6} fill={secondary} opacity="0.9" />
      {pet.species === "bird" &&
        [-1, 1].map((s) => (
          <ellipse key={s} cx={100 + s * g.rx * 0.8} cy={g.cy} rx={g.rx * 0.32} ry={g.ry * 0.55} fill={shade(primary, -25)} stroke={EDGE} transform={`rotate(${s * 18} ${100 + s * g.rx * 0.8} ${g.cy})`} />
        ))}
      {/* feet */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={100 + s * g.rx * 0.45} cy={g.cy + g.ry - 2} rx="12" ry="7" fill={shade(primary, -18)} stroke={EDGE} />
      ))}
      {dirty && (
        <g fill="#9a8f86" opacity="0.55">
          <circle cx={100 - g.rx * 0.5} cy={g.cy - g.ry * 0.3} r="5" />
          <circle cx={100 + g.rx * 0.35} cy={g.cy + g.ry * 0.35} r="4" />
          <circle cx={100 + g.rx * 0.55} cy={g.cy - g.ry * 0.45} r="3.5" />
        </g>
      )}
      {/* head */}
      <g transform={`translate(100,${g.headCy})`}>
        <Ears kind={pet.parts.ears} r={g.headR} primary={primary} secondary={secondary} accent={accent} />
        <circle cx="0" cy="0" r={g.headR} fill={primary} stroke={EDGE} />
        <Face species={pet.species} r={g.headR} secondary={secondary} accent={accent} mood={mood} />
        <Eyes kind={pet.parts.eyes} r={g.headR} accent={accent} sleepy={sleepy} />
        <Mouth mood={mood} r={g.headR} species={pet.species} accent={accent} />
        {(mood === "sad" || mood === "hungry") && <ellipse cx={g.headR * 0.58} cy={g.headR * 0.14} rx="3" ry="5" fill="#93c5fd" opacity="0.85" />}
        {sleepy && (
          <text x={g.headR * 0.9} y={-g.headR * 0.7} fontSize={g.headR * 0.42} fontWeight="800" fill={INK} opacity="0.7" fontFamily="system-ui, sans-serif">
            z
          </text>
        )}
      </g>
      <Accessory kind={pet.parts.accessory} accent={accent} secondary={secondary} neckY={neckY} headCy={g.headCy} headR={g.headR} />
    </svg>
  );
}
