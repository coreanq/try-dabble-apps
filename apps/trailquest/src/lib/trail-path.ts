/**
 * The winding trail drawn on the route card, as a polyline in a 320 x 120
 * box, plus the maths to place a marker part-way along it. Kept out of the
 * React file so the tests can walk it without a DOM.
 */
export const TRAIL: [number, number][] = [
  [16, 100],
  [50, 92],
  [78, 74],
  [112, 82],
  [148, 66],
  [180, 72],
  [212, 52],
  [246, 58],
  [276, 40],
  [304, 30],
];

function segLengths(): { total: number; lens: number[] } {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < TRAIL.length; i++) {
    const [x0, y0] = TRAIL[i - 1];
    const [x1, y1] = TRAIL[i];
    const l = Math.hypot(x1 - x0, y1 - y0);
    lens.push(l);
    total += l;
  }
  return { total, lens };
}

const SEG = segLengths();

export const TRAIL_LENGTH = SEG.total;

export const TRAIL_D = TRAIL.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

/** Point on the trail at ratio 0..1 of its drawn length. */
export function pointAt(ratio: number): { x: number; y: number } {
  const r = Math.max(0, Math.min(1, ratio));
  let dist = r * SEG.total;
  for (let i = 0; i < SEG.lens.length; i++) {
    if (dist <= SEG.lens[i] || i === SEG.lens.length - 1) {
      const f = SEG.lens[i] === 0 ? 0 : Math.min(1, dist / SEG.lens[i]);
      const [x0, y0] = TRAIL[i];
      const [x1, y1] = TRAIL[i + 1];
      return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f };
    }
    dist -= SEG.lens[i];
  }
  const [x, y] = TRAIL[TRAIL.length - 1];
  return { x, y };
}
