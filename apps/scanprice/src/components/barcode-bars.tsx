import { bars } from "@/lib/barcode";

/**
 * The code's real EAN-13 / EAN-8 modules, so a saved row looks like the thing
 * on the shelf. The guard bars run a little longer, the way they are printed.
 */
export function BarcodeBars({ code }: { code: string }) {
  const { bars: rects, width } = bars(code);
  if (rects.length === 0) return null;
  const tall = new Set([0, width - 3, Math.floor(width / 2) - 2]);
  return (
    <svg
      className="sp-bars"
      viewBox={`0 0 ${width} 34`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {rects.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={0}
          width={bar.width}
          height={tall.has(bar.x) ? 34 : 30}
        />
      ))}
    </svg>
  );
}
