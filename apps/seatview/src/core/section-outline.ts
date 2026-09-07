import type { Section, Stage } from './venue-schema'
import { generateSeats } from './seat-engine'

export type Vec2 = [number, number]

const ARC_SAMPLES = 16

function arcPoint(cx: number, cz: number, r: number, deg: number): Vec2 {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cz + r * Math.cos(a)]
}

export function sectionOutline(section: Section, stage: Stage): Vec2[] {
  if ('seats' in section) {
    const seats = generateSeats(section, stage)
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    for (const s of seats) {
      minX = Math.min(minX, s.position[0]); maxX = Math.max(maxX, s.position[0])
      minZ = Math.min(minZ, s.position[2]); maxZ = Math.max(maxZ, s.position[2])
    }
    const m = 0.5
    return [[minX - m, minZ - m], [maxX + m, minZ - m], [maxX + m, maxZ + m], [minX - m, maxZ + m]]
  }
  const shape = section.shape
  if (shape.type === 'polygon') return shape.points.map((p) => [p[0], p[1]] as Vec2)

  const [cx, cz] = shape.center
  const r0 = shape.radiusStart
  const r1 = shape.radiusStart + section.rows * section.rowDepth
  const inner: Vec2[] = []
  const outer: Vec2[] = []
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const deg = shape.angleStart + ((shape.angleEnd - shape.angleStart) * i) / ARC_SAMPLES
    inner.push(arcPoint(cx, cz, r0, deg))
    outer.push(arcPoint(cx, cz, r1, deg))
  }
  return [...inner, ...outer.reverse()]
}

export function sectionCentroid(outline: Vec2[]): Vec2 {
  let x = 0, z = 0
  for (const p of outline) { x += p[0]; z += p[1] }
  return [x / outline.length, z / outline.length]
}
