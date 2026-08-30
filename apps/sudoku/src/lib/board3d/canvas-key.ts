/** A new key remounts the Canvas; the boundary bumps it on every retry. */
export function nextCanvasKey(current: number): number {
  return current + 1;
}
