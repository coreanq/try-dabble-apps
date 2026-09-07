import type { Seat } from './seat-engine'
import type { Vec2 } from './section-outline'

export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }
/** screen = world * scale + offset. 화면 y축은 월드 z축 */
export interface Transform { scale: number; offsetX: number; offsetY: number }

export function boundsOf(points: Vec2[]): Bounds {
  const b: Bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  for (const [x, z] of points) {
    b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x)
    b.minZ = Math.min(b.minZ, z); b.maxZ = Math.max(b.maxZ, z)
  }
  return b
}

export function expandBounds(b: Bounds, margin: number): Bounds {
  return { minX: b.minX - margin, maxX: b.maxX + margin, minZ: b.minZ - margin, maxZ: b.maxZ + margin }
}

export function fitTransform(b: Bounds, width: number, height: number, padding = 20): Transform {
  const w = b.maxX - b.minX || 1
  const h = b.maxZ - b.minZ || 1
  const scale = Math.max(1e-6, Math.min((width - 2 * padding) / w, (height - 2 * padding) / h))
  const cx = (b.minX + b.maxX) / 2
  const cz = (b.minZ + b.maxZ) / 2
  return { scale, offsetX: width / 2 - cx * scale, offsetY: height / 2 - cz * scale }
}

export function worldToScreen(t: Transform, p: Vec2): Vec2 {
  return [p[0] * t.scale + t.offsetX, p[1] * t.scale + t.offsetY]
}

export function screenToWorld(t: Transform, s: Vec2): Vec2 {
  return [(s[0] - t.offsetX) / t.scale, (s[1] - t.offsetY) / t.scale]
}

export function zoomAt(t: Transform, s: Vec2, factor: number): Transform {
  const w = screenToWorld(t, s)
  const scale = t.scale * factor
  return { scale, offsetX: s[0] - w[0] * scale, offsetY: s[1] - w[1] * scale }
}

export function pan(t: Transform, dx: number, dy: number): Transform {
  return { scale: t.scale, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    const crosses = zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

export function nearestSeat(seats: Seat[], p: Vec2, maxDist: number): Seat | undefined {
  let best: Seat | undefined
  let bestD = maxDist * maxDist
  for (const s of seats) {
    const dx = s.position[0] - p[0]
    const dz = s.position[2] - p[1]
    const d = dx * dx + dz * dz
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}
